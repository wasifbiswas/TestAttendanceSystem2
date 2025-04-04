import asyncHandler from "express-async-handler";
import UserRole from "../models/UserRole.js";
import Role from "../models/Role.js";
import Employee from "../models/Employee.js";
import { getUserRoles } from "./authMiddleware.js";

// Admin role middleware
export const admin = asyncHandler(async (req, res, next) => {
  const roles = await getUserRoles(req.user._id);

  if (roles.includes("ADMIN")) {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as an admin");
  }
});

// Manager role middleware
export const manager = asyncHandler(async (req, res, next) => {
  const roles = await getUserRoles(req.user._id);

  if (roles.includes("ADMIN") || roles.includes("MANAGER")) {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as a manager");
  }
});

// Check if user is a manager of the specified department
export const departmentManager = asyncHandler(async (req, res, next) => {
  const roles = await getUserRoles(req.user._id);

  // Admin can access all departments
  if (roles.includes("ADMIN")) {
    next();
    return;
  }

  const { departmentId } = req.params;

  // Check if the user is a manager and is the department head
  if (roles.includes("MANAGER")) {
    const employee = await Employee.findOne({ user_id: req.user._id });

    if (!employee) {
      res.status(403);
      throw new Error("Employee profile not found");
    }

    // Check if this manager is the head of the requested department
    const isDepartmentHead = await Employee.findOne({
      user_id: req.user._id,
      dept_id: departmentId,
    });

    if (isDepartmentHead) {
      next();
    } else {
      res.status(403);
      throw new Error("Not authorized to access this department");
    }
  } else {
    res.status(403);
    throw new Error("Not authorized as a manager");
  }
});

// Check if user is the manager of the specific employee
export const employeeManager = asyncHandler(async (req, res, next) => {
  const roles = await getUserRoles(req.user._id);

  // Admin can access all employees
  if (roles.includes("ADMIN")) {
    next();
    return;
  }

  const { employeeId } = req.params;

  // Check if the user is a manager
  if (roles.includes("MANAGER")) {
    const manager = await Employee.findOne({ user_id: req.user._id });

    if (!manager) {
      res.status(403);
      throw new Error("Manager profile not found");
    }

    // Check if employee reports to this manager
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }

    if (
      employee.reporting_manager_id.toString() === manager._id.toString() ||
      employee.dept_id.toString() === manager.dept_id.toString()
    ) {
      next();
    } else {
      res.status(403);
      throw new Error("Not authorized to access this employee");
    }
  } else {
    res.status(403);
    throw new Error("Not authorized as a manager");
  }
});

// Check if user is the employee or their manager
export const selfOrManager = asyncHandler(async (req, res, next) => {
  const roles = await getUserRoles(req.user._id);
  const { employeeId } = req.params;

  // Admin can access all employees
  if (roles.includes("ADMIN")) {
    next();
    return;
  }

  // Get user's employee profile
  const userEmployee = await Employee.findOne({ user_id: req.user._id });

  if (!userEmployee) {
    res.status(404);
    throw new Error("Employee profile not found");
  }

  // If accessing own record
  if (userEmployee._id.toString() === employeeId) {
    next();
    return;
  }

  // If user is a manager, check if employee reports to them
  if (roles.includes("MANAGER")) {
    // Check if employee reports to this manager
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }

    if (
      employee.reporting_manager_id.toString() ===
        userEmployee._id.toString() ||
      employee.dept_id.toString() === userEmployee.dept_id.toString()
    ) {
      next();
    } else {
      res.status(403);
      throw new Error("Not authorized to access this employee");
    }
  } else {
    res.status(403);
    throw new Error("Not authorized to access this resource");
  }
});
