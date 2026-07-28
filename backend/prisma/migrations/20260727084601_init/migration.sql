/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `artisans` table. All the data in the column will be lost.
  - You are about to drop the column `bankDetailsJson` on the `artisans` table. All the data in the column will be lost.
  - You are about to drop the column `coverImageUrl` on the `artisans` table. All the data in the column will be lost.
  - You are about to drop the column `craftSpecialty` on the `artisans` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `artisans` table. All the data in the column will be lost.
  - You are about to drop the column `govIdUrl` on the `artisans` table. All the data in the column will be lost.
  - You are about to drop the column `isFeaturedMaker` on the `artisans` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `artisans` table. All the data in the column will be lost.
  - You are about to drop the column `ratingAvg` on the `artisans` table. All the data in the column will be lost.
  - You are about to drop the column `ratingCount` on the `artisans` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `artisans` table. All the data in the column will be lost.
  - You are about to drop the column `verificationStatus` on the `artisans` table. All the data in the column will be lost.
  - You are about to drop the column `yearsOfExperience` on the `artisans` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `displayOrder` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `artisanId` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `payoutMarkedAt` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `payoutStatus` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `platformFee` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `priceEach` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `sellerAmount` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `adminConfirmedAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `adminConfirmedBy` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayOrderId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayPaymentId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shippingAddress` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `artisanId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `craftProcess` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `discountPrice` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isEditorsPick` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isFeatured` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isTrending` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `ratingAvg` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `ratingCount` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `shortDescription` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `viewedAt` on the `recently_viewed` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `avatarUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `wishlist_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[razorpay_order_id]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[google_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `craft_specialty` to the `artisans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `artisans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `cart_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_id` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_each` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `artisan_id` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_id` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `short_description` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_artisanId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_orderId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_adminConfirmedBy_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_userId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_artisanId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropIndex
DROP INDEX "orders_razorpayOrderId_key";

-- DropIndex
DROP INDEX "products_artisanId_idx";

-- DropIndex
DROP INDEX "products_categoryId_idx";

-- DropIndex
DROP INDEX "products_isEditorsPick_idx";

-- DropIndex
DROP INDEX "products_isFeatured_idx";

-- DropIndex
DROP INDEX "products_isTrending_idx";

-- DropIndex
DROP INDEX "users_googleId_key";

-- AlterTable
ALTER TABLE "artisans" DROP COLUMN "avatarUrl",
DROP COLUMN "bankDetailsJson",
DROP COLUMN "coverImageUrl",
DROP COLUMN "craftSpecialty",
DROP COLUMN "createdAt",
DROP COLUMN "govIdUrl",
DROP COLUMN "isFeaturedMaker",
DROP COLUMN "passwordHash",
DROP COLUMN "ratingAvg",
DROP COLUMN "ratingCount",
DROP COLUMN "updatedAt",
DROP COLUMN "verificationStatus",
DROP COLUMN "yearsOfExperience",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "bank_details_json" JSONB,
ADD COLUMN     "cover_image_url" TEXT,
ADD COLUMN     "craft_specialty" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gov_id_url" TEXT,
ADD COLUMN     "is_featured_maker" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "rating_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "verification_status" "VerificationStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
ADD COLUMN     "years_of_experience" INTEGER;

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "displayOrder",
DROP COLUMN "imageUrl",
ADD COLUMN     "display_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "artisanId",
DROP COLUMN "orderId",
DROP COLUMN "payoutMarkedAt",
DROP COLUMN "payoutStatus",
DROP COLUMN "platformFee",
DROP COLUMN "priceEach",
DROP COLUMN "productId",
DROP COLUMN "sellerAmount",
ADD COLUMN     "artisan_id" TEXT,
ADD COLUMN     "order_id" TEXT NOT NULL,
ADD COLUMN     "payout_marked_at" TIMESTAMP(3),
ADD COLUMN     "payout_status" "PayoutStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
ADD COLUMN     "platform_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "price_each" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "product_id" TEXT NOT NULL,
ADD COLUMN     "seller_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "adminConfirmedAt",
DROP COLUMN "adminConfirmedBy",
DROP COLUMN "createdAt",
DROP COLUMN "paymentStatus",
DROP COLUMN "razorpayOrderId",
DROP COLUMN "razorpayPaymentId",
DROP COLUMN "shippingAddress",
DROP COLUMN "totalAmount",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "admin_confirmed_at" TIMESTAMP(3),
ADD COLUMN     "admin_confirmed_by" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "razorpay_order_id" TEXT,
ADD COLUMN     "razorpay_payment_id" TEXT,
ADD COLUMN     "shipping_address" JSONB,
ADD COLUMN     "total_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "artisanId",
DROP COLUMN "categoryId",
DROP COLUMN "craftProcess",
DROP COLUMN "createdAt",
DROP COLUMN "discountPrice",
DROP COLUMN "isEditorsPick",
DROP COLUMN "isFeatured",
DROP COLUMN "isTrending",
DROP COLUMN "ratingAvg",
DROP COLUMN "ratingCount",
DROP COLUMN "shortDescription",
DROP COLUMN "updatedAt",
ADD COLUMN     "artisan_id" TEXT NOT NULL,
ADD COLUMN     "category_id" TEXT NOT NULL,
ADD COLUMN     "craft_process" TEXT[],
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "discount_price" DECIMAL(10,2),
ADD COLUMN     "is_editors_pick" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_trending" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "rating_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "short_description" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "recently_viewed" DROP COLUMN "viewedAt",
ADD COLUMN     "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatarUrl",
DROP COLUMN "createdAt",
DROP COLUMN "googleId",
DROP COLUMN "passwordHash",
DROP COLUMN "updatedAt",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "google_id" TEXT,
ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "wishlist_items" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "orders_razorpay_order_id_key" ON "orders"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_artisan_id_idx" ON "products"("artisan_id");

-- CreateIndex
CREATE INDEX "products_is_featured_idx" ON "products"("is_featured");

-- CreateIndex
CREATE INDEX "products_is_editors_pick_idx" ON "products"("is_editors_pick");

-- CreateIndex
CREATE INDEX "products_is_trending_idx" ON "products"("is_trending");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_artisan_id_fkey" FOREIGN KEY ("artisan_id") REFERENCES "artisans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_admin_confirmed_by_fkey" FOREIGN KEY ("admin_confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_artisan_id_fkey" FOREIGN KEY ("artisan_id") REFERENCES "artisans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
