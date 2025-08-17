import express from "express";
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignDepartmentHead,
  removeDepartmentHead,
  getAvailableHeads,
  getDepartmentStats,
} from "../controllers/departmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin, departmentManager } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  assignDeptHeadSchema,
} from "../validations/departmentValidation.js";

const router = express.Router();

// Department statistics endpoint
router.get("/stats", protect, admin, getDepartmentStats);

// Get all departments and create new departments
router
  .route("/")
  .get(protect, getAllDepartments)
  .post(protect, admin, validate(createDepartmentSchema), createDepartment);

// Manage individual departments
router
  .route("/:id")
  .get(protect, getDepartmentById)
  .put(protect, admin, validate(updateDepartmentSchema), updateDepartment)
  .delete(protect, admin, deleteDepartment);

// Department head management
router
  .route("/:id/head")
  .put(protect, admin, validate(assignDeptHeadSchema), assignDepartmentHead)
  .delete(protect, admin, removeDepartmentHead);

// Get available employees for department head assignment
router.get("/:id/available-heads", protect, admin, getAvailableHeads);

export default router;
