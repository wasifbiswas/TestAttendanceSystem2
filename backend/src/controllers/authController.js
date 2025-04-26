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
  const { username, email, password, full_name, contact_number, department } =
    req.body;

  // Log department for future use but don't save it yet as it's not in the schema
  if (department) {
    console.log(
      `User ${username} is registering with department: ${department}`
    );
  }

  // Check if user already exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    const message = "User already exists";
    res.status(400).json({
      status: "fail",
      message,
    });
    return; // Early return to prevent further execution
  }

  // Create new user
  const user = await User.create({
    username,
    email,
    password_hash: password,
    full_name,
    contact_number,
    department,
    join_date: new Date(),
    is_active: true,
  });

  if (user) {
    // Assign default EMPLOYEE role to new user
    const employeeRole = await Role.findOne({ role_name: "EMPLOYEE" });
    if (employeeRole) {
      await UserRole.create({
        user_id: user._id,
        role_id: employeeRole._id,
        assigned_date: new Date(),
      });
    }

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new AppError("Invalid user data", 400);
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
