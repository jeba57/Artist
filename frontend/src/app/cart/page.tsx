"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, updateItem, removeItem } = useCart();

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="font-display text-2xl text-ink">Your bag is waiting</p>
        <p className="mt-2 text-sm text-ink-soft/70">Sign in to view your bag and continue checkout.</p>
        <Link href="/login" className="mt-6 inline-block bg-ink text-stone label-text px-6 py-3.5 rounded-full hover:bg-indigo transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="font-display text-2xl text-ink">Your bag is empty</p>
        <p className="mt-2 text-sm text-ink-soft/70">Browse the exhibition and add pieces you love.</p>
        <Link href="/discover" className="mt-6 inline-block bg-ink text-stone label-text px-6 py-3.5 rounded-full hover:bg-indigo transition-colors">
          Discover Craft
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-14">
      <p className="label-text text-terracotta">Your Bag</p>
      <h1 className="mt-2 font-display text-3xl text-ink">{cart.itemCount} item{cart.itemCount !== 1 ? "s" : ""}</h1>

      <div className="mt-8 divide-y divide-stone-line">
        {cart.items.map((item) => (
          <div key={item.cartItemId} className="py-6 flex items-center gap-5">
            <Link href={`/product/${item.slug}`} className="relative w-24 h-24 rounded-xl overflow-hidden bg-stone-deep shrink-0">
              {item.image && <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/product/${item.slug}`} className="font-display text-lg text-ink hover:text-terracotta transition-colors">
                {item.name}
              </Link>
              <p className="label-text text-ink-soft/60 mt-1">{item.artisanName}</p>
              {!item.inStock && <p className="text-xs text-terracotta mt-1">Only limited stock left</p>}
            </div>
            <div className="flex items-center border border-stone-line rounded-full">
              <button onClick={() => updateItem(item.productId, item.quantity - 1)} className="p-2.5 hover:text-terracotta transition-colors" aria-label="Decrease">
                <Minus size={13} />
              </button>
              <span className="w-7 text-center label-text">{item.quantity}</span>
              <button onClick={() => updateItem(item.productId, item.quantity + 1)} className="p-2.5 hover:text-terracotta transition-colors" aria-label="Increase">
                <Plus size={13} />
              </button>
            </div>
            <p className="w-24 text-right font-medium text-ink">{formatPrice(item.lineTotal, item.currency)}</p>
            <button onClick={() => removeItem(item.productId)} aria-label="Remove item" className="p-2 text-ink-soft/40 hover:text-terracotta transition-colors">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-stone-line pt-6">
        <span className="label-text text-ink-soft/60">Subtotal</span>
        <span className="font-display text-2xl text-ink">{formatPrice(cart.subtotal, cart.items[0]?.currency || "INR")}</span>
      </div>
      <Link href="/checkout" className="mt-6 block w-full text-center bg-terracotta text-stone label-text py-4 rounded-full hover:bg-terracotta-deep transition-colors">
        Proceed to Checkout
      </Link>
    </div>
  );
}
