/**
 * Hotjar-like Standalone SDK
 * Self-starting, single-file analytics tracker
 * Can be included multiple times safely
 */

// ============================================================================
// Types
// ============================================================================

interface TrackerConfig {
  projectId?: string;
  siteId?: string;
  endpoint?: string;
  sampleRate?: number;
  debug?: boolean;
  maskSelectors?: string[];
  trackClicks?: boolean;
  trackScrolls?: boolean;
  trackInputs?: boolean;
  trackErrors?: boolean;
  trackPerformance?: boolean;
  batchInterval?: number;
  maxBatchSize?: number;
  consent?: boolean;
}

type EventType = 'pageview' | 'click' | 'scroll' | 'input' | 'route_change' | 'error' | 'performance' | 'heartbeat' | 'custom';

interface BaseEvent {
  type: EventType;
  timestamp: number;
  sessionId: string;
  userId?: string;
  url: string;
  referrer: string;
  viewport: { width: number; height: number };
}

interface TrackingEvent extends BaseEvent {
  [key: string]: any;
}

interface SessionData {
  id: string;
  userId?: string;
  startTime: number;
  lastActivityTime: number;
  pageviews: number;
  events: number;
}

// ============================================================================
// Globals
// ============================================================================

declare global {
  interface Window {
    HJ: HJApi;
    HJ_CONFIG?: TrackerConfig;
    HJ_AUTO_START?: boolean;
    __hj_initialized?: boolean;
    __hj_tracker?: Tracker;
  }
}

// ============================================================================
// Utilities
// ============================================================================

class Utils {
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  static getSession(): SessionData {
    const SESSION_KEY = '__hj_session';
    const SESSION_TIMEOUT = 30 * 60 * 1000;

    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const session: SessionData = JSON.parse(stored);
        const now = Date.now();

        if (now - session.lastActivityTime < SESSION_TIMEOUT) {
          session.lastActivityTime = now;
          session.events++;
          Utils.saveSession(session);
          return session;
        }
      }
    } catch (e) {
      console.warn('[HJ] localStorage not available', e);
    }

    return Utils.createNewSession();
  }

  static createNewSession(): SessionData {
    const session: SessionData = {
      id: Utils.generateUUID(),
      userId: Utils.getUserId(),
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      pageviews: 0,
      events: 0,
    };

    Utils.saveSession(session);
    return session;
  }

  static saveSession(session: SessionData): void {
    try {
      localStorage.setItem('__hj_session', JSON.stringify(session));
    } catch (e) {
      // Ignore
    }
  }

  static getUserId(): string | undefined {
    try {
      return localStorage.getItem('__hj_user_id') || undefined;
    } catch (e) {
      return undefined;
    }
  }

  static setUserId(userId: string): void {
    try {
      localStorage.setItem('__hj_user_id', userId);
      const session = Utils.getSession();
      session.userId = userId;
      Utils.saveSession(session);
    } catch (e) {
      // Ignore
    }
  }

  static incrementPageview(): void {
    try {
      const stored = localStorage.getItem('__hj_session');
      if (stored) {
        const session: SessionData = JSON.parse(stored);
        session.pageviews++;
        session.lastActivityTime = Date.now();
        Utils.saveSession(session);
      }
    } catch (e) {
      // Ignore
    }
  }

  static shouldMaskElement(element: HTMLElement, maskSelectors: string[]): boolean {
    const DEFAULT_MASK_SELECTORS = [
      'input[type="password"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[data-private]',
      '[data-mask]',
      '.sensitive',
    ];

    const selectors = [...DEFAULT_MASK_SELECTORS, ...maskSelectors];

    for (const selector of selectors) {
      try {
        if (element.matches(selector)) {
          return true;
        }
      } catch (e) {
        // Invalid selector
      }
    }

    let parent = element.parentElement;
    while (parent) {
      if (parent.hasAttribute('data-mask')) {
        return true;
      }
      parent = parent.parentElement;
    }

    return false;
  }

  static getElementText(element: HTMLElement): string | undefined {
    if (!element) return undefined;

    let text = element.textContent?.trim() || '';
    if (text.length > 100) {
      text = text.substring(0, 100) + '...';
    }

    return text || undefined;
  }

  static getElementAttributes(element: HTMLElement): Record<string, string> | undefined {
    const attrs: Record<string, string> = {};
    const allowedAttrs = ['href', 'title', 'alt', 'role', 'aria-label'];

    for (const attr of allowedAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        attrs[attr] = value;
      }
    }

    return Object.keys(attrs).length > 0 ? attrs : undefined;
  }

  static shouldSample(sampleRate: number): boolean {
    return Math.random() < sampleRate;
  }

  static async sendBatch(endpoint: string, batch: any, debug: boolean): Promise<void> {
    try {
      const payload = JSON.stringify(batch);

      if (debug) {
        console.log('[HJ] Sending batch:', {
          events: batch.events.length,
          size: payload.length,
        });
      }

      // Try sendBeacon first
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        const sent = navigator.sendBeacon(endpoint, blob);

        if (sent) {
          if (debug) console.log('[HJ] Sent via sendBeacon');
          return;
        }
      }

      // Fallback to fetch
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      });

      if (debug) console.log('[HJ] Sent via fetch');
    } catch (error) {
      if (debug) {
        console.error('[HJ] Failed to send batch:', error);
      }
    }
  }
}

