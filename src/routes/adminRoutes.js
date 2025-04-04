import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  assignRole,
  removeRole,
  getSystemStats,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { updateUserSchema } from "../validations/userValidation.js";

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(admin);

// System statistics
router.get("/stats", getSystemStats);

// User management
router.route("/users").get(getAllUsers);

router
  .route("/users/:id")
  .get(getUserById)
  .put(validate(updateUserSchema), updateUser)
  .delete(deleteUser);

// Role management
router.post("/users/:id/roles", assignRole);
router.delete("/users/:userId/roles/:roleId", removeRole);

export default router;
