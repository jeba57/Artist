import "dotenv/config";
import pg from "pg";
import slugify from "slugify";
import { randomBytes } from "crypto";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const id = (prefix) => `${prefix}${Date.now().toString(36)}${randomBytes(6).toString("hex")}`;
const slug = (s) => slugify(s, { lower: true, strict: true });

// Free, license-friendly placeholder imagery (Unsplash source) —
// swap for real Cloudinary-hosted AI-generated craft photography
// when that pipeline is wired up. Kept as plain URLs so the
// `images` column is exercised exactly as it will be in production.
const img = (query, seed) => `https://source.unsplash.com/800x800/?${encodeURIComponent(query)}&sig=${seed}`;

const CATEGORIES = [
  { name: "Pottery", desc: "Wheel-thrown and hand-built ceramic vessels." },
  { name: "Clay Art", desc: "Sculptural terracotta and clay figurines." },
  { name: "Crochet", desc: "Hand-crocheted textiles and accessories." },
  { name: "Bamboo Crafts", desc: "Woven and carved bamboo homeware." },
  { name: "Wooden Crafts", desc: "Hand-carved wooden decor and utility pieces." },
  { name: "Handmade Bags", desc: "Artisan-stitched bags and totes." },
  { name: "Paintings", desc: "Original folk and contemporary artwork." },
  { name: "Candles", desc: "Hand-poured botanical and soy candles." },
  { name: "Home Decor", desc: "Curated pieces to warm up a room." },
  { name: "Jewellery", desc: "Handcrafted metal, bead, and stone jewellery." },
  { name: "Embroidery", desc: "Hand-embroidered textiles and wall art." },
];

const ARTISANS = [
  { name: "Meera Devi", specialty: "Terracotta Pottery", location: "Khurja, Uttar Pradesh", years: 22, bio: "Fourth-generation potter continuing her family's terracotta legacy from the kilns of Khurja." },
  { name: "Ravi Prajapati", specialty: "Blue Pottery", location: "Jaipur, Rajasthan", years: 15, bio: "Self-taught blue pottery artist blending Persian technique with Rajasthani motifs." },
  { name: "Lakshmi Bai", specialty: "Crochet Textiles", location: "Kannur, Kerala", years: 18, bio: "Leads a women's crochet collective producing heirloom-quality textiles." },
  { name: "Suresh Mallick", specialty: "Bamboo Weaving", location: "Cooch Behar, West Bengal", years: 30, bio: "Master bamboo weaver trained under his grandfather in traditional Bengal basketry." },
  { name: "Anita Tudu", specialty: "Wooden Carving", location: "Saharanpur, Uttar Pradesh", years: 12, bio: "Wood carver known for intricate floral relief work on sheesham wood." },
  { name: "Farida Khatoon", specialty: "Embroidery", location: "Lucknow, Uttar Pradesh", years: 20, bio: "Chikankari embroidery artisan preserving a 400-year-old Awadhi craft." },
  { name: "Devendra Soni", specialty: "Silver Jewellery", location: "Bikaner, Rajasthan", years: 25, bio: "Silversmith specializing in traditional Rajasthani filigree jewellery." },
  { name: "Kamala Rani", specialty: "Madhubani Painting", location: "Madhubani, Bihar", years: 17, bio: "National award-winning Madhubani painter depicting folklore and nature." },
  { name: "Irfan Ansari", specialty: "Leather Bags", location: "Kanpur, Uttar Pradesh", years: 14, bio: "Leatherworker crafting hand-stitched bags using vegetable-tanned hides." },
  { name: "Priya Nair", specialty: "Soy Candles", location: "Kochi, Kerala", years: 6, bio: "Runs a small-batch candle studio using coconut-soy wax and local botanicals." },
];

