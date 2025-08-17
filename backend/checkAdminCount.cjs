const mongoose = require("mongoose");

// Define schemas
const roleSchema = new mongoose.Schema({
  role_name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  full_name: { type: String, required: true },
  join_date: { type: Date, default: Date.now },
});

const userRoleSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
});

const Role = mongoose.model("Role", roleSchema);
const User = mongoose.model("User", userSchema);
const UserRole = mongoose.model("UserRole", userRoleSchema);

const MONGODB_URI =
  "mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system";

async function checkAdminCount() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all users
    const users = await User.find({});
    console.log(`\n👤 Found ${users.length} users total:`);
    users.forEach((user, index) => {
      console.log(
        `${index + 1}. Email: ${user.email}, Name: ${user.full_name}, ID: ${
          user._id
        }`
      );
    });

    // Get all roles
    const roles = await Role.find({});
    console.log(`\n🏷️  Found ${roles.length} roles:`);
    roles.forEach((role, index) => {
      console.log(`${index + 1}. Role: ${role.role_name}, ID: ${role._id}`);
    });

    // Find admin role
    const adminRole = await Role.findOne({ role_name: "ADMIN" });
    if (!adminRole) {
      console.log("\n❌ No ADMIN role found in database");
      return;
    }

    console.log(`\n🔍 Admin Role ID: ${adminRole._id}`);

    // Get admin user-role assignments
    const adminUserRoles = await UserRole.find({
      role_id: adminRole._id,
    }).populate("user_id", "-password_hash");

    console.log(`\n👑 Found ${adminUserRoles.length} admin assignments:`);
    adminUserRoles.forEach((userRole, index) => {
      if (userRole.user_id) {
        console.log(
          `${index + 1}. User: ${userRole.user_id.email} (${
            userRole.user_id.full_name
          })`
        );
        console.log(`   User ID: ${userRole.user_id._id}`);
        console.log(`   Assignment ID: ${userRole._id}`);
      } else {
        console.log(
          `${index + 1}. Invalid assignment (no user): ${userRole._id}`
        );
      }
    });

    // Check for duplicate or orphaned role assignments
    const allUserRoles = await UserRole.find({});
    console.log(`\n📋 Total role assignments: ${allUserRoles.length}`);

    const adminAssignments = allUserRoles.filter(
      (ur) => ur.role_id.toString() === adminRole._id.toString()
    );
    console.log(`🔍 Admin role assignments found: ${adminAssignments.length}`);

    adminAssignments.forEach((assignment, index) => {
      console.log(
        `${index + 1}. Assignment ID: ${assignment._id}, User ID: ${
          assignment.user_id
        }`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

checkAdminCount();
