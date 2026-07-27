"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, ApiClientError } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <p className="label-text text-terracotta">Buyer Login</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-soft/70">Sign in to your Artist account to continue.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label-text text-ink-soft/60 block mb-2">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-stone-deep/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo"
          />
        </div>
        <div>
          <label className="label-text text-ink-soft/60 block mb-2">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-stone-deep/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo"
          />
        </div>

        {error && <p className="text-sm text-terracotta">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-stone label-text py-3.5 rounded-full hover:bg-indigo transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft/70 text-center">
        New to Artist?{" "}
        <Link href="/register" className="text-terracotta hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
