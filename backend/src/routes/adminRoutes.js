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
import {
  getAllLeaveRequests,
  updateLeaveStatus,
} from "../controllers/leaveController.js";

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

// Leave request management
router.get("/leave-requests/pending", async (req, res) => {
  req.query.status = "PENDING";
  return getAllLeaveRequests(req, res);
});

router.post("/leave-requests/:id/approve", async (req, res) => {
  req.body.status = "APPROVED";
  req.params.id = req.params.id;
  return updateLeaveStatus(req, res);
});

router.post("/leave-requests/:id/deny", async (req, res) => {
  req.body.status = "REJECTED";
  req.params.id = req.params.id;
  return updateLeaveStatus(req, res);
});

// Department statistics
router.get("/departments/stats", async (req, res) => {
  // This route is already called from the frontend but not implemented on the backend
  // Return a simple response for now
  const departments = [
    { department: "Engineering", employeeCount: 12 },
    { department: "Marketing", employeeCount: 6 },
    { department: "HR", employeeCount: 4 },
    { department: "Finance", employeeCount: 5 },
  ];

  res.json(departments);
});

export default router;
