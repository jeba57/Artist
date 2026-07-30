"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import type { AdminOrderSummary } from "@/types";
import { formatPrice } from "@/lib/format";

export default function AdminOrdersPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

 const load = useCallback(() => {
  if (!accessToken) return;

  setLoading(true);

  api
    .get<AdminOrderSummary[]>("/admin/orders?statusFilter=PENDING", {
      token: accessToken,
    })
    .then((res) => setOrders(res.data))
    .catch((err) =>
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Failed to load orders."
      )
    )
    .finally(() => setLoading(false));
}, [accessToken]);



  useEffect(() => {
  load();
}, [load]);

  const advanceOrder = async (orderId: string) => {
  if (!accessToken) return;

  setConfirmingId(orderId);

  try {
    await api.post(
      `/admin/orders/${orderId}/status`,
      { status: "CONFIRMED" },
      { token: accessToken }
    );

    load();
  } catch (err) {
    setError(
      err instanceof ApiClientError
        ? err.message
        : "Couldn't update order."
    );
  } finally {
    setConfirmingId(null);
  }
};

  if (!authLoading && (!user || user.role !== "ADMIN")) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="font-display text-2xl text-ink">Admin access required</p>
        <p className="mt-2 text-sm text-ink-soft/70">This dashboard is only visible to admin accounts.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-14">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="label-text text-terracotta">Admin</p>
         <h1 className="mt-2 font-display text-3xl text-ink">
  Pending Orders
</h1>
        </div>
        <Link href="/admin/payouts" className="label-text text-indigo hover:text-terracotta transition-colors">
          View Payouts →
        </Link>
      </div>

      <p className="mt-3 text-sm text-ink-soft/70 max-w-xl">
  Review newly placed orders and confirm them before they move to the next stage of fulfilment.
              </p>

      {error && <p className="mt-4 text-sm text-terracotta">{error}</p>}

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft/60">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft/60">Nothing needs confirmation right now.</p>
      ) : (
        <div className="mt-8 divide-y divide-stone-line border-y border-stone-line">
          {orders.map((o) => (
            <div key={o.id} className="py-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-display text-lg text-ink">Order #{o.id.slice(-8)}</p>
                <p className="label-text text-ink-soft/50 mt-1">
  {o.buyer_name} · {o.buyer_email}
</p>

<p className="text-xs text-ink-soft/60 mt-1">
  {o.product_summary}
</p>

<p className="text-xs text-ink-soft/50">
  Artisan: {o.artisan_names}
</p>

<p className="text-xs text-ink-soft/50 mt-1">
  Qty: {o.total_quantity} • {o.shipping_address.city} •{" "}
  {new Date(o.created_at).toLocaleDateString("en-IN")}
</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-ink">{formatPrice(Number(o.total_amount))}</span>
                <button
                  onClick={() => advanceOrder(o.id)}
                  disabled={confirmingId === o.id}
                  className="bg-ink text-stone label-text px-5 py-2.5 rounded-full hover:bg-indigo transition-colors disabled:opacity-50"
                >
                 {confirmingId === o.id ? "Updating..." : "Confirm Order"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
