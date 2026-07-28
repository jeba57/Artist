"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import type { ProductCard } from "@/types";
import { formatPrice, cx } from "@/lib/format";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Public endpoint — reused as-is, no admin-only duplicate needed.
    api
      .get<ProductCard[]>("/products?limit=48&sort=newest")
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-8 py-10 max-w-6xl">
      <p className="label-text text-terracotta">Admin</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Products</h1>
      <p className="mt-2 text-sm text-ink-soft/70">{products.length} pieces in the catalog.</p>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft/60">Loading…</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="label-text text-ink-soft/50 text-left border-b border-stone-line">
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Artisan</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">Stock</th>
                <th className="py-3 pr-4">Rating</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-stone-line/60">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-stone-deep shrink-0">
                        {p.image && <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />}
                      </div>
                      <span className="text-ink max-w-[220px] truncate">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{p.category.name}</td>
                  <td className="py-3 pr-4 text-ink-soft">{p.artisan.name}</td>
                  <td className="py-3 pr-4 text-ink">{formatPrice(p.discountPrice ?? p.price, p.currency)}</td>
                  <td className={cx("py-3 pr-4", p.inStock ? "text-sage" : "text-terracotta")}>
                    {p.inStock ? "In stock" : "Out of stock"}
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">
                    {p.rating.count > 0 ? `★ ${p.rating.avg.toFixed(1)} (${p.rating.count})` : "—"}
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
