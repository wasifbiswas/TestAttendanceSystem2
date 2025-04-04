import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import UserRole from "../models/UserRole.js";
import { verifyToken } from "../config/jwt.js";

// Protect routes - Authentication middleware
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = verifyToken(token);

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password_hash");

      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }

      if (!req.user.is_active) {
        res.status(401);
        throw new Error("User account is deactivated");
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

// Get user roles - Role middleware helper
export const getUserRoles = asyncHandler(async (userId) => {
  const userRoles = await UserRole.find({ user_id: userId }).populate(
    "role_id"
  );

  // Filter out null roles and map to role names
  const roles = userRoles
    .filter((userRole) => userRole.role_id && userRole.role_id.role_name)
    .map((userRole) => userRole.role_id.role_name);

  // Add default role if empty
  if (roles.length === 0) {
    roles.push("EMPLOYEE");
  }

  return roles;
});

// Check active status
export const isActive = asyncHandler(async (req, res, next) => {
  if (!req.user.is_active) {
    res.status(403);
    throw new Error("Account is deactivated");
  }
  next();
});

const authMiddleware = {
  // Verify JWT token
  verifyToken: async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      // Verify token using JWT secret from environment
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user and populate related data
      const user = await User.findById(decoded.userId).select("-password_hash");

      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Attach user to request object
      req.user = user;

      // Find associated employee
      const employee = await Employee.findOne({ user_id: user._id }).populate(
        "dept_id"
      );

      // Find user roles
      const userRoles = await UserRole.find({ user_id: user._id }).populate(
        "role_id"
      );

      // Attach employee and roles to request
      req.employee = employee;

      // Filter out null roles and map to role names
      req.userRoles = userRoles
        .filter((ur) => ur.role_id && ur.role_id.role_name)
        .map((ur) => ur.role_id.role_name);

      // Add default role if empty
      if (req.userRoles.length === 0) {
        req.userRoles.push("EMPLOYEE");
      }

      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(401).json({
        message: "Authentication failed",
        error: error.message,
      });
    }
  },

  // Generate JWT token
  generateToken: (user) => {
    return jwt.sign(
      {
        userId: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
  },

  // Refresh token
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Find user
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      // Generate new access token
      const newAccessToken = authMiddleware.generateToken(user);

      res.json({
        accessToken: newAccessToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(401).json({ message: "Token refresh failed" });
    }
  },
};

export default authMiddleware;
