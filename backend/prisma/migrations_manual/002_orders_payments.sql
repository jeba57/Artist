-- ============================================================
-- Migration 002: Orders, Payments, Admin Confirmation, Payouts
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PayoutStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Orders gain: payment tracking, shipping address, admin confirmation,
-- and the commission split (platform fee vs seller payout).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status       "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS shipping_address     JSONB,
  ADD COLUMN IF NOT EXISTS admin_confirmed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_confirmed_by   TEXT REFERENCES users(id);

-- Order items gain: per-artisan commission split, computed at
-- checkout time from the price then locked in (so a later change
-- to the platform commission rate doesn't rewrite historical orders).
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS artisan_id       TEXT REFERENCES artisans(id),
  ADD COLUMN IF NOT EXISTS platform_fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payout_status    "PayoutStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
  ADD COLUMN IF NOT EXISTS payout_marked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_artisan ON order_items(artisan_id);
