import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    leave_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    leave_name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    is_carry_forward: {
      type: Boolean,
      default: false,
    },
    default_annual_quota: {
      type: Number,
      required: true,
      min: 0,
    },
    requires_approval: {
      type: Boolean,
      default: true,
    },
    max_consecutive_days: {
      type: Number,
      default: 0, // 0 = unlimited
    },
  },
  {
    timestamps: true,
  }
);

const LeaveType = mongoose.model("LeaveType", leaveTypeSchema);

export default LeaveType;
