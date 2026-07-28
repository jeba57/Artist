"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api, ApiClientError } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "artist_access_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
     const res = await api.get<{ user: User }>("/auth/me", { token: stored });

console.log("AUTH /auth/me:", res.data);

setUser(res.data.user);
setAccessToken(stored);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const persist = (token: string, u: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    setAccessToken(token);
    setUser(u);
  };

 const login = async (email: string, password: string) => {
  const res = await api.post<{ user: User; accessToken: string }>("/auth/login", {
    email,
    password,
  });

  console.log("LOGIN RESPONSE:", res.data.user);

  persist(res.data.accessToken, res.data.user);
};

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post<{ user: User; accessToken: string }>("/auth/register", { name, email, password });
    persist(res.data.accessToken, res.data.user);
  };

  const logout = async () => {
    try {
      if (accessToken) await api.post("/auth/logout", undefined, { token: accessToken });
    } catch {
      /* best-effort */
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiClientError };
