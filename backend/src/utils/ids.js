import { randomBytes } from "crypto";
import slugify from "slugify";

// Prisma's default id generator is `cuid()`. We don't have the
// Prisma runtime available in this environment, so we generate
// collision-safe ids in the same shape/spirit (lowercase,
// url-safe, sortable-ish) by hand. Swapping to `@prisma/client`
// later needs no schema change — `id` stays a plain TEXT PK.
export const generateId = (prefix = "") => {
  const time = Date.now().toString(36);
  const rand = randomBytes(8).toString("hex");
  return `${prefix}${time}${rand}`;
};

export const makeSlug = (text) => slugify(text, { lower: true, strict: true });
