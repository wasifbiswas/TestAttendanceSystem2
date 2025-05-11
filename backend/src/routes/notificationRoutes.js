import express from "express";
import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  getAllNotifications,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin, manager } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { createNotificationSchema } from "../validations/notificationValidation.js";

const router = express.Router();

// Protect all notification routes
router.use(protect);

// User notification routes
router.get("/", getUserNotifications);
router.put("/read-all", markAllNotificationsAsRead);
router.put("/:id/read", markNotificationAsRead);
router.delete("/:id", deleteNotification);

// Admin/Manager notification routes
router.post(
  "/",
  manager,
  validate(createNotificationSchema),
  createNotification
);

// Admin-only routes
router.get("/all", admin, getAllNotifications);

export default router;
