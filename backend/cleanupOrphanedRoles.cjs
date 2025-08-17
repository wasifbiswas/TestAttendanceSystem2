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

async function cleanupOrphanedRoles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("🔌 Connected to MongoDB");

    // Get all role assignments
    const allUserRoles = await UserRole.find({});
    console.log(`\n📋 Found ${allUserRoles.length} role assignments total`);

    // Check which role assignments have valid user references
    const orphanedAssignments = [];
    const validAssignments = [];

    for (const assignment of allUserRoles) {
      const user = await User.findById(assignment.user_id);
      const role = await Role.findById(assignment.role_id);

      if (user && role) {
        validAssignments.push(assignment);
        console.log(`✅ Valid assignment: ${user.email} -> ${role.role_name}`);
      } else {
        orphanedAssignments.push(assignment);
        console.log(
          `❌ Orphaned assignment: User ID ${assignment.user_id} -> Role ID ${assignment.role_id} (Assignment ID: ${assignment._id})`
        );
        if (!user) console.log(`   - User not found`);
        if (!role) console.log(`   - Role not found`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`Valid assignments: ${validAssignments.length}`);
    console.log(`Orphaned assignments: ${orphanedAssignments.length}`);

    if (orphanedAssignments.length > 0) {
      console.log(
        `\n🗑️  Removing ${orphanedAssignments.length} orphaned role assignments...`
      );

      for (const assignment of orphanedAssignments) {
        await UserRole.findByIdAndDelete(assignment._id);
        console.log(
          `Deleted assignment ${assignment._id} (User: ${assignment.user_id}, Role: ${assignment.role_id})`
        );
      }

      console.log("✅ Cleanup completed!");
    } else {
      console.log(
        "\n✅ No orphaned role assignments found. Database is clean!"
      );
    }

    // Final verification - count admins again
    const adminRole = await Role.findOne({ role_name: "ADMIN" });
    if (adminRole) {
      const adminUserRoles = await UserRole.find({
        role_id: adminRole._id,
      }).populate("user_id", "-password_hash");

      console.log(`\n👑 Final admin count: ${adminUserRoles.length}`);
      adminUserRoles.forEach((userRole, index) => {
        if (userRole.user_id) {
          console.log(
            `${index + 1}. ${userRole.user_id.email} (${
              userRole.user_id.full_name
            })`
          );
        }
      });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

cleanupOrphanedRoles();
