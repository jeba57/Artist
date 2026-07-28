"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Users, Wallet, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cx } from "@/lib/format";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/payouts", label: "Payouts", icon: Wallet },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Still resolving the session — render nothing rather than a
  // flash of "Access Denied" for a legitimate admin who just hasn't
  // hydrated yet.
  if (loading) {
    return <div className="min-h-screen bg-ink" />;
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6">
        <div className="text-center">
          <p className="label-text text-terracotta">403</p>
          <h1 className="mt-3 font-display text-3xl text-stone">Access Denied</h1>
          <p className="mt-3 text-sm text-stone/60 max-w-sm">
            This area isn&rsquo;t available to your account.
          </p>
          <Link href="/" className="mt-7 inline-block bg-stone text-ink label-text px-6 py-3 rounded-full hover:bg-stone-deep transition-colors">
            Back to Artist
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-deep flex font-body">
      <aside className="w-60 shrink-0 bg-ink text-stone flex flex-col">
        <div className="px-6 py-6 border-b border-stone/10">
          <span className="font-display text-xl">Artist</span>
          <p className="label-text text-stone/40 mt-1">Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                  active ? "bg-stone text-ink font-medium" : "text-stone/70 hover:bg-stone/10 hover:text-stone"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-stone/10">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone/50 hover:bg-stone/10 hover:text-stone transition-colors">
            <ExternalLink size={16} />
            View site
          </Link>
          <p className="px-3 mt-2 text-xs text-stone/30">{user.name}</p>
        </div>
      </aside>

      <main className="flex-1 min-h-screen overflow-y-auto">{children}</main>
    </div>
  );
}
