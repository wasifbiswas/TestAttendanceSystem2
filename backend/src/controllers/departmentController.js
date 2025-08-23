import asyncHandler from "express-async-handler";
import Department from "../models/Department.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import AppError from "../utils/errorHandler.js";

// @desc    Get all departments with detailed info
// @route   GET /api/departments
// @access  Private/Admin
export const getAllDepartments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const skip = (page - 1) * limit;

  // Build query
  let query = {};
  if (status) {
    query.status = status.toUpperCase();
  }
  if (search) {
    query.$or = [
      { dept_name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  // Get departments with employee count and head info
  const departments = await Department.find(query)
    .populate({
      path: "dept_head_id",
      populate: {
        path: "user_id",
        select: "full_name email",
      },
    })
    .sort({ dept_name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination
  const total = await Department.countDocuments(query);

  // Update employee counts for each department
  const departmentsWithCounts = await Promise.all(
    departments.map(async (dept) => {
      const employeeCount = await Employee.countDocuments({
        dept_id: dept._id,
      });
      return {
        ...dept.toObject(),
        employee_count: employeeCount,
      };
    })
  );

  res.json({
    success: true,
    departments: departmentsWithCounts,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalDepartments: total,
      hasNextPage: parseInt(page) < Math.ceil(total / limit),
      hasPrevPage: parseInt(page) > 1,
    },
  });
});

// @desc    Get department by ID with employees
// @route   GET /api/departments/:id
// @access  Private/Admin/Manager
export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate({
    path: "dept_head_id",
    populate: {
      path: "user_id",
      select: "full_name email contact_number",
    },
  });

  if (!department) {
    res.status(404);
    throw new AppError("Department not found", 404);
  }

  // Get employees in this department
  const employees = await Employee.find({ dept_id: department._id })
    .populate("user_id", "full_name email contact_number")
    .sort({ employee_code: 1 });

  // Update employee count
  department.employee_count = employees.length;
  await department.save();

  res.json({
    department: department.toObject(),
    employees,
  });
});

// @desc    Create department
// @route   POST /api/departments
// @access  Private/Admin
export const createDepartment = asyncHandler(async (req, res) => {
  const { dept_name, description, dept_head_id, location, budget, status } =
    req.body;

  // Check if department already exists
  const departmentExists = await Department.findOne({
    dept_name: { $regex: new RegExp(`^${dept_name}$`, "i") },
  });
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
    location,
    budget,
    status: status ? status.toUpperCase() : "ACTIVE",
  });

  // Populate the created department
  const populatedDepartment = await Department.findById(
    department._id
  ).populate({
    path: "dept_head_id",
    populate: {
      path: "user_id",
      select: "full_name email",
    },
  });

  res.status(201).json({
    success: true,
    message: "Department created successfully",
    department: populatedDepartment,
  });
});

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/Admin
export const updateDepartment = asyncHandler(async (req, res) => {
  const { dept_name, description, dept_head_id, location, budget, status } =
    req.body;

  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new AppError("Department not found", 404);
  }

  // Check if new department name already exists
  if (
    dept_name &&
    dept_name.toLowerCase() !== department.dept_name.toLowerCase()
  ) {
    const existingDept = await Department.findOne({
      dept_name: { $regex: new RegExp(`^${dept_name}$`, "i") },
    });
    if (existingDept) {
      res.status(400);
      throw new AppError("Department with this name already exists", 400);
    }
  }

  // If department head is provided, validate it exists
  if (dept_head_id && dept_head_id !== department.dept_head_id?.toString()) {
    const employee = await Employee.findById(dept_head_id);
    if (!employee) {
      res.status(404);
      throw new AppError("Department head employee not found", 404);
    }
  }

  // Update department fields
  if (dept_name) department.dept_name = dept_name;
  if (description !== undefined) department.description = description;
  if (dept_head_id !== undefined)
    department.dept_head_id = dept_head_id || null;
  if (location !== undefined) department.location = location;
  if (budget !== undefined) department.budget = budget;
  if (status) department.status = status.toUpperCase();

  const updatedDepartment = await department.save();

  // Populate the updated department
  const populatedDepartment = await Department.findById(
    updatedDepartment._id
  ).populate({
    path: "dept_head_id",
    populate: {
      path: "user_id",
      select: "full_name email",
    },
  });

  res.json({
    success: true,
    message: "Department updated successfully",
    department: populatedDepartment,
  });
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
    throw new AppError(
      `Cannot delete department. ${employeesInDept} employees are assigned to this department. Please reassign them first.`,
      400
    );
  }

  await department.deleteOne();

  res.json({
    success: true,
    message: "Department deleted successfully",
  });
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
  const employee = await Employee.findById(dept_head_id).populate(
    "user_id",
    "full_name email"
  );
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

  // Populate the updated department
  const populatedDepartment = await Department.findById(
    updatedDepartment._id
  ).populate({
    path: "dept_head_id",
    populate: {
      path: "user_id",
      select: "full_name email",
    },
  });

  res.json({
    success: true,
    message: "Department head assigned successfully",
    department: populatedDepartment,
  });
});

