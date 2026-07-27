"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import type { Cart } from "@/types";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const EMPTY_CART: Cart = { items: [], itemCount: 0, subtotal: 0 };

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<Cart>("/cart", { token: accessToken });
      setCart(res.data);
    } catch {
      setCart(EMPTY_CART);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (productId: string, quantity = 1) => {
    if (!accessToken) throw new Error("Please log in to add items to your bag.");
    const res = await api.post<Cart>("/cart/items", { productId, quantity }, { token: accessToken });
    setCart(res.data);
  };

  const updateItem = async (productId: string, quantity: number) => {
    if (!accessToken) return;
    const res = await api.patch<Cart>(`/cart/items/${productId}`, { quantity }, { token: accessToken });
    setCart(res.data);
  };

  const removeItem = async (productId: string) => {
    if (!accessToken) return;
    const res = await api.delete<Cart>(`/cart/items/${productId}`, { token: accessToken });
    setCart(res.data);
  };

  return (
    <CartContext.Provider value={{ cart, loading, addItem, updateItem, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
