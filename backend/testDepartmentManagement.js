import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const API_BASE_URL = process.env.API_URL || "http://localhost:3000/api";

// You need to replace this with a valid JWT token from an admin user
const ADMIN_TOKEN = "your-admin-jwt-token-here";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${ADMIN_TOKEN}`,
    "Content-Type": "application/json",
  },
});

async function testDepartmentManagement() {
  console.log("🚀 Testing Enhanced Department Management Features\n");

  try {
    // 1. Test Department Statistics
    console.log("1️⃣ Testing Department Statistics...");
    const statsResponse = await apiClient.get("/departments/stats");
    console.log(
      "✅ Department Stats:",
      JSON.stringify(statsResponse.data, null, 2)
    );
    console.log("");

    // 2. Test Get All Departments (with pagination)
    console.log("2️⃣ Testing Get All Departments with pagination...");
    const allDeptsResponse = await apiClient.get(
      "/departments?page=1&limit=5&search="
    );
    console.log(
      "✅ All Departments:",
      JSON.stringify(allDeptsResponse.data, null, 2)
    );
    console.log("");

    // 3. Test Create Department
    console.log("3️⃣ Testing Create Department...");
    const newDepartment = {
      dept_name: "Test Department",
      description: "A test department for API testing",
      status: "ACTIVE",
      location: "Test Building, Floor 3",
      budget: 50000,
    };

    const createResponse = await apiClient.post("/departments", newDepartment);
    console.log(
      "✅ Department Created:",
      JSON.stringify(createResponse.data, null, 2)
    );
    const createdDeptId = createResponse.data.department._id;
    console.log("");

    // 4. Test Get Department by ID
    console.log("4️⃣ Testing Get Department by ID...");
    const getDeptResponse = await apiClient.get(
      `/departments/${createdDeptId}`
    );
    console.log(
      "✅ Department Details:",
      JSON.stringify(getDeptResponse.data, null, 2)
    );
    console.log("");

    // 5. Test Update Department
    console.log("5️⃣ Testing Update Department...");
    const updateData = {
      description: "Updated test department description",
      budget: 75000,
      location: "Updated Building, Floor 5",
    };

    const updateResponse = await apiClient.put(
      `/departments/${createdDeptId}`,
      updateData
    );
    console.log(
      "✅ Department Updated:",
      JSON.stringify(updateResponse.data, null, 2)
    );
    console.log("");

    // 6. Test Get Available Heads (should be empty for new department)
    console.log("6️⃣ Testing Get Available Heads...");
    const availableHeadsResponse = await apiClient.get(
      `/departments/${createdDeptId}/available-heads`
    );
    console.log(
      "✅ Available Heads:",
      JSON.stringify(availableHeadsResponse.data, null, 2)
    );
    console.log("");

    // 7. Test Delete Department (should work since no employees assigned)
    console.log("7️⃣ Testing Delete Department...");
    const deleteResponse = await apiClient.delete(
      `/departments/${createdDeptId}`
    );
    console.log(
      "✅ Department Deleted:",
      JSON.stringify(deleteResponse.data, null, 2)
    );
    console.log("");

    // 8. Test Search Departments
    console.log("8️⃣ Testing Search Departments...");
    const searchResponse = await apiClient.get("/departments?search=IT");
    console.log(
      "✅ Search Results:",
      JSON.stringify(searchResponse.data, null, 2)
    );
    console.log("");

    console.log("🎉 All department management tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log(
        "\n⚠️  Authentication failed. Please update the ADMIN_TOKEN in this script with a valid JWT token from an admin user."
      );
    }
  }
}

// Function to test with an existing department
async function testExistingDepartment() {
  console.log("\n🔍 Testing with existing departments...\n");

  try {
    // Get all departments first
    const deptResponse = await apiClient.get("/departments?page=1&limit=1");

    if (
      deptResponse.data.departments &&
      deptResponse.data.departments.length > 0
    ) {
      const existingDept = deptResponse.data.departments[0];
      console.log(
        "📋 Testing with existing department:",
        existingDept.dept_name
      );

      // Test department head assignment functionality
      const availableHeads = await apiClient.get(
        `/departments/${existingDept._id}/available-heads`
      );
      console.log(
        "✅ Available employees for head assignment:",
        availableHeads.data.employees.length
      );

      if (availableHeads.data.employees.length > 0) {
        const employee = availableHeads.data.employees[0];
        console.log(
          `💼 Could assign ${employee.user_id.full_name} as department head`
        );
      }
    } else {
      console.log("ℹ️  No existing departments found to test with");
    }
  } catch (error) {
    console.error(
      "❌ Existing department test failed:",
      error.response?.data || error.message
    );
  }
}

// Run the tests
async function runTests() {
  await testDepartmentManagement();
  await testExistingDepartment();
}

runTests();
