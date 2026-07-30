import { query } from "../../config/db.js";
import { generateId, makeSlug } from "../../utils/ids.js";

export const findArtisanByEmail = async (email) => {
  const { rows } = await query(`SELECT * FROM artisans WHERE email = $1`, [email]);
  return rows[0] || null;
};

export const findArtisanById = async (id) => {
  const { rows } = await query(`SELECT * FROM artisans WHERE id = $1`, [id]);
  return rows[0] || null;
};

/** Ensures a unique slug by suffixing -2, -3, ... on collision. */
const generateUniqueSlug = async (baseName) => {
  const base = makeSlug(baseName);
  let slug = base;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows } = await query(`SELECT 1 FROM artisans WHERE slug = $1`, [slug]);
    if (!rows[0]) return slug;
    slug = `${base}-${suffix++}`;
  }
};

export const createSellerApplication = async ({
  shopName,
  ownerName,
  email,
  passwordHash,
  phone,
  bio,
  craftSpecialty,
  location,
  yearsOfExperience,
  gstin,
  pan,
  panCardUrl,
  gstCertificateUrl,
  govIdUrl,
  bankProofUrl,
  bankDetailsJson,
  pickupAddress,
  avatarUrl,
}) => {
  const id = generateId("art_");
  const slug = await generateUniqueSlug(shopName);

  const { rows } = await query(
    `INSERT INTO artisans (
       id, name, slug, bio, avatar_url, location, craft_specialty, years_of_experience,
       email, password_hash, owner_name, phone,
       gstin, pan, pan_card_url, gst_certificate_url, gov_id_url, bank_proof_url,
       bank_details_json, pickup_address,
       verification_status, verification_submitted_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,
       $9,$10,$11,$12,
       $13,$14,$15,$16,$17,$18,
       $19,$20,
       'PENDING', now()
     )
     RETURNING *`,
    [
      id, shopName, slug, bio, avatarUrl || null, location, craftSpecialty, yearsOfExperience || null,
      email, passwordHash, ownerName, phone,
      gstin || null, pan || null, panCardUrl || null, gstCertificateUrl || null, govIdUrl, bankProofUrl,
      JSON.stringify(bankDetailsJson), JSON.stringify(pickupAddress),
    ]
  );
  return rows[0];
};

/** Allows a PENDING or REJECTED seller to update and resubmit their application. */
export const updateAndResubmitApplication = async (artisanId, fields) => {
  const allowed = [
    "name", "bio", "avatar_url", "location", "craft_specialty", "years_of_experience",
    "owner_name", "phone", "gstin", "pan", "pan_card_url", "gst_certificate_url",
    "gov_id_url", "bank_proof_url", "bank_details_json", "pickup_address",
  ];
  const columnMap = {
    name: "name", bio: "bio", avatarUrl: "avatar_url", location: "location",
    craftSpecialty: "craft_specialty", yearsOfExperience: "years_of_experience",
    ownerName: "owner_name", phone: "phone", gstin: "gstin", pan: "pan",
    panCardUrl: "pan_card_url", gstCertificateUrl: "gst_certificate_url",
    govIdUrl: "gov_id_url", bankProofUrl: "bank_proof_url",
    bankDetailsJson: "bank_details_json", pickupAddress: "pickup_address",
  };

  const sets = [];
  const params = [artisanId];
  for (const [key, value] of Object.entries(fields)) {
    const column = columnMap[key];
    if (!column || !allowed.includes(column) || value === undefined) continue;
    params.push(["bank_details_json", "pickup_address"].includes(column) ? JSON.stringify(value) : value);
    sets.push(`${column} = $${params.length}`);
  }
  if (!sets.length) return findArtisanById(artisanId);

  const { rows } = await query(
    `UPDATE artisans
     SET ${sets.join(", ")}, verification_status = 'PENDING', verification_submitted_at = now(),
         verified_at = NULL, verified_by = NULL, rejection_reason = NULL, updated_at = now()
     WHERE id = $1 AND verification_status IN ('PENDING', 'REJECTED')
     RETURNING *`,
    params
  );
  return rows[0] || null;
};
