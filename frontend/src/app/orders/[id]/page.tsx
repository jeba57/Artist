"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { OrderDetail } from "@/types";
import { formatPrice } from "@/lib/format";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const justPaid = searchParams.get("justPaid") === "1";
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    api
      .get<OrderDetail>(`/orders/${params.id}`, { token: accessToken })
      .then((res) => setOrder(res.data))
      .finally(() => setLoading(false));
  }, [accessToken, params.id]);

  if (loading) return <div className="mx-auto max-w-2xl px-5 py-24 text-center text-sm text-ink-soft/60">Loading…</div>;
  if (!order) return <div className="mx-auto max-w-2xl px-5 py-24 text-center text-sm text-ink-soft/60">Order not found.</div>;

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 py-14">
      {justPaid && (
        <div className="mb-8 flex items-start gap-3 bg-sage/10 border border-sage/30 rounded-2xl px-5 py-4">
          <CheckCircle2 size={20} className="text-sage shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ink">Payment successful!</p>
            <p className="text-sm text-ink-soft mt-0.5">
              Your order is placed and the maker has been notified. We&rsquo;ll confirm once it&rsquo;s delivered.
            </p>
          </div>
        </div>
      )}

      <p className="label-text text-terracotta">Order #{order.id.slice(-8)}</p>
      <h1 className="mt-2 font-display text-3xl text-ink">
        {order.payment_status !== "PAID" ? "Payment incomplete" : order.admin_confirmed_at ? "Delivered & confirmed" : "Awaiting delivery confirmation"}
      </h1>
      <p className="mt-2 text-sm text-ink-soft/60">
        Placed {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 divide-y divide-stone-line border-y border-stone-line">
        {order.items.map((item) => (
          <div key={item.id} className="py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-ink font-medium">{item.product_name}</p>
              <p className="label-text text-ink-soft/50 mt-1">
                Qty {item.quantity} · Sold by {item.artisan_name || "—"}
              </p>
            </div>
            <p className="text-ink">{formatPrice(Number(item.price_each) * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <span className="label-text text-ink-soft/60">Total paid</span>
        <span className="font-display text-2xl text-ink">{formatPrice(Number(order.total_amount))}</span>
      </div>

      <div className="mt-10 pt-8 border-t border-stone-line">
        <p className="label-text text-ink-soft/60 mb-3">Shipping to</p>
        <p className="text-sm text-ink leading-relaxed">
          {order.shipping_address.fullName}<br />
          {order.shipping_address.line1}{order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ""}<br />
          {order.shipping_address.city} — {order.shipping_address.pincode}<br />
          {order.shipping_address.phone}
        </p>
      </div>

      <Link href="/orders" className="mt-10 inline-block label-text text-indigo hover:text-terracotta transition-colors">
        ← Back to your orders
      </Link>
    </div>
  );
}
