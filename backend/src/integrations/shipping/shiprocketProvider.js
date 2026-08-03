import "dotenv/config";

export const name = "shiprocket";

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken = null;
let cachedTokenExpiresAt = 0;

export const isConfigured = () =>
  Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);

/** Authenticates once, caches the bearer token (~9 days validity), re-auths near expiry. */
const authenticate = async () => {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) return cachedToken;

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Shiprocket auth failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  cachedToken = data.token;
  // Shiprocket tokens are valid ~10 days; refresh a day early to be safe.
  cachedTokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
};

const call = async (path, { method = "GET", body } = {}) => {
  const token = await authenticate();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Shiprocket ${method} ${path} failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
};

/**
 * Shiprocket pickup-location nicknames must be short and
 * alphanumeric-ish. Deriving it from the artisan's slug keeps it
 * stable and human-traceable without a lookup table.
 */
const pickupLocationNameFor = (artisan) =>
  `seller-${artisan.slug}`.slice(0, 36).replace(/[^a-zA-Z0-9-]/g, "");

export const ensurePickupLocation = async (artisan) => {
  if (artisan.shipping_pickup_location_code) return artisan.shipping_pickup_location_code;

  const pickup = artisan.pickup_address;
  if (!pickup?.line1 || !pickup?.city || !pickup?.pincode || !pickup?.phone) {
    throw new Error("Seller's pickup address is incomplete — can't register with the shipping provider.");
  }

  const nickname = pickupLocationNameFor(artisan);

  try {
    await call("/settings/company/addpickup", {
      method: "POST",
      body: {
        pickup_location: nickname,
        name: artisan.owner_name || artisan.name,
        email: artisan.email,
        phone: pickup.phone,
        address: pickup.line1,
        address_2: pickup.line2 || "",
        city: pickup.city,
        state: pickup.state || "",
        country: "India",
        pin_code: pickup.pincode,
      },
    });
  } catch (err) {
    // Shiprocket errors if the nickname is already registered — that's
    // fine, it just means a prior attempt partially succeeded. Any
    // other failure should still surface.
    if (!/already exists|already in use/i.test(err.message)) throw err;
  }

  return nickname;
};

export const createShipmentAndSchedulePickup = async ({
  order, items, pickupLocationCode, weightKg, dimensionsCm, isCod, codAmount,
}) => {
  const orderPayload = {
    order_id: order.id,
    order_date: new Date(order.created_at).toISOString().slice(0, 19).replace("T", " "),
    pickup_location: pickupLocationCode,
    billing_customer_name: order.shipping_address.fullName,
    billing_address: order.shipping_address.line1,
    billing_address_2: order.shipping_address.line2 || "",
    billing_city: order.shipping_address.city,
    billing_pincode: order.shipping_address.pincode,
    billing_state: order.shipping_address.state || "",
    billing_country: "India",
    billing_phone: order.shipping_address.phone,
    shipping_is_billing: true,
    order_items: items.map((i) => ({
      name: i.product_name,
      sku: i.product_id,
      units: i.quantity,
      selling_price: i.price_each,
    })),
    payment_method: isCod ? "COD" : "Prepaid",
    sub_total: order.total_amount,
    length: dimensionsCm.lengthCm,
    breadth: dimensionsCm.widthCm,
    height: dimensionsCm.heightCm,
    weight: weightKg,
  };
  if (isCod) orderPayload.cod_amount = codAmount;

  const created = await call("/orders/create/adhoc", { method: "POST", body: orderPayload });
  const shipmentId = created.shipment_id;
  const providerOrderId = String(created.order_id);

  const awbRes = await call("/courier/assign/awb", { method: "POST", body: { shipment_id: shipmentId } });
  const awbCode = awbRes.response?.data?.awb_code;
  const courierName = awbRes.response?.data?.courier_name;

  await call("/courier/generate/pickup", { method: "POST", body: { shipment_id: [shipmentId] } });

  let labelUrl = null;
  try {
    const labelRes = await call("/courier/generate/label", { method: "POST", body: { shipment_id: [shipmentId] } });
    labelUrl = labelRes.label_url || null;
  } catch {
    // Label generation can lag right after AWB assignment on some
    // couriers — non-fatal, the shipment is still valid without it.
  }

  return {
    providerOrderId,
    providerShipmentId: String(shipmentId),
    awbCode,
    courierName,
    labelUrl,
    manifestUrl: null,
    pickupScheduledAt: new Date(),
  };
};

export const getTracking = async (awbCode) => {
  const data = await call(`/courier/track/awb/${awbCode}`);
  const track = data?.tracking_data;
  return {
    status: track?.shipment_track?.[0]?.current_status || null,
    events: track?.shipment_track_activities || [],
  };
};

export const requestReturnPickup = async ({ order, reason }) => {
  const returnPayload = {
    order_id: `RET-${order.id}`,
    order_date: new Date().toISOString().slice(0, 19).replace("T", " "),
    pickup_customer_name: order.shipping_address.fullName,
    pickup_address: order.shipping_address.line1,
    pickup_city: order.shipping_address.city,
    pickup_pincode: order.shipping_address.pincode,
    pickup_state: order.shipping_address.state || "",
    pickup_country: "India",
    pickup_phone: order.shipping_address.phone,
    shipping_customer_name: "Warehouse Returns", // seller's registered pickup location receives it
    order_items: (order.items || []).map((i) => ({
      name: i.product_name,
      sku: i.product_id,
      units: i.quantity,
      selling_price: i.price_each,
    })),
    payment_method: "Prepaid",
    sub_total: order.total_amount,
    length: 15,
    breadth: 15,
    height: 10,
    weight: order.package_weight_kg || 0.5,
    reason,
  };

  const created = await call("/orders/create/return", { method: "POST", body: returnPayload });
  return { returnAwbCode: created?.awb_code || null };
};
