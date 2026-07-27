"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { api, ApiClientError } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { CheckoutResponse, ShippingAddress } from "@/types";
import Link from "next/link";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { cart, refresh: refreshCart } = useCart();
  const router = useRouter();

  const [scriptReady, setScriptReady] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    pincode: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (user) setAddress((a) => ({ ...a, fullName: a.fullName || user.name }));
  }, [user]);

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="font-display text-2xl text-ink">Sign in to check out</p>
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
        <Link href="/discover" className="mt-6 inline-block bg-ink text-stone label-text px-6 py-3.5 rounded-full hover:bg-indigo transition-colors">
          Discover Craft
        </Link>
      </div>
    );
  }

  const onChange = (field: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((a) => ({ ...a, [field]: e.target.value }));

  const startPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!scriptReady) {
      setError("Payment widget is still loading — try again in a second.");
      return;
    }
    if (!accessToken) return;

    setPlacing(true);
    try {
      const res = await api.post<CheckoutResponse>("/orders/checkout", { shippingAddress: address }, { token: accessToken });
      const { orderId, razorpayOrderId, amount, currency, keyId } = res.data;

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: "Artist",
        description: "Handmade craft order",
        order_id: razorpayOrderId,
        prefill: {
          name: address.fullName,
          contact: address.phone,
          email: user?.email,
        },
        theme: { color: "#33456b" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await api.post(
              "/orders/verify-payment",
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
              { token: accessToken }
            );
            router.push(`/orders/${orderId}?justPaid=1`);
            refreshCart();
          } catch (err) {
            setError(err instanceof ApiClientError ? err.message : "Payment succeeded but we couldn't confirm your order — contact support.");
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't start checkout. Please try again.");
      setPlacing(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onReady={() => setScriptReady(true)} />

      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-14">
        <p className="label-text text-terracotta">Checkout</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Where should this go?</h1>

        <div className="mt-8 grid lg:grid-cols-[1fr_260px] gap-10">
          <form onSubmit={startPayment} className="space-y-4">
            <div>
              <label className="label-text text-ink-soft/60 block mb-2">Full name</label>
              <input required value={address.fullName} onChange={onChange("fullName")} className="w-full bg-stone-deep/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo" />
            </div>
            <div>
              <label className="label-text text-ink-soft/60 block mb-2">Address line</label>
              <input required value={address.line1} onChange={onChange("line1")} placeholder="House no., street, area" className="w-full bg-stone-deep/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo" />
            </div>
            <div>
              <label className="label-text text-ink-soft/60 block mb-2">Address line 2 (optional)</label>
              <input value={address.line2} onChange={onChange("line2")} placeholder="Landmark, apartment" className="w-full bg-stone-deep/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text text-ink-soft/60 block mb-2">City</label>
                <input required value={address.city} onChange={onChange("city")} className="w-full bg-stone-deep/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo" />
              </div>
              <div>
                <label className="label-text text-ink-soft/60 block mb-2">Pincode</label>
                <input required value={address.pincode} onChange={onChange("pincode")} className="w-full bg-stone-deep/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo" />
              </div>
            </div>
            <div>
              <label className="label-text text-ink-soft/60 block mb-2">Phone number</label>
              <input required type="tel" value={address.phone} onChange={onChange("phone")} placeholder="For delivery updates" className="w-full bg-stone-deep/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo" />
            </div>

            {error && <p className="text-sm text-terracotta">{error}</p>}

            <button
              type="submit"
              disabled={placing}
              className="w-full bg-terracotta text-stone label-text py-4 rounded-full hover:bg-terracotta-deep transition-colors disabled:opacity-50"
            >
              {placing ? "Opening payment…" : `Pay ${formatPrice(cart.subtotal)}`}
            </button>
            <p className="text-xs text-ink-soft/50 text-center">
              You&rsquo;ll be asked to pay securely via Razorpay (cards, UPI, netbanking).
            </p>
          </form>

          <aside className="border-t lg:border-t-0 lg:border-l border-stone-line pt-6 lg:pt-0 lg:pl-8">
            <p className="label-text text-ink-soft/60 mb-4">Order Summary</p>
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.cartItemId} className="flex justify-between text-sm">
                  <span className="text-ink-soft truncate pr-2">{item.name} × {item.quantity}</span>
                  <span className="text-ink shrink-0">{formatPrice(item.lineTotal, item.currency)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-stone-line flex justify-between">
              <span className="label-text text-ink-soft/60">Total</span>
              <span className="font-display text-xl text-ink">{formatPrice(cart.subtotal)}</span>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
