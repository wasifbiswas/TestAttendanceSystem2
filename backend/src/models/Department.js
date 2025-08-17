import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    dept_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    dept_head_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    budget: {
      type: Number,
      min: 0,
    },
    employee_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for getting employees in this department
departmentSchema.virtual("employees", {
  ref: "Employee",
  localField: "_id",
  foreignField: "dept_id",
});

// Pre-save middleware to update employee count
departmentSchema.pre("save", async function (next) {
  if (this.isModified("_id") || this.isNew) {
    try {
      const Employee = mongoose.model("Employee");
      const count = await Employee.countDocuments({ dept_id: this._id });
      this.employee_count = count;
    } catch (error) {
      console.log("Could not update employee count:", error.message);
    }
  }
  next();
});

// Method to update employee count
departmentSchema.methods.updateEmployeeCount = async function () {
  try {
    const Employee = mongoose.model("Employee");
    const count = await Employee.countDocuments({ dept_id: this._id });
    this.employee_count = count;
    return await this.save();
  } catch (error) {
    console.error("Error updating employee count:", error);
    throw error;
  }
};

const Department = mongoose.model("Department", departmentSchema);

export default Department;
