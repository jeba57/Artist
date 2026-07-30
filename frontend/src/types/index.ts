export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface ArtisanRef {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
}

export interface Rating {
  avg: number;
  count: number;
}

export interface Badges {
  isFeatured: boolean;
  isEditorsPick: boolean;
  isTrending: boolean;
}

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  image: string | null;
  images: string[];
  price: number;
  discountPrice: number | null;
  currency: string;
  inStock: boolean;
  location: string;
  rating: Rating;
  badges: Badges;
  category: CategoryRef;
  artisan: ArtisanRef;
  createdAt: string;
}

export interface ArtisanDetail {
  id: string;
  name: string;
  slug: string;
  bio: string;
  story: string | null;
  avatarUrl: string | null;
  location: string;
  craftSpecialty: string;
  verified: boolean;
  ratingAvg: number;
}

export interface ProductDetail extends Omit<ProductCard, "image" | "images"> {
  story: string;
  craftProcess: string[];
  materials: string[];
  images: string[];
  stock: number;
  artisan: ArtisanDetail;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

export interface Maker {
  id: string;
  name: string;
  slug: string;
  bio: string;
  avatar_url: string | null;
  cover_image_url: string | null;
  location: string;
  craft_specialty: string;
  years_of_experience: number | null;
  verified: boolean;
  rating_avg: number;
  rating_count: number;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  artisanName: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  lineTotal: number;
  inStock: boolean;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: "BUYER" | "ADMIN";
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  phone: string;
}

export interface CheckoutResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  commissionPercent: number;
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PayoutStatus = "NOT_APPLICABLE" | "PENDING" | "PAID";

export interface BuyerOrderSummary {
  id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: string;
  created_at: string;
  admin_confirmed_at: string | null;
}

export interface OrderItemDetail {
  id: string;
  quantity: number;
  price_each: string;
  platform_fee: string;
  seller_amount: string;
  payout_status: PayoutStatus;
  product_name: string;
  images: string[];
  artisan_name: string | null;
}

export interface OrderDetail {
  id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: string;
  shipping_address: ShippingAddress;
  created_at: string;
  admin_confirmed_at: string | null;
  buyer_name: string;
  buyer_email: string;
  items: OrderItemDetail[];
}

export interface AdminOrderSummary {
  id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: string;

  buyer_name: string;
  buyer_email: string;

  artisan_names: string;
  product_summary: string;
  total_quantity: number;

  shipping_address: ShippingAddress;
  created_at: string;
  admin_confirmed_at: string | null;
}

export interface PendingPayout {
  order_item_id: string;
  order_id: string;
  quantity: number;
  price_each: string;
  seller_amount: string;
  platform_fee: string;
  product_name: string;
  artisan_id: string;
  artisan_name: string;
  artisan_location: string;
  admin_confirmed_at: string;
  order_created_at: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "BUYER" | "ADMIN";
  order_count: number;
  created_at: string;
}

export interface AdminStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  total_revenue: string;
  payouts_owed: string;
  total_products: number;
  total_users: number;
}

// ===================== SELLER TYPES =====================

export type SellerStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

export interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  status: SellerStatus;
}

export interface SellerAuthResponse {
  seller: Seller;
  accessToken: string;
}

export interface SellerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;

  owner_name: string;
  bio: string;
  location: string;
  craft_specialty: string;
  years_of_experience: number | null;

  verification_status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  verification_submitted_at: string | null;
  rejection_reason: string | null;

  avatar_url: string | null;

  gov_id_url: string | null;
  pan_card_url: string | null;
  gst_certificate_url: string | null;
  bank_proof_url: string | null;

  created_at: string;
}

export interface SellerVerification {
  id: string;
  sellerId: string;
  status: SellerStatus;
  rejectionReason?: string | null;
  submittedAt: string;
  verifiedAt?: string | null;
}