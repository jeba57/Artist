import { cacheGetJson, cacheSetJson, redis } from "../../config/redis.js";
import { ApiError } from "../../utils/ApiError.js";
import * as cartRepo from "./cart.repository.js";
import * as productsRepo from "../products/products.repository.js";

const CART_TTL = 60 * 5;
const cartKey = (userId) => `cart:${userId}`;

const toCartDTO = (rows) => {
  const items = rows.map((r) => {
    const unitPrice = Number(r.discount_price ?? r.price);
    return {
      cartItemId: r.id,
      productId: r.product_id,
      name: r.name,
      slug: r.slug,
      image: r.images?.[0] || null,
      artisanName: r.artisan_name,
      unitPrice,
      currency: r.currency,
      quantity: r.quantity,
      lineTotal: Number((unitPrice * r.quantity).toFixed(2)),
      inStock: r.stock >= r.quantity,
    };
  });
  const subtotal = Number(items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2));
  return { items, itemCount: items.reduce((n, i) => n + i.quantity, 0), subtotal };
};

export const getCart = async (userId) => {
  const cached = await cacheGetJson(cartKey(userId));
  if (cached) return cached;

  const rows = await cartRepo.getCartItems(userId);
  const dto = toCartDTO(rows);
  await cacheSetJson(cartKey(userId), dto, CART_TTL);
  return dto;
};

const invalidateCart = (userId) => redis.del(cartKey(userId));

export const addToCart = async (userId, productId, quantity = 1) => {
  const product = await productsRepo.findProductById(productId);
  if (!product) throw ApiError.notFound("Product not found.");
  if (product.stock < quantity) throw ApiError.badRequest("Not enough stock available.");

  await cartRepo.upsertCartItem(userId, productId, quantity);
  await invalidateCart(userId);
  return getCart(userId);
};

export const updateCartItemQuantity = async (userId, productId, quantity) => {
  if (quantity <= 0) {
    await cartRepo.removeCartItem(userId, productId);
  } else {
    const updated = await cartRepo.setCartItemQuantity(userId, productId, quantity);
    if (!updated) throw ApiError.notFound("Item not in cart.");
  }
  await invalidateCart(userId);
  return getCart(userId);
};

export const removeFromCart = async (userId, productId) => {
  await cartRepo.removeCartItem(userId, productId);
  await invalidateCart(userId);
  return getCart(userId);
};

export const clearCart = async (userId) => {
  await cartRepo.clearCart(userId);
  await invalidateCart(userId);
  return getCart(userId);
};
