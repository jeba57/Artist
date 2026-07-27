# Artist — Full Project (Backend + Frontend)

This folder contains both halves of Artist:

```
artist/
  backend/     ← Express API (port 5000)
  frontend/    ← Next.js app (port 3000)
  docker-compose.yml   ← runs Postgres + Redis for the backend
```

They stay as **two separate apps** that talk over HTTP — putting them in one
folder is just for convenience, not because they need to be together.

---

## 0. What you need installed first

- **Node.js** (v20 or newer) — you already have this, since you ran the frontend/backend before.
- **Docker Desktop** — download from https://www.docker.com/products/docker-desktop/
  installs both `docker` and `docker compose`. This is the only new thing.

You do **not** need to install Postgres or Redis yourself — Docker handles that.

---

## 1. What Docker is actually doing here (30 seconds)

Docker runs small, self-contained "boxes" (containers) that each run one
program — already installed, already configured, isolated from the rest of
your computer. We're using it for exactly two things:

- **Postgres** — the database that stores products, users, orders, etc.
- **Redis** — a fast in-memory cache (used for things like "recently viewed"
  products, live trending, search suggestions, and rate limiting)

Your backend code (Node/Express) is **not** in Docker. You'll run that
normally with `npm run dev`, same as before. Docker is just standing in for
"a database server, already running."

---

## 2. Start Postgres + Redis

From the `artist/` folder (this one, where `docker-compose.yml` lives):

```bash
docker compose up -d
```

`-d` means "detached" — it runs in the background instead of taking over
your terminal. Check it worked:

```bash
docker compose ps
```

You should see `artist-postgres` and `artist-redis` both listed as
"running" / "Up". That's it — they'll now sit there running until you stop
them.

To stop them later: `docker compose down`
To stop AND permanently delete the data: `docker compose down -v`

---

## 3. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and check `DATABASE_URL` — it should already match what
`docker-compose.yml` set up:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/artisan_exhibition?schema=public"
REDIS_URL="redis://localhost:6379"
```

Now create the database tables. You have full internet access on your own
machine (unlike the sandbox this was built in), so the real Prisma command
will work here:

```bash
npx prisma migrate dev --name init
```

If that ever gives you trouble, there's a hand-written fallback that does
the exact same thing:

```bash
psql "$DATABASE_URL" -f prisma/migrations_manual/001_init.sql
```

Then seed some demo products/artisans/categories:

```bash
npm run seed
```

Finally, run the backend:

```bash
npm run dev
```

Leave this terminal open. Visit http://localhost:5000/health — you should
see `{"status":"ok", ...}`. That means Postgres, Redis, and the API are all
wired up correctly.

---

## 4. Set up the frontend

Open a **second terminal** (leave the backend running in the first one):

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Visit http://localhost:3000 — you should see the Artist homepage with
real products loaded from your backend.

---

## 5. How they're actually "connected"

Nothing links them except one line in `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Every page in the frontend calls this URL to get data (`GET /products`,
`POST /auth/login`, etc.) — that's the entire connection. As long as the
backend is running on port 5000, the frontend can reach it, regardless of
what folder either one lives in.

The backend also has one line that has to know about the frontend —
`backend/.env`:

```
CLIENT_URL="http://localhost:3000"
```

This is used for **CORS** (Cross-Origin Resource Sharing) — a browser
security rule that blocks a webpage from calling an API on a different
port/domain unless that API explicitly allows it. This line is the backend
saying "requests from localhost:3000 are allowed."

If you ever deploy these for real (e.g. backend on Railway, frontend on
Vercel), you'd update both of these to the real URLs instead of localhost.

---

## 6. Order, payment & payout flow (new)

The site now has a real (test-mode) checkout, an admin approval step, and
seller payout tracking. Here's the full loop:

```
Buyer adds to cart → Checkout → pays via Razorpay
    → Backend verifies the payment signature → order marked PAID
    → Email sent to ADMIN_EMAIL ("new order, needs confirmation")
    → You open /admin/orders, confirm once the item has actually arrived
    → That marks the maker's payout as PENDING
    → You open /admin/payouts, pay the maker via UPI/bank transfer yourself,
      then click "Mark Paid" to log it
```

**Two accounts are yours to set up** — I can't create these for you since
they require your own signup/verification:

### A. Razorpay (payment gateway)

1. Sign up free at https://dashboard.razorpay.com/signup — Test Mode needs
   no KYC/business verification, just an email.
