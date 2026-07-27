import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-5 py-32 text-center">
      <p className="label-text text-terracotta">404</p>
      <h1 className="mt-3 font-display text-3xl text-ink">This piece isn&rsquo;t on display</h1>
      <p className="mt-3 text-sm text-ink-soft/70">
        It may have sold out, moved, or never existed. Let&rsquo;s get you back to the exhibition floor.
      </p>
      <Link href="/" className="mt-7 inline-block bg-ink text-stone label-text px-6 py-3.5 rounded-full hover:bg-indigo transition-colors">
        Back to Artist
      </Link>
    </div>
  );
}
