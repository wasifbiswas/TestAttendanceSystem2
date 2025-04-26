import mongoose from "mongoose";
import moment from "moment";

const LeaveRequestSchema = new mongoose.Schema(
  {
    emp_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    leave_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 0.5,
      max: 30,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
    },
    applied_date: {
      type: Date,
      default: Date.now,
    },
    last_modified: {
      type: Date,
      default: Date.now,
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    rejection_reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    is_half_day: {
      type: Boolean,
      default: false,
    },
    attachment: {
      type: String,
      trim: true,
    },
    contact_during_leave: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

// Validate date range and business rules
LeaveRequestSchema.pre("validate", async function (next) {
  // Date validation
  if (this.start_date > this.end_date) {
    return next(new Error("Start date must be before or equal to end date"));
  }

  // Fetch leave type details
  try {
    const LeaveType = mongoose.model("LeaveType");
    const leaveType = await LeaveType.findById(this.leave_type_id);

    if (!leaveType) {
      return next(new Error("Invalid leave type"));
    }

    // Check maximum consecutive days
    const daysDiff =
      moment(this.end_date).diff(moment(this.start_date), "days") + 1;
    if (daysDiff > leaveType.max_consecutive_days) {
      return next(
        new Error(
          `Maximum ${leaveType.max_consecutive_days} consecutive days allowed for this leave type`
        )
      );
    }

    // Update duration based on dates
    this.duration = daysDiff;
  } catch (error) {
    return next(error);
  }

  next();
});

// Auto-update last_modified and perform additional checks
LeaveRequestSchema.pre("save", async function (next) {
  this.last_modified = Date.now();

  // Only check for status changes on existing documents
  if (!this.isNew && this.isModified("status")) {
    // Get the original document to check previous status
    try {
      const originalDoc = await mongoose
        .model("LeaveRequest")
        .findById(this._id);
      if (
        originalDoc &&
        ["APPROVED", "REJECTED"].includes(originalDoc.status)
      ) {
        return next(
          new Error("Cannot modify an already processed leave request")
        );
      }
    } catch (error) {
      return next(error);
    }
  }

  next();
});

// Static method to check leave balance
LeaveRequestSchema.statics.checkLeaveBalance = async function (
  empId,
  leaveTypeId,
  requestedDays
) {
  const LeaveBalance = mongoose.model("LeaveBalance");
  const currentYear = new Date().getFullYear();

  const leaveBalance = await LeaveBalance.findOne({
    emp_id: empId,
    leave_type_id: leaveTypeId,
    year: currentYear,
  });

  if (!leaveBalance) {
    throw new Error("Leave balance not found");
  }

  const availableLeaves =
    leaveBalance.allocated_leaves +
    leaveBalance.carried_forward -
    leaveBalance.used_leaves;

  if (requestedDays > availableLeaves) {
    throw new Error("Insufficient leave balance");
  }

  return true;
};

export default mongoose.model("LeaveRequest", LeaveRequestSchema);
