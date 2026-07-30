"use client";

import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api";
import type { Category } from "@/types";
import { formatPrice } from "@/lib/format";

const inputClass = "w-full bg-white/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo";

export default function SellerProductQuickCreate({ accessToken }: { accessToken: string | null }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState({
    categorySlug: "", name: "", shortDescription: "", story: "",
    price: "", stock: "10", imageUrl: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  useEffect(() => {
    api.get<Category[]>("/categories").then((res) => setCategories(res.data));
  }, []);

  const loadOwnProducts = () => {
    if (!accessToken) return;
    api.get<Record<string, unknown>[]>("/seller/products", { token: accessToken }).then((res) => setProducts(res.data));
  };

  useEffect(loadOwnProducts, [accessToken]);

  const onChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSubmitting(true);
    setJustAdded(null);
    try {
      const res = await api.post<{ name: string }>(
        "/seller/products",
        {
          categorySlug: form.categorySlug,
          name: form.name,
          shortDescription: form.shortDescription,
          story: form.story,
          price: Number(form.price),
          stock: Number(form.stock),
          images: [form.imageUrl],
        },
        { token: accessToken }
      );
      setJustAdded(res.data.name);
      setForm({ categorySlug: "", name: "", shortDescription: "", story: "", price: "", stock: "10", imageUrl: "" });
      loadOwnProducts();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't list this product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
      <p className="label-text text-indigo mb-4">List a Product</p>
      <p className="text-xs text-ink-soft/50 mb-4">
        A quick way to get your first pieces live. Full inventory management, bulk uploads, and editing are coming soon.
      </p>

      <form onSubmit={submit} className="space-y-3 bg-stone-deep/40 rounded-2xl p-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <select required value={form.categorySlug} onChange={onChange("categorySlug")} className={inputClass}>
            <option value="">Category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <input required placeholder="Product name" value={form.name} onChange={onChange("name")} className={inputClass} />
        </div>
        <input required placeholder="Short description (10+ chars)" value={form.shortDescription} onChange={onChange("shortDescription")} className={inputClass} />
        <textarea required placeholder="The story behind this piece (20+ chars)" rows={2} value={form.story} onChange={onChange("story")} className={inputClass} />
        <div className="grid sm:grid-cols-3 gap-3">
          <input required type="number" min={1} placeholder="Price (₹)" value={form.price} onChange={onChange("price")} className={inputClass} />
          <input required type="number" min={0} placeholder="Stock" value={form.stock} onChange={onChange("stock")} className={inputClass} />
          <input required type="url" placeholder="Image URL" value={form.imageUrl} onChange={onChange("imageUrl")} className={inputClass} />
        </div>

        {error && <p className="text-sm text-terracotta">{error}</p>}
        {justAdded && <p className="text-sm text-sage">&ldquo;{justAdded}&rdquo; is now listed.</p>}

        <button
          type="submit"
          disabled={submitting}
          className="label-text bg-ink text-stone px-6 py-2.5 rounded-full hover:bg-indigo transition-colors disabled:opacity-50"
        >
          {submitting ? "Listing…" : "List Product"}
        </button>
      </form>

      {products.length > 0 && (
        <div className="mt-8">
          <p className="label-text text-ink-soft/60 mb-3">Your listings ({products.length})</p>
          <div className="divide-y divide-stone-line border-y border-stone-line">
            {products.map((p) => (
              <div key={p.id as string} className="py-3 flex items-center justify-between text-sm">
                <span className="text-ink">{p.name as string}</span>
                <span className="text-ink-soft">{formatPrice(Number(p.price))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
