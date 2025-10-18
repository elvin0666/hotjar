class HotjarRecorder {
    constructor(apiUrl = 'http://localhost:8080/api/recording') {
        this.apiUrl = apiUrl;
        this.sessionId = null;
        this.isRecording = false;
        this.eventQueue = [];
        this.startTime = null;
    }

    async startRecording() {
        if (this.isRecording) {
            console.warn('Recording already in progress');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: window.location.href,
                    viewportWidth: window.innerWidth,
                    viewportHeight: window.innerHeight,
                    userAgent: navigator.userAgent
                })
            });

            const data = await response.json();
            this.sessionId = data.sessionId;
            this.isRecording = true;
            this.startTime = Date.now();

            console.log('Recording started with session ID:', this.sessionId);

            this.attachEventListeners();
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }

    attachEventListeners() {
        // Mouse movement
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));

        // Mouse clicks
        document.addEventListener('click', this.handleClick.bind(this));

        // Scroll events
        document.addEventListener('scroll', this.handleScroll.bind(this));

        // Keyboard input
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));

        // Page visibility change
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    getTimestamp() {
        return Date.now() - this.startTime;
    }

    async sendEvent(eventType, eventData) {
        if (!this.isRecording) return;

        const event = {
            sessionId: this.sessionId,
            timestamp: this.getTimestamp(),
            eventType: eventType,
            eventData: JSON.stringify(eventData)
        };

        try {
            await fetch(`${this.apiUrl}/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.error('Failed to send event:', error);
        }
    }

    handleMouseMove(e) {
        // Throttle mouse move events to avoid overwhelming the server
        if (!this.lastMouseMove || Date.now() - this.lastMouseMove > 50) {
            this.sendEvent('mousemove', {
                x: e.clientX,
                y: e.clientY,
                pageX: e.pageX,
                pageY: e.pageY
            });
            this.lastMouseMove = Date.now();
        }
    }

    handleClick(e) {
        this.sendEvent('click', {
            x: e.clientX,
            y: e.clientY,
            pageX: e.pageX,
            pageY: e.pageY,
            target: this.getElementPath(e.target),
            button: e.button
        });
    }

    handleScroll(e) {
        // Throttle scroll events
        if (!this.lastScroll || Date.now() - this.lastScroll > 100) {
            this.sendEvent('scroll', {
                scrollX: window.scrollX,
                scrollY: window.scrollY
            });
            this.lastScroll = Date.now();
        }
    }

    handleKeyDown(e) {
        this.sendEvent('keydown', {
            key: e.key,
            code: e.code,
            target: this.getElementPath(e.target)
        });
    }

    handleResize(e) {
        this.sendEvent('resize', {
            width: window.innerWidth,
            height: window.innerHeight
        });
    }

    handleVisibilityChange(e) {
        this.sendEvent('visibilitychange', {
            hidden: document.hidden
        });
    }

    getElementPath(element) {
        if (!element) return '';

        const path = [];
        let current = element;

        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let selector = current.nodeName.toLowerCase();

            if (current.id) {
                selector += '#' + current.id;
                path.unshift(selector);
                break;
            } else {
                let sibling = current;
                let nth = 1;
                while (sibling.previousElementSibling) {
                    sibling = sibling.previousElementSibling;
                    if (sibling.nodeName.toLowerCase() === selector) nth++;
                }
                if (nth > 1) selector += `:nth-of-type(${nth})`;
            }

            path.unshift(selector);
            current = current.parentNode;
        }

        return path.join(' > ');
    }

    async stopRecording() {
        if (!this.isRecording) {
            console.warn('No recording in progress');
            return;
        }

        try {
            await fetch(`${this.apiUrl}/end/${this.sessionId}`, {
                method: 'POST'
            });

            this.isRecording = false;
            console.log('Recording stopped for session:', this.sessionId);

            // Remove event listeners
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('click', this.handleClick);
            document.removeEventListener('scroll', this.handleScroll);
            document.removeEventListener('keydown', this.handleKeyDown);
            window.removeEventListener('resize', this.handleResize);
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    }
}

// Auto-initialize if window.hotjarAutoStart is true
if (typeof window !== 'undefined' && window.hotjarAutoStart) {
    const recorder = new HotjarRecorder();
    recorder.startRecording();
    window.hotjarRecorder = recorder;
}