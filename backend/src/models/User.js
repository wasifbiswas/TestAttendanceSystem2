import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    join_date: {
      type: Date,
      default: Date.now,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    contact_number: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving to database
userSchema.pre("save", async function (next) {
  // Only hash if password_hash is modified
  if (!this.isModified("password_hash")) {
    return next();
  }

  try {
    console.log("Hashing password for user:", this.username);
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    console.log("Password hashed successfully");
    next();
  } catch (error) {
    console.error("Error hashing password:", error);
    next(error);
  }
});

// Method to match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password_hash);
};

// Cascade delete - clean up related data when user is deleted
userSchema.pre(['deleteOne', 'findOneAndDelete'], async function(next) {
  try {
    const userId = this.getQuery()._id;
    console.log(`Cleaning up related data for user: ${userId}`);
    
    // Import models inside the hook to avoid circular dependency issues
    const UserRole = mongoose.model('UserRole');
    const Employee = mongoose.model('Employee');
    const Attendance = mongoose.model('Attendance');
    const LeaveRequest = mongoose.model('LeaveRequest');
    const LeaveBalance = mongoose.model('LeaveBalance');
    
    // Clean up user roles
    const deletedRoles = await UserRole.deleteMany({ user_id: userId });
    console.log(`Deleted ${deletedRoles.deletedCount} user role assignments`);
    
    // Find employee profile
    const employee = await Employee.findOne({ user_id: userId });
    if (employee) {
      console.log(`Found employee profile: ${employee._id}, cleaning up employee data`);
      
      // Clean up attendance records
      const deletedAttendance = await Attendance.deleteMany({ emp_id: employee._id });
      console.log(`Deleted ${deletedAttendance.deletedCount} attendance records`);
      
      // Clean up leave requests
      const deletedLeaveRequests = await LeaveRequest.deleteMany({ emp_id: employee._id });
      console.log(`Deleted ${deletedLeaveRequests.deletedCount} leave requests`);
      
      // Clean up leave balances
      const deletedLeaveBalances = await LeaveBalance.deleteMany({ emp_id: employee._id });
      console.log(`Deleted ${deletedLeaveBalances.deletedCount} leave balances`);
      
      // Clean up employee profile
      await Employee.deleteOne({ _id: employee._id });
      console.log(`Deleted employee profile: ${employee._id}`);
    }
    
    // Clean up notifications (only if Notification model is available)
    try {
      const Notification = mongoose.model('Notification');
      const notifications = await Notification.find({
        'recipients.user_id': userId
      });
      
      for (const notification of notifications) {
        // Remove user from recipients
        notification.recipients = notification.recipients.filter(
          recipient => recipient.user_id.toString() !== userId.toString()
        );
        
        // If no recipients left, delete the notification
        if (notification.recipients.length === 0) {
          await Notification.deleteOne({ _id: notification._id });
        } else {
          await notification.save();
        }
      }
      console.log(`Cleaned up ${notifications.length} notifications`);
    } catch (notificationError) {
      console.log(`Notification model not available, skipping notification cleanup`);
    }
    
    console.log(`Completed cleanup for user: ${userId}`);
    next();
  } catch (error) {
    console.error('Error in user pre-delete hook:', error);
    next(error);
  }
});

// Also handle document-level deleteOne
userSchema.pre('deleteOne', { document: true }, async function(next) {
  try {
    const userId = this._id;
    console.log(`Document-level cleanup for user: ${userId}`);
    
    // Import models inside the hook to avoid circular dependency issues
    const UserRole = mongoose.model('UserRole');
    const Employee = mongoose.model('Employee');
    const Attendance = mongoose.model('Attendance');
    const LeaveRequest = mongoose.model('LeaveRequest');
    const LeaveBalance = mongoose.model('LeaveBalance');
    
    // Clean up user roles
    const deletedRoles = await UserRole.deleteMany({ user_id: userId });
    console.log(`Deleted ${deletedRoles.deletedCount} user role assignments`);
    
    // Find employee profile
    const employee = await Employee.findOne({ user_id: userId });
    if (employee) {
      console.log(`Found employee profile: ${employee._id}, cleaning up employee data`);
      
      // Clean up attendance records
      const deletedAttendance = await Attendance.deleteMany({ emp_id: employee._id });
      console.log(`Deleted ${deletedAttendance.deletedCount} attendance records`);
      
      // Clean up leave requests
      const deletedLeaveRequests = await LeaveRequest.deleteMany({ emp_id: employee._id });
      console.log(`Deleted ${deletedLeaveRequests.deletedCount} leave requests`);
      
      // Clean up leave balances
      const deletedLeaveBalances = await LeaveBalance.deleteMany({ emp_id: employee._id });
      console.log(`Deleted ${deletedLeaveBalances.deletedCount} leave balances`);
      
      // Clean up employee profile
      await Employee.deleteOne({ _id: employee._id });
      console.log(`Deleted employee profile: ${employee._id}`);
    }
    
    // Clean up notifications (only if Notification model is available)
    try {
      const Notification = mongoose.model('Notification');
      const notifications = await Notification.find({
        'recipients.user_id': userId
      });
      
      for (const notification of notifications) {
        notification.recipients = notification.recipients.filter(
          recipient => recipient.user_id.toString() !== userId.toString()
        );
        
        if (notification.recipients.length === 0) {
          await Notification.deleteOne({ _id: notification._id });
        } else {
          await notification.save();
        }
      }
      console.log(`Cleaned up ${notifications.length} notifications`);
    } catch (notificationError) {
      console.log(`Notification model not available, skipping notification cleanup`);
    }
    
    console.log(`Completed document-level cleanup for user: ${userId}`);
    next();
  } catch (error) {
    console.error('Error in user document pre-delete hook:', error);
    next(error);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
