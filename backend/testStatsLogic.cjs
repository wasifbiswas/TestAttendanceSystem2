const mongoose = require("mongoose");
const User = require("./src/models/User.js").default;
const Employee = require("./src/models/Employee.js").default;
const UserRole = require("./src/models/UserRole.js").default;
const Role = require("./src/models/Role.js").default;

const DATABASE_URL =
  "mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system";

async function testStatsLogic() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(DATABASE_URL);
    console.log("Connected to MongoDB");

    console.log("\n📊 Testing Employee Count Logic...\n");

    // Get role objects
    const employeeRole = await Role.findOne({ role_name: "EMPLOYEE" });
    const managerRole = await Role.findOne({ role_name: "MANAGER" });
    const adminRole = await Role.findOne({ role_name: "ADMIN" });

    console.log("📋 Role IDs:");
    console.log(`  Employee Role: ${employeeRole?._id || "Not found"}`);
    console.log(`  Manager Role: ${managerRole?._id || "Not found"}`);
    console.log(`  Admin Role: ${adminRole?._id || "Not found"}`);

    // Get all valid employees (for Total Employees section)
    const validEmployees = await Employee.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $match: {
          "user.0": { $exists: true },
        },
      },
    ]);

    console.log(
      `\n🏢 Total Employees (for Total Employees section): ${validEmployees.length}`
    );

    // Get employee roles breakdown
    let regularEmployeeCount = 0;
    let managerCount = 0;
    let adminCount = 0;

    console.log("\n👥 Analyzing each employee:");
    for (const employee of validEmployees) {
      const userRoles = await UserRole.find({ user_id: employee.user_id });
      const roleNames = [];

      let isManager = false;
      let isAdmin = false;

      for (const userRole of userRoles) {
        const role = await Role.findById(userRole.role_id);
        if (role) {
          roleNames.push(role.role_name);
          if (role.role_name === "MANAGER") isManager = true;
          if (role.role_name === "ADMIN") isAdmin = true;
        }
      }

      // Count logic for Employee Summary by Role
      if (isAdmin) {
        adminCount++;
        console.log(
          `  ${
            employee.employee_code || employee._id
          } - ADMIN (${roleNames.join(", ")})`
        );
      } else if (isManager) {
        managerCount++;
        console.log(
          `  ${
            employee.employee_code || employee._id
          } - MANAGER (${roleNames.join(", ")})`
        );
      } else {
        regularEmployeeCount++;
        console.log(
          `  ${
            employee.employee_code || employee._id
          } - EMPLOYEE (${roleNames.join(", ")})`
        );
      }
    }

    console.log("\n📊 EXPECTED DASHBOARD RESULTS:");
    console.log("================================");
    console.log(
      `Total Employees Section: ${validEmployees.length} (ALL employees including managers)`
    );
    console.log("\nEmployee Summary by Role Section:");
    console.log(
      `  - Employees: ${regularEmployeeCount} (regular employees only, excluding managers)`
    );
    console.log(`  - Managers: ${managerCount} (managers only)`);
    console.log(`  - Admins: ${adminCount} (admins only)`);

    // Verify the math
    const totalByRole = regularEmployeeCount + managerCount + adminCount;
    console.log(
      `\n✅ Verification: ${regularEmployeeCount} + ${managerCount} + ${adminCount} = ${totalByRole}`
    );
    if (totalByRole === validEmployees.length) {
      console.log("✅ Math checks out! All employees are accounted for.");
    } else {
      console.log(
        "❌ Math error! Some employees are missing or double-counted."
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
    process.exit(0);
  }
}

testStatsLogic();
