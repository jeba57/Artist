"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import type { SellerProfile } from "@/types";
import { cx } from "@/lib/format";

const DOC_FIELDS: { key: keyof SellerProfile; label: string }[] = [
  { key: "avatar_url", label: "Shop logo" },
  { key: "gov_id_url", label: "Government ID" },
  { key: "pan_card_url", label: "PAN card" },
  { key: "gst_certificate_url", label: "GST certificate" },
  { key: "bank_proof_url", label: "Bank proof" },
];

export default function AdminSellerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const load = () => {
    if (!accessToken) return;
    api
      .get<SellerProfile>(`/admin/sellers/${params.id}`, { token: accessToken })
      .then((res) => setSeller(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [accessToken, params.id]);

  const approve = async () => {
    if (!accessToken) return;
    setActing(true);
    setError(null);
    try {
      await api.post(`/admin/sellers/${params.id}/approve`, undefined, { token: accessToken });
      router.push("/admin/sellers");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't approve this seller.");
    } finally {
      setActing(false);
    }
  };

  const reject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setActing(true);
    setError(null);
    try {
      await api.post(`/admin/sellers/${params.id}/reject`, { reason: rejectReason }, { token: accessToken });
      router.push("/admin/sellers");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't reject this seller.");
    } finally {
      setActing(false);
    }
  };

  if (loading) return <div className="px-8 py-10 text-sm text-ink-soft/60">Loading…</div>;
  if (!seller) return <div className="px-8 py-10 text-sm text-ink-soft/60">Application not found.</div>;

  const bank = seller.bank_details_json;
  const pickup = seller.pickup_address;

  return (
    <div className="px-8 py-10 max-w-3xl">
      <Link href="/admin/sellers" className="label-text text-indigo hover:text-terracotta transition-colors">
        ← All Applications
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="label-text text-terracotta">{seller.verification_status}</p>
          <h1 className="mt-2 font-display text-3xl text-ink">{seller.name}</h1>
          <p className="mt-1 text-sm text-ink-soft/60">{seller.craft_specialty} · {seller.location}</p>
        </div>

        {seller.verification_status !== "APPROVED" && (
          <div className="flex gap-2">
            <button
              onClick={approve}
              disabled={acting}
              className="bg-sage text-stone label-text px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => setShowReject((s) => !s)}
              className="border border-terracotta text-terracotta label-text px-5 py-2.5 rounded-full hover:bg-terracotta/10 transition-colors"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-terracotta">{error}</p>}

      {showReject && (
        <form onSubmit={reject} className="mt-6 bg-terracotta/10 border border-terracotta/30 rounded-2xl p-5">
          <label className="label-text text-ink-soft/60 block mb-2">Reason (shown to the seller)</label>
          <textarea
            required
            minLength={5}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="w-full bg-white/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-terracotta"
            placeholder="e.g. Bank proof document is not legible — please re-upload."
          />
          <button
            type="submit"
            disabled={acting}
            className="mt-3 label-text bg-terracotta text-stone px-6 py-2.5 rounded-full hover:bg-terracotta-deep transition-colors disabled:opacity-50"
          >
            {acting ? "Rejecting…" : "Confirm Rejection"}
          </button>
        </form>
      )}

      {seller.verification_status === "REJECTED" && seller.rejection_reason && (
        <div className="mt-6 bg-terracotta/10 border border-terracotta/30 rounded-2xl px-5 py-4">
          <p className="label-text text-terracotta mb-1">Rejection reason on file</p>
          <p className="text-sm text-ink">{seller.rejection_reason}</p>
        </div>
      )}

      <div className="mt-10 grid sm:grid-cols-2 gap-8">
        <div>
          <p className="label-text text-ink-soft/60 mb-3">Owner</p>
          <p className="text-sm text-ink">{seller.owner_name}</p>
          <p className="text-sm text-ink-soft">{seller.email}</p>
          <p className="text-sm text-ink-soft">{seller.phone}</p>
        </div>
        <div>
          <p className="label-text text-ink-soft/60 mb-3">Compliance</p>
          <p className="text-sm text-ink-soft">GSTIN: {seller.gstin || "—"}</p>
          <p className="text-sm text-ink-soft">PAN: {seller.pan || "—"}</p>
        </div>
      </div>

      <div className="mt-8">
        <p className="label-text text-ink-soft/60 mb-3">Bio</p>
        <p className="text-sm text-ink leading-relaxed">{seller.bio}</p>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 gap-8">
        <div>
          <p className="label-text text-ink-soft/60 mb-3">Bank Details</p>
          {bank ? (
            <div className="text-sm text-ink-soft space-y-0.5">
              <p>{bank.accountHolderName}</p>
              <p>{bank.bankName}</p>
              <p>A/C: {bank.accountNumber}</p>
              <p>IFSC: {bank.ifsc}</p>
            </div>
          ) : (
            <p className="text-sm text-ink-soft/50">Not provided</p>
          )}
        </div>
        <div>
          <p className="label-text text-ink-soft/60 mb-3">Pickup Address</p>
          {pickup ? (
            <p className="text-sm text-ink-soft leading-relaxed">
              {pickup.line1}{pickup.line2 ? `, ${pickup.line2}` : ""}<br />
              {pickup.city}, {pickup.state} — {pickup.pincode}<br />
              {pickup.phone}
            </p>
          ) : (
            <p className="text-sm text-ink-soft/50">Not provided</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <p className="label-text text-ink-soft/60 mb-3">Documents</p>
        <div className="flex flex-wrap gap-3">
          {DOC_FIELDS.map((f) => {
            const url = seller[f.key] as string | null;
            return (
              <a
                key={f.key}
                href={url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={cx(
                  "flex items-center gap-1.5 label-text px-4 py-2 rounded-full border transition-colors",
                  url ? "border-indigo text-indigo hover:bg-indigo/10" : "border-stone-line text-ink-soft/30 pointer-events-none"
                )}
              >
                {f.label} {url && <ExternalLink size={12} />}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
