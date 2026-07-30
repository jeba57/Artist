"use client";

import { useState } from "react";
import Link from "next/link";
import { useSellerAuth } from "@/context/SellerAuthContext";
import { api, ApiClientError } from "@/lib/api";
import type { SellerProfile } from "@/types";
import SellerProductQuickCreate from "./SellerProductQuickCreate";

export default function SellerHomePage() {
  const {
  seller,
  accessToken,
  loading,
  refreshSeller,
  logoutSeller,
} = useSellerAuth();

  if (loading) return <div className="mx-auto max-w-2xl px-5 py-24 text-sm text-ink-soft/60">Loading…</div>;

  if (!seller) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="font-display text-2xl text-ink">Seller area</p>
        <p className="mt-2 text-sm text-ink-soft/70">Sign in to manage your shop.</p>
        <Link href="/seller/login" className="mt-6 inline-block bg-ink text-stone label-text px-6 py-3.5 rounded-full hover:bg-indigo transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 py-14">
      <div className="flex items-start justify-between">
        <div>
          <p className="label-text text-terracotta">Seller Dashboard</p>
          <h1 className="mt-2 font-display text-3xl text-ink">{seller.name}</h1>
        </div>
        <button onClick={logoutSeller} className="label-text text-ink-soft/60 hover:text-terracotta transition-colors">
          Log out
        </button>
      </div>

      {seller.verification_status === "PENDING" && (
        <div className="mt-8 bg-turmeric/10 border border-turmeric/30 rounded-2xl px-6 py-6">
          <p className="font-medium text-ink">Your application is under review</p>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">
            We're checking your documents and details. This usually takes a few days — you'll be able to list
            products the moment you're approved. No action needed from you right now.
          </p>
          <p className="mt-3 text-xs text-ink-soft/50">
            Submitted {seller.verification_submitted_at ? new Date(seller.verification_submitted_at).toLocaleDateString("en-IN") : "—"}
          </p>
        </div>
      )}

      {seller.verification_status === "REJECTED" && (
        <RejectedView seller={seller} accessToken={accessToken} onResubmitted={refreshSeller} />
      )}

      {seller.verification_status === "APPROVED" && (
        <div className="mt-8">
          <div className="bg-sage/10 border border-sage/30 rounded-2xl px-6 py-5">
            <p className="font-medium text-ink">You're a verified seller ✓</p>
            <p className="mt-1 text-sm text-ink-soft">List a product below to get it into the marketplace.</p>
          </div>
          <SellerProductQuickCreate accessToken={accessToken} />
        </div>
      )}
    </div>
  );
}

function RejectedView({
  seller,
  accessToken,
  onResubmitted,
}: {
  seller: SellerProfile;
  accessToken: string | null;
  onResubmitted: () => void;
}) {
  const [bio, setBio] = useState(seller.bio);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("bio", bio);
      await api.postForm("/seller/auth/resubmit", formData, { token: accessToken });
      onResubmitted();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't resubmit right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 bg-terracotta/10 border border-terracotta/30 rounded-2xl px-6 py-6">
      <p className="font-medium text-ink">Your application wasn't approved</p>
      <p className="mt-2 text-sm text-ink-soft leading-relaxed">{seller.rejection_reason}</p>

      <form onSubmit={resubmit} className="mt-5">
        <label className="label-text text-ink-soft/60 block mb-2">Update your shop description</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full bg-white/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo"
        />
        <p className="mt-2 text-xs text-ink-soft/50">
          To update documents or bank details, contact support — this quick form covers text fields only for now.
        </p>
        {error && <p className="mt-2 text-sm text-terracotta">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-3 label-text bg-ink text-stone px-6 py-3 rounded-full hover:bg-indigo transition-colors disabled:opacity-50"
        >
          {submitting ? "Resubmitting…" : "Resubmit for Review"}
        </button>
      </form>
    </div>
  );
}
