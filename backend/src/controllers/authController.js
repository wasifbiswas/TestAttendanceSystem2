import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Role from "../models/Role.js";
import UserRole from "../models/UserRole.js";
import { generateToken } from "../config/jwt.js";
import AppError from "../utils/errorHandler.js";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  try {
    console.log(
      "Registration request received:",
      JSON.stringify(req.body, null, 2)
    );

    const {
      username,
      email,
      password,
      full_name,
      contact_number,
      department,
      gender,
    } = req.body;

    // Log request info for debugging
    console.log(`Attempting to register user: ${username}, email: ${email}`);

    if (department) {
      console.log(
        `User ${username} is registering with department: ${department}`
      );
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      console.log(`User already exists: ${username} or ${email}`);
      const message = "User already exists";
      res.status(400).json({
        status: "fail",
        message,
      });
      return; // Early return to prevent further execution
    }

    // Create new user - explicitly setting password_hash
    const userData = {
      username,
      email,
      password_hash: password, // Model middleware will hash this
      full_name,
      contact_number,
      department,
      gender,
      join_date: new Date(),
      is_active: true,
    };

    console.log(
      "Creating new user with data:",
      JSON.stringify(userData, null, 2)
    );

    const user = await User.create(userData);

    if (user) {
      console.log(`User created successfully: ${user._id}`);

      // Assign default EMPLOYEE role to new user
      const employeeRole = await Role.findOne({ role_name: "EMPLOYEE" });
      if (employeeRole) {
        await UserRole.create({
          user_id: user._id,
          role_id: employeeRole._id,
          assigned_date: new Date(),
        });
        console.log(`Assigned EMPLOYEE role to user: ${user.username}`);
      } else {
        console.log("Warning: EMPLOYEE role not found");
      }

      // If department is provided, create an employee profile and assign department
      if (department) {
        try {
          // Import required models
          const Department = (await import("../models/Department.js")).default;
          const Employee = (await import("../models/Employee.js")).default;

          // Find department by name
          const departmentObj = await Department.findOne({
            dept_name: department,
          });

          if (departmentObj) {
            console.log(
              `Found department: ${departmentObj.dept_name} with ID: ${departmentObj._id}`
            );

            // Generate employee code based on department name and user ID
            const deptCode = departmentObj.dept_name.slice(0, 3).toUpperCase();
            const userIdShort = user._id.toString().slice(-4);
            const employeeCode = `${deptCode}-${userIdShort}`;

            // Create employee profile
            const employee = await Employee.create({
              user_id: user._id,
              dept_id: departmentObj._id,
              employee_code: employeeCode,
              designation: "Staff", // Default designation
              join_date: new Date(),
            });

            console.log(
              `Created employee profile with code: ${employeeCode} for user: ${user.username}`
            );
          } else {
            console.log(`Department not found with name: ${department}`);
          }
        } catch (err) {
          console.error("Error creating employee profile:", err);
          // Don't fail the registration if employee profile creation fails
        }
      }

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        token: generateToken(user._id),
      });
    } else {
      console.log("User creation failed with no specific error");
      res.status(400);
      throw new AppError("Invalid user data", 400);
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: "Registration failed: " + (error.message || "Unknown error"),
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Find user by username
  const user = await User.findOne({ username });

  // Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    // Get user roles
    const userRoles = await UserRole.find({ user_id: user._id }).populate(
      "role_id"
    );
    const roles = userRoles
      .filter((userRole) => userRole.role_id && userRole.role_id.role_name)
      .map((userRole) => userRole.role_id.role_name);

    // Add default EMPLOYEE role if no roles found
    if (roles.length === 0) {
      roles.push("EMPLOYEE");
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      roles,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new AppError("Invalid username or password", 401);
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password_hash");

  if (user) {
    // Get user roles
    const userRoles = await UserRole.find({ user_id: user._id }).populate(
      "role_id"
    );
    const roles = userRoles
      .filter((userRole) => userRole.role_id && userRole.role_id.role_name)
      .map((userRole) => userRole.role_id.role_name);

    // Add default EMPLOYEE role if no roles found
    if (roles.length === 0) {
      roles.push("EMPLOYEE");
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      join_date: user.join_date,
      contact_number: user.contact_number,
      department: user.department,
      gender: user.gender,
      is_active: user.is_active,
      roles,
    });
  } else {
    res.status(404);
    throw new AppError("User not found", 404);
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.full_name = req.body.full_name || user.full_name;
    user.email = req.body.email || user.email;
    user.contact_number = req.body.contact_number || user.contact_number;
    user.gender = req.body.gender || user.gender;

    // Update password if provided
    if (req.body.password) {
      user.password_hash = req.body.password;
    }

    const updatedUser = await user.save();

    // Get user roles
    const userRoles = await UserRole.find({
      user_id: updatedUser._id,
    }).populate("role_id");

    const roles = userRoles
      .filter((userRole) => userRole.role_id && userRole.role_id.role_name)
      .map((userRole) => userRole.role_id.role_name);

    // Add default EMPLOYEE role if no roles found
    if (roles.length === 0) {
      roles.push("EMPLOYEE");
    }

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      full_name: updatedUser.full_name,
      join_date: updatedUser.join_date,
      contact_number: updatedUser.contact_number,
      gender: updatedUser.gender,
      is_active: updatedUser.is_active,
      roles,
    });
  } else {
    res.status(404);
    throw new AppError("User not found", 404);
  }
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;

  // Check if new password matches confirmation
  if (new_password !== confirm_password) {
    res.status(400);
    throw new AppError("New password and confirmation do not match", 400);
  }

  const user = await User.findById(req.user._id);

  if (user && (await user.matchPassword(current_password))) {
    user.password_hash = new_password;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } else {
    res.status(401);
    throw new AppError("Current password is incorrect", 401);
  }
});

// @desc    Debug roles for current user
// @route   GET /api/auth/debug/roles
// @access  Private
export const debugUserRoles = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password_hash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user roles from UserRole collection
    const userRoles = await UserRole.find({ user_id: user._id }).populate(
      "role_id"
    );

    // Format role data for debugging
    const roleDetails = userRoles.map((userRole) => {
      if (userRole.role_id) {
        return {
          role_id: userRole.role_id._id,
          role_name: userRole.role_id.role_name,
          assigned_date: userRole.assigned_date,
        };
      } else {
        return { error: "Invalid role reference", raw: userRole };
      }
    });

    // Get plain role names
    const roleNames = userRoles
      .filter((userRole) => userRole.role_id && userRole.role_id.role_name)
      .map((userRole) => userRole.role_id.role_name);

    // Add default role if no roles found
    if (roleNames.length === 0) {
      roleNames.push("EMPLOYEE");
    }

    // Check admin status
    const isAdmin = roleNames.includes("ADMIN");

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
      roleDetails,
      roleNames,
      isAdmin,
      debug: {
        rawUserRoles: userRoles,
      },
    });
  } catch (error) {
    console.error("Debug roles error:", error);
    res.status(500).json({
      message: "Error retrieving role information",
      error: error.message,
    });
  }
});
