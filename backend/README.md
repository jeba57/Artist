# Artist — Backend (Stage 1: Buyer Side)

Backend for **Artist**, a premium digital exhibition for handmade crafts and
rural artisans. Stage 1 covers the full buyer experience against real,
seeded demo data — no hardcoded frontend data, everything comes from REST APIs.

## Stack

- **Runtime**: Node.js (ES Modules) + Express
- **Database**: PostgreSQL (schema modeled in `prisma/schema.prisma`)
- **Cache**: Redis — product/list/category caching, live trending, recently-viewed, search suggestions, rate limiting, refresh-token session store
- **Auth**: JWT access + refresh tokens (httpOnly cookies + Bearer header both supported), Google OAuth
- **Images**: Cloudinary (config wired, needs your credentials)
- **Architecture**: feature-based (`src/features/<domain>/{routes,controller,service,repository,validation}.js`)

## ⚠️ A note on Prisma

`prisma/schema.prisma` is the **real, canonical data model** — the one the
brief asked for. It's fully normalized (Users, Artisans, Categories,
Products, Reviews, Cart, Wishlist, RecentlyViewed, Orders) and is what you
should treat as the source of truth going forward.

However, this backend was built inside a sandboxed environment whose network
allowlist doesn't include `binaries.prisma.sh`, which is where Prisma
downloads its query/schema engine from. That made `prisma generate` /
`prisma migrate dev` impossible to run *in that sandbox*.

To still ship a fully working, tested backend, the actual data-access layer
here uses the `pg` driver directly with hand-written SQL that mirrors
`schema.prisma` field-for-field (see `prisma/migrations_manual/001_init.sql`).
Every repository file (`*.repository.js`) is a thin, isolated layer — routes
and controllers never touch SQL or `pg` directly, only repositories do.

**On your own machine (with normal internet access), switch to real Prisma:**

```bash
npx prisma migrate dev --name init   # generates a migration from schema.prisma
npx prisma generate
```

Then swap `src/config/db.js` for a `@prisma/client` instance (with the
`@prisma/adapter-pg` driver adapter, since Prisma 7 requires driver adapters)
and update repository files to use `prisma.product.findMany(...)` etc.
instead of raw SQL. The schema won't change — this is a data-access-layer
swap, not a redesign.

## Getting started

```bash
npm install

# 1. Start Postgres + Redis (Docker is simplest)
docker run -d --name artist-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=artisan_exhibition -p 5432:5432 postgres:16
docker run -d --name artist-redis -p 6379:6379 redis:7

# 2. Configure env
cp .env.example .env   # fill in DATABASE_URL, JWT secrets, Cloudinary, Google OAuth

# 3. Create schema
#    Preferred (needs full internet access):
npx prisma migrate dev --name init
#    Fallback (works anywhere, e.g. restricted sandboxes):
psql "$DATABASE_URL" -f prisma/migrations_manual/001_init.sql

# 4. Seed demo data (11 categories, 10 artisans, 22 products)
npm run seed

# 5. Run
npm run dev      # nodemon, auto-restart
npm start        # production
```

Server boots on `http://localhost:5000`. Health check: `GET /health`.

## API surface (Stage 1)

| Feature | Routes |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/google`, `/refresh`, `/logout`, `GET /me` |
| Products | `GET /api/products` (search/filter/sort/paginate), `GET /:slug`, `GET /home-sections`, `GET /trending`, `GET /search/suggestions`, `GET /recently-viewed` |
| Categories | `GET /api/categories` |
| Cart | `GET /api/cart`, `POST /items`, `PATCH /items/:productId`, `DELETE /items/:productId`, `DELETE /` |
| Wishlist | `GET /api/wishlist`, `POST /:productId`, `DELETE /:productId` |
| Reviews | `GET /api/reviews/product/:productId`, `POST /api/reviews/product/:productId` |
| Makers | `GET /api/makers/featured`, `GET /api/makers/:slug` |

All list/detail responses follow `{ success, statusCode, message, data, meta? }`.
Validation errors return `{ success: false, statusCode: 400, details: [{field, message}] }`.

## Redis usage (as specified in the brief)

| Purpose | Key pattern |
|---|---|
| Product detail cache | `product:{slug}` |
| Product list/filter cache | `products:list:{md5(filters)}` |
| Category list cache | `category:list` |
| Home sections cache | `home:sections` |
| Cart cache | `cart:{userId}` |
| Recently viewed | `recently-viewed:{userId}` (capped list, 30-day TTL) |
| Live trending | `trending:views` (sorted set, incremented on product-detail views) |
| Search suggestions | `search:suggest` (sorted set, incremented on product-detail views) |
| Refresh-token sessions | `session:{userId}:{tokenSuffix}` |
| Rate limiting | `ratelimit:{routeKey}:{ip-or-userId}` |

## What's deliberately deferred to a later stage

Per the brief, Stage 1 is buyer-only. The `artisans` table already has the
fields a future seller-verification flow needs (`email`, `passwordHash`,
`govIdUrl`, `bankDetailsJson`, `verificationStatus`), but there are no
seller-facing auth/registration/admin-approval routes yet — that's Stage 2.
Orders/checkout tables exist in the schema for forward-compatibility but
aren't exposed via API yet either (cart → order conversion, payment
integration, and order status routes are a natural Stage 2 addition).

## Project structure

```
src/
  config/        # db.js (pg pool), redis.js, cloudinary.js
  features/
    auth/        # register, login, Google OAuth, JWT refresh/session
    products/    # listing, detail, home sections, trending, search
    categories/
    cart/
    wishlist/
    reviews/     # keeps product rating_avg/rating_count in sync
    makers/      # artisan profiles + "Meet the Makers"
  middlewares/    # auth, error handling, validation, rate limiting
  utils/          # ApiError, ApiResponse, asyncHandler, jwt, id/slug helpers
  app.js
  server.js
prisma/
  schema.prisma            # canonical data model
  migrations_manual/       # hand-written SQL fallback (see note above)
  seed.js                  # demo categories/artisans/products
```
