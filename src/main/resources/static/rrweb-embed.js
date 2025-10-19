/**
 * RRWeb Session Replay Recorder
 * Minimal session recorder using rrweb
 *
 * Usage: Include this script in your HTML:
 * <script src="/rrweb-embed.js"></script>
 */

// =====================================================
// Configuration
// =====================================================
const FLUSH_MS = 10000;        // Send events every 10 seconds
const FLUSH_COUNT = 50;        // Or after 50 events
const INGEST_URL = '/api/replay/ingest';

// =====================================================
// Session Recorder using rrweb
// =====================================================
(function() {
    'use strict';

    // Load rrweb from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js';
    script.onload = initRecorder;
    document.head.appendChild(script);

    let sessionId = null;
    let eventBuffer = [];
    let flushTimer = null;
    let stopRecordFn = null;

    function initRecorder() {
        // Generate unique session ID
        sessionId = crypto.randomUUID();
        console.log('[RRWeb] Session started:', sessionId);

        // Start recording with rrweb
        stopRecordFn = rrweb.record({
            emit(event) {
                // Add event to buffer
                eventBuffer.push(event);

                // Flush if buffer reaches count limit
                if (eventBuffer.length >= FLUSH_COUNT) {
                    flushEvents();
                }
            },
            // Privacy settings
            maskAllText: true,
            maskInputOptions: {
                password: true,
                email: true,
                text: true,
                textarea: true,
                tel: true,
                search: true,
                url: true,
                number: true,
                date: true,
                color: true,
                time: true,
                week: true,
                month: true,
                datetime: true,
                'datetime-local': true
            },
            // Block elements with .rr-block class
            blockClass: 'rr-block',
            // Additional privacy options
            maskTextClass: 'rr-mask',
            maskTextSelector: null,
            // Performance options
            checkoutEveryNms: 5 * 60 * 1000, // Full snapshot every 5 minutes
            checkoutEveryNth: null,
            // Sampling
            mousemoveWait: 50,
            // Collect fonts
            inlineStylesheet: true,
            recordCanvas: false,
            collectFonts: true
        });

        // Set up periodic flush
        startFlushTimer();

        // Handle page unload
        window.addEventListener('beforeunload', handleUnload);
        window.addEventListener('pagehide', handleUnload);
    }

    function startFlushTimer() {
        if (flushTimer) {
            clearInterval(flushTimer);
        }
        flushTimer = setInterval(() => {
            if (eventBuffer.length > 0) {
                flushEvents();
            }
        }, FLUSH_MS);
    }

    function flushEvents() {
        if (eventBuffer.length === 0) return;

        const eventsToSend = [...eventBuffer];
        eventBuffer = [];

        const payload = {
            sessionId: sessionId,
            events: eventsToSend,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        // Send events to backend
        fetch(INGEST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            keepalive: true
        })
        .then(response => {
            if (response.ok) {
                console.log(`[RRWeb] Sent ${eventsToSend.length} events`);
            } else {
                console.error('[RRWeb] Failed to send events:', response.status);
                // Put events back in buffer if failed
                eventBuffer = [...eventsToSend, ...eventBuffer];
            }
        })
        .catch(error => {
            console.error('[RRWeb] Error sending events:', error);
            // Put events back in buffer if failed
            eventBuffer = [...eventsToSend, ...eventBuffer];
        });
    }

    function handleUnload() {
        // Stop recording
        if (stopRecordFn) {
            stopRecordFn();
        }

        // Clear flush timer
        if (flushTimer) {
            clearInterval(flushTimer);
        }

        // Send remaining events with sendBeacon
        if (eventBuffer.length > 0) {
            const payload = {
                sessionId: sessionId,
                events: eventBuffer,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                sessionEnd: true
            };

            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(INGEST_URL, blob);
            console.log(`[RRWeb] Sent ${eventBuffer.length} final events via beacon`);
            eventBuffer = [];
        }
    }

    // Expose API for manual control (optional)
    window.RRWebRecorder = {
        getSessionId: () => sessionId,
        flush: flushEvents,
        stop: () => {
            if (stopRecordFn) {
                stopRecordFn();
                flushEvents();
            }
        }
    };
})();