import { z } from 'zod';

// Base event schema
const baseEventSchema = z.object({
  type: z.enum([
    'pageview',
    'click',
    'scroll',
    'input',
    'route_change',
    'error',
    'performance',
    'heartbeat',
    'custom',
  ]),
  timestamp: z.number(),
  sessionId: z.string().uuid(),
  userId: z.string().optional(),
  url: z.string().url(),
  referrer: z.string(),
  viewport: z.object({
    width: z.number(),
    height: z.number(),
  }),
});

// Specific event schemas
const pageviewEventSchema = baseEventSchema.extend({
  type: z.literal('pageview'),
  title: z.string(),
});

const clickEventSchema = baseEventSchema.extend({
  type: z.literal('click'),
  target: z.object({
    tagName: z.string(),
    id: z.string().optional(),
    className: z.string().optional(),
    text: z.string().optional(),
    attributes: z.record(z.string()).optional(),
  }),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

const scrollEventSchema = baseEventSchema.extend({
  type: z.literal('scroll'),
  depth: z.number().min(0).max(100),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

const inputEventSchema = baseEventSchema.extend({
  type: z.literal('input'),
  target: z.object({
    tagName: z.string(),
    id: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
  }),
  masked: z.boolean(),
  value: z.string().optional(),
});

const routeChangeEventSchema = baseEventSchema.extend({
  type: z.literal('route_change'),
  from: z.string(),
  to: z.string(),
});

const errorEventSchema = baseEventSchema.extend({
  type: z.literal('error'),
  error: z.object({
    message: z.string(),
    stack: z.string().optional(),
    line: z.number().optional(),
    column: z.number().optional(),
    filename: z.string().optional(),
  }),
});

const performanceEventSchema = baseEventSchema.extend({
  type: z.literal('performance'),
  metrics: z.object({
    dns: z.number().optional(),
    tcp: z.number().optional(),
    ttfb: z.number().optional(),
    download: z.number().optional(),
    domInteractive: z.number().optional(),
    domComplete: z.number().optional(),
    loadComplete: z.number().optional(),
    fcp: z.number().optional(),
    lcp: z.number().optional(),
  }),
});

const heartbeatEventSchema = baseEventSchema.extend({
  type: z.literal('heartbeat'),
  duration: z.number(),
});

const customEventSchema = baseEventSchema.extend({
  type: z.literal('custom'),
  name: z.string(),
  properties: z.record(z.any()).optional(),
});

// Union of all event types
const eventSchema = z.discriminatedUnion('type', [
  pageviewEventSchema,
  clickEventSchema,
  scrollEventSchema,
  inputEventSchema,
  routeChangeEventSchema,
  errorEventSchema,
  performanceEventSchema,
  heartbeatEventSchema,
  customEventSchema,
]);

// Event batch schema
export const eventBatchSchema = z.object({
  siteId: z.string().min(1),
  events: z.array(eventSchema).min(1).max(100),
  metadata: z.object({
    sdkVersion: z.string(),
    userAgent: z.string(),
    language: z.string(),
    timezone: z.string(),
    screen: z.object({
      width: z.number(),
      height: z.number(),
      colorDepth: z.number(),
    }),
  }),
});

export type ValidatedEventBatch = z.infer<typeof eventBatchSchema>;