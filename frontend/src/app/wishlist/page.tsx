"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/product/ProductCard";

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading } = useWishlist();

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="font-display text-2xl text-ink">Save what catches your eye</p>
        <p className="mt-2 text-sm text-ink-soft/70">Sign in to build your wishlist.</p>
        <Link href="/login" className="mt-6 inline-block bg-ink text-stone label-text px-6 py-3.5 rounded-full hover:bg-indigo transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14">
      <p className="label-text text-terracotta">Your Wishlist</p>
      <h1 className="mt-2 font-display text-3xl text-ink">{items.length} saved piece{items.length !== 1 ? "s" : ""}</h1>

      {!loading && items.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-ink-soft/70">Nothing saved yet — tap the heart on any piece to add it here.</p>
          <Link href="/discover" className="mt-6 inline-block bg-ink text-stone label-text px-6 py-3.5 rounded-full hover:bg-indigo transition-colors">
            Discover Craft
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
