import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL as string;

type AuthContextType = {
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwtExp(token: string | null): number | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof payload.exp === "number") return payload.exp;
    return null;
  } catch (e) {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const refreshTimer = useRef<number | null>(null);

  const clearRefresh = () => {
    if (refreshTimer.current !== null) {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  const scheduleRefresh = useCallback((token: string | null) => {
    clearRefresh();
    const exp = parseJwtExp(token);
    if (!exp) return;
    // schedule refresh 60 seconds before expiry (or immediately if already expired)
    const msUntilExp = exp * 1000 - Date.now();
    const refreshIn = Math.max(0, msUntilExp - 60_000);
    refreshTimer.current = window.setTimeout(() => {
      silentRefresh().catch(() => {});
    }, refreshIn) as unknown as number;
  }, []);

  const silentRefresh = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/user/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        setAccessToken(null);
        clearRefresh();
        return;
      }
      const data = await res.json();
      // backend returns the access token in the `token` field
      const token = data?.token ?? null;
      setAccessToken(token);
      scheduleRefresh(token);
    } catch (err) {
      setAccessToken(null);
      clearRefresh();
    }
  }, [scheduleRefresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/user/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    // backend returns the access token in the `token` field
    const token = data?.token ?? null;
    setAccessToken(token);
    scheduleRefresh(token);
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/user/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setAccessToken(null);
      clearRefresh();
    }
  }, []);

  const getAccessToken = useCallback(() => accessToken, [accessToken]);

  useEffect(() => {
    // Try to obtain token silently on mount (refresh token in httpOnly cookie expected)
    silentRefresh();
    return () => clearRefresh();
  }, [silentRefresh]);

  const value: AuthContextType = {
    accessToken,
    isAuthenticated: !!accessToken,
    login,
    logout,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthProvider;