// ============================================================================
// Tracker Class
// ============================================================================

class Tracker {
  private config: Required<TrackerConfig>;
  private eventQueue: TrackingEvent[] = [];
  private batchTimer: number | null = null;
  private lastUrl: string;
  private heartbeatTimer: number | null = null;
  private scrollDepth: number = 0;
  private consentGranted: boolean = true;
  private userId?: string;

  constructor(config: TrackerConfig) {
    this.config = {
      projectId: config.projectId || config.siteId || 'default',
      siteId: config.siteId || config.projectId || 'default',
      endpoint: config.endpoint || 'http://localhost:3001/v1/ingest',
      sampleRate: config.sampleRate ?? 1,
      debug: config.debug ?? false,
      maskSelectors: config.maskSelectors || [],
      trackClicks: config.trackClicks ?? true,
      trackScrolls: config.trackScrolls ?? true,
      trackInputs: config.trackInputs ?? true,
      trackErrors: config.trackErrors ?? true,
      trackPerformance: config.trackPerformance ?? true,
      batchInterval: config.batchInterval ?? 3000,
      maxBatchSize: config.maxBatchSize ?? 50,
      consent: config.consent ?? true,
    };

    this.lastUrl = window.location.href;
    this.consentGranted = this.config.consent;

    if (!Utils.shouldSample(this.config.sampleRate)) {
      if (this.config.debug) {
        console.log('[HJ] Session not sampled, tracking disabled');
      }
      return;
    }

    this.init();
  }

  private init(): void {
    this.trackPageview();
    this.setupListeners();
    this.startHeartbeat();

    if (this.config.trackPerformance) {
      if (document.readyState === 'complete') {
        this.trackPerformance();
      } else {
        window.addEventListener('load', () => this.trackPerformance());
      }
    }

    if (this.config.debug) {
      console.log('[HJ] Initialized', this.config);
    }
  }

