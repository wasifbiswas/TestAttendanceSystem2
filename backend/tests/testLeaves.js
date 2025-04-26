import fetch from "node-fetch";
import colors from 'colors';

const API_URL = "http://localhost:5000/api";
let authToken = "";
let createdUserId = "";
let createdEmployeeId = "";
let leaveTypesMap = {};

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

// Login function
async function login() {
  console.log("\n--- Logging in as testadmin2 ---");
  const loginData = {
    username: "testadmin2",
    password: "Password123",
  };

  const response = await callAPI("/auth/login", "POST", loginData);
  console.log(`Status: ${response.status}`);

  if (response.status === 200 && response.data.token) {
    authToken = response.data.token;
    createdUserId = response.data._id;
    console.log("Auth token saved for future requests");

    // Verify user roles
    const userResponse = await callAPI("/auth/profile", "GET", null, response.data.token);
    if (userResponse.status === 200) {
      console.log("User roles:", userResponse.data.roles);
    }
  } else {
    console.error("Login failed:", response.data);
    process.exit(1);
  }
}

// Get all leave types
async function getAllLeaveTypes() {
  console.log("\n--- Getting all leave types ---");

  const response = await callAPI("/leaves/types", "GET", null, authToken);
  console.log(`Status: ${response.status}`);
  console.log(`Found ${response.data.length} leave types`);

  // Create a map of leave code to leave ID for easier access
  response.data.forEach((leaveType) => {
    leaveTypesMap[leaveType.leave_code] = leaveType._id;
    console.log(
      `- ${leaveType.leave_name} (${leaveType.leave_code}): ${leaveType.default_annual_quota} days`
    );
  });
}

// Get or create employee
async function getOrCreateEmployee() {
  console.log("\n--- Getting or creating test employee ---");

  // First check if there are existing employees
  const empResponse = await callAPI("/employees", "GET", null, authToken);

  if (
    empResponse.status === 200 &&
    empResponse.data &&
    empResponse.data.length > 0
  ) {
    createdEmployeeId = empResponse.data[0]._id;
    console.log(`Using existing employee with ID: ${createdEmployeeId}`);
    return;
  }

  // Create a department if none exists
  let deptId;
  const deptResponse = await callAPI("/departments", "GET", null, authToken);

  if (
    deptResponse.status === 200 &&
    deptResponse.data &&
    deptResponse.data.length > 0
  ) {
    deptId = deptResponse.data[0]._id;
    console.log(`Using existing department with ID: ${deptId}`);
  } else {
    // Create a new department
    const createDeptResponse = await callAPI(
      "/departments",
      "POST",
      {
        dept_name: "Engineering",
        description: "Software Engineering Department",
      },
      authToken
    );

    if (createDeptResponse.status === 201) {
      deptId = createDeptResponse.data._id;
      console.log(`Created new department with ID: ${deptId}`);
    } else {
      console.error("Failed to create department:", createDeptResponse.data);
      return;
    }
  }

  // Create a new employee
  const createEmpResponse = await callAPI(
    "/employees",
    "POST",
    {
      user_id: createdUserId,
      dept_id: deptId,
      designation: "Software Engineer",
      employee_code: "EMP002",
    },
    authToken
  );

  if (createEmpResponse.status === 201) {
    createdEmployeeId = createEmpResponse.data._id;
    console.log(`Created new employee with ID: ${createdEmployeeId}`);
  } else {
    console.error("Failed to create employee:", createEmpResponse.data);
  }
}

// Create leave requests for different leave types
async function createLeaveRequests() {
  if (!createdEmployeeId) {
    console.error("No employee ID available. Cannot create leave requests.");
    return;
  }

  console.log("\n--- Creating leave requests for different leave types ---");

  // Define the leave types to test (use all or a subset)
  const leaveTypesToTest = [
    { code: "AL", name: "Annual Leave", days: 3, reason: "Annual vacation" },
    { code: "SL", name: "Sick Leave", days: 2, reason: "Flu and fever" },
    { code: "CL", name: "Casual Leave", days: 1, reason: "Personal errand" },
    { code: "ML", name: "Maternity Leave", days: 20, reason: "Maternity" }, // Reduce to stay under limit
    { code: "PL", name: "Paternity Leave", days: 5, reason: "Paternity" },
    {
      code: "BL",
      name: "Bereavement Leave",
      days: 3,
      reason: "Family funeral",
    },
    { code: "MRL", name: "Marriage Leave", days: 5, reason: "Getting married" },
    { code: "STL", name: "Study Leave", days: 2, reason: "Exam preparation" },
    { code: "UPL", name: "Unpaid Leave", days: 10, reason: "Extended break" },
    { code: "WFH", name: "Work From Home", days: 5, reason: "Home office" },
    {
      code: "COMP",
      name: "Compensatory Off",
      days: 1,
      reason: "Worked weekend",
    },
  ];

  // Loop through each leave type and create a request
  for (const leaveType of leaveTypesToTest) {
    if (!leaveTypesMap[leaveType.code]) {
      console.log(`Skipping ${leaveType.name} - no matching leave type found`);
      continue;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Start a week from now

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + leaveType.days - 1);

    const leaveData = {
      emp_id: createdEmployeeId,
      leave_type_id: leaveTypesMap[leaveType.code],
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      duration: leaveType.days,
      reason: leaveType.reason,
      status: "PENDING",
    };

    console.log(
      `\nCreating ${leaveType.name} request for ${leaveType.days} days`
    );
    const response = await callAPI("/leaves", "POST", leaveData, authToken);

    if (response.status === 201) {
      console.log(
        `Successfully created ${leaveType.name} request (ID: ${response.data._id})`
      );
    } else {
      console.log(
        `Failed to create ${leaveType.name} request: ${JSON.stringify(
          response.data
        )}`
      );
    }
  }
}

