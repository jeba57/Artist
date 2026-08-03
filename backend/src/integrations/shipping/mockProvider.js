import { generateId } from "../../utils/ids.js";

const COURIERS = ["Delhivery", "Bluedart", "Ekart", "DTDC"];

export const name = "mock";

export const isConfigured = () => true; // always available as a fallback

export const ensurePickupLocation = async (artisan) => {
  return artisan.shipping_pickup_location_code || `mock-pickup-${artisan.slug}`;
};

export const createShipmentAndSchedulePickup = async ({ weightKg, dimensionsCm, isCod }) => {
  const shipmentId = generateId("mockship_");
  return {
    providerOrderId: generateId("mockord_"),
    providerShipmentId: shipmentId,
    awbCode: `MOCK${Date.now().toString().slice(-10)}`,
    courierName: COURIERS[Math.floor(Math.random() * COURIERS.length)],
    labelUrl: `https://example.com/mock-labels/${shipmentId}.pdf`,
    manifestUrl: null,
    pickupScheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // "tomorrow"
  };
};

export const getTracking = async (awbCode) => ({
  status: "IN_TRANSIT",
  events: [{ status: "IN_TRANSIT", location: "Mock Hub", occurred_at: new Date().toISOString() }],
});

export const requestReturnPickup = async () => ({
  returnAwbCode: `MOCKRET${Date.now().toString().slice(-8)}`,
});
