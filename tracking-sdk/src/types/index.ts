export interface TrackerConfig {
  siteId: string;
  endpoint?: string;
  sampleRate?: number; // 0-1, default 1 (100%)
  debug?: boolean;
  maskSelectors?: string[]; // CSS selectors to mask
  trackClicks?: boolean;
  trackScrolls?: boolean;
  trackInputs?: boolean;
  trackErrors?: boolean;
  trackPerformance?: boolean;
  batchInterval?: number; // ms, default 3000
  maxBatchSize?: number; // default 50
  consent?: boolean; // GDPR consent
}

export type EventType =
  | 'pageview'
  | 'click'
  | 'scroll'
  | 'input'
  | 'route_change'
  | 'error'
  | 'performance'
  | 'heartbeat'
  | 'custom';

export interface BaseEvent {
  type: EventType;
  timestamp: number;
  sessionId: string;
  userId?: string;
  url: string;
  referrer: string;
  viewport: {
    width: number;
    height: number;
  };
}

export interface PageviewEvent extends BaseEvent {
  type: 'pageview';
  title: string;
}

export interface ClickEvent extends BaseEvent {
  type: 'click';
  target: {
    tagName: string;
    id?: string;
    className?: string;
    text?: string;
    attributes?: Record<string, string>;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface ScrollEvent extends BaseEvent {
  type: 'scroll';
  depth: number; // percentage 0-100
  position: {
    x: number;
    y: number;
  };
}

export interface InputEvent extends BaseEvent {
  type: 'input';
  target: {
    tagName: string;
    id?: string;
    name?: string;
    type?: string;
  };
  masked: boolean;
  value?: string; // only if not masked
}

export interface RouteChangeEvent extends BaseEvent {
  type: 'route_change';
  from: string;
  to: string;
}

export interface ErrorEvent extends BaseEvent {
  type: 'error';
  error: {
    message: string;
    stack?: string;
    line?: number;
    column?: number;
    filename?: string;
  };
}

export interface PerformanceEvent extends BaseEvent {
  type: 'performance';
  metrics: {
    dns?: number;
    tcp?: number;
    ttfb?: number;
    download?: number;
    domInteractive?: number;
    domComplete?: number;
    loadComplete?: number;
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
  };
}

export interface HeartbeatEvent extends BaseEvent {
  type: 'heartbeat';
  duration: number; // session duration in ms
}

export interface CustomEvent extends BaseEvent {
  type: 'custom';
  name: string;
  properties?: Record<string, any>;
}

export type TrackingEvent =
  | PageviewEvent
  | ClickEvent
  | ScrollEvent
  | InputEvent
  | RouteChangeEvent
  | ErrorEvent
  | PerformanceEvent
  | HeartbeatEvent
  | CustomEvent;

export interface EventBatch {
  siteId: string;
  events: TrackingEvent[];
  metadata: {
    sdkVersion: string;
    userAgent: string;
    language: string;
    timezone: string;
    screen: {
      width: number;
      height: number;
      colorDepth: number;
    };
  };
}

export interface SessionData {
  id: string;
  userId?: string;
  startTime: number;
  lastActivityTime: number;
  pageviews: number;
  events: number;
}

export interface HJApi {
  (command: 'track', eventName: string, properties?: Record<string, any>): void;
  (command: 'identify', userId: string, traits?: Record<string, any>): void;
  (command: 'consent', granted: boolean): void;
  (command: 'config', config: Partial<TrackerConfig>): void;
}