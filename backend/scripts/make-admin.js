import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const email = process.argv[2];

if (!email) {
  console.error("Usage: npm run make-admin -- your-email@example.com");
  process.exit(1);
}

const main = async () => {
  const { rows } = await pool.query(`UPDATE users SET role = 'ADMIN' WHERE email = $1 RETURNING id, name, email, role`, [
    email,
  ]);

  if (!rows[0]) {
    console.error(`No user found with email "${email}". Register that account on the site first, then run this again.`);
    process.exit(1);
  }

  console.log(`✅ ${rows[0].name} <${rows[0].email}> is now an ADMIN.`);
  console.log("Log out and log back in on the site for the change to take effect.");
  await pool.end();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
