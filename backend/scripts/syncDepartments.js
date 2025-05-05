import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import colors from "colors";

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, "../.env");

// Load .env file with proper path
console.log(`Loading environment from ${envPath}`.yellow);
dotenv.config({ path: envPath });

// Directly use the MongoDB URI from your .env file
const mongoUri =
  "mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system";

console.log(`Using MongoDB URI: ${mongoUri}`.cyan);

// Import the Department model - using dynamic import since we're running this as a script
let Department;

// List of departments from the signup page (only long format names)
const departments = [
  {
    dept_name: "Human Resources",
    description:
      "HR department responsible for recruiting and employee management",
  },
  {
    dept_name: "Information Technology",
    description:
      "IT department responsible for technical infrastructure and support",
  },
  {
    dept_name: "Finance & Accounting",
    description: "Finance department handling company finances and accounting",
  },
  {
    dept_name: "Marketing & Communications",
    description: "Marketing department handling advertising and communications",
  },
  {
    dept_name: "Operations & Logistics",
    description:
      "Operations department managing logistics and daily operations",
  },
  {
    dept_name: "Sales & Business Development",
    description:
      "Sales department responsible for business growth and client relationships",
  },
  {
    dept_name: "Research & Development",
    description:
      "R&D department focusing on innovation and product development",
  },
  {
    dept_name: "Legal & Compliance",
    description: "Legal department handling compliance and legal matters",
  },
  {
    dept_name: "Customer Support",
    description: "Customer support department providing client assistance",
  },
  {
    dept_name: "Administration",
    description: "Administration handling general office management",
  },
  {
    dept_name: "Executive Leadership",
    description: "Company leadership and executive management",
  },
  {
    dept_name: "Product Management",
    description: "Department focused on product strategy and roadmap",
  },
];

// Short form names to be removed
const shortFormNames = [
  "HR",
  "IT",
  "Finance",
  "Marketing",
  "Operations",
  "Sales",
  "RnD",
  "Legal",
  "Customer",
  "Admin",
  "Executive",
  "Product",
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log(`Connecting to MongoDB...`.cyan);
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`.green.bold);
    return true;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`.red.bold);
    console.error(error.stack);
    process.exit(1);
  }
};

// Main function to sync departments
const syncDepartments = async () => {
  try {
    // Connect to database
    await connectDB();

    // Dynamically import Department model after connecting
    const departmentModule = await import("../src/models/Department.js");
    Department = departmentModule.default;

    console.log("Starting department cleanup and synchronization...".yellow);

    // Step 1: Remove short forms (if they exist)
    for (const shortName of shortFormNames) {
      const result = await Department.deleteOne({ dept_name: shortName });
      if (result.deletedCount > 0) {
        console.log(`🗑️ Removed short form department: ${shortName}`.red);
      }
    }

    // Step 2: Check existing departments
    const existingDepartments = await Department.find({});
    console.log(
      `Found ${existingDepartments.length} departments after cleanup`.cyan
    );

    // Debug: List existing departments
    existingDepartments.forEach((dept) => {
      console.log(`  - ${dept.dept_name}`.gray);
    });

    // Step 3: Add long format departments if they don't exist
    for (const dept of departments) {
      const exists = existingDepartments.some(
        (existingDept) => existingDept.dept_name === dept.dept_name
      );

      if (!exists) {
        await Department.create(dept);
        console.log(`✅ Created department: ${dept.dept_name}`.green);
      } else {
        console.log(`ℹ️  Department already exists: ${dept.dept_name}`.blue);
      }
    }

    console.log("Department synchronization completed!".green.bold);
    process.exit(0);
  } catch (error) {
    console.error(
      `Error in department synchronization: ${error.message}`.red.bold
    );
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the function
syncDepartments();
