import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-ink text-stone mt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2 max-w-sm">
          <span className="font-display text-2xl">Artist</span>
          <p className="mt-4 text-sm text-stone/60 leading-relaxed">
            A living exhibition of handmade India — every piece here was shaped by hand, not machine,
            and carries the name and story of the person who made it.
          </p>
        </div>

        <div>
          <p className="label-text text-stone/40 mb-4">Explore</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/discover" className="text-stone/75 hover:text-stone transition-colors">All Craft</Link></li>
            <li><Link href="/discover?category=pottery" className="text-stone/75 hover:text-stone transition-colors">Pottery</Link></li>
            <li><Link href="/discover?category=jewellery" className="text-stone/75 hover:text-stone transition-colors">Jewellery</Link></li>
            <li><Link href="/discover?category=paintings" className="text-stone/75 hover:text-stone transition-colors">Paintings</Link></li>
          </ul>
        </div>

        <div>
          <p className="label-text text-stone/40 mb-4">Artist</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/wishlist" className="text-stone/75 hover:text-stone transition-colors">Wishlist</Link></li>
            <li><Link href="/cart" className="text-stone/75 hover:text-stone transition-colors">Your Bag</Link></li>
            <li><Link href="/login" className="text-stone/75 hover:text-stone transition-colors">Buyer Login</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone/10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-5 flex flex-col sm:flex-row gap-2 items-center justify-between">
          <p className="label-text text-stone/35">© {new Date().getFullYear()} Artist — Stage 01</p>
          <p className="label-text text-stone/35">Made for makers, by hand</p>
        </div>
      </div>
    </footer>
  );
}