// Get all employee leaves
async function getEmployeeLeaves() {
  console.log("\n--- Getting all leave requests for the employee ---");

  const response = await callAPI(
    `/leaves/employee/${createdEmployeeId}`,
    "GET",
    null,
    authToken
  );

  console.log(`Status: ${response.status}`);
  console.log(`Total leave requests: ${response.data.length}`);

  // Summarize the leaves by type
  const leavesByType = {};

  response.data.forEach((leave) => {
    const leaveTypeName = leave.leave_type_id ? leave.leave_type_id.leave_name : 'Unknown';
    if (!leavesByType[leaveTypeName]) {
      leavesByType[leaveTypeName] = 0;
    }
    leavesByType[leaveTypeName]++;
  });

  console.log("\nLeave requests by type:");
  Object.keys(leavesByType).forEach((type) => {
    console.log(`- ${type}: ${leavesByType[type]} request(s)`);
  });
}

// Approve a random leave request
async function approveRandomLeave() {
  console.log("\n--- Approving a random leave request ---");

  const response = await callAPI(
    `/leaves/employee/${createdEmployeeId}`,
    "GET",
    null,
    authToken
  );

  if (response.status !== 200 || !response.data || response.data.length === 0) {
    console.log("No leave requests available to approve");
    return;
  }

  // Filter for pending requests
  const pendingLeaves = response.data.filter(
    (leave) => leave.status === "PENDING"
  );

  if (pendingLeaves.length === 0) {
    console.log("No pending leave requests available to approve");
    return;
  }

  // Select a random leave request
  const randomIndex = Math.floor(Math.random() * pendingLeaves.length);
  const leaveToApprove = pendingLeaves[randomIndex];

  console.log(
    `Approving ${
      leaveToApprove.leave_type_id.leave_name
    } request from ${new Date(
      leaveToApprove.start_date
    ).toLocaleDateString()} to ${new Date(
      leaveToApprove.end_date
    ).toLocaleDateString()}`
  );

  const approvalResponse = await callAPI(
    `/leaves/${leaveToApprove._id}/status`,
    "PUT",
    {
      request_id: leaveToApprove._id,
      status: "APPROVED",
    },
    authToken
  );

  if (approvalResponse.status === 200) {
    console.log("Leave request approved successfully");
  } else {
    console.log("Failed to approve leave request:", approvalResponse.data);
  }
}

// Reject a random leave request
async function rejectRandomLeave() {
  console.log("\n--- Rejecting a random leave request ---");

  const response = await callAPI(
    `/leaves/employee/${createdEmployeeId}`,
    "GET",
    null,
    authToken
  );

  if (response.status !== 200 || !response.data || response.data.length === 0) {
    console.log("No leave requests available to reject");
    return;
  }

  // Filter for pending requests
  const pendingLeaves = response.data.filter(
    (leave) => leave.status === "PENDING"
  );

  if (pendingLeaves.length === 0) {
    console.log("No pending leave requests available to reject");
    return;
  }

  // Select a random leave request
  const randomIndex = Math.floor(Math.random() * pendingLeaves.length);
  const leaveToReject = pendingLeaves[randomIndex];

  console.log(
    `Rejecting ${
      leaveToReject.leave_type_id.leave_name
    } request from ${new Date(
      leaveToReject.start_date
    ).toLocaleDateString()} to ${new Date(
      leaveToReject.end_date
    ).toLocaleDateString()}`
  );

  const rejectionResponse = await callAPI(
    `/leaves/${leaveToReject._id}/status`,
    "PUT",
    {
      request_id: leaveToReject._id,
      status: "REJECTED",
      rejection_reason: "Business requirements",
    },
    authToken
  );

  if (rejectionResponse.status === 200) {
    console.log("Leave request rejected successfully");
  } else {
    console.log("Failed to reject leave request:", rejectionResponse.data);
  }
}

// Get employee leave balances
async function getLeaveBalances() {
  console.log("\n--- Getting employee leave balances ---");
  try {
    const response = await callAPI(
      `/leaves/balance/${createdEmployeeId}`,
      "GET",
      null,
      authToken
    );

    console.log(`Status: ${response.status}`);
    if (response.status === 200 && Array.isArray(response.data)) {
      console.log("\nLeave balances:");
      response.data.forEach(balance => {
        if (!balance.leave_type_id) {
          console.log(`- Unknown leave type: ${balance.allocated_leaves} allocated`);
          return;
        }

        const allocated = parseInt(balance.allocated_leaves) || 0;
        const used = parseInt(balance.used_leaves) || 0;
        const pending = parseInt(balance.pending_leaves) || 0;
        const carried = parseInt(balance.carried_forward) || 0;
        const available = allocated + carried - used - pending;

        const balanceStr = 
          `- ${balance.leave_type_id.leave_name} (${balance.leave_type_id.leave_code}): ` +
          `${available} available = ${allocated} allocated + ${carried} carried forward - ${used} used - ${pending} pending`;
          
        console.log(balanceStr);
      });
    }
  } catch (error) {
    console.log("Error fetching leave balances:", error);
  }
}

// Main function to run all tests
async function runTests() {
  try {
    await login();
    await getAllLeaveTypes();
    await getOrCreateEmployee();
    await createLeaveRequests();
    await getEmployeeLeaves();
    await approveRandomLeave();
    await rejectRandomLeave();
    await getLeaveBalances();

    console.log("\n--- All leave tests completed successfully ---");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the tests
runTests();
