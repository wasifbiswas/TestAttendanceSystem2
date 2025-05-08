import asyncHandler from "express-async-handler";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import UserRole from "../models/UserRole.js";
import Role from "../models/Role.js";
import AppError from "../utils/errorHandler.js";

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin
export const getEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.find({})
    .populate("user_id", "-password_hash")
    .populate("dept_id")
    .populate("reporting_manager_id");

  res.json(employees);
});

// @desc    Get employees by department
// @route   GET /api/employees/department/:departmentId
// @access  Private/Admin/Manager
export const getDepartmentEmployees = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;

  // Validate department exists
  const department = await Department.findById(departmentId);
  if (!department) {
    res.status(404);
    throw new AppError("Department not found", 404);
  }

  const employees = await Employee.find({ dept_id: departmentId })
    .populate("user_id", "-password_hash")
    .populate("dept_id")
    .populate("reporting_manager_id");

  res.json(employees);
});

// @desc    Get employees by manager
// @route   GET /api/employees/manager/:managerId
// @access  Private/Admin/Manager
export const getManagerEmployees = asyncHandler(async (req, res) => {
  const { managerId } = req.params;

  // Validate manager exists
  const manager = await Employee.findById(managerId);
  if (!manager) {
    res.status(404);
    throw new AppError("Manager not found", 404);
  }

  const employees = await Employee.find({ reporting_manager_id: managerId })
    .populate("user_id", "-password_hash")
    .populate("dept_id")
    .populate("reporting_manager_id");

  res.json(employees);
});

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private/Admin/Manager/Self
export const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate("user_id", "-password_hash")
    .populate("dept_id")
    .populate("reporting_manager_id");

  if (employee) {
    res.json(employee);
  } else {
    res.status(404);
    throw new AppError("Employee not found", 404);
  }
});

// @desc    Create employee profile
// @route   POST /api/employees
// @access  Private/Admin
export const createEmployee = asyncHandler(async (req, res) => {
  const {
    user_id,
    dept_id,
    designation,
    hire_date,
    employee_code,
    reporting_manager_id,
  } = req.body;

  // Check if employee already exists for the user
  const employeeExists = await Employee.findOne({ user_id });
  if (employeeExists) {
    res.status(400);
    throw new AppError("Employee profile already exists for this user", 400);
  }

  // Validate user exists
  const user = await User.findById(user_id);
  if (!user) {
    res.status(404);
    throw new AppError("User not found", 404);
  }

  // Validate department exists
  const department = await Department.findById(dept_id);
  if (!department) {
    res.status(404);
    throw new AppError("Department not found", 404);
  }

  // Validate reporting manager if provided
  if (reporting_manager_id) {
    const manager = await Employee.findById(reporting_manager_id);
    if (!manager) {
      res.status(404);
      throw new AppError("Reporting manager not found", 404);
    }
  }

  // Generate employee code if not provided
  let finalEmployeeCode = employee_code;
  if (!finalEmployeeCode) {
    // Find the last employee to get the last used employee code number
    const lastEmployee = await Employee.findOne().sort({ employee_code: -1 });

    if (
      lastEmployee &&
      lastEmployee.employee_code &&
      lastEmployee.employee_code.startsWith("EMP")
    ) {
      // Extract the number part and increment it
      const lastNumber =
        parseInt(lastEmployee.employee_code.replace("EMP", "")) || 0;
      finalEmployeeCode = `EMP${(lastNumber + 1).toString().padStart(4, "0")}`;
    } else {
      // Start with EMP0001 if no existing codes or format is different
      finalEmployeeCode = "EMP0001";
    }
  }

  // Create employee
  const employee = await Employee.create({
    user_id,
    dept_id,
    designation,
    hire_date: hire_date || new Date(),
    employee_code: finalEmployeeCode,
    reporting_manager_id,
  });

  if (employee) {
    // If employee role not already assigned, assign it
    const employeeRole = await Role.findOne({ role_name: "EMPLOYEE" });
    if (employeeRole) {
      const userRole = await UserRole.findOne({
        user_id,
        role_id: employeeRole._id,
      });

      if (!userRole) {
        await UserRole.create({
          user_id,
          role_id: employeeRole._id,
          assigned_date: new Date(),
        });
      }
    }

    res.status(201).json(employee);
  } else {
    res.status(400);
    throw new AppError("Invalid employee data", 400);
  }
});

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (employee) {
    // Update only the fields that are provided
    employee.dept_id = req.body.dept_id || employee.dept_id;
    employee.designation = req.body.designation || employee.designation;
    employee.reporting_manager_id =
      req.body.reporting_manager_id || employee.reporting_manager_id;

    const updatedEmployee = await employee.save();

    res.json(updatedEmployee);
  } else {
    res.status(404);
    throw new AppError("Employee not found", 404);
  }
});

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (employee) {
    await employee.deleteOne();
    res.json({ message: "Employee removed" });
  } else {
    res.status(404);
    throw new AppError("Employee not found", 404);
  }
});

// @desc    Assign manager to employee
// @route   PUT /api/employees/:id/manager
// @access  Private/Admin
export const assignManager = asyncHandler(async (req, res) => {
  const { manager_id } = req.body;
  const employeeId = req.params.id;

  // Check if employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    res.status(404);
    throw new AppError("Employee not found", 404);
  }

  // Check if manager exists
  const manager = await Employee.findById(manager_id);
  if (!manager) {
    res.status(404);
    throw new AppError("Manager not found", 404);
  }

  // Check if manager is trying to assign themselves
  if (employeeId === manager_id) {
    res.status(400);
    throw new AppError("An employee cannot be their own manager", 400);
  }

  // Update employee's manager
  employee.reporting_manager_id = manager_id;
  const updatedEmployee = await employee.save();

  res.json(updatedEmployee);
});