  private setupListeners(): void {
    if (this.config.trackClicks) {
      document.addEventListener('click', this.handleClick.bind(this), true);
    }

    if (this.config.trackScrolls) {
      window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    }

    if (this.config.trackInputs) {
      document.addEventListener('input', this.handleInput.bind(this), true);
    }

    if (this.config.trackErrors) {
      window.addEventListener('error', this.handleError.bind(this));
      window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }

    this.setupRouteChangeTracking();

    window.addEventListener('beforeunload', () => this.flush());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.flush();
    });
  }

  private setupRouteChangeTracking(): void {
    window.addEventListener('popstate', () => this.handleRouteChange());

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleRouteChange();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handleRouteChange();
    };
  }

  private createBaseEvent(): BaseEvent {
    const session = Utils.getSession();

    return {
      type: 'pageview',
      timestamp: Date.now(),
      sessionId: session.id,
      userId: session.userId || this.userId,
      url: window.location.href,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  private trackPageview(): void {
    const event: any = {
      ...this.createBaseEvent(),
      type: 'pageview',
      title: document.title,
    };

    Utils.incrementPageview();
    this.addEvent(event);
  }

  private handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target) return;

    const event: any = {
      ...this.createBaseEvent(),
      type: 'click',
      target: {
        tagName: target.tagName.toLowerCase(),
        id: target.id || undefined,
        className: target.className || undefined,
        text: Utils.getElementText(target),
        attributes: Utils.getElementAttributes(target),
      },
      position: { x: e.clientX, y: e.clientY },
    };

    this.addEvent(event);
  }

  private handleScroll(): void {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const depth = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);

    if (depth > this.scrollDepth + 10) {
      this.scrollDepth = depth;

      const event: any = {
        ...this.createBaseEvent(),
        type: 'scroll',
        depth: Math.min(depth, 100),
        position: { x: window.pageXOffset, y: scrollTop },
      };

      this.addEvent(event);
    }
  }

  private handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    if (!target || !target.tagName) return;

    const masked = Utils.shouldMaskElement(target, this.config.maskSelectors);

    const event: any = {
      ...this.createBaseEvent(),
      type: 'input',
      target: {
        tagName: target.tagName.toLowerCase(),
        id: target.id || undefined,
        name: target.name || undefined,
        type: target.type || undefined,
      },
      masked,
      value: masked ? undefined : target.value?.substring(0, 100),
    };

    this.addEvent(event);
  }

  private handleRouteChange(): void {
    const newUrl = window.location.href;

    if (newUrl !== this.lastUrl) {
      const event: any = {
        ...this.createBaseEvent(),
        type: 'route_change',
        from: this.lastUrl,
        to: newUrl,
      };

      this.lastUrl = newUrl;
      this.scrollDepth = 0;
      this.addEvent(event);
      this.trackPageview();
    }
  }

  private handleError(e: ErrorEvent): void {
    const event: any = {
      ...this.createBaseEvent(),
      type: 'error',
      error: {
        message: e.message,
        stack: e.error?.stack,
        line: e.lineno,
        column: e.colno,
        filename: e.filename,
      },
    };

    this.addEvent(event);
  }

  private handlePromiseRejection(e: PromiseRejectionEvent): void {
    const event: any = {
      ...this.createBaseEvent(),
      type: 'error',
      error: {
        message: `Unhandled Promise Rejection: ${e.reason}`,
        stack: e.reason?.stack,
      },
    };

    this.addEvent(event);
  }

  private trackPerformance(): void {
    if (!window.performance || !window.performance.timing) return;

    const timing = window.performance.timing;
    const navigation = timing.navigationStart;

    const event: any = {
      ...this.createBaseEvent(),
      type: 'performance',
      metrics: {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        ttfb: timing.responseStart - navigation,
        download: timing.responseEnd - timing.responseStart,
        domInteractive: timing.domInteractive - navigation,
        domComplete: timing.domComplete - navigation,
        loadComplete: timing.loadEventEnd - navigation,
      },
    };

    this.addEvent(event);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      const session = Utils.getSession();
      const event: any = {
        ...this.createBaseEvent(),
        type: 'heartbeat',
        duration: Date.now() - session.startTime,
      };

      this.addEvent(event);
    }, 30000);
  }

  private addEvent(event: TrackingEvent): void {
    if (!this.consentGranted) {
      if (this.config.debug) {
        console.log('[HJ] Event blocked - no consent');
      }
      return;
    }

    this.eventQueue.push(event);

    if (this.config.debug) {
      console.log('[HJ] Event queued:', event.type, event);
    }

    if (this.eventQueue.length >= this.config.maxBatchSize) {
      this.flush();
    } else if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => this.flush(), this.config.batchInterval);
    }
  }

  private flush(): void {
    if (this.eventQueue.length === 0) return;

    const batch = {
      siteId: this.config.siteId,
      events: [...this.eventQueue],
      metadata: {
        sdkVersion: '1.0.0',
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth,
        },
      },
    };

    this.eventQueue = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    Utils.sendBatch(this.config.endpoint, batch, this.config.debug);
  }

  public track(eventName: string, properties?: Record<string, any>): void {
    const event: any = {
      ...this.createBaseEvent(),
      type: 'custom',
      name: eventName,
      properties,
    };

    this.addEvent(event);
  }

  public identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    Utils.setUserId(userId);

    if (this.config.debug) {
      console.log('[HJ] User identified:', userId, traits);
    }

    this.track('identify', { userId, ...traits });
  }

  public consent(granted: boolean): void {
    this.consentGranted = granted;

    if (!granted) {
      this.eventQueue = [];
    }

    if (this.config.debug) {
      console.log('[HJ] Consent:', granted);
    }
  }

  public updateConfig(config: Partial<TrackerConfig>): void {
    this.config = { ...this.config, ...config } as Required<TrackerConfig>;

    if (this.config.debug) {
      console.log('[HJ] Config updated:', this.config);
    }
  }

  public stop(): void {
    this.flush();

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    if (this.config.debug) {
      console.log('[HJ] Stopped');
    }
  }
}

