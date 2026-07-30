"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { SellerProfile } from "@/types";
import { cx } from "@/lib/format";

const FILTERS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "All", value: "" },
];

const STATUS_STYLE: Record<string, string> = {
  PENDING: "text-turmeric",
  APPROVED: "text-sage",
  REJECTED: "text-terracotta",
};

export default function AdminSellersPage() {
  const { accessToken } = useAuth();
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    api
      .get<SellerProfile[]>(`/admin/sellers${qs}`, { token: accessToken })
      .then((res) => setSellers(res.data))
      .finally(() => setLoading(false));
  }, [accessToken, filter]);

  return (
    <div className="px-8 py-10 max-w-5xl">
      <p className="label-text text-terracotta">Admin</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Seller Applications</h1>
      <p className="mt-2 text-sm text-ink-soft/70">Review documents and business details before a seller can list products.</p>

      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={cx(
              "label-text px-4 py-2 rounded-full border transition-colors",
              filter === f.value ? "bg-ink text-stone border-ink" : "border-stone-line text-ink-soft hover:border-ink/30"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft/60">Loading…</p>
      ) : sellers.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft/60">No applications in this view.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="label-text text-ink-soft/50 text-left border-b border-stone-line">
                <th className="py-3 pr-4">Shop</th>
                <th className="py-3 pr-4">Owner</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Craft</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Submitted</th>
                <th className="py-3 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((s) => (
                <tr key={s.id} className="border-b border-stone-line/60">
                  <td className="py-3 pr-4 text-ink">{s.name}</td>
                  <td className="py-3 pr-4 text-ink-soft">{s.owner_name}</td>
                  <td className="py-3 pr-4 text-ink-soft">{s.email}</td>
                  <td className="py-3 pr-4 text-ink-soft">{s.craft_specialty}</td>
                  <td className="py-3 pr-4">
                    <span className={cx("label-text", STATUS_STYLE[s.verification_status])}>{s.verification_status}</span>
                  </td>
                  <td className="py-3 pr-4 text-ink-soft/60 text-xs">
                    {s.verification_submitted_at ? new Date(s.verification_submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <Link href={`/admin/sellers/${s.id}`} className="label-text text-indigo hover:text-terracotta transition-colors">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
