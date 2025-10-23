/**
 * Main SDK entry point
 * This gets loaded after the async loader
 */

import { Tracker } from './tracker';
import { TrackerConfig, HJApi } from '../types';

declare global {
  interface Window {
    __hjq: any[][];
    __hjConfig: {
      siteId: string;
      endpoint: string;
      loadTime: number;
    };
    hj: HJApi & { _loaded?: boolean; _tracker?: Tracker };
  }
}

(function() {
  // Prevent double initialization
  if (window.hj._loaded) {
    console.warn('[Tracker] SDK already loaded');
    return;
  }

  // Get initial config from loader
  const initialConfig = window.__hjConfig;
  if (!initialConfig) {
    console.error('[Tracker] Missing initial config');
    return;
  }

  // Initialize tracker
  const config: TrackerConfig = {
    siteId: initialConfig.siteId,
    endpoint: initialConfig.endpoint,
    debug: false, // Can be overridden via hj('config', ...)
  };

  const tracker = new Tracker(config);

  // Process queued events from before SDK loaded
  const queue = window.__hjq || [];
  for (const args of queue) {
    processCommand(tracker, args);
  }

  // Replace the queue function with the real implementation
  const hjApi: HJApi = function(...args: any[]) {
    processCommand(tracker, args);
  } as HJApi;

  hjApi._loaded = true;
  hjApi._tracker = tracker;

  window.hj = hjApi;

  // Log load time
  const loadTime = Date.now() - initialConfig.loadTime;
  if (config.debug) {
    console.log(`[Tracker] SDK loaded in ${loadTime}ms`);
  }
})();

function processCommand(tracker: Tracker, args: any[]): void {
  const [command, ...params] = args;

  switch (command) {
    case 'track':
      const [eventName, properties] = params;
      tracker.track(eventName, properties);
      break;

    case 'identify':
      const [userId, traits] = params;
      tracker.identify(userId, traits);
      break;

    case 'consent':
      const [granted] = params;
      tracker.consent(granted);
      break;

    case 'config':
      const [newConfig] = params;
      tracker.updateConfig(newConfig);
      break;

    default:
      console.warn('[Tracker] Unknown command:', command);
  }
}

// Export for TypeScript users who want to import directly
export { Tracker } from './tracker';
export * from '../types';