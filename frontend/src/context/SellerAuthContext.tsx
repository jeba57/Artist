"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import type { SellerProfile } from "@/types";

interface SellerAuthContextValue {
  seller: SellerProfile | null;
  accessToken: string | null;
  loading: boolean;
  loginSeller: (email: string, password: string) => Promise<void>;
  logoutSeller: () => Promise<void>;
  refreshSeller: () => Promise<void>;
  setSellerSession: (token: string, seller: SellerProfile) => void;
}

const SellerAuthContext = createContext<SellerAuthContextValue | undefined>(undefined);

// Deliberately a different storage key from the buyer/admin token, so
// someone can be logged in as both a buyer and a seller at once
// without either session clobbering the other.
const SELLER_TOKEN_KEY = "artist_seller_access_token";

export function SellerAuthProvider({ children }: { children: ReactNode }) {
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(SELLER_TOKEN_KEY) : null;
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<SellerProfile>("/seller/auth/me", { token: stored });
      setSeller(res.data);
      setAccessToken(stored);
    } catch {
      localStorage.removeItem(SELLER_TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const setSellerSession = (token: string, s: SellerProfile) => {
    localStorage.setItem(SELLER_TOKEN_KEY, token);
    setAccessToken(token);
    setSeller(s);
  };

  const loginSeller = async (email: string, password: string) => {
    const res = await api.post<{ seller: SellerProfile; accessToken: string }>("/seller/auth/login", { email, password });
    setSellerSession(res.data.accessToken, res.data.seller);
  };

  const logoutSeller = async () => {
    try {
      if (accessToken) await api.post("/seller/auth/logout", undefined, { token: accessToken });
    } catch {
      /* best-effort */
    }
    localStorage.removeItem(SELLER_TOKEN_KEY);
    setSeller(null);
    setAccessToken(null);
  };

  const refreshSeller = async () => {
    if (!accessToken) return;
    const res = await api.get<SellerProfile>("/seller/auth/me", { token: accessToken });
    setSeller(res.data);
  };

  return (
    <SellerAuthContext.Provider value={{ seller, accessToken, loading, loginSeller, logoutSeller, refreshSeller, setSellerSession }}>
      {children}
    </SellerAuthContext.Provider>
  );
}

export function useSellerAuth() {
  const ctx = useContext(SellerAuthContext);
  if (!ctx) throw new Error("useSellerAuth must be used within SellerAuthProvider");
  return ctx;
}
