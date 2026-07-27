import crypto from "crypto";
import { getRazorpay, isRazorpayConfigured } from "../../config/razorpay.js";
import { ApiError } from "../../utils/ApiError.js";
import * as ordersRepo from "./orders.repository.js";
import { query } from "../../config/db.js";
import { sendAdminOrderNotification } from "../../utils/email.js";

const commissionPercent = () => Number(process.env.PLATFORM_COMMISSION_PERCENT || 10);

const round2 = (n) => Math.round(n * 100) / 100;

export const startCheckout = async (userId, shippingAddress) => {
  if (!isRazorpayConfigured()) {
    throw ApiError.badRequest(
      "Payments aren't set up yet — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env (see README)."
    );
  }
  if (!shippingAddress?.fullName || !shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.pincode || !shippingAddress?.phone) {
    throw ApiError.badRequest("Full shipping address (name, address line, city, pincode, phone) is required.");
  }

  const cartRows = await ordersRepo.getCartForCheckout(userId);
  if (cartRows.length === 0) throw ApiError.badRequest("Your cart is empty.");

  const outOfStock = cartRows.find((r) => r.stock < r.quantity);
  if (outOfStock) throw ApiError.badRequest(`"${outOfStock.name}" doesn't have enough stock right now.`);

  const commission = commissionPercent();
  const lineItems = cartRows.map((r) => {
    const unitPrice = Number(r.discount_price ?? r.price);
    const lineTotal = round2(unitPrice * r.quantity);
    const platformFee = round2(lineTotal * (commission / 100));
    const sellerAmount = round2(lineTotal - platformFee);
    return {
      productId: r.product_id,
      artisanId: r.artisan_id,
      quantity: r.quantity,
      priceEach: unitPrice,
      lineTotal,
      platformFee,
      sellerAmount,
    };
  });

  const totalAmount = round2(lineItems.reduce((sum, i) => sum + i.lineTotal, 0));

  const razorpay = getRazorpay();
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100), // paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  });

  const orderId = await ordersRepo.createPendingOrder({
    userId,
    totalAmount,
    shippingAddress,
    razorpayOrderId: razorpayOrder.id,
    lineItems,
  });

  return {
    orderId,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    commissionPercent: commission,
  };
};

export const verifyAndCapturePayment = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!isRazorpayConfigured()) throw ApiError.badRequest("Payments aren't set up yet.");

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    throw ApiError.badRequest("Payment verification failed — signature mismatch.");
  }

  const order = await ordersRepo.findOrderByRazorpayOrderId(razorpayOrderId);
  if (!order) throw ApiError.notFound("Order not found.");

  const updated = await ordersRepo.markOrderPaid({ orderId: order.id, razorpayPaymentId });
  if (!updated) {
    // Already marked paid (e.g. duplicate webhook/callback) — treat as success, not an error.
    return { orderId: order.id, alreadyPaid: true };
  }

  // Clear the buyer's cart now that it's been converted into an order.
  await query(`DELETE FROM cart_items WHERE user_id = $1`, [order.user_id]);

  const fullOrder = await ordersRepo.getOrderWithItems(order.id);
  await sendAdminOrderNotification(fullOrder).catch((err) => console.error("[email] admin notify failed:", err.message));

  return { orderId: order.id, alreadyPaid: false };
};

export const getBuyerOrders = (userId) => ordersRepo.listOrdersForBuyer(userId);

export const getOrderDetailForBuyer = async (userId, orderId) => {
  const order = await ordersRepo.getOrderWithItems(orderId);
  if (!order || order.user_id !== userId) throw ApiError.notFound("Order not found.");
  return order;
};
