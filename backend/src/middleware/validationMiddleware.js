import { ZodError } from "zod";

// Middleware to validate request body against a Zod schema
export const validate = (schema) => (req, res, next) => {
  try {
    console.log("Validating request data:", JSON.stringify(req.body, null, 2));
    schema.parse(req.body);
    console.log("Validation successful");
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Validation error:", error.errors);
      return res.status(400).json({
        status: "fail",
        message: "Validation failed",
        errors: error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      });
    }
    console.error("Unexpected validation error:", error);
    res.status(500).json({
      status: "error",
      message: "An unexpected error occurred during validation",
    });
  }
};

// Middleware to validate request query parameters against a Zod schema
export const validateQuery = (schema) => (req, res, next) => {
  try {
    // Parse and validate the query parameters against the schema
    const validated = schema.parse(req.query);

    // Replace the query with the validated data
    req.query = validated;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: "error",
        message: "Query validation failed",
        errors: error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // If it's not a validation error, pass it to the error handler
    next(error);
  }
};

// Middleware to validate request params against a Zod schema
export const validateParams = (schema) => (req, res, next) => {
  try {
    // Parse and validate the params against the schema
    const validated = schema.parse(req.params);

    // Replace the params with the validated data
    req.params = validated;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: "error",
        message: "Parameter validation failed",
        errors: error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // If it's not a validation error, pass it to the error handler
    next(error);
  }
};

// Middleware to sanitize inputs
export const sanitizeInput = (req, res, next) => {
  // Remove any potentially harmful characters or scripts
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === "string") {
        // Basic XSS prevention
        obj[key] = obj[key].replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  // Sanitize request body, params, and query
  sanitize(req.body);
  sanitize(req.params);
  sanitize(req.query);

  next();
};

// Rate limiting middleware
export const rateLimiter = (req, res, next) => {
  // Simple in-memory rate limiting
  const requestCounts = new Map();
  const MAX_REQUESTS = 100; // Max requests per hour
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour

  const ip = req.ip;
  const now = Date.now();
  const requestsForIp = requestCounts.get(ip) || [];

  // Remove old requests
  const recentRequests = requestsForIp.filter(
    (timestamp) => now - timestamp < WINDOW_MS
  );

  if (recentRequests.length >= MAX_REQUESTS) {
    return res.status(429).json({
      message: "Too many requests, please try again later",
    });
  }

  // Add current request timestamp
  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);

  next();
};

const validationMiddleware = {
  validate,
  validateQuery,
  validateParams,
  sanitizeInput,
  rateLimiter,
};

export default validationMiddleware;
