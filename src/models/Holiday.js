import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    holiday_name: {
      type: String,
      required: true,
      trim: true,
    },
    holiday_date: {
      type: Date,
      required: true,
    },
    is_optional: {
      type: Boolean,
      default: false,
    },
    applicable_depts: {
      type: String,
      default: "ALL", // 'ALL' or comma-separated department IDs
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for holiday date for faster queries
holidaySchema.index({ holiday_date: 1 });

const Holiday = mongoose.model("Holiday", holidaySchema);

export default Holiday;
