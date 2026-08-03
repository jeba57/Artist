import crypto from "crypto";
import { getRazorpay, isRazorpayConfigured } from "../../config/razorpay.js";
import { ApiError } from "../../utils/ApiError.js";
import * as ordersRepo from "./orders.repository.js";
import { query } from "../../config/db.js";
import { sendAdminOrderNotification } from "../../utils/email.js";

const commissionPercent = () => Number(process.env.PLATFORM_COMMISSION_PERCENT || 10);

const round2 = (n) => Math.round(n * 100) / 100;

export const startCheckout = async (userId, shippingAddress, paymentMethod = "ONLINE") => {
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

  // --- Cash on Delivery: no Razorpay involved at all. The order is
  // placed immediately; the courier collects payment at the door,
  // which is what marks it PAID (see applyShipmentStatusUpdate's
  // markCodPaid logic, triggered by the delivery webhook). ---
  if (paymentMethod === "COD") {
    const orderId = await ordersRepo.createPendingOrder({
      userId, totalAmount, shippingAddress, razorpayOrderId: null, lineItems,
      paymentMethod: "COD", codAmount: totalAmount,
    });

    await query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);

    const fullOrder = await ordersRepo.getOrderWithItems(orderId);
    await sendAdminOrderNotification(fullOrder).catch((err) => console.error("[email] admin notify failed:", err.message));

    return { orderId, paymentMethod: "COD", codAmount: totalAmount, placedImmediately: true };
  }

  // --- Online payment: existing Razorpay flow, unchanged. ---
  if (!isRazorpayConfigured()) {
    throw ApiError.badRequest(
      "Payments aren't set up yet — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env (see README)."
    );
  }

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
    paymentMethod: "ONLINE",
  });

  return {
    orderId,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    commissionPercent: commission,
    placedImmediately: false,
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
  const shipmentEvents = await ordersRepo.getShipmentEvents(orderId);
  return { ...order, shipmentEvents };
};

export const requestReturn = async (userId, orderId, reason) => {
  if (!reason || reason.trim().length < 5) {
    throw ApiError.badRequest("Please tell us why you're returning this (at least 5 characters).");
  }

  const updated = await ordersRepo.requestOrderReturn({ orderId, userId, reason: reason.trim() });
  if (!updated) {
    throw ApiError.badRequest("This order can't be returned right now — it may not be delivered yet, or a return was already requested.");
  }

  // Best-effort reverse-pickup creation. A return request should
  // still succeed even if the shipping provider call fails — an
  // admin can retry/arrange pickup manually, same philosophy as the
  // email notifications elsewhere in this app.
  try {
    const { getShippingProvider } = await import("../../integrations/shipping/index.js");
    const provider = getShippingProvider();
    const fullOrder = await ordersRepo.getOrderWithItems(orderId);
    const { returnAwbCode } = await provider.requestReturnPickup({ order: fullOrder, reason });
    if (returnAwbCode) await ordersRepo.setReturnAwb(orderId, returnAwbCode);
  } catch (err) {
    console.error("[returns] Failed to create reverse pickup — needs manual handling:", err.message);
  }

  return updated;
};
