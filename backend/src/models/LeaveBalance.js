import mongoose from "mongoose";

const leaveBalanceSchema = new mongoose.Schema(
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
    year: {
      type: Number,
      required: true,
    },
    allocated_leaves: {
      type: Number,
      required: true,
      default: 0,
    },
    used_leaves: {
      type: Number,
      default: 0,
    },
    pending_leaves: {
      type: Number,
      default: 0,
    },
    carried_forward: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for employee, leave type, and year to ensure uniqueness
leaveBalanceSchema.index(
  { emp_id: 1, leave_type_id: 1, year: 1 },
  { unique: true }
);

const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);

export default LeaveBalance;
