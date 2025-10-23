import { SessionData } from '../types';

const SESSION_KEY = '__hj_session';
const USER_ID_KEY = '__hj_user_id';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getSession(): SessionData {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const session: SessionData = JSON.parse(stored);
      const now = Date.now();

      // Check if session is still valid
      if (now - session.lastActivityTime < SESSION_TIMEOUT) {
        session.lastActivityTime = now;
        session.events++;
        saveSession(session);
        return session;
      }
    }
  } catch (e) {
    // localStorage might be disabled
    console.warn('[Tracker] localStorage not available', e);
  }

  // Create new session
  return createNewSession();
}

export function createNewSession(): SessionData {
  const session: SessionData = {
    id: generateUUID(),
    userId: getUserId(),
    startTime: Date.now(),
    lastActivityTime: Date.now(),
    pageviews: 0,
    events: 0,
  };

  saveSession(session);
  return session;
}

export function saveSession(session: SessionData): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    // Ignore localStorage errors
  }
}

export function getUserId(): string | undefined {
  try {
    const userId = localStorage.getItem(USER_ID_KEY);
    return userId || undefined;
  } catch (e) {
    return undefined;
  }
}

export function setUserId(userId: string): void {
  try {
    localStorage.setItem(USER_ID_KEY, userId);
    const session = getSession();
    session.userId = userId;
    saveSession(session);
  } catch (e) {
    // Ignore localStorage errors
  }
}

export function incrementPageview(): void {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const session: SessionData = JSON.parse(stored);
      session.pageviews++;
      session.lastActivityTime = Date.now();
      saveSession(session);
    }
  } catch (e) {
    // Ignore
  }
}