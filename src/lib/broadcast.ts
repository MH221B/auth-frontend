export type AuthMessage = "login" | "logout";

const CHANNEL = "auth_broadcast_v1";

export function broadcast(action: AuthMessage) {
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(CHANNEL);
      bc.postMessage(action);
      bc.close();
      return;
    }
  } catch (e) {
    // fallthrough to localStorage fallback
  }

  try {
    // Write a small object so storage events fire across tabs.
    localStorage.setItem(CHANNEL, JSON.stringify({ action, ts: Date.now() }));
    // Immediately remove to avoid leaving stale data
    localStorage.removeItem(CHANNEL);
  } catch (e) {
    // ignore
  }
}

export function subscribe(handler: (action: AuthMessage) => void) {
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(CHANNEL);
      const listener = (ev: MessageEvent) => {
        try {
          handler(ev.data as AuthMessage);
        } catch (e) {
          // ignore handler errors
        }
      };
      bc.addEventListener("message", listener);
      return () => {
        bc.removeEventListener("message", listener);
        bc.close();
      };
    }
  } catch (e) {
    // fallback to storage event
  }

  const storageListener = (ev: StorageEvent) => {
    if (ev.key !== CHANNEL) return;
    if (!ev.newValue) return;
    try {
      const parsed = JSON.parse(ev.newValue);
      if (parsed && typeof parsed.action === "string") {
        handler(parsed.action as AuthMessage);
      }
    } catch (e) {
      // ignore
    }
  };

  window.addEventListener("storage", storageListener);
  return () => window.removeEventListener("storage", storageListener);
}
