import axios from "axios";
import colors from "colors";

const API_URL = "http://localhost:5000/api";
let authToken = "";
let adminId = "";
let testUserId = "";
let employeeId = "";
let departmentId = "";
let testLeaveRequestId = "";

// Helper function to make API calls
async function callAPI(endpoint, method = "GET", data = null, token = null) {
  try {
    const response = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return { status: response.status, data: response.data };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || { message: error.message },
    };
  }
}

async function runSystemCheck() {
  console.log("🔍 Starting System Check...".cyan);

  // Test Authentication
  console.log("\n=== Testing Authentication ===".cyan);

  // Test admin login
  console.log("Testing admin login...");
  const adminLoginResponse = await callAPI("/auth/login", "POST", {
    username: "testadmin2",
    password: "Password123",
  });

  if (adminLoginResponse.status === 200 && adminLoginResponse.data.token) {
    console.log("✓ Admin login successful".green);
    authToken = adminLoginResponse.data.token;
    adminId = adminLoginResponse.data._id;
  } else {
    console.log("✗ Admin login failed".red);
    process.exit(1);
  }

  // Test invalid login
  console.log("Testing invalid login...");
  const invalidLoginResponse = await callAPI("/auth/login", "POST", {
    username: "invalid",
    password: "invalid",
  });

  if (invalidLoginResponse.status === 401) {
    console.log("✓ Invalid login properly rejected".green);
  } else {
    console.log("✗ Invalid login test failed".red);
    return;
  }

  // Test Department Management
  console.log("\n=== Testing Department Management ===".cyan);

  // Create department
  console.log("Creating test department...");
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const createDeptResponse = await callAPI(
    "/departments",
    "POST",
    {
      dept_name: `Test Department ${timestamp}`,
      description: "Department for system testing",
    },
    authToken
  );

  if (createDeptResponse.status === 201) {
    console.log("✓ Department created successfully".green);
    departmentId = createDeptResponse.data._id;
  } else {
    console.log("✗ Department creation failed".red);
    return;
  }

  // Get departments
  console.log("Getting departments...");
  const getDeptResponse = await callAPI("/departments", "GET", null, authToken);

  if (getDeptResponse.status === 200) {
    console.log(`✓ Retrieved ${getDeptResponse.data.length} departments`.green);
  } else {
    console.log("✗ Failed to retrieve departments".red);
    return;
  }

  // Test Employee Management
  console.log("\n=== Testing Employee Management ===".cyan);

  // Create test user for employee
  console.log("Creating test user for employee...");
  const createUserResponse = await callAPI(
    "/auth/register",
    "POST",
    {
      username: `testuser_${timestamp}`,
      password: "Password123",
      confirm_password: "Password123",
      email: `testuser_${timestamp}@example.com`,
      full_name: "Test User",
    },
    authToken
  );

  if (createUserResponse.status === 201) {
    console.log("✓ Test user created successfully".green);
    testUserId = createUserResponse.data._id;
  } else {
    console.log("✗ Test user creation failed".red);
    console.log("Error:", JSON.stringify(createUserResponse.data));
    return;
  }

  // Create employee
  console.log("Creating test employee...");
  const createEmpResponse = await callAPI(
    "/employees",
    "POST",
    {
      user_id: testUserId,
      dept_id: departmentId,
      designation: "Test Engineer",
      employee_code: `EMP${timestamp}`,
    },
    authToken
  );

  if (createEmpResponse.status === 201) {
    console.log("✓ Employee created successfully".green);
    employeeId = createEmpResponse.data._id;
  } else {
    console.log("✗ Employee creation failed".red);
    console.log("Error:", JSON.stringify(createEmpResponse.data));
    return;
  }

  // Get employees
  console.log("Getting employees...");
  const getEmpResponse = await callAPI("/employees", "GET", null, authToken);

  if (getEmpResponse.status === 200) {
    console.log(`✓ Retrieved ${getEmpResponse.data.length} employees`.green);
  } else {
    console.log("✗ Failed to retrieve employees".red);
    return;
  }

  // Test Leave Management
  console.log("\n=== Testing Leave Management ===".cyan);

  // Get leave types
  console.log("Getting leave types...");
  const getTypesResponse = await callAPI("/leaves/types", "GET", null, authToken);

  if (getTypesResponse.status === 200) {
    console.log(`✓ Retrieved ${getTypesResponse.data.length} leave types`.green);
  } else {
    console.log("✗ Failed to retrieve leave types".red);
    return;
  }

  // Create test leave request
  console.log("Creating test leave request...");
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 1);
  const duration = 1; // One day duration
  
  const createLeaveResponse = await callAPI(
    "/leaves/requests",
    "POST",
    {
      emp_id: employeeId,
      leave_type_id: getTypesResponse.data[0]._id,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      duration: duration,
      reason: "System test leave request",
      contact_during_leave: "test@example.com"
    },
    authToken
  );

  if (createLeaveResponse.status === 201) {
    console.log("✓ Leave request created successfully".green);
    testLeaveRequestId = createLeaveResponse.data._id;
  } else {
    console.log("✗ Leave request creation failed".red);
    console.log("Error:", JSON.stringify(createLeaveResponse.data));
    return;
  }

  // Get leave balances
  console.log("Getting leave balances...");
  const getBalancesResponse = await callAPI(
    `/leaves/balances/${employeeId}`,
    "GET",
    null,
    authToken
  );

  if (getBalancesResponse.status === 200) {
    console.log(`✓ Retrieved leave balances successfully`.green);
  } else {
    console.log("✗ Failed to retrieve leave balances".red);
    console.log("Error:", JSON.stringify(getBalancesResponse.data));
    return;
  }

  // Test Attendance Management
  console.log("\n=== Testing Attendance Management ===".cyan);

  // Create test attendance record
  console.log("Creating test attendance record...");
  const createAttendanceResponse = await callAPI(
    "/attendance",
    "POST",
    {
      employee_id: employeeId,
      attendance_date: new Date().toISOString().split('T')[0],
      status: "PRESENT",
      check_in: new Date().toISOString(),
    },
    authToken
  );

  if (createAttendanceResponse.status === 201) {
    console.log("✓ Attendance record created successfully".green);
  } else {
    console.log("✗ Attendance record creation failed".red);
    return;
  }

  // Get attendance records
  console.log("Getting attendance records...");
  const getAttendanceResponse = await callAPI(
    `/attendance/${employeeId}`,
    "GET",
    null,
    authToken
  );

  if (getAttendanceResponse.status === 200) {
    console.log(
      `✓ Retrieved ${getAttendanceResponse.data.length} attendance records`.green
    );
  } else {
    console.log("✗ Failed to retrieve attendance records".red);
    return;
  }

  // Test Role Management
  console.log("\n=== Testing Role Management ===".cyan);

  // Get all roles
  console.log("Getting roles...");
  const getRolesResponse = await callAPI("/admin/roles", "GET", null, authToken);

  if (getRolesResponse.status === 200) {
    console.log(`✓ Retrieved ${getRolesResponse.data.length} roles`.green);
  } else {
    console.log("✗ Failed to retrieve roles".red);
  }

  // Get user roles
  console.log("Getting user roles...");
  const getUserResponse = await callAPI(
    "/auth/profile",
    "GET",
    null,
    authToken
  );

  if (getUserResponse.status === 200 && getUserResponse.data.roles) {
    console.log(
      `✓ Retrieved user roles: ${getUserResponse.data.roles.join(", ")}`.green
    );
  } else {
    console.log("✗ Failed to retrieve user roles".red);
  }

  console.log("\n✨ System Check Complete! ✨".cyan);
}

runSystemCheck().catch((error) => {
  console.error("System check failed:", error);
  process.exit(1);
});