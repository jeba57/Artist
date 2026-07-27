-- ============================================================
-- Artist — Manual SQL migration
-- Mirrors prisma/schema.prisma field-for-field.
-- NOTE: If you have unrestricted internet access, prefer:
--   npx prisma migrate dev --name init
-- which generates (and keeps in sync) an equivalent migration
-- from schema.prisma automatically. This file exists because
-- Prisma's engine binaries are unreachable in restricted /
-- offline sandboxes (see README "Prisma engine note").
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()-style ids if needed

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('BUYER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NOT_APPLICABLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT,
  google_id      TEXT UNIQUE,
  avatar_url     TEXT,
  role           "Role" NOT NULL DEFAULT 'BUYER',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- ARTISANS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artisans (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  bio                  TEXT NOT NULL,
  story                TEXT,
  avatar_url           TEXT,
  cover_image_url      TEXT,
  location             TEXT NOT NULL,
  craft_specialty      TEXT NOT NULL,
  years_of_experience  INT,
  verified             BOOLEAN NOT NULL DEFAULT false,
  verification_status  "VerificationStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
  rating_avg           DOUBLE PRECISION NOT NULL DEFAULT 0,
  rating_count         INT NOT NULL DEFAULT 0,
  is_featured_maker    BOOLEAN NOT NULL DEFAULT false,
  email                TEXT UNIQUE,
  password_hash        TEXT,
  gov_id_url           TEXT,
  bank_details_json    JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL UNIQUE,
  slug           TEXT NOT NULL UNIQUE,
  description    TEXT,
  image_url      TEXT,
  display_order  INT NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  short_description  TEXT NOT NULL,
  story              TEXT NOT NULL,
  craft_process      TEXT[] NOT NULL DEFAULT '{}',
  materials          TEXT[] NOT NULL DEFAULT '{}',
  images             TEXT[] NOT NULL DEFAULT '{}',
  price              NUMERIC(10,2) NOT NULL,
  discount_price     NUMERIC(10,2),
  currency           TEXT NOT NULL DEFAULT 'INR',
  stock              INT NOT NULL DEFAULT 10,
  location           TEXT NOT NULL,
  rating_avg         DOUBLE PRECISION NOT NULL DEFAULT 0,
  rating_count       INT NOT NULL DEFAULT 0,
  is_featured        BOOLEAN NOT NULL DEFAULT false,
  is_editors_pick    BOOLEAN NOT NULL DEFAULT false,
  is_trending        BOOLEAN NOT NULL DEFAULT false,
  category_id        TEXT NOT NULL REFERENCES categories(id),
  artisan_id         TEXT NOT NULL REFERENCES artisans(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_artisan ON products(artisan_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_editors_pick ON products(is_editors_pick);
CREATE INDEX IF NOT EXISTS idx_products_trending ON products(is_trending);

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT PRIMARY KEY,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- ------------------------------------------------------------
-- CART
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
  id          TEXT PRIMARY KEY,
  quantity    INT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE (user_id, product_id)
);

-- ------------------------------------------------------------
-- WISHLIST
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist_items (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE (user_id, product_id)
);

-- ------------------------------------------------------------
-- RECENTLY VIEWED
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recently_viewed (
  id          TEXT PRIMARY KEY,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE (user_id, product_id)
);

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,
  status        "OrderStatus" NOT NULL DEFAULT 'PENDING',
  total_amount  NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id       TEXT NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id          TEXT PRIMARY KEY,
  quantity    INT NOT NULL,
  price_each  NUMERIC(10,2) NOT NULL,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL REFERENCES products(id)
);
