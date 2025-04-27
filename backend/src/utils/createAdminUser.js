import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Role from "../models/Role.js";
import UserRole from "../models/UserRole.js";

// Load environment variables
dotenv.config();

// Function to create a new admin user
const createAdminUser = async (username, email, password, fullName) => {
  try {
    // Connect directly to the MongoDB cluster
    const MONGO_URI =
      "mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system";
    console.log(`Connecting to MongoDB with URI: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.error(`User with username ${username} already exists`);
      process.exit(1);
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.error(`User with email ${email} already exists`);
      process.exit(1);
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password_hash: password, // The model will hash this
      full_name: fullName,
      join_date: new Date(),
      is_active: true,
    });

    console.log(`Created new user: ${user.username} (${user._id})`);

    // Find the admin role
    const adminRole = await Role.findOne({ role_name: "ADMIN" });
    if (!adminRole) {
      console.error("Admin role not found in the database");
      process.exit(1);
    }

    console.log(`Found admin role: ${adminRole.role_name} (${adminRole._id})`);

    // Assign admin role to user
    const userRole = await UserRole.create({
      user_id: user._id,
      role_id: adminRole._id,
      assigned_date: new Date(),
    });

    console.log(`Successfully created ${username} as an admin!`);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Get arguments from command line
const username = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];
const fullName = process.argv[5];

if (!username || !email || !password || !fullName) {
  console.error("Please provide all required information");
  console.log(
    "Usage: node utils/createAdminUser.js <username> <email> <password> <fullName>"
  );
  process.exit(1);
}

// Run the function
createAdminUser(username, email, password, fullName);
