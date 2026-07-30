"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import { useSellerAuth } from "@/context/SellerAuthContext";
import type { SellerProfile } from "@/types";

type FileField = "logo" | "govId" | "panCard" | "gstCertificate" | "bankProof";

const FILE_FIELDS: { key: FileField; label: string; required: boolean; hint: string }[] = [
  { key: "logo", label: "Shop logo / profile photo", required: false, hint: "Optional, but helps buyers trust your shop" },
  { key: "govId", label: "Government ID (Aadhaar / Voter ID / Passport)", required: true, hint: "Required" },
  { key: "panCard", label: "PAN card", required: false, hint: "Required only if you provided a PAN number" },
  { key: "gstCertificate", label: "GST certificate", required: false, hint: "Required only if you provided a GSTIN" },
  { key: "bankProof", label: "Bank proof (cancelled cheque / passbook photo)", required: true, hint: "Required" },
];

const inputClass = "w-full bg-stone-deep/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo";
const labelClass = "label-text text-ink-soft/60 block mb-2";

export default function SellerRegisterPage() {
  const { setSellerSession } = useSellerAuth();
  const router = useRouter();

  const [fields, setFields] = useState({
    shopName: "", ownerName: "", email: "", password: "", phone: "",
    bio: "", craftSpecialty: "", location: "", yearsOfExperience: "",
    gstin: "", pan: "",
  });
  const [bank, setBank] = useState({ accountHolderName: "", accountNumber: "", ifsc: "", bankName: "" });
  const [pickup, setPickup] = useState({ line1: "", line2: "", city: "", state: "", pincode: "", phone: "" });
  const [files, setFiles] = useState<Partial<Record<FileField, File>>>({});

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onField = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));
  const onBank = (key: keyof typeof bank) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBank((b) => ({ ...b, [key]: e.target.value }));
  const onPickup = (key: keyof typeof pickup) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPickup((p) => ({ ...p, [key]: e.target.value }));
  const onFile = (key: FileField) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFiles((f) => ({ ...f, [key]: e.target.files?.[0] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
      formData.append("bankDetails", JSON.stringify(bank));
      formData.append("pickupAddress", JSON.stringify(pickup));
      Object.entries(files).forEach(([k, file]) => file && formData.append(k, file));

      const res = await api.postForm<{ seller: SellerProfile; accessToken: string }>("/seller/auth/register", formData);
      setSellerSession(res.data.accessToken, res.data.seller);
      router.push("/seller");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 py-14">
      <p className="label-text text-terracotta">Become a Seller</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Sell your craft on Artist</h1>
      <p className="mt-2 text-sm text-ink-soft/70">
        Every application is reviewed by our team before your shop goes live — usually within a few days.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-10">
        {/* Shop details */}
        <section>
          <p className="label-text text-indigo mb-4">Shop Details</p>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Shop / brand name</label>
              <input required value={fields.shopName} onChange={onField("shopName")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Your full name (owner)</label>
              <input required value={fields.ownerName} onChange={onField("ownerName")} className={inputClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email</label>
                <input required type="email" value={fields.email} onChange={onField("email")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input required type="password" minLength={8} value={fields.password} onChange={onField("password")} className={inputClass} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone (10-digit Indian mobile)</label>
                <input required value={fields.phone} onChange={onField("phone")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Craft specialty</label>
                <input required placeholder="e.g. Handloom Weaving" value={fields.craftSpecialty} onChange={onField("craftSpecialty")} className={inputClass} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Location (city, state)</label>
                <input required value={fields.location} onChange={onField("location")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Years of experience</label>
                <input type="number" min={0} value={fields.yearsOfExperience} onChange={onField("yearsOfExperience")} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Tell buyers about your craft</label>
              <textarea required rows={4} minLength={20} value={fields.bio} onChange={onField("bio")} className={inputClass} />
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section>
          <p className="label-text text-indigo mb-4">Business Details (optional, if registered)</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>GSTIN</label>
              <input value={fields.gstin} onChange={onField("gstin")} placeholder="If GST-registered" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>PAN</label>
              <input value={fields.pan} onChange={onField("pan")} placeholder="ABCDE1234F" className={inputClass} />
            </div>
          </div>
        </section>

        {/* Bank details */}
        <section>
          <p className="label-text text-indigo mb-4">Bank Details (for payouts)</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Account holder name</label>
              <input required value={bank.accountHolderName} onChange={onBank("accountHolderName")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bank name</label>
              <input required value={bank.bankName} onChange={onBank("bankName")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Account number</label>
              <input required value={bank.accountNumber} onChange={onBank("accountNumber")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>IFSC code</label>
              <input required value={bank.ifsc} onChange={onBank("ifsc")} placeholder="HDFC0001234" className={inputClass} />
            </div>
          </div>
        </section>

        {/* Pickup address */}
        <section>
          <p className="label-text text-indigo mb-4">Pickup Address</p>
          <p className="text-xs text-ink-soft/50 mb-4">Where couriers will collect orders from you.</p>
          <div className="space-y-4">
            <input required placeholder="Address line 1" value={pickup.line1} onChange={onPickup("line1")} className={inputClass} />
            <input placeholder="Address line 2 (optional)" value={pickup.line2} onChange={onPickup("line2")} className={inputClass} />
            <div className="grid sm:grid-cols-3 gap-4">
              <input required placeholder="City" value={pickup.city} onChange={onPickup("city")} className={inputClass} />
              <input placeholder="State" value={pickup.state} onChange={onPickup("state")} className={inputClass} />
              <input required placeholder="Pincode" value={pickup.pincode} onChange={onPickup("pincode")} className={inputClass} />
            </div>
            <input required placeholder="Pickup contact phone" value={pickup.phone} onChange={onPickup("phone")} className={inputClass} />
          </div>
        </section>

        {/* Documents */}
        <section>
          <p className="label-text text-indigo mb-4">Documents</p>
          <div className="space-y-4">
            {FILE_FIELDS.map((f) => (
              <div key={f.key}>
                <label className={labelClass}>
                  {f.label} {f.required && <span className="text-terracotta">*</span>}
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  required={f.required}
                  onChange={onFile(f.key)}
                  className="w-full text-sm text-ink-soft file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:label-text file:bg-stone-deep file:text-ink hover:file:bg-stone-line file:cursor-pointer cursor-pointer"
                />
                <p className="text-xs text-ink-soft/50 mt-1">{f.hint}</p>
              </div>
            ))}
          </div>
        </section>

        {error && <p className="text-sm text-terracotta">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink text-stone label-text py-4 rounded-full hover:bg-indigo transition-colors disabled:opacity-50"
        >
          {submitting ? "Submitting application…" : "Submit Application"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft/70 text-center">
        Already applied?{" "}
        <Link href="/seller/login" className="text-terracotta hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
