// Custom Error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not Found Error - 404
export const notFound = (req, res, next) => {
  console.log(
    `[NOT FOUND] ${req.method} ${req.originalUrl} - Headers: ${JSON.stringify(
      req.headers
    )}`
  );
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error for debugging
  console.error("Error: ", err);

  // Set default status code
  const statusCode = error.statusCode || err.statusCode || 500;

  // Mongoose bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    error = new AppError("Resource not found", 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(
      `Duplicate field value: ${field}. Please use another value`,
      400
    );
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => val.message);
    error = new AppError(`Validation failed: ${errors.join(", ")}`, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please log in again", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Token expired. Please log in again", 401);
  }

  // Format and send the error response
  res.status(statusCode).json({
    status: error.status || "error",
    message: error.message || "Something went wrong",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default AppError;
