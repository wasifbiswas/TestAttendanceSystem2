import fetch from "node-fetch";
// import LeaveType from "../src/models/LeaveType.js";

const API_URL = "http://localhost:5000/api";
let authToken = "";
let createdDeptId = "";
let createdUserId = "";
let createdEmployeeId = "";
let createdLeaveId = "";

// Helper function to make API requests
async function callAPI(endpoint, method = "GET", data = null, token = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return { status: 500, error: error.message };
  }
}

// Test Functions
async function testRegisterUser() {
  console.log("\n--- Testing User Registration ---");
  const userData = {
    username: "testadmin2",
    password: "Password123",
    confirm_password: "Password123",
    email: "testadmin2@example.com",
    full_name: "Test Admin 2",
    contact_number: "1234567890",
  };

  const response = await callAPI("/auth/register", "POST", userData);
  console.log(`Status: ${response.status}`);
  console.log("Response:", response.data);

  if (response.status === 201 && response.data._id) {
    createdUserId = response.data._id;
    console.log(`User created with ID: ${createdUserId}`);
  }

  return response;
}

async function testLogin(username = "testadmin2", password = "Password123") {
  console.log("\n--- Testing User Login ---");
  const loginData = {
    username,
    password,
  };

  const response = await callAPI("/auth/login", "POST", loginData);
  console.log(`Status: ${response.status}`);
  console.log("Response:", response.data);

  // Save token for later requests
  if (response.status === 200 && response.data.token) {
    authToken = response.data.token;
    console.log("Auth token saved for future requests");

    // Also save the user ID if not already set
    if (!createdUserId && response.data._id) {
      createdUserId = response.data._id;
      console.log(`User ID saved: ${createdUserId}`);
    }
  }

  return response;
}

async function testGetProfile() {
  console.log("\n--- Testing Get User Profile ---");

  if (!authToken) {
    console.log("Error: Not logged in. Please login first");
    return;
  }

  const response = await callAPI("/auth/profile", "GET", null, authToken);
  console.log(`Status: ${response.status}`);
  console.log("Response:", response.data);

  return response;
}

async function testCreateDepartment() {
  console.log("\n--- Testing Department Creation ---");

  if (!authToken) {
    console.log("Error: Not logged in. Please login first");
    return;
  }

  const deptData = {
    dept_name: "Engineering",
    description: "Software Engineering Department",
  };

  const response = await callAPI("/departments", "POST", deptData, authToken);
  console.log(`Status: ${response.status}`);
  console.log("Response:", response.data);

  if (response.status === 201 && response.data._id) {
    createdDeptId = response.data._id;
    console.log(`Department created with ID: ${createdDeptId}`);
  }

  return response;
}

async function testGetAllDepartments() {
  console.log("\n--- Testing Get All Departments ---");

  if (!authToken) {
    console.log("Error: Not logged in. Please login first");
    return;
  }

  const response = await callAPI("/departments", "GET", null, authToken);
  console.log(`Status: ${response.status}`);
  console.log("Response:", response.data);

  return response;
}

async function testCreateEmployee() {
  console.log("\n--- Testing Employee Creation ---");

  if (!authToken || !createdUserId || !createdDeptId) {
    console.log(
      "Error: Missing required IDs. Login and create department first"
    );
    return;
  }

  const employeeData = {
    user_id: createdUserId,
    dept_id: createdDeptId,
    designation: "Software Engineer",
    employee_code: "EMP001",
  };

  const response = await callAPI("/employees", "POST", employeeData, authToken);
  console.log(`Status: ${response.status}`);
  console.log("Response:", response.data);

  if (response.status === 201 && response.data._id) {
    createdEmployeeId = response.data._id;
    console.log(`Employee created with ID: ${createdEmployeeId}`);
  }

  return response;
}

async function testGetAllEmployees() {
  console.log("\n--- Testing Get All Employees ---");

  if (!authToken) {
    console.log("Error: Not logged in. Please login first");
    return;
  }

  const response = await callAPI("/employees", "GET", null, authToken);
  console.log(`Status: ${response.status}`);
  console.log("Response:", response.data);

  return response;
}

async function testCheckIn() {
  console.log("\n--- Testing Attendance Check-In ---");

  if (!authToken || !createdEmployeeId) {
    console.log("Error: Missing required IDs. Create employee first");
    return;
  }

  const checkInData = {
    emp_id: createdEmployeeId,
    check_in: new Date().toISOString(),
    remarks: "Test check-in",
  };

  const response = await callAPI(
    "/attendance/check-in",
    "POST",
    checkInData,
    authToken
  );
  console.log(`Status: ${response.status}`);
  console.log("Response:", response.data);

  return response;
}

async function testCheckOut() {
  console.log("\n--- Testing Attendance Check-Out ---");

  if (!authToken || !createdEmployeeId) {
    console.log("Error: Missing required IDs. Create employee first");
    return;
  }

  const checkOutData = {
    emp_id: createdEmployeeId,
    check_out: new Date().toISOString(),
    remarks: "Test check-out",
  };

  const response = await callAPI(
    "/attendance/check-out",
    "POST",
    checkOutData,
    authToken
  );
  console.log(`Status: ${response.status}`);
  console.log("Response:", response.data);

  return response;
}

async function testGetEmployeeAttendance() {
  console.log("\n--- Testing Get Employee Attendance ---");

  if (!authToken || !createdEmployeeId) {
    console.log("Error: Missing required IDs. Create employee first");
    return;
  }

  const response = await callAPI(
    `/attendance/employee/${createdEmployeeId}`,
    "GET",
    null,
    authToken
  );
  console.log(`Status: ${response.status}`);
  console.log("Response:", response.data);

  return response;
}

