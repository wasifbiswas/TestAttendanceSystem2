import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    emp_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    attendance_date: {
      type: Date,
      required: true,
    },
    check_in: {
      type: Date,
    },
    check_out: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LEAVE", "HOLIDAY", "HALF_DAY", "WEEKEND"],
      default: "ABSENT",
    },
    work_hours: {
      type: Number,
      default: 0,
    },
    is_leave: {
      type: Boolean,
      default: false,
    },
    leave_request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveRequest",
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for employee and date to ensure uniqueness
attendanceSchema.index({ emp_id: 1, attendance_date: 1 }, { unique: true });

// Calculate work hours when data is saved
attendanceSchema.pre("save", function (next) {
  if (this.check_in && this.check_out) {
    // Calculate work hours as a decimal (e.g., 8.5 hours)
    const hours = (this.check_out - this.check_in) / (1000 * 60 * 60);
    this.work_hours = parseFloat(hours.toFixed(2));

    // Set status based on work hours
    if (hours >= 4 && hours < 8) {
      this.status = "HALF_DAY";
    } else if (hours >= 8) {
      this.status = "PRESENT";
    }
  }
  next();
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
