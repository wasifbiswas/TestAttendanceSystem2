import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import UserRole from "../models/UserRole.js";
import Role from "../models/Role.js";

// Load environment variables
dotenv.config();

async function listUsers() {
  try {
    // Connect directly to the MongoDB cluster
    const MONGO_URI =
      "mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system";
    console.log(`Connecting to MongoDB with URI: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);

    // Get all users
    const users = await User.find({}).select("-password_hash");

    // Get admin role
    const adminRole = await Role.findOne({ role_name: "ADMIN" });

    if (!adminRole) {
      console.log("Admin role not found in database!");
      process.exit(1);
    }

    console.log("\n=== Users in the System ===");
    console.log("----------------------------");

    for (const user of users) {
      // Check if this user is an admin
      const isAdmin = await UserRole.findOne({
        user_id: user._id,
        role_id: adminRole._id,
      });

      console.log(`Username: ${user.username}`);
      console.log(`Full Name: ${user.full_name || "N/A"}`);
      console.log(`Email: ${user.email || "N/A"}`);
      console.log(`Admin: ${isAdmin ? "Yes" : "No"}`);
      console.log("----------------------------");
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the function
listUsers();
