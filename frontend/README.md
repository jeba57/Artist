# Artist — Frontend (Stage 1: Buyer Side)

The buyer-facing frontend for **Artist**, a premium digital exhibition for
handmade crafts and rural artisans. Built to feel like a gallery walk, not a
marketplace grid.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (CSS-native `@theme`, no `tailwind.config.js` needed)
- Framer Motion for scroll reveals and page-load choreography
- lucide-react for icons
- No hardcoded product data anywhere — every product, category, and artisan
  comes from the Artist backend's REST API

## Getting started

```bash
npm install
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at your backend
npm run dev
```

Requires the **Artist backend** running (see the companion
`artist-backend` project) — this app has zero mock/demo data of its own;
everything is fetched live.

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Structure

```
src/
  app/
    page.tsx                 # Homepage (Hero, Editor's Picks, Featured, Story Banner, Trending, Makers, Mission)
    discover/                # Search, filter, sort, paginate
    product/[slug]/          # Gallery, story, craft process, seller profile, reviews, similar products
    maker/[slug]/            # Artisan profile
    login/ register/         # Buyer auth
    cart/ wishlist/
  components/
    layout/                  # Navbar, Footer
    home/                    # Homepage sections
    product/                 # ProductCard (the core reusable unit)
    ui/                      # SectionHeading and other small primitives
  context/                   # AuthContext, CartContext, WishlistContext
  lib/                       # api.ts (typed fetch client), format.ts
  types/                     # Types mirroring backend DTOs exactly
```

## Design system

The identity is grounded in the subject, not a generic "handmade" look:

- **Palette** — warm stone/parchment background (`#F2EEE1`), deep indigo ink
  and primary accent (`#33456B` — natural indigo dye, iconic in Indian
  textile craft), terracotta (`#B14D2A`) used sparingly for sale tags and the
  wishlist heart, turmeric (`#C4901F`) for ratings.
- **Type** — Fraunces (display serif, used restrained — headlines and
  product names only), Work Sans (body), IBM Plex Mono (the "wayfinding"
  typeface: nav labels, prices, and product metadata are all set in tracked-out
  uppercase mono, like museum wall signage).
- **Signature element** — the **specimen label** product card: a thin rule
  under the image, then a two-line label block (serif title, mono metadata
  line) styled like a gallery object tag. Wishlist/add-to-cart only appear on
  hover so the default state stays pure and gallery-like.

## Notes

- **Fonts** are loaded via `<link>` tags in `layout.tsx` rather than
  `next/font/google`, so the build never needs network access to Google's
  font CDN — only the browser does, at runtime, same as any normal site.
- **Images**: seed data from the backend currently points at Unsplash source
  URLs as photography placeholders. `next.config.ts` allowlists both
  `source.unsplash.com` and `res.cloudinary.com`, so swapping in real
  Cloudinary-hosted photography later needs no config change.
- **Auth**: access token in `localStorage` + `Authorization: Bearer` header;
  the backend also sets httpOnly refresh cookies for session renewal.
- **Seller Login** is visibly present but disabled in the navbar dropdown —
  intentional, since Stage 1 is buyer-only per the brief.

## Verified

`npm run build` completes with zero TypeScript errors. All routes
(`/`, `/discover`, `/product/[slug]`, `/maker/[slug]`, `/login`, `/register`,
`/cart`, `/wishlist`) were smoke-tested against a live instance of the
Artist backend before this was packaged.
