import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  assignRole,
  removeRole,
  getSystemStats,
  getUserRoleCounts,
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
router.get("/users/role-counts", getUserRoleCounts);

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
  try {
    req.query.status = "PENDING";
    // Store the original response handling
    const originalRes = res;

    // Create a custom response object to intercept the response
    const customRes = {
      ...res,
      json: (data) => {
        // If the data is not in the expected format, transform it
        if (Array.isArray(data)) {
          // Map the data to match the expected format in the frontend
          const formattedData = data.map((leave) => ({
            id: leave._id.toString(),
            userId: leave.emp_id.user_id._id.toString(),
            userName: leave.emp_id.user_id.full_name,
            employee_id: leave.emp_id._id.toString(),
            employee_code:
              leave.emp_id.employee_code ||
              "EMP-" + leave.emp_id._id.toString().substring(0, 5),
            type: leave.leave_type_id.leave_name,
            start_date: leave.start_date,
            end_date: leave.end_date,
            reason: leave.reason,
            status: leave.status,
            createdAt: leave.applied_date,
            updatedAt: leave.last_modified,
          }));

          // Send the formatted data
          return originalRes.json(formattedData);
        }

        // If it's not an array, just pass it through
        return originalRes.json(data);
      },
    };

    // Call the controller with our custom response
    return await getAllLeaveRequests(req, customRes);
  } catch (error) {
    console.error("Error fetching pending leave requests:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch pending leave requests" });
  }
});

router.post("/leave-requests/:id/approve", async (req, res) => {
  try {
    req.body.status = "APPROVED";
    req.params.id = req.params.id;

    const result = await updateLeaveStatus(req, res);
    return result;
  } catch (error) {
    console.error("Error approving leave request:", error);
    return res.status(500).json({ message: "Failed to approve leave request" });
  }
});

router.post("/leave-requests/:id/deny", async (req, res) => {
  try {
    req.body.status = "REJECTED";
    req.params.id = req.params.id;

    const result = await updateLeaveStatus(req, res);
    return result;
  } catch (error) {
    console.error("Error denying leave request:", error);
    return res.status(500).json({ message: "Failed to deny leave request" });
  }
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
