import {
  TrackerConfig,
  TrackingEvent,
  EventBatch,
  BaseEvent,
  PageviewEvent,
  ClickEvent,
  ScrollEvent,
  InputEvent,
  RouteChangeEvent,
  ErrorEvent,
  PerformanceEvent,
  HeartbeatEvent,
  CustomEvent,
} from '../types';
import { getSession, setUserId, incrementPageview } from '../utils/session';
import {
  shouldMaskElement,
  maskValue,
  getElementText,
  getElementAttributes,
} from '../utils/privacy';
import { sendBatch, shouldSample } from '../utils/transport';

const SDK_VERSION = '1.0.0';

export class Tracker {
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
      siteId: config.siteId,
      endpoint: config.endpoint || '/v1/ingest',
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

    // Check if we should sample this session
    if (!shouldSample(this.config.sampleRate)) {
      if (this.config.debug) {
        console.log('[Tracker] Session not sampled, tracking disabled');
      }
      return;
    }

    this.init();
  }

  private init(): void {
    // Track initial pageview
    this.trackPageview();

    // Setup event listeners
    this.setupListeners();

    // Start heartbeat
    this.startHeartbeat();

    // Track performance metrics when page is loaded
    if (this.config.trackPerformance) {
      if (document.readyState === 'complete') {
        this.trackPerformance();
      } else {
        window.addEventListener('load', () => this.trackPerformance());
      }
    }

    if (this.config.debug) {
      console.log('[Tracker] Initialized', this.config);
    }
  }

  private setupListeners(): void {
    if (this.config.trackClicks) {
      document.addEventListener('click', this.handleClick.bind(this), true);
    }

    if (this.config.trackScrolls) {
      window.addEventListener('scroll', this.handleScroll.bind(this), {
        passive: true,
      });
    }

    if (this.config.trackInputs) {
      document.addEventListener('input', this.handleInput.bind(this), true);
    }

    if (this.config.trackErrors) {
      window.addEventListener('error', this.handleError.bind(this));
      window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }

    // Track route changes for SPAs
    this.setupRouteChangeTracking();

    // Flush events before page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Flush events when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });
  }

  private setupRouteChangeTracking(): void {
    // Listen to popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });

    // Override pushState and replaceState
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
    const session = getSession();

    return {
      type: 'pageview', // Will be overridden
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
    const event: PageviewEvent = {
      ...this.createBaseEvent(),
      type: 'pageview',
      title: document.title,
    };

    incrementPageview();
    this.addEvent(event);
  }

  private handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target) return;

    const event: ClickEvent = {
      ...this.createBaseEvent(),
      type: 'click',
      target: {
        tagName: target.tagName.toLowerCase(),
        id: target.id || undefined,
        className: target.className || undefined,
        text: getElementText(target),
        attributes: getElementAttributes(target),
      },
      position: {
        x: e.clientX,
        y: e.clientY,
      },
    };

    this.addEvent(event);
  }

  private handleScroll(): void {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const depth = Math.round(
      ((scrollTop + windowHeight) / documentHeight) * 100
    );

    // Only track if depth increased by at least 10%
    if (depth > this.scrollDepth + 10) {
      this.scrollDepth = depth;

      const event: ScrollEvent = {
        ...this.createBaseEvent(),
        type: 'scroll',
        depth: Math.min(depth, 100),
        position: {
          x: window.pageXOffset,
          y: scrollTop,
        },
      };

      this.addEvent(event);
    }
  }

  private handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    if (!target || !target.tagName) return;

    const masked = shouldMaskElement(target, this.config.maskSelectors);

    const event: InputEvent = {
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
      const event: RouteChangeEvent = {
        ...this.createBaseEvent(),
        type: 'route_change',
        from: this.lastUrl,
        to: newUrl,
      };

      this.lastUrl = newUrl;
      this.scrollDepth = 0; // Reset scroll depth
      this.addEvent(event);

      // Track as pageview too
      this.trackPageview();
    }
  }

  private handleError(e: ErrorEvent): void {
    const event: ErrorEvent = {
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
    const event: ErrorEvent = {
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
    if (!window.performance || !window.performance.timing) {
      return;
    }

    const timing = window.performance.timing;
    const navigation = timing.navigationStart;

    const event: PerformanceEvent = {
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

    // Try to get FCP and LCP from PerformanceObserver
    if ('PerformanceObserver' in window) {
      try {
        const perfObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
              event.metrics.fcp = entry.startTime;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              event.metrics.lcp = entry.startTime;
            }
          }
        });

        perfObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      } catch (e) {
        // PerformanceObserver not supported
      }
    }

    this.addEvent(event);
  }

  private startHeartbeat(): void {
    // Send heartbeat every 30 seconds
    this.heartbeatTimer = window.setInterval(() => {
      const session = getSession();
      const event: HeartbeatEvent = {
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
        console.log('[Tracker] Event blocked - no consent');
      }
      return;
    }

    this.eventQueue.push(event);

    if (this.config.debug) {
      console.log('[Tracker] Event queued:', event.type, event);
    }

    // Flush if batch is full
    if (this.eventQueue.length >= this.config.maxBatchSize) {
      this.flush();
    } else if (!this.batchTimer) {
      // Schedule batch send
      this.batchTimer = window.setTimeout(() => {
        this.flush();
      }, this.config.batchInterval);
    }
  }

  private flush(): void {
    if (this.eventQueue.length === 0) return;

    const batch: EventBatch = {
      siteId: this.config.siteId,
      events: [...this.eventQueue],
      metadata: {
        sdkVersion: SDK_VERSION,
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

    // Clear queue and timer
    this.eventQueue = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Send batch
    sendBatch(this.config.endpoint, batch, this.config.debug);
  }

  // Public API methods
  public track(eventName: string, properties?: Record<string, any>): void {
    const event: CustomEvent = {
      ...this.createBaseEvent(),
      type: 'custom',
      name: eventName,
      properties,
    };

    this.addEvent(event);
  }

  public identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    setUserId(userId);

    if (this.config.debug) {
      console.log('[Tracker] User identified:', userId, traits);
    }

    // Track as custom event
    this.track('identify', { userId, ...traits });
  }

  public consent(granted: boolean): void {
    this.consentGranted = granted;

    if (!granted) {
      // Clear queue if consent is revoked
      this.eventQueue = [];
    }

    if (this.config.debug) {
      console.log('[Tracker] Consent:', granted);
    }
  }

  public updateConfig(config: Partial<TrackerConfig>): void {
    this.config = { ...this.config, ...config } as Required<TrackerConfig>;

    if (this.config.debug) {
      console.log('[Tracker] Config updated:', this.config);
    }
  }

  public destroy(): void {
    // Flush remaining events
    this.flush();

    // Clear timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    if (this.config.debug) {
      console.log('[Tracker] Destroyed');
    }
  }
}