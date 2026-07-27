"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { BuyerOrderSummary } from "@/types";
import { formatPrice, cx } from "@/lib/format";

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  PENDING: { text: "Awaiting confirmation", className: "text-turmeric" },
  DELIVERED: { text: "Delivered & confirmed", className: "text-sage" },
  CONFIRMED: { text: "Confirmed", className: "text-sage" },
  SHIPPED: { text: "Shipped", className: "text-indigo" },
  CANCELLED: { text: "Cancelled", className: "text-terracotta" },
};

export default function OrdersPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<BuyerOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    api
      .get<BuyerOrderSummary[]>("/orders", { token: accessToken })
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="font-display text-2xl text-ink">Sign in to see your orders</p>
        <Link href="/login" className="mt-6 inline-block bg-ink text-stone label-text px-6 py-3.5 rounded-full hover:bg-indigo transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-14">
      <p className="label-text text-terracotta">Your Orders</p>
      <h1 className="mt-2 font-display text-3xl text-ink">{orders.length} order{orders.length !== 1 ? "s" : ""}</h1>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft/60">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="mt-10 text-center py-10">
          <p className="text-sm text-ink-soft/70">No orders yet.</p>
          <Link href="/discover" className="mt-5 inline-block bg-ink text-stone label-text px-6 py-3 rounded-full hover:bg-indigo transition-colors">
            Discover Craft
          </Link>
        </div>
      ) : (
        <div className="mt-8 divide-y divide-stone-line">
          {orders.map((o) => {
            const status = STATUS_LABEL[o.status] || { text: o.status, className: "text-ink-soft" };
            return (
              <Link key={o.id} href={`/orders/${o.id}`} className="py-5 flex items-center justify-between gap-4 group">
                <div>
                  <p className="font-display text-lg text-ink group-hover:text-terracotta transition-colors">
                    Order #{o.id.slice(-8)}
                  </p>
                  <p className="label-text text-ink-soft/50 mt-1">
                    {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-ink">{formatPrice(Number(o.total_amount))}</p>
                  <p className={cx("label-text mt-1", o.payment_status !== "PAID" ? "text-terracotta" : status.className)}>
                    {o.payment_status !== "PAID" ? "Payment incomplete" : status.text}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
