import asyncHandler from "express-async-handler";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import mongoose from "mongoose";
import { getUserRoles } from "../middleware/authMiddleware.js";

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private (Admin, Manager)
export const createNotification = asyncHandler(async (req, res) => {
  const {
    title,
    message,
    recipients,
    department_id,
    all_employees,
    priority,
    expires_at,
  } = req.body;

  const sender_id = req.user._id;

  // Validate permissions based on user role
  const roles = await getUserRoles(sender_id);

  // If it's a department-specific notification and user is a manager,
  // check if they're managing that department
  if (department_id && !roles.includes("ADMIN")) {
    // Find the employee profile for the manager
    const manager = await Employee.findOne({ user_id: sender_id });

    if (!manager) {
      res.status(403);
      throw new Error("Manager profile not found");
    }

    // Check if the manager belongs to that department
    if (manager.dept_id.toString() !== department_id.toString()) {
      res.status(403);
      throw new Error(
        "You are not authorized to send notifications to this department"
      );
    }
  }

  // Prepare notification data
  const notificationData = {
    title,
    message,
    sender_id,
    department_id: department_id || null,
    all_employees: all_employees || false,
    priority: priority || "medium",
    recipients: [],
  };

  if (expires_at) {
    notificationData.expires_at = new Date(expires_at);
  }

  // Find recipients and prepare recipient array
  let recipientsList = [];

  // Individual recipients
  if (recipients && recipients.length > 0) {
    recipientsList = recipients.map((userId) => ({
      user_id: userId,
      read: false,
      read_at: null,
    }));
  }
  // Department recipients
  else if (department_id) {
    // Find all employees in the department
    const employees = await Employee.find({ dept_id: department_id });
    const userIds = employees.map((emp) => emp.user_id);

    // Get all active users who are also employees in the department
    const users = await User.find({
      _id: { $in: userIds },
      is_active: true,
    });

    recipientsList = users.map((user) => ({
      user_id: user._id,
      read: false,
      read_at: null,
    }));
  }
  // All employees (admin only)
  else if (all_employees) {
    if (!roles.includes("ADMIN")) {
      res.status(403);
      throw new Error(
        "Only administrators can send notifications to all employees"
      );
    }

    // Find all active users who are employees
    const employees = await Employee.find({}).select("user_id");
    const userIds = employees.map((emp) => emp.user_id);

    const users = await User.find({
      _id: { $in: userIds },
      is_active: true,
    });

    recipientsList = users.map((user) => ({
      user_id: user._id,
      read: false,
      read_at: null,
    }));
  }

  // Ensure we have recipients
  if (recipientsList.length === 0) {
    res.status(400);
    throw new Error("No recipients specified for the notification");
  }

  notificationData.recipients = recipientsList;

  // Create the notification
  const notification = await Notification.create(notificationData);

  res.status(201).json({
    success: true,
    data: notification,
  });
});

// @desc    Get all notifications for the current user
// @route   GET /api/notifications
// @access  Private
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Pagination parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Get notification count
  const totalNotifications = await Notification.countDocuments({
    "recipients.user_id": userId,
    expires_at: { $gt: new Date() }, // Not expired
  });

  // Get unread notification count
  const unreadCount = await Notification.countDocuments({
    "recipients.user_id": userId,
    "recipients.read": false,
    expires_at: { $gt: new Date() }, // Not expired
  });

  // Find notifications for the user that are not expired
  const notifications = await Notification.find({
    "recipients.user_id": userId,
    expires_at: { $gt: new Date() }, // Not expired
  })
    .populate("sender_id", "username full_name")
    .populate("department_id", "name")
    .sort({ created_at: -1 }) // Most recent first
    .skip(skip)
    .limit(limit);

  // Format the notifications for better readability
  const formattedNotifications = notifications.map((notification) => {
    // Find the recipient entry for current user to get read status
    const recipientData = notification.recipients.find(
      (recipient) => recipient.user_id.toString() === userId.toString()
    );

    return {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      sender: notification.sender_id,
      department: notification.department_id,
      created_at: notification.created_at,
      expires_at: notification.expires_at,
      priority: notification.priority,
      read: recipientData ? recipientData.read : false,
      read_at: recipientData ? recipientData.read_at : null,
    };
  });

  res.json({
    success: true,
    count: formattedNotifications.length,
    total: totalNotifications,
    unread: unreadCount,
    page,
    pages: Math.ceil(totalNotifications / limit),
    data: formattedNotifications,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user._id;

  // Ensure valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    res.status(400);
    throw new Error("Invalid notification ID");
  }

  // Find the notification
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  // Check if the user is a recipient of this notification
  const recipientIndex = notification.recipients.findIndex(
    (recipient) => recipient.user_id.toString() === userId.toString()
  );

  if (recipientIndex === -1) {
    res.status(403);
    throw new Error("You are not authorized to mark this notification as read");
  }

  // Update the read status for this recipient
  notification.recipients[recipientIndex].read = true;
  notification.recipients[recipientIndex].read_at = new Date();

  await notification.save();

  res.json({
    success: true,
    message: "Notification marked as read",
  });
});

// @desc    Delete a notification (admin only) or remove for current user
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user._id;

  // Ensure valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    res.status(400);
    throw new Error("Invalid notification ID");
  }

  // Find the notification
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  // Check user roles
  const roles = await getUserRoles(userId);

  // If admin, completely delete the notification
  if (roles.includes("ADMIN")) {
    await Notification.deleteOne({ _id: notificationId });

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  }
  // For non-admin users, just remove them from recipients
  else {
    // Check if the user is a recipient of this notification
    const recipientIndex = notification.recipients.findIndex(
      (recipient) => recipient.user_id.toString() === userId.toString()
    );

    if (recipientIndex === -1) {
      res.status(403);
      throw new Error("You are not authorized to delete this notification");
    }

    // Remove the user from recipients
    notification.recipients.splice(recipientIndex, 1);

    // If no recipients left, delete the notification
    if (notification.recipients.length === 0) {
      await Notification.deleteOne({ _id: notificationId });
    } else {
      await notification.save();
    }

    res.json({
      success: true,
      message: "Notification removed for your account",
    });
  }
});

// @desc    Get all notifications (admin only)
// @route   GET /api/notifications/all
// @access  Private (Admin)
export const getAllNotifications = asyncHandler(async (req, res) => {
  // Pagination parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Get notification count
  const totalCount = await Notification.countDocuments({});

  // Find all notifications
  const notifications = await Notification.find({})
    .populate("sender_id", "username full_name")
    .populate("department_id", "name")
    .sort({ created_at: -1 }) // Most recent first
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    count: notifications.length,
    total: totalCount,
    page,
    pages: Math.ceil(totalCount / limit),
    data: notifications,
  });
});

// @desc    Mark all notifications as read for the current user
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Update all notifications where the user is a recipient and has unread notifications
  const result = await Notification.updateMany(
    {
      "recipients.user_id": userId,
      "recipients.read": false,
    },
    {
      $set: {
        "recipients.$[elem].read": true,
        "recipients.$[elem].read_at": new Date(),
      },
    },
    {
      arrayFilters: [{ "elem.user_id": userId, "elem.read": false }],
      multi: true,
    }
  );

  res.json({
    success: true,
    message: "All notifications marked as read",
    count: result.modifiedCount,
  });
});
