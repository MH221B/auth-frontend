export type AuthMessage = "login" | "logout";

const CHANNEL = "auth_broadcast_v1";

type BroadcastPayload = {
  action: AuthMessage;
  ts?: number;
  clientId?: string;
};

// include optional clientId so tabs can ignore messages originating from themselves
export function broadcast(action: AuthMessage, clientId?: string) {
  const payload: BroadcastPayload = { action, ts: Date.now(), clientId };
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(CHANNEL);
      bc.postMessage(payload);
      bc.close();
      return;
    }
  } catch (e) {
    // fallthrough to localStorage fallback
  }

  try {
    // Write a small object so storage events fire across tabs.
    localStorage.setItem(CHANNEL, JSON.stringify(payload));
    // Immediately remove to avoid leaving stale data
    localStorage.removeItem(CHANNEL);
  } catch (e) {
    // ignore
  }
}

// subscribe will ignore messages whose clientId matches `localClientId` if provided
export function subscribe(handler: (action: AuthMessage) => void, localClientId?: string) {
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(CHANNEL);
      const listener = (ev: MessageEvent) => {
        try {
          const data = ev.data as BroadcastPayload | string;
          let payload: BroadcastPayload;
          if (typeof data === "string") {
            try {
              payload = JSON.parse(data);
            } catch (e) {
              return;
            }
          } else {
            payload = data as BroadcastPayload;
          }
          if (localClientId && payload.clientId && payload.clientId === localClientId) return;
          handler(payload.action);
        } catch (e) {
          // ignore handler errors
        }
      };
      bc.addEventListener("message", listener as EventListener);
      return () => {
        bc.removeEventListener("message", listener as EventListener);
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
      const parsed = JSON.parse(ev.newValue) as BroadcastPayload;
      if (!parsed || typeof parsed.action !== "string") return;
      if (localClientId && parsed.clientId && parsed.clientId === localClientId) return;
      handler(parsed.action as AuthMessage);
    } catch (e) {
      // ignore
    }
  };

  window.addEventListener("storage", storageListener);
  return () => window.removeEventListener("storage", storageListener);
}