2. Go to **Settings → API Keys → Generate Test Key**.
3. Copy the **Key ID** and **Key Secret** into `backend/.env`:
   ```
   RAZORPAY_KEY_ID="rzp_test_..."
   RAZORPAY_KEY_SECRET="..."
   ```
4. Restart the backend. Checkout will now work with Razorpay's test cards
   (e.g. card number `4111 1111 1111 1111`, any future expiry, any CVV —
   Razorpay's docs list more at https://razorpay.com/docs/payments/payments/test-card-upi-details/).
   No real money moves in Test Mode.

### B. Gmail App Password (so the backend can email you)

Regular Gmail passwords don't work for this — Google requires a separate
16-character "App Password" for apps that send mail on your behalf.

1. On the Gmail account you want to send FROM, turn on 2-Step Verification:
   https://myaccount.google.com/security
2. Then go to https://myaccount.google.com/apppasswords
3. Create one (name it anything, e.g. "Artist backend"), copy the 16-character code.
4. In `backend/.env`:
   ```
   EMAIL_USER="your-sending-gmail@gmail.com"
   EMAIL_APP_PASSWORD="the 16-character code, no spaces"
   ADMIN_EMAIL="khatunjeba888@gmail.com"
   ```
5. Restart the backend. If you skip this step, checkout still works fine —
   you just won't get an email; you'd need to check `/admin/orders` manually.

### Becoming an admin

Registering on the site always creates a regular buyer account — nobody
becomes admin by signing up. To promote your own account after registering
normally on the site:

```bash
cd backend
npm run make-admin -- khatunjeba888@gmail.com
```

Log out and back in on the site afterward — you'll see an **Admin
Dashboard** link in the account menu, linking to `/admin/orders` and
`/admin/payouts`.

### The commission split

`PLATFORM_COMMISSION_PERCENT=10` in `backend/.env` controls the split —
change it any time, it's read live at checkout. It's computed and locked in
per order line item at the moment of purchase, so changing it later doesn't
rewrite past orders.

### What's real vs. manual right now

- ✅ Real payment collection (Razorpay, test mode)
- ✅ Real signature verification (can't be faked/bypassed)
- ✅ Real commission math, tracked per order item
- ✅ Real email notification on payment
- ⚠️ Actual bank transfer to sellers is **manual** — you pay them yourself
  via UPI/bank transfer, then click "Mark Paid" to log it. Full automation
  of that (Razorpay Route) requires every seller to complete their own KYC
  with Razorpay, which isn't realistic until there are real onboarded
  sellers — a natural Stage 3 addition.

---

## 7. Everyday workflow, once it's all set up

You need **3 things running** at once, in 3 terminals (or 3 tabs):

| Terminal | Command | What it does |
|---|---|---|
| 1 | `docker compose up -d` (once, then leave it) | Postgres + Redis |
| 2 | `cd backend && npm run dev` | API on :5000 |
| 3 | `cd frontend && npm run dev` | Website on :3000 |

Docker containers keep running in the background even after you close the
terminal (because of `-d`), so you usually only run `docker compose up -d`
once per day/session, not every time.

---

## 8. Common issues

**"Port 5432 already in use"** — you probably have Postgres installed
natively too. Either stop that service, or change the port mapping in
`docker-compose.yml` (e.g. `"5433:5432"`) and update `DATABASE_URL` in
`backend/.env` to match.

**Frontend loads but shows no products** — check the backend terminal is
still running and `http://localhost:5000/health` responds. Also check
`frontend/.env.local` has the right `NEXT_PUBLIC_API_URL`.

**"relation does not exist" errors from the backend** — the migration
didn't run. Redo step 3's `npx prisma migrate dev` (or the SQL fallback).

**Docker containers show "Exited"** — run `docker compose logs postgres` or
`docker compose logs redis` to see why they crashed, usually a port
conflict.

**CORS error in the browser console** — double check `CLIENT_URL` in
`backend/.env` exactly matches where your frontend is running (including
`http://` and the port number).

**"Payments aren't set up yet" when checking out** — you haven't added
`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` to `backend/.env` yet. See section 6.

**Razorpay checkout window doesn't open** — check the browser console. It's
usually either the keys being wrong/empty, or an ad-blocker blocking
`checkout.razorpay.com`.

**Admin Dashboard link doesn't appear** — you're logged in as a regular
buyer. Run `npm run make-admin -- your-email@example.com`, then log out and
back in.