const PRODUCTS = [
  { name: "Hand-Thrown Terracotta Vase", category: "Pottery", artisan: 0, price: 1299, discount: 999, materials: ["Terracotta clay", "Natural glaze"], story: "Shaped on a foot-powered wheel and fired in a traditional wood kiln, each vase carries the subtle asymmetry of the human hand." },
  { name: "Blue Pottery Dinner Plate Set", category: "Pottery", artisan: 1, price: 2499, materials: ["Quartz powder", "Cobalt oxide glaze"], story: "Jaipur's iconic blue pottery, fired without clay using a quartz-based dough technique dating back to the Mughal era." },
  { name: "Rustic Clay Diya Set (Pack of 6)", category: "Clay Art", artisan: 0, price: 349, materials: ["Terracotta clay"], story: "Hand-molded oil lamps finished with a matte earthen glaze, ready for festival evenings." },
  { name: "Terracotta Elephant Figurine", category: "Clay Art", artisan: 0, price: 799, materials: ["Terracotta clay", "Natural pigment"], story: "A sculptural centerpiece inspired by temple processions, air-dried and hand-painted." },
  { name: "Chunky Crochet Throw Blanket", category: "Crochet", artisan: 2, price: 3499, discount: 2999, materials: ["Cotton yarn"], story: "Each stitch is worked by hand over three days, producing a throw that's as sturdy as it is soft." },
  { name: "Crochet Market Tote Bag", category: "Crochet", artisan: 2, price: 899, materials: ["Cotton yarn", "Wooden handles"], story: "A everyday tote crocheted in a durable granny-square pattern, lined for structure." },
  { name: "Woven Bamboo Storage Basket", category: "Bamboo Crafts", artisan: 3, price: 1099, materials: ["Bamboo strips", "Cane"], story: "Split and woven by hand using a technique passed down for three generations in Cooch Behar." },
  { name: "Bamboo Table Lamp", category: "Bamboo Crafts", artisan: 3, price: 1799, materials: ["Bamboo", "Cotton wiring"], story: "Slatted bamboo casts warm, dappled light — a quiet centerpiece for any reading corner." },
  { name: "Hand-Carved Sheesham Jewellery Box", category: "Wooden Crafts", artisan: 4, price: 2199, materials: ["Sheesham wood", "Brass inlay"], story: "Floral relief carving done entirely by hand with traditional chisels, no two boxes alike." },
  { name: "Carved Wooden Wall Panel", category: "Wooden Crafts", artisan: 4, price: 4499, materials: ["Sheesham wood"], story: "A large-format decorative panel carved over two weeks, depicting a traditional lotus motif." },
  { name: "Chikankari Embroidered Cotton Kurta", category: "Embroidery", artisan: 5, price: 1899, materials: ["Cotton", "Cotton thread"], story: "Hand-embroidered using the shadow-work technique unique to Lucknow's Chikankari tradition." },
  { name: "Embroidered Wall Hanging", category: "Embroidery", artisan: 5, price: 1599, materials: ["Cotton fabric", "Silk thread"], story: "A framable piece of hand-embroidered folk art, taking roughly 40 hours to complete." },
  { name: "Rajasthani Silver Filigree Earrings", category: "Jewellery", artisan: 6, price: 2299, materials: ["Sterling silver"], story: "Wire-thin silver threads are hand-twisted into lace-like patterns using a technique called tarkashi." },
  { name: "Oxidised Silver Anklet Pair", category: "Jewellery", artisan: 6, price: 1499, materials: ["Oxidised silver"], story: "Traditional ghungroo-style anklets, hand-finished with a deep oxidised patina." },
  { name: "Madhubani Painting — Tree of Life", category: "Paintings", artisan: 7, price: 3999, materials: ["Handmade paper", "Natural pigments"], story: "Painted with bamboo-stick brushes and natural dyes, following motifs passed down through generations of Mithila women." },
  { name: "Folk Art Canvas — Village Fair", category: "Paintings", artisan: 7, price: 5499, discount: 4799, materials: ["Canvas", "Acrylic paint"], story: "A vibrant Madhubani-style depiction of a rural village fair, hand-painted over ten days." },
  { name: "Hand-Stitched Leather Tote", category: "Handmade Bags", artisan: 8, price: 3299, materials: ["Vegetable-tanned leather", "Cotton thread"], story: "Cut and saddle-stitched entirely by hand, this tote develops a rich patina with age." },
  { name: "Canvas & Leather Sling Bag", category: "Handmade Bags", artisan: 8, price: 1799, materials: ["Canvas", "Leather trim"], story: "A lightweight everyday sling with hand-finished leather detailing." },
  { name: "Coconut Soy Candle — Sandalwood", category: "Candles", artisan: 9, price: 649, materials: ["Coconut-soy wax", "Cotton wick", "Sandalwood oil"], story: "Hand-poured in small batches using a clean-burning coconut-soy blend and natural sandalwood oil." },
  { name: "Botanical Soy Candle Trio", category: "Candles", artisan: 9, price: 1199, materials: ["Soy wax", "Dried botanicals"], story: "Three hand-poured candles layered with real dried flowers, scented with essential oils." },
  { name: "Handwoven Jute Table Runner", category: "Home Decor", artisan: 3, price: 899, materials: ["Jute", "Cotton"], story: "Woven on a traditional pit loom, this runner brings texture to any table setting." },
  { name: "Terracotta Wall Plates (Set of 3)", category: "Home Decor", artisan: 0, price: 1399, materials: ["Terracotta clay", "Natural pigment"], story: "Hand-painted decorative plates meant for wall display, inspired by folk pottery traditions." },
];

