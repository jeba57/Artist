"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { AdminStats } from "@/types";
import { formatPrice } from "@/lib/format";

export default function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api.get<AdminStats>("/admin/stats", { token: accessToken }).then((res) => setStats(res.data));
  }, [accessToken]);

  const cards = stats
    ? [
        { label: "Total Orders", value: stats.total_orders, href: "/admin/orders" },
        { label: "Awaiting Confirmation", value: stats.pending_orders, href: "/admin/orders?status=PENDING" },
        { label: "In Transit", value: stats.confirmed_orders + stats.shipped_orders, href: "/admin/orders" },
        { label: "Delivered", value: stats.delivered_orders, href: "/admin/orders?status=DELIVERED" },
        { label: "Total Revenue", value: formatPrice(Number(stats.total_revenue)), href: "/admin/orders" },
        { label: "Payouts Owed", value: formatPrice(Number(stats.payouts_owed)), href: "/admin/payouts" },
        { label: "Products", value: stats.total_products, href: "/admin/products" },
        { label: "Users", value: stats.total_users, href: "/admin/users" },
      ]
    : [];

  return (
    <div className="px-8 py-10 max-w-5xl">
      <p className="label-text text-terracotta">Admin</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Dashboard</h1>
      <p className="mt-2 text-sm text-ink-soft/70">A quick pulse on orders, payouts, and the catalog.</p>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-white/60 border border-stone-line rounded-2xl px-5 py-5 hover:border-indigo/40 transition-colors"
          >
            <p className="label-text text-ink-soft/50">{c.label}</p>
            <p className="mt-2 font-display text-2xl text-ink">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
