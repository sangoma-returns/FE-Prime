const SESSION_KEY = 'bitfrost_session_v1';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SessionPayload {
  ts: number;
  data: {
    appState: any;
    authState: any;
    walletConnected: boolean;
  };
}

export function loadSession() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const payload: SessionPayload = JSON.parse(raw);
    if (!payload?.ts || !payload?.data) return null;
    if (Date.now() - payload.ts > SESSION_TTL_MS) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return payload.data;
  } catch {
    return null;
  }
}

export function saveSession(data: SessionPayload['data']) {
  if (typeof window === 'undefined') return;
  const payload: SessionPayload = { ts: Date.now(), data };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
}
