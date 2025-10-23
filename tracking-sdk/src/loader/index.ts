/**
 * Async loader for the tracking SDK
 * This creates the global queue and loads the full SDK asynchronously
 * Usage: <script async src="loader.js" data-site-id="YOUR_SITE_ID"></script>
 */

(function() {
  // Create global queue for early events
  window.__hjq = window.__hjq || [];

  // Create the hj() API function
  window.hj = window.hj || function() {
    window.__hjq.push(arguments);
  };

  // Get configuration from script tag
  const script = document.currentScript as HTMLScriptElement;
  const siteId = script?.getAttribute('data-site-id');
  const endpoint = script?.getAttribute('data-endpoint') || '/v1/ingest';
  const sdkUrl = script?.getAttribute('data-sdk-url') || '/sdk.js';

  if (!siteId) {
    console.error('[Tracker] Missing data-site-id attribute');
    return;
  }

  // Store initial config
  window.__hjConfig = {
    siteId,
    endpoint,
    loadTime: Date.now(),
  };

  // Load the full SDK asynchronously
  const sdkScript = document.createElement('script');
  sdkScript.async = true;
  sdkScript.src = sdkUrl;
  sdkScript.onerror = function() {
    console.error('[Tracker] Failed to load SDK from', sdkUrl);
  };

  // Insert before the loader script
  const firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode?.insertBefore(sdkScript, firstScript);
})();

// TypeScript declarations
declare global {
  interface Window {
    __hjq: any[][];
    __hjConfig: {
      siteId: string;
      endpoint: string;
      loadTime: number;
    };
    hj: {
      (...args: any[]): void;
      _loaded?: boolean;
    };
  }
}

export {};