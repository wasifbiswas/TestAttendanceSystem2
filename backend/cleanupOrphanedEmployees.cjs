const mongoose = require("mongoose");
require("dotenv").config();

// Define schemas (CJS compatible)
const employeeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dept_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    hire_date: {
      type: Date,
      default: Date.now,
    },
    employee_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    reporting_manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  {
    timestamps: true,
  }
);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  full_name: { type: String, required: true },
  join_date: { type: Date, default: Date.now },
});

const Employee = mongoose.model("Employee", employeeSchema);
const User = mongoose.model("User", userSchema);

async function cleanupOrphanedEmployees() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system"
    );
    console.log("✅ Connected to MongoDB");

    // Find all employees
    const employees = await Employee.find({});
    console.log(`\n👥 Found ${employees.length} employees total`);

    // Check which employees have valid user references
    const orphanedEmployees = [];
    const validEmployees = [];

    for (const employee of employees) {
      const user = await User.findById(employee.user_id);
      if (user) {
        validEmployees.push(employee);
        console.log(
          `✅ Employee ${employee.employee_code} has valid user: ${user.email}`
        );
      } else {
        orphanedEmployees.push(employee);
        console.log(
          `❌ Employee ${employee.employee_code} has no valid user (user_id: ${employee.user_id})`
        );
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`Valid employees: ${validEmployees.length}`);
    console.log(`Orphaned employees: ${orphanedEmployees.length}`);

    if (orphanedEmployees.length > 0) {
      console.log(
        `\n🗑️  Removing ${orphanedEmployees.length} orphaned employee records...`
      );

      for (const employee of orphanedEmployees) {
        await Employee.findByIdAndDelete(employee._id);
        console.log(
          `Deleted employee ${employee.employee_code} (ID: ${employee._id})`
        );
      }

      console.log("✅ Cleanup completed!");
    } else {
      console.log("\n✅ No orphaned employees found. Database is clean!");
    }

    // Final verification
    const remainingEmployees = await Employee.find({});
    console.log(`\n📋 Final employee count: ${remainingEmployees.length}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

cleanupOrphanedEmployees();
