import * as shiprocket from "./shiprocketProvider.js";
import * as mock from "./mockProvider.js";

/**
 * The single seam for swapping shipping providers. Everything else
 * in the app calls getShippingProvider() and uses the returned
 * object — nothing imports shiprocketProvider.js or mockProvider.js
 * directly outside this file. Adding a second real provider later
 * means adding one more module here, not touching seller/admin/
 * webhook route code at all.
 */
export const getShippingProvider = () => {
  if (shiprocket.isConfigured()) return shiprocket;

  console.warn(
    "[shipping] SHIPROCKET_EMAIL/SHIPROCKET_PASSWORD not set — using the mock shipping provider. " +
      "Shipments will be created with fake AWB/courier data and won't trigger real pickups. See README."
  );
  return mock;
};
