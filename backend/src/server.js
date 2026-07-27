import "dotenv/config";
import app from "./app.js";
import { pool } from "./config/db.js";
import { redis } from "./config/redis.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("[postgres] connection verified");
  } catch (err) {
    console.error("[postgres] failed to connect —", err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`[artist-backend] listening on http://localhost:${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[server] received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await pool.end();
      redis.disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start();
