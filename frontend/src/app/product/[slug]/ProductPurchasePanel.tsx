"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, BadgeCheck, Minus, Plus } from "lucide-react";
import type { ProductDetail } from "@/types";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export default function ProductPurchasePanel({ product }: { product: ProductDetail }) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "adding" | "added">("idle");
  const { addItem } = useCart();
  const { ids, toggle } = useWishlist();
  const router = useRouter();

  const wished = ids.has(product.id);
  const price = product.discountPrice ?? product.price;

  const handleAdd = async () => {
    setStatus("adding");
    try {
      await addItem(product.id, quantity);
      setStatus("added");
      setTimeout(() => setStatus("idle"), 1800);
    } catch {
      router.push("/login");
      setStatus("idle");
    }
  };

  const handleBuyNow = async () => {
    try {
      await addItem(product.id, quantity);
      router.push("/cart");
    } catch {
      router.push("/login");
    }
  };

  return (
    <div>
      <div className="label-text text-ink-soft/60">{product.category.name}</div>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl leading-tight text-ink">{product.name}</h1>

      <div className="mt-4 flex items-center gap-3">
        {product.rating.count > 0 && (
          <span className="label-text text-turmeric">★ {product.rating.avg.toFixed(1)} ({product.rating.count} reviews)</span>
        )}
        <span className="label-text text-ink-soft/40">·</span>
        <span className="label-text text-ink-soft/60">{product.location}</span>
      </div>

      <div className="mt-6 flex items-baseline gap-3">
        <span className="font-display text-3xl text-ink">{formatPrice(price, product.currency)}</span>
        {product.discountPrice && (
          <span className="text-lg text-ink-soft/50 line-through">{formatPrice(product.price, product.currency)}</span>
        )}
      </div>

      <p className="mt-5 text-[15px] text-ink-soft leading-relaxed">{product.shortDescription}</p>

      <div className="mt-7 flex items-center gap-4">
        <div className="flex items-center border border-stone-line rounded-full">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-3 hover:text-terracotta transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center label-text">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            className="p-3 hover:text-terracotta transition-colors"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
        <span className="label-text text-ink-soft/50">{product.inStock ? `${product.stock} in stock` : "Out of stock"}</span>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleAdd}
          disabled={!product.inStock || status === "adding"}
          className="flex-1 bg-ink text-stone label-text py-4 rounded-full hover:bg-indigo transition-colors disabled:opacity-50"
        >
          {status === "added" ? "Added ✓" : status === "adding" ? "Adding…" : "Add to Bag"}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={!product.inStock}
          className="flex-1 bg-terracotta text-stone label-text py-4 rounded-full hover:bg-terracotta-deep transition-colors disabled:opacity-50"
        >
          Buy Now
        </button>
        <button
          onClick={() => toggle(product.id).catch(() => router.push("/login"))}
          aria-label="Toggle wishlist"
          className="w-14 h-14 shrink-0 rounded-full border border-stone-line flex items-center justify-center hover:border-terracotta transition-colors"
        >
          <Heart size={18} className={wished ? "fill-terracotta text-terracotta" : "text-ink"} />
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-stone-line flex items-center gap-2">
        <BadgeCheck size={16} className="text-indigo" />
        <span className="text-sm text-ink-soft">
          Sold by <span className="font-medium text-ink">{product.artisan.name}</span>
          {product.artisan.verified && " — Verified Artisan"}
        </span>
      </div>
    </div>
  );
}