// ============================================================================
// Public API
// ============================================================================

interface HJApi {
  init: (config: TrackerConfig) => void;
  start: () => void;
  stop: () => void;
  track: (eventName: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  consent: (granted: boolean) => void;
  config: (config: Partial<TrackerConfig>) => void;
}

// ============================================================================
// Initialization
// ============================================================================

(function() {
  // Prevent multiple initialization
  if (window.__hj_initialized) {
    console.warn('[HJ] Already initialized');
    return;
  }

  window.__hj_initialized = true;

  // Create API
  const HJ: HJApi = {
    init: (config: TrackerConfig) => {
      if (window.__hj_tracker) {
        console.warn('[HJ] Already initialized');
        return;
      }

      window.__hj_tracker = new Tracker(config);
    },

    start: () => {
      if (window.__hj_tracker) {
        console.warn('[HJ] Already started');
        return;
      }

      const config = window.HJ_CONFIG || {};
      window.__hj_tracker = new Tracker(config);
    },

    stop: () => {
      if (window.__hj_tracker) {
        window.__hj_tracker.stop();
        window.__hj_tracker = undefined;
      }
    },

    track: (eventName: string, properties?: Record<string, any>) => {
      if (window.__hj_tracker) {
        window.__hj_tracker.track(eventName, properties);
      } else {
        console.warn('[HJ] Not initialized. Call HJ.init() or HJ.start() first.');
      }
    },

    identify: (userId: string, traits?: Record<string, any>) => {
      if (window.__hj_tracker) {
        window.__hj_tracker.identify(userId, traits);
      } else {
        console.warn('[HJ] Not initialized. Call HJ.init() or HJ.start() first.');
      }
    },

    consent: (granted: boolean) => {
      if (window.__hj_tracker) {
        window.__hj_tracker.consent(granted);
      } else {
        console.warn('[HJ] Not initialized. Call HJ.init() or HJ.start() first.');
      }
    },

    config: (config: Partial<TrackerConfig>) => {
      if (window.__hj_tracker) {
        window.__hj_tracker.updateConfig(config);
      } else {
        console.warn('[HJ] Not initialized. Call HJ.init() or HJ.start() first.');
      }
    },
  };

  // Expose globally
  window.HJ = HJ;

  // Auto-start logic
  const shouldAutoStart = () => {
    // Check if explicitly disabled
    if (window.HJ_AUTO_START === false) {
      return false;
    }

    // Check if config is provided
    if (window.HJ_CONFIG) {
      return true;
    }

    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('hj') === '1') {
      return true;
    }

    // Default to true if HJ_AUTO_START is not set
    return window.HJ_AUTO_START !== false;
  };

  // Auto-start if conditions are met
  if (shouldAutoStart()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => HJ.start());
    } else {
      HJ.start();
    }
  }
})();

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.HJ;
}

export default window.HJ;
