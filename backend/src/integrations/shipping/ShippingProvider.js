/**
 * Every shipping provider (Shiprocket, a future alternative, or the
 * mock used in dev/testing) implements this exact shape. Nothing
 * outside src/integrations/shipping/ should ever import a specific
 * provider directly — always go through getShippingProvider() in
 * index.js. That's what makes swapping providers later a config
 * change instead of an architecture change.
 *
 * @typedef {Object} ShippingProvider
 *
 * @property {() => boolean} isConfigured
 *   Whether real credentials are present. Mirrors the existing
 *   isRazorpayConfigured()/isCloudinaryConfigured() pattern.
 *
 * @property {(artisan: object) => Promise<string>} ensurePickupLocation
 *   Registers (or looks up) a pickup location for this seller with
 *   the provider, returning a provider-specific location code.
 *   Idempotent — safe to call every time, only registers once.
 *
 * @property {(params: {
 *   order: object,
 *   items: object[],
 *   pickupLocationCode: string,
 *   weightKg: number,
 *   dimensionsCm: { lengthCm: number, widthCm: number, heightCm: number },
 *   isCod: boolean,
 *   codAmount: number | null,
 * }) => Promise<{
 *   providerOrderId: string,
 *   providerShipmentId: string,
 *   awbCode: string,
 *   courierName: string,
 *   labelUrl: string | null,
 *   manifestUrl: string | null,
 *   pickupScheduledAt: Date | null,
 * }>} createShipmentAndSchedulePickup
 *   The single call that covers steps 3-4 of the workflow: create
 *   the shipment, assign a courier + AWB, and request pickup.
 *
 * @property {(awbCode: string) => Promise<{ status: string, events: object[] }>} getTracking
 *   Polling fallback for when a webhook hasn't arrived — not the
 *   primary sync path, but useful for an admin "refresh" button.
 *
 * @property {(params: { order: object, reason: string }) => Promise<{
 *   returnAwbCode: string,
 * }>} requestReturnPickup
 *   Creates a reverse-pickup shipment for a return.
 */

export {};
