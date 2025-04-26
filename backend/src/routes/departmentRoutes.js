import express from "express";
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignDepartmentHead,
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

// Assign department head
router.put(
  "/:id/head",
  protect,
  admin,
  validate(assignDeptHeadSchema),
  assignDepartmentHead
);

export default router;