async function testCreateLeaveRequest() {
  console.log("\n--- Testing Leave Request Creation ---");

  if (!authToken || !createdEmployeeId) {
    console.log("Error: Missing required IDs. Create employee first");
    return;
  }

  try {
    // Get leave types from the correct API endpoint
    const leaveTypesResponse = await callAPI(
      "/leaves/types",
      "GET",
      null,
      authToken
    );

    if (
      leaveTypesResponse.status !== 200 ||
      !leaveTypesResponse.data ||
      leaveTypesResponse.data.length === 0
    ) {
      console.log("No leave types found, creating one...");

      // Create a leave type using the correct API endpoint
      const newLeaveTypeData = {
        leave_code: "AL",
        leave_name: "Annual Leave",
        description: "Regular paid leave for vacation or personal time",
        is_carry_forward: true,
        default_annual_quota: 20,
        requires_approval: true,
        max_consecutive_days: 15,
      };

      const createResponse = await callAPI(
        "/leaves/types",
        "POST",
        newLeaveTypeData,
        authToken
      );

      if (createResponse.status !== 201 || !createResponse.data) {
        console.log("Error creating leave type:", createResponse);
        return;
      }

      var leaveTypeId = createResponse.data._id;
      console.log(`Created leave type with ID: ${leaveTypeId}`);
    } else {
      var leaveTypeId = leaveTypesResponse.data[0]._id;
      console.log(`Using existing leave type with ID: ${leaveTypeId}`);
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 2); // 3-day leave

    const payload = {
      emp_id: createdEmployeeId,
      leave_type_id: leaveTypeId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      duration: 3,
      reason: "Annual vacation",
      status: "PENDING",
    };

    const response = await callAPI("/leaves", "POST", payload, authToken);

    console.log("Status:", response.status);
    console.log("Response:", response.data);

    createdLeaveId = response.data?._id;
    return response;
  } catch (error) {
    handleAxiosError(error);
    return null;
  }
}

async function testGetEmployeeLeaves() {
  console.log("\n--- Testing Get Employee Leaves ---");

  if (!authToken || !createdEmployeeId) {
    console.log("Error: Missing required IDs. Create employee first");
    return;
  }

  const response = await callAPI(
    `/leaves/employee/${createdEmployeeId}`,
    "GET",
    null,
    authToken
  );
  console.log(`Status: ${response.status}`);
  console.log("Response:", response.data);

  return response;
}

async function testAdminStats() {
  console.log("\n--- Testing Admin Stats ---");

  if (!authToken) {
    console.log("Error: Not logged in. Please login first");
    return;
  }

  const response = await callAPI("/admin/stats", "GET", null, authToken);
  console.log(`Status: ${response.status}`);
  console.log("Response:", response.data);

  return response;
}

// Make admin user function - to be used if we need to create an admin
async function makeUserAdmin(userId) {
  console.log("\n--- Making User Admin ---");

  if (!authToken || !userId) {
    console.log("Error: Not logged in or no user ID provided");
    return;
  }

  // First get the admin role ID
  const rolesResponse = await callAPI("/roles", "GET", null, authToken);
  if (rolesResponse.status !== 200) {
    console.log(`Error getting roles: ${rolesResponse.status}`);
    console.log(rolesResponse.data);
    return;
  }

  const adminRole = rolesResponse.data.find(
    (role) => role.role_name === "ADMIN"
  );
  if (!adminRole) {
    console.log("Admin role not found");
    return;
  }

  const response = await callAPI(
    `/admin/users/${userId}/roles`,
    "POST",
    {
      role_id: adminRole._id,
    },
    authToken
  );

  console.log(`Status: ${response.status}`);
  console.log("Response:", response.data);

  return response;
}

// Run tests
async function runTests() {
  try {
    // Auth Module Testing
    const registerResponse = await testRegisterUser();
    const loginResponse = await testLogin();
    await testGetProfile();

    // Making user an admin first (this should be fixed now but we'll leave it)
    if (createdUserId) {
      console.log("\n--- Making user an admin first ---");
      const adminResponse = await makeUserAdmin(createdUserId);
      if (adminResponse && adminResponse.status === 200) {
        console.log(
          "Successfully made user admin, logging in again to update token..."
        );
        await testLogin();
      } else {
        console.log(
          "Failed to make user admin, continuing with regular user permissions"
        );
      }
    }

    // Department Module Testing
    const deptResponse = await testGetAllDepartments();
    if (
      deptResponse.status === 200 &&
      deptResponse.data &&
      deptResponse.data.length > 0
    ) {
      createdDeptId = deptResponse.data[0]._id;
      console.log(`Using existing department with ID: ${createdDeptId}`);
    } else {
      await testCreateDepartment();
    }

    // Employee Module Testing
    const empResponse = await testGetAllEmployees();
    if (
      empResponse.status === 200 &&
      empResponse.data &&
      empResponse.data.length > 0
    ) {
      createdEmployeeId = empResponse.data[0]._id;
      console.log(`Using existing employee with ID: ${createdEmployeeId}`);
    } else {
      await testCreateEmployee();
    }

    // Attendance Module Testing
    await testCheckIn();
    await testCheckOut();
    await testGetEmployeeAttendance();

    // Leave Module Testing
    await testCreateLeaveRequest();
    await testGetEmployeeLeaves();

    // Admin Module Testing
    await testAdminStats();
  } catch (error) {
    console.error("Test failed:", error);
  }
}

runTests();
