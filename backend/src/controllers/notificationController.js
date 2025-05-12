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
  try {
    console.log('[createNotification] Request received:', JSON.stringify({
      body: req.body,
      user: req.user?._id || 'No user found in request',
      headers: req.headers,
      url: req.originalUrl,
      method: req.method
    }));
    
    const {
      title,
      message,
      recipients,
      department_id,
      all_employees,
      priority,
      expires_at,
    } = req.body;

    // Validate required fields
    if (!title || !message) {
      res.status(400);
      throw new Error("Title and message are required");
    }

    // Validate recipient type is specified
    if (!recipients?.length && !department_id && !all_employees) {
      res.status(400);
      throw new Error("No recipients specified for the notification");
    }

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

  // Log the recipient selection criteria
  console.log(`[createNotification] Recipient selection criteria:`, {
    hasIndividualRecipients: !!(recipients && recipients.length > 0),
    hasDepartmentId: !!department_id,
    isAllEmployees: !!all_employees
  });

  // Individual recipients
  if (recipients && recipients.length > 0) {
    recipientsList = recipients.map((userId) => ({
      user_id: userId,
      read: false,
      read_at: null,
    }));
    console.log(`[createNotification] Added ${recipientsList.length} individual recipients`);
  }  // Department recipients
  else if (department_id) {
    try {
      console.log(`[createNotification] Finding employees for department: ${department_id}`);
      
      // Validate department_id is a valid ObjectId
      if (!department_id || !mongoose.Types.ObjectId.isValid(department_id)) {
        console.error(`[createNotification] Invalid department ID format: ${department_id}`);
        res.status(400);
        throw new Error("Invalid department ID format");
      }
      
      // Check if department exists
      const departmentExists = await mongoose.connection.db
        .collection('departments')
        .findOne({ _id: new mongoose.Types.ObjectId(department_id) });
        
      if (!departmentExists) {
        console.error(`[createNotification] Department not found: ${department_id}`);
        res.status(404);
        throw new Error("Department not found");
      }

      // Find all employees in the department
      const employees = await Employee.find({ dept_id: department_id });
      console.log(`[createNotification] Found ${employees.length} employees in department`);
      
      if (employees.length === 0) {
        console.warn(`[createNotification] No employees found in department ${department_id}`);
      }
      
      const userIds = employees.map((emp) => emp.user_id);
      console.log(`[createNotification] Extracted ${userIds.length} user IDs`);

      // Get all active users who are also employees in the department
      const users = await User.find({
        _id: { $in: userIds },
        is_active: true,
      });
      
      console.log(`[createNotification] Found ${users.length} active users from employee IDs`);

      recipientsList = users.map((user) => ({
        user_id: user._id,
        read: false,
        read_at: null,
      }));
    } catch (err) {
      console.error(`[createNotification] Error processing department recipients:`, err);
      throw err; // Re-throw to be caught by the outer try-catch
    }
  }  // All employees (admin only)
  else if (all_employees) {
    try {
      console.log(`[createNotification] Preparing to send to all employees, user roles: ${roles}`);
      
      if (!roles.includes("ADMIN")) {
        console.error(`[createNotification] Non-admin user ${req.user._id} attempted to send to all employees`);
        res.status(403);
        throw new Error(
          "Only administrators can send notifications to all employees"
        );
      }

      // Find all active users who are employees
      console.log(`[createNotification] Finding all employees`);
      const employees = await Employee.find({}).select("user_id");
      console.log(`[createNotification] Found ${employees.length} employees`);
      
      if (employees.length === 0) {
        console.warn(`[createNotification] No employees found in the system`);
      }
      
      const userIds = employees.map((emp) => emp.user_id);
      console.log(`[createNotification] Extracted ${userIds.length} employee user IDs`);
      
      // Check for null or invalid user IDs
      const validUserIds = userIds.filter(id => id !== null && id !== undefined);
      if (validUserIds.length !== userIds.length) {
        console.warn(`[createNotification] Found ${userIds.length - validUserIds.length} invalid user IDs`);
      }

      console.log(`[createNotification] Finding active users`);
      const users = await User.find({
        _id: { $in: validUserIds },
        is_active: true,
      });
      
      console.log(`[createNotification] Found ${users.length} active users`);

      recipientsList = users.map((user) => ({
        user_id: user._id,
        read: false,
        read_at: null,
      }));
    } catch (err) {
      console.error(`[createNotification] Error processing all-employees:`, err);
      throw err; // Re-throw to be caught by the outer try-catch
    }
  }

  // Ensure we have recipients
  if (recipientsList.length === 0) {
    res.status(400);
    throw new Error("No recipients specified for the notification");
  }

  notificationData.recipients = recipientsList;
  // Create the notification
  console.log(`[createNotification] Creating notification with ${recipientsList.length} recipients`);
  
  const notification = await Notification.create(notificationData);
    console.log(`[createNotification] Notification created successfully:`, {
    id: notification._id,
    title: notification.title,
    recipients: notification.recipients.length,
    department: notification.department_id,
    all_employees: notification.all_employees
  });

  res.status(201).json({
    success: true,
    data: notification,
  });  } catch (error) {
    console.error('[createNotification] Error creating notification:', error);
    
    // Handle specific error cases
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.message,
        error: error.message
      });
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      res.status(500).json({
        success: false,
        message: 'Database error. Please try again.',
        error: error.message
      });
    } else if (error.code === 11000) {
      // Duplicate key error
      res.status(400).json({
        success: false,
        message: 'Duplicate entry error',
        error: error.message
      });
    } else {
      // Default error handling
      const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create notification',
        error: error.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
      });
    }
  }
});

// @desc    Get all notifications for the current user
// @route   GET /api/notifications
// @access  Private
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  console.log(`[getUserNotifications] Fetching notifications for user ${userId}`);

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
  console.log(`[getUserNotifications] Found ${formattedNotifications.length} notifications for user ${userId}, ${unreadCount} unread`);
  
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
