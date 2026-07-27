import nodemailer from "nodemailer";
import "dotenv/config";

let transporter = null;

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
};

/**
 * Sends a plain-text/HTML email. Never throws — a missing or
 * misconfigured email setup should never break checkout. Instead it
 * logs a clear warning so you know the notification didn't go out.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const t = getTransporter();
  if (!t) {
    console.warn(
      `[email] Skipped sending "${subject}" to ${to} — EMAIL_USER / EMAIL_APP_PASSWORD not set in .env yet.`
    );
    return { sent: false, reason: "not_configured" };
  }

  try {
    await t.sendMail({
      from: `"Artist" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
};

export const sendAdminOrderNotification = async (order) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const itemsHtml = order.items
    .map(
      (i) =>
        `<li>${i.quantity} × ${i.product_name} — ₹${i.price_each} each (seller: ${i.artisan_name || "—"}, seller gets ₹${i.seller_amount}, platform fee ₹${i.platform_fee})</li>`
    )
    .join("");

  await sendEmail({
    to: adminEmail,
    subject: `New paid order #${order.id.slice(-8)} — needs your confirmation`,
    html: `
      <h2>New order paid ✅</h2>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Buyer:</strong> ${order.buyer_name} (${order.buyer_email})</p>
      <p><strong>Total:</strong> ₹${order.total_amount}</p>
      <p><strong>Shipping to:</strong> ${JSON.stringify(order.shipping_address)}</p>
      <h3>Items</h3>
      <ul>${itemsHtml}</ul>
      <p>Once the item is delivered, go to your admin dashboard and confirm the order —
      that's what marks each seller's payout as ready to pay out.</p>
      <p><a href="${process.env.CLIENT_URL}/admin/orders">Open Admin Dashboard</a></p>
    `,
    text: `New paid order #${order.id}. Buyer: ${order.buyer_name}. Total: ₹${order.total_amount}. Review and confirm at ${process.env.CLIENT_URL}/admin/orders`,
  });
};

export const sendBuyerOrderConfirmedEmail = async (order) => {
  await sendEmail({
    to: order.buyer_email,
    subject: `Your order #${order.id.slice(-8)} has been confirmed`,
    html: `
      <h2>Your order is confirmed</h2>
      <p>Hi ${order.buyer_name}, your order #${order.id.slice(-8)} has been reviewed and confirmed.
      Thank you for shopping handmade!</p>
    `,
    text: `Your order #${order.id} has been confirmed.`,
  });
};
