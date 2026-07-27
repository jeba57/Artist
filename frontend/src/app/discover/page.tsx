"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/api";
import type { ProductCard as ProductCardType, Category, PaginationMeta } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { cx } from "@/lib/format";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "popular", label: "Most Reviewed" },
];

function DiscoverInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductCardType[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page") || 1);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      if (!("page" in updates)) params.delete("page");
      router.push(`/discover?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    api
      .get<Category[]>("/categories")
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (category) qs.set("category", category);
    if (sort) qs.set("sort", sort);
    qs.set("page", String(page));
    qs.set("limit", "12");

    api
      .get<ProductCardType[]>(`/products?${qs.toString()}`)
      .then((res) => {
        setProducts(res.data);
        setMeta(res.meta || null);
      })
      .catch(() => {
        setProducts([]);
        setMeta(null);
      })
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12 sm:py-16">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="label-text text-terracotta">Discover</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl text-ink">
            {search ? `Results for "${search}"` : category ? categories.find((c) => c.slug === category)?.name || "Discover" : "The Full Collection"}
          </h1>
          {meta && <p className="mt-2 text-sm text-ink-soft/70">{meta.total} handmade pieces</p>}
        </div>

        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="lg:hidden flex items-center gap-2 label-text border border-stone-line rounded-full px-4 py-2.5"
        >
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>

      <div className="mt-10 grid lg:grid-cols-[220px_1fr] gap-10">
        {/* Filters sidebar */}
        <aside className={cx("lg:block", filtersOpen ? "block" : "hidden")}>
          <div className="flex items-center justify-between lg:hidden mb-4">
            <p className="label-text">Filters</p>
            <button onClick={() => setFiltersOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div>
            <p className="label-text text-ink-soft/60 mb-3">Category</p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => updateParams({ category: null })}
                  className={cx("text-sm py-1.5 hover:text-terracotta transition-colors", !category && "text-terracotta font-medium")}
                >
                  All Craft
                </button>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => updateParams({ category: c.slug })}
                    className={cx(
                      "text-sm py-1.5 hover:text-terracotta transition-colors block truncate w-full text-left",
                      category === c.slug && "text-terracotta font-medium"
                    )}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <p className="label-text text-ink-soft/60 mb-3">Sort by</p>
            <ul className="space-y-1">
              {SORTS.map((s) => (
                <li key={s.value}>
                  <button
                    onClick={() => updateParams({ sort: s.value })}
                    className={cx(
                      "text-sm py-1.5 hover:text-terracotta transition-colors block w-full text-left",
                      sort === s.value && "text-terracotta font-medium"
                    )}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Grid */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-2xl bg-stone-deep animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display text-2xl text-ink">Nothing here yet</p>
              <p className="mt-2 text-sm text-ink-soft/70">Try a different search or clear your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {Array.from({ length: meta.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateParams({ page: String(i + 1) })}
                  className={cx(
                    "label-text w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                    page === i + 1 ? "bg-ink text-stone" : "hover:bg-stone-deep"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={null}>
      <DiscoverInner />
    </Suspense>
  );
}
