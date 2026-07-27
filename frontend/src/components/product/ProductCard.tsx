"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { ProductCard as ProductCardType } from "@/types";
import { formatPrice, cx } from "@/lib/format";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductCard({ product, priority = false }: { product: ProductCardType; priority?: boolean }) {
  const { ids, toggle } = useWishlist();
  const { addItem } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const wished = ids.has(product.id);

  const onWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await toggle(product.id);
    } catch {
      router.push("/login");
    }
  };

  const onAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await addItem(product.id, 1);
    } catch {
      router.push("/login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group"
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-deep">
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          )}

          {/* Discount tag */}
          {product.discountPrice && (
            <span className="absolute top-3 left-3 label-text bg-terracotta text-stone px-2 py-1 rounded-full">
              Sale
            </span>
          )}

          {/* Wishlist */}
          <button
            onClick={onWishlist}
            aria-label="Toggle wishlist"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-stone/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Heart size={16} className={wished ? "fill-terracotta text-terracotta" : "text-ink"} />
          </button>

          {/* Add to cart — slides up on hover */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={onAddToCart}
              disabled={busy || !product.inStock}
              className="w-full flex items-center justify-center gap-2 bg-ink/90 backdrop-blur text-stone label-text py-2.5 rounded-full disabled:opacity-50"
            >
              <ShoppingBag size={13} /> {product.inStock ? "Add to Bag" : "Out of Stock"}
            </button>
          </div>
        </div>

        {/* Specimen label */}
        <div className="mt-3.5 border-t border-stone-line pt-3">
          <h3 className="font-display text-[1.05rem] leading-snug text-ink truncate">{product.name}</h3>
          <div className="mt-1.5 flex items-center gap-1.5 label-text text-ink-soft/70">
            <span className="truncate max-w-[90px]">{product.artisan.name}</span>
            {product.artisan.verified && <BadgeCheck size={12} className="text-indigo shrink-0" />}
            <span>·</span>
            <span className="truncate">{product.location}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-medium text-ink">
              {formatPrice(product.discountPrice ?? product.price, product.currency)}
            </span>
            {product.discountPrice && (
              <span className="text-sm text-ink-soft/50 line-through">
                {formatPrice(product.price, product.currency)}
              </span>
            )}
            {product.rating.count > 0 && (
              <span className={cx("ml-auto label-text text-turmeric")}>
                ★ {product.rating.avg.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
