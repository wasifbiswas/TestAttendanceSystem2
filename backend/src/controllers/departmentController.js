import asyncHandler from "express-async-handler";
import Department from "../models/Department.js";
import Employee from "../models/Employee.js";
import AppError from "../utils/errorHandler.js";

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private/Admin
export const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({}).populate(
    "dept_head_id",
    "-password_hash"
  );
  res.json(departments);
});

// @desc    Get department by ID
// @route   GET /api/departments/:id
// @access  Private/Admin/Manager
export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate(
    "dept_head_id",
    "-password_hash"
  );

  if (department) {
    res.json(department);
  } else {
    res.status(404);
    throw new AppError("Department not found", 404);
  }
});

// @desc    Create department
// @route   POST /api/departments
// @access  Private/Admin
export const createDepartment = asyncHandler(async (req, res) => {
  const { dept_name, description, dept_head_id } = req.body;

  // Check if department already exists
  const departmentExists = await Department.findOne({ dept_name });
  if (departmentExists) {
    res.status(400);
    throw new AppError("Department with this name already exists", 400);
  }

  // If department head is provided, validate it exists
  if (dept_head_id) {
    const employee = await Employee.findById(dept_head_id);
    if (!employee) {
      res.status(404);
      throw new AppError("Department head employee not found", 404);
    }
  }

  // Create department
  const department = await Department.create({
    dept_name,
    description,
    dept_head_id,
  });

  res.status(201).json(department);
});

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/Admin
export const updateDepartment = asyncHandler(async (req, res) => {
  const { dept_name, description, dept_head_id } = req.body;

  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new AppError("Department not found", 404);
  }

  // Check if new department name already exists
  if (dept_name && dept_name !== department.dept_name) {
    const existingDept = await Department.findOne({ dept_name });
    if (existingDept) {
      res.status(400);
      throw new AppError("Department with this name already exists", 400);
    }
  }

  // If department head is provided, validate it exists
  if (dept_head_id && dept_head_id !== department.dept_head_id) {
    const employee = await Employee.findById(dept_head_id);
    if (!employee) {
      res.status(404);
      throw new AppError("Department head employee not found", 404);
    }
  }

  // Update department
  department.dept_name = dept_name || department.dept_name;
  department.description =
    description !== undefined ? description : department.description;
  department.dept_head_id = dept_head_id || department.dept_head_id;

  const updatedDepartment = await department.save();

  res.json(updatedDepartment);
});

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new AppError("Department not found", 404);
  }

  // Check if any employees are assigned to this department
  const employeesInDept = await Employee.countDocuments({
    dept_id: department._id,
  });
  if (employeesInDept > 0) {
    res.status(400);
    throw new AppError("Cannot delete department with assigned employees", 400);
  }

  await department.deleteOne();

  res.json({ message: "Department removed" });
});

// @desc    Assign department head
// @route   PUT /api/departments/:id/head
// @access  Private/Admin
export const assignDepartmentHead = asyncHandler(async (req, res) => {
  const { dept_head_id } = req.body;

  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new AppError("Department not found", 404);
  }

  // Validate employee exists
  const employee = await Employee.findById(dept_head_id);
  if (!employee) {
    res.status(404);
    throw new AppError("Employee not found", 404);
  }

  // Check if employee belongs to the department
  if (employee.dept_id.toString() !== department._id.toString()) {
    res.status(400);
    throw new AppError(
      "Employee must belong to the department to be assigned as head",
      400
    );
  }

  // Update department head
  department.dept_head_id = dept_head_id;
  const updatedDepartment = await department.save();

  res.json(updatedDepartment);
});
