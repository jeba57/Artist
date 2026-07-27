import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import "dotenv/config";

import authRoutes from "./features/auth/auth.routes.js";
import productsRoutes from "./features/products/products.routes.js";
import categoriesRoutes from "./features/categories/categories.routes.js";
import cartRoutes from "./features/cart/cart.routes.js";
import wishlistRoutes from "./features/wishlist/wishlist.routes.js";
import reviewsRoutes from "./features/reviews/reviews.routes.js";
import makersRoutes from "./features/makers/makers.routes.js";
import ordersRoutes from "./features/orders/orders.routes.js";
import adminRoutes from "./features/admin/admin.routes.js";

import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "artist-backend", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/makers", makersRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
