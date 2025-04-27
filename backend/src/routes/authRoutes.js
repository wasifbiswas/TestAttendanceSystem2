import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  debugUserRoles,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  updateUserSchema,
} from "../validations/authValidation.js";

const router = express.Router();

// Public routes
router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);

// Protected routes
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, validate(updateUserSchema), updateUserProfile);
router.put(
  "/password",
  protect,
  validate(changePasswordSchema),
  changePassword
);

// Debug route
router.get("/debug/roles", protect, debugUserRoles);

export default router;
