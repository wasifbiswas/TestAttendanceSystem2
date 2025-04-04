import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";
import connectDB from "../config/database.js";
import Role from "../models/Role.js";
import LeaveType from "../models/LeaveType.js";

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

// Define roles to seed
const roles = [
  {
    role_name: "ADMIN",
    description: "System administrator with full access to all features",
  },
  {
    role_name: "MANAGER",
    description:
      "Department manager with access to department data and approvals",
  },
  {
    role_name: "EMPLOYEE",
    description: "Regular employee with personal data access only",
  },
];

// Define leave types to seed
const leaveTypes = [
  {
    leave_code: "AL",
    leave_name: "Annual Leave",
    description: "Regular paid leave for vacation or personal time",
    is_carry_forward: true,
    default_annual_quota: 20,
    requires_approval: true,
    max_consecutive_days: 15,
  },
  {
    leave_code: "SL",
    leave_name: "Sick Leave",
    description: "Leave for illness or medical appointments",
    is_carry_forward: false,
    default_annual_quota: 10,
    requires_approval: false,
    max_consecutive_days: 5,
  },
  {
    leave_code: "ML",
    leave_name: "Maternity Leave",
    description: "Leave for childbirth and care of newborn",
    is_carry_forward: false,
    default_annual_quota: 90,
    requires_approval: true,
    max_consecutive_days: 90,
  },
  {
    leave_code: "PL",
    leave_name: "Paternity Leave",
    description: "Leave for fathers after childbirth",
    is_carry_forward: false,
    default_annual_quota: 14,
    requires_approval: true,
    max_consecutive_days: 14,
  },
  {
    leave_code: "UL",
    leave_name: "Unpaid Leave",
    description: "Leave without pay for personal reasons",
    is_carry_forward: false,
    default_annual_quota: 30,
    requires_approval: true,
    max_consecutive_days: 30,
  },
];

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    await Role.deleteMany();
    await LeaveType.deleteMany();

    console.log("Data cleared...".yellow.inverse);

    // Insert roles
    await Role.insertMany(roles);
    console.log("Roles seeded...".green.inverse);

    // Insert leave types
    await LeaveType.insertMany(leaveTypes);
    console.log("Leave types seeded...".green.inverse);

    console.log("Data seed completed!".blue.inverse);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red.inverse);
    process.exit(1);
  }
};

// Run the seed function
seedData();

//to satrt role seeding module only run : npm run seed:roles
