import { ApiError } from "../utils/ApiError.js";

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let { statusCode, message, details } = err;

  // Postgres-specific error shaping so clients get useful messages
  // instead of raw driver errors.
  if (err.code === "23505") {
    statusCode = 409;
    message = "A record with these details already exists.";
  } else if (err.code === "23503") {
    statusCode = 400;
    message = "Referenced record does not exist.";
  }

  if (!(err instanceof ApiError) && !statusCode) {
    statusCode = 500;
    message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode || 500).json({
    success: false,
    statusCode: statusCode || 500,
    message: message || "Internal server error",
    ...(details ? { details } : {}),
    ...(process.env.NODE_ENV !== "production" && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};
