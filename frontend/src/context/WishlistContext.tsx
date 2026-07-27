"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import type { ProductCard } from "@/types";
import { useAuth } from "./AuthContext";

interface WishlistContextValue {
  items: ProductCard[];
  ids: Set<string>;
  loading: boolean;
  toggle: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<ProductCard[]>("/wishlist", { token: accessToken });
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ids = new Set(items.map((i) => i.id));

  const toggle = async (productId: string) => {
    if (!accessToken) throw new Error("Please log in to save favourites.");
    if (ids.has(productId)) {
      await api.delete(`/wishlist/${productId}`, { token: accessToken });
    } else {
      await api.post(`/wishlist/${productId}`, undefined, { token: accessToken });
    }
    await refresh();
  };

  return <WishlistContext.Provider value={{ items, ids, loading, toggle }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
