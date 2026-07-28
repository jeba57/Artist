"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, Heart, ShoppingBag, ChevronDown, User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { cx } from "@/lib/format";

const LANGUAGES = ["EN", "HI", "BN"];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { items: wishlistItems } = useWishlist();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("EN");
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) setLoginOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/discover?search=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  };

  return (
    <header
      className={cx(
        "sticky top-0 z-50 transition-colors duration-300",
        scrolled ? "bg-stone/95 backdrop-blur border-b border-stone-line" : "bg-stone/0 border-b border-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex h-20 items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-baseline gap-1.5">
            <span className="font-display text-2xl tracking-tight text-ink">Artist</span>
            <span className="hidden sm:inline label-text text-indigo">exhibition</span>
          </Link>

          {/* Primary nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="label-text text-ink-soft hover:text-terracotta transition-colors">
              Home
            </Link>
            <Link href="/discover" className="label-text text-ink-soft hover:text-terracotta transition-colors">
              Discover
            </Link>
          </nav>

          {/* Search */}
          <form onSubmit={submitSearch} className="hidden lg:flex flex-1 max-w-sm items-center relative">
            <Search size={16} className="absolute left-3 text-ink-soft/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search handmade pieces…"
              className="w-full bg-stone-deep/60 focus:bg-stone-deep rounded-full pl-9 pr-4 py-2.5 text-sm outline-none border border-transparent focus:border-indigo/30 transition-colors placeholder:text-ink-soft/50"
            />
          </form>

          {/* Right cluster */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className="lg:hidden p-2 rounded-full hover:bg-stone-deep transition-colors"
              aria-label="Search"
            >
              <Search size={19} />
            </button>

            {/* Language selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="label-text flex items-center gap-1 px-2.5 py-2 rounded-full hover:bg-stone-deep transition-colors"
              >
                {lang} <ChevronDown size={12} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1 w-24 bg-stone border border-stone-line rounded-xl shadow-lg overflow-hidden">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        setLang(l);
                        setLangOpen(false);
                      }}
                      className="label-text block w-full text-left px-3 py-2 hover:bg-stone-deep transition-colors"
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href="/wishlist" className="relative p-2 rounded-full hover:bg-stone-deep transition-colors" aria-label="Wishlist">
              <Heart size={19} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-terracotta text-stone text-[10px] font-label w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative p-2 rounded-full hover:bg-stone-deep transition-colors" aria-label="Cart">
              <ShoppingBag size={19} />
              {!!cart?.itemCount && (
                <span className="absolute -top-0.5 -right-0.5 bg-indigo text-stone text-[10px] font-label w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.itemCount}
                </span>
              )}
            </Link>

            {/* Login / account dropdown */}
            <div className="relative" ref={loginRef}>
              <button
                onClick={() => setLoginOpen((o) => !o)}
                className="flex items-center gap-1.5 pl-2.5 pr-3 py-2 rounded-full hover:bg-stone-deep transition-colors"
              >
                <User size={18} />
                <span className="hidden sm:inline label-text">{user
  ? (user.name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "User")
  : "Login"}</span>
              </button>

              {loginOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-stone border border-stone-line rounded-2xl shadow-xl overflow-hidden py-1.5">
                  {user ? (
                    <>
                      <div className="px-4 py-2.5 border-b border-stone-line">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-ink-soft/70">{user.email}</p>
                      </div>
                      <Link
                        href="/orders"
                        onClick={() => setLoginOpen(false)}
                        className="block px-4 py-2.5 text-sm hover:bg-stone-deep transition-colors"
                      >
                        My Orders
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin/orders"
                          onClick={() => setLoginOpen(false)}
                          className="block px-4 py-2.5 text-sm text-indigo hover:bg-stone-deep transition-colors"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setLoginOpen(false);
                        }}
                        className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm hover:bg-stone-deep transition-colors"
                      >
                        <LogOut size={15} /> Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setLoginOpen(false)}
                        className="block px-4 py-2.5 text-sm hover:bg-stone-deep transition-colors"
                      >
                        Buyer Login
                      </Link>
                      <button
                        disabled
                        title="Seller onboarding arrives in Stage 2"
                        className="w-full text-left px-4 py-2.5 text-sm text-ink-soft/40 cursor-not-allowed"
                      >
                        Seller Login <span className="label-text">· soon</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-full hover:bg-stone-deep transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submitSearch} className="lg:hidden pb-4 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search handmade pieces…"
              className="w-full bg-stone-deep/60 rounded-full pl-9 pr-4 py-2.5 text-sm outline-none placeholder:text-ink-soft/50"
            />
          </form>
        )}

        {mobileOpen && (
          <nav className="md:hidden pb-5 flex flex-col gap-1">
            <Link href="/" className="label-text py-2.5" onClick={() => setMobileOpen(false)}>
              Home
            </Link>
            <Link href="/discover" className="label-text py-2.5" onClick={() => setMobileOpen(false)}>
              Discover
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
