"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { AdminUser } from "@/types";
import { cx } from "@/lib/format";

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    api
      .get<AdminUser[]>("/admin/users", { token: accessToken })
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div className="px-8 py-10 max-w-4xl">
      <p className="label-text text-terracotta">Admin</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Users</h1>
      <p className="mt-2 text-sm text-ink-soft/70">{users.length} registered accounts.</p>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft/60">Loading…</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="label-text text-ink-soft/50 text-left border-b border-stone-line">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Orders</th>
                <th className="py-3 pr-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-stone-line/60">
                  <td className="py-3 pr-4 text-ink">{u.name}</td>
                  <td className="py-3 pr-4 text-ink-soft">{u.email}</td>
                  <td className="py-3 pr-4">
                    <span className={cx("label-text", u.role === "ADMIN" ? "text-indigo" : "text-ink-soft")}>{u.role}</span>
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{u.order_count}</td>
                  <td className="py-3 pr-4 text-ink-soft/60 text-xs">
                    {new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
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