// @desc    Remove department head
// @route   DELETE /api/departments/:id/head
// @access  Private/Admin
export const removeDepartmentHead = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new AppError("Department not found", 404);
  }

  // Remove department head
  department.dept_head_id = null;
  const updatedDepartment = await department.save();

  res.json({
    success: true,
    message: "Department head removed successfully",
    department: updatedDepartment,
  });
});

// @desc    Get available employees for department head assignment
// @route   GET /api/departments/:id/available-heads
// @access  Private/Admin
export const getAvailableHeads = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new AppError("Department not found", 404);
  }

  // Get employees in this department who can be department heads
  const availableEmployees = await Employee.find({
    dept_id: department._id,
  })
    .populate("user_id", "full_name email contact_number")
    .sort({ employee_code: 1 });

  res.json({
    success: true,
    employees: availableEmployees,
  });
});

// @desc    Get department statistics
// @route   GET /api/departments/stats
// @access  Private/Admin
export const getDepartmentStats = asyncHandler(async (req, res) => {
  // Get total departments
  const totalDepartments = await Department.countDocuments();

  // Get active departments
  const activeDepartments = await Department.countDocuments({
    status: "ACTIVE",
  });

  // Get inactive departments
  const inactiveDepartments = await Department.countDocuments({
    status: "INACTIVE",
  });

  // Get departments with heads
  const departmentsWithHeads = await Department.countDocuments({
    dept_head_id: { $exists: true, $ne: null },
  });

  // Get department employee distribution
  const departmentDistribution = await Department.aggregate([
    {
      $lookup: {
        from: "employees",
        localField: "_id",
        foreignField: "dept_id",
        as: "employees",
      },
    },
    {
      $project: {
        dept_name: 1,
        status: 1,
        employee_count: { $size: "$employees" },
      },
    },
    {
      $sort: { employee_count: -1 },
    },
  ]);

  res.json({
    success: true,
    stats: {
      totalDepartments,
      activeDepartments,
      inactiveDepartments,
      departmentsWithHeads,
      departmentDistribution,
    },
  });
});

// @desc    Get public departments for registration (no auth required)
// @route   GET /api/public-departments
// @access  Public
export const getPublicDepartments = asyncHandler(async (req, res) => {
  try {
    console.log("[DEBUG] getPublicDepartments endpoint hit - starting query");

    // Get active departments and departments without status field
    const departments = await Department.find({
      $or: [{ status: "ACTIVE" }, { status: { $exists: false } }],
    })
      .select("_id dept_name description")
      .sort({ dept_name: 1 });

    console.log(
      `[DEBUG] Query completed. Found ${departments.length} departments`
    );

    res.json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error("[DEBUG] Error in getPublicDepartments:", error);
    throw error;
  }
});