const CRAFT_PROCESS = [
  "Sourcing raw, natural materials directly from local suppliers",
  "Shaping or forming the piece entirely by hand",
  "A resting or drying period to set the form",
  "Hand-finishing details, glaze, dye, or carving",
  "Final quality check before it ships to you",
];

async function main() {
  console.log("Seeding categories...");
  const categoryIds = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const cid = id("cat_");
    await pool.query(
      `INSERT INTO categories (id, name, slug, description, image_url, display_order)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (slug) DO NOTHING`,
      [cid, c.name, slug(c.name), c.desc, img(c.name + " craft", i), i]
    );
    const { rows } = await pool.query(`SELECT id FROM categories WHERE slug = $1`, [slug(c.name)]);
    categoryIds[c.name] = rows[0].id;
  }

  console.log("Seeding artisans...");
  const artisanIds = [];
  for (const [i, a] of ARTISANS.entries()) {
    const aid = id("art_");
    await pool.query(
      `INSERT INTO artisans (id, name, slug, bio, story, avatar_url, cover_image_url, location, craft_specialty,
                              years_of_experience, verified, verification_status, rating_avg, rating_count, is_featured_maker)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,'APPROVED',$11,$12,$13)
       ON CONFLICT (slug) DO NOTHING`,
      [
        aid, a.name, slug(a.name), a.bio,
        `${a.bio} Working from ${a.location}, ${a.name.split(" ")[0]} has spent ${a.years} years perfecting this craft, training a new generation of artisans along the way.`,
        img("artisan portrait india", i + 100),
        img(a.specialty + " workshop", i + 200),
        a.location, a.specialty, a.years,
        Number((4.2 + Math.random() * 0.7).toFixed(1)),
        20 + Math.floor(Math.random() * 180),
        i < 6, // first six are "featured makers"
      ]
    );
    const { rows } = await pool.query(`SELECT id FROM artisans WHERE slug = $1`, [slug(a.name)]);
    artisanIds.push(rows[0].id);
  }

  console.log("Seeding products...");
  for (const [i, p] of PRODUCTS.entries()) {
    const pid = id("prod_");
    const images = [img(p.name, i), img(p.category + " closeup", i + 500), img(p.category + " detail", i + 900)];
    await pool.query(
      `INSERT INTO products (id, name, slug, short_description, story, craft_process, materials, images,
                              price, discount_price, currency, stock, location, rating_avg, rating_count,
                              is_featured, is_editors_pick, is_trending, category_id, artisan_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'INR',$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (slug) DO NOTHING`,
      [
        pid, p.name, slug(p.name), p.story.slice(0, 120) + "…", p.story,
        CRAFT_PROCESS, p.materials, images,
        p.price, p.discount || null,
        5 + Math.floor(Math.random() * 40),
        ARTISANS[p.artisan].location,
        Number((4.0 + Math.random() * 1.0).toFixed(1)),
        5 + Math.floor(Math.random() * 90),
        i % 4 === 0, // isFeatured
        i % 3 === 0, // isEditorsPick
        i % 5 === 0, // isTrending (seed flag; live trending is Redis-driven)
        categoryIds[p.category],
        artisanIds[p.artisan],
      ]
    );
  }

  console.log(`Done. ${CATEGORIES.length} categories, ${ARTISANS.length} artisans, ${PRODUCTS.length} products.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
