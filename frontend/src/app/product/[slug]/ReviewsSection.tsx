"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import type { Review } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { cx } from "@/lib/format";

export default function ReviewsSection({ productId }: { productId: string }) {
  const { user, accessToken } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get<Review[]>(`/reviews/product/${productId}`)
      .then((res) => setReviews(res.data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSubmitting(true);
    try {
      await api.post(`/reviews/product/${productId}`, { rating, comment }, { token: accessToken });
      setComment("");
      setRating(5);
      load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 border-t border-stone-line pt-12">
      <p className="label-text text-terracotta mb-6">Reviews {reviews.length > 0 && `(${reviews.length})`}</p>

      {user && (
        <form onSubmit={submit} className="mb-10 max-w-lg">
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`Rate ${n} stars`}>
                <Star size={20} className={cx(n <= rating ? "fill-turmeric text-turmeric" : "text-stone-line")} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this piece…"
            rows={3}
            className="w-full bg-stone-deep/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 label-text bg-ink text-stone px-6 py-3 rounded-full hover:bg-indigo transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-ink-soft/60">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-ink-soft/60">No reviews yet — be the first to share your thoughts.</p>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-stone-line pb-6">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className={cx(i < r.rating ? "fill-turmeric text-turmeric" : "text-stone-line")} />
                  ))}
                </div>
                <span className="text-sm font-medium text-ink">{r.reviewer_name}</span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-ink-soft leading-relaxed">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
