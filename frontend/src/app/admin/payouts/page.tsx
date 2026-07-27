"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import type { PendingPayout } from "@/types";
import { formatPrice } from "@/lib/format";

export default function AdminPayoutsPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const [payouts, setPayouts] = useState<PendingPayout[]>([]);
  const [totalOwed, setTotalOwed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!accessToken) return;
    setLoading(true);
    api
      .get<PendingPayout[]>("/admin/payouts", { token: accessToken })
      .then((res) => {
        setPayouts(res.data);
        const meta = res.meta as unknown as { totalOwed?: number } | undefined;
        setTotalOwed(meta?.totalOwed ?? 0);
      })
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load payouts."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [accessToken]);

  const markPaid = async (orderItemId: string) => {
    if (!accessToken) return;
    setMarkingId(orderItemId);
    try {
      await api.post(`/admin/payouts/${orderItemId}/mark-paid`, undefined, { token: accessToken });
      setPayouts((prev) => prev.filter((p) => p.order_item_id !== orderItemId));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't mark this payout paid.");
    } finally {
      setMarkingId(null);
    }
  };

  if (!authLoading && (!user || user.role !== "ADMIN")) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="font-display text-2xl text-ink">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-14">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="label-text text-terracotta">Admin</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Payouts owed to makers</h1>
        </div>
        <Link href="/admin/orders" className="label-text text-indigo hover:text-terracotta transition-colors">
          ← Orders
        </Link>
      </div>

      <p className="mt-3 text-sm text-ink-soft/70 max-w-xl">
        Pay each maker via UPI or bank transfer yourself, then click Mark Paid to log it here.
        This doesn&rsquo;t move any money automatically.
      </p>

      {payouts.length > 0 && (
        <div className="mt-6 bg-stone-deep rounded-2xl px-5 py-4 flex items-center justify-between">
          <span className="label-text text-ink-soft/60">Total owed across {payouts.length} item{payouts.length !== 1 ? "s" : ""}</span>
          <span className="font-display text-xl text-ink">{formatPrice(totalOwed)}</span>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-terracotta">{error}</p>}

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft/60">Loading…</p>
      ) : payouts.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft/60">No payouts pending right now.</p>
      ) : (
        <div className="mt-8 divide-y divide-stone-line border-y border-stone-line">
          {payouts.map((p) => (
            <div key={p.order_item_id} className="py-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-display text-lg text-ink">{p.artisan_name}</p>
                <p className="label-text text-ink-soft/50 mt-1">
                  {p.product_name} × {p.quantity} · {p.artisan_location}
                </p>
                <p className="text-xs text-ink-soft/50 mt-1">
                  Order confirmed {new Date(p.admin_confirmed_at).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium text-ink">{formatPrice(Number(p.seller_amount))}</p>
                  <p className="text-xs text-ink-soft/50">platform fee {formatPrice(Number(p.platform_fee))}</p>
                </div>
                <button
                  onClick={() => markPaid(p.order_item_id)}
                  disabled={markingId === p.order_item_id}
                  className="bg-terracotta text-stone label-text px-5 py-2.5 rounded-full hover:bg-terracotta-deep transition-colors disabled:opacity-50"
                >
                  {markingId === p.order_item_id ? "Marking…" : "Mark Paid"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
