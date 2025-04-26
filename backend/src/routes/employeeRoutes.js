import express from "express";
import {
  getEmployees,
  getDepartmentEmployees,
  getManagerEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  assignManager,
} from "../controllers/employeeController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin, manager, selfOrManager } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  assignManagerSchema,
} from "../validations/employeeValidation.js";

const router = express.Router();

// Admin routes
router
  .route("/")
  .get(protect, admin, getEmployees)
  .post(protect, admin, validate(createEmployeeSchema), createEmployee);

// Department employees
router.get(
  "/department/:departmentId",
  protect,
  manager,
  getDepartmentEmployees
);

// Manager's employees
router.get("/manager/:managerId", protect, manager, getManagerEmployees);

// Individual employee routes
router
  .route("/:id")
  .get(protect, selfOrManager, getEmployeeById)
  .put(protect, admin, validate(updateEmployeeSchema), updateEmployee)
  .delete(protect, admin, deleteEmployee);

// Assign manager
router.put(
  "/:id/manager",
  protect,
  admin,
  validate(assignManagerSchema),
  assignManager
);

export default router;
