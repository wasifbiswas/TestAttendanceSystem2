const https = require("https");

// Simple test script to check admin stats
const testAdminStats = async () => {
  try {
    const response = await fetch("http://localhost:5003/api/admin/stats", {
      method: "GET",
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkwNmRlMmZhMTUwZjgyOTg1MDYxYTMiLCJpYXQiOjE3MzQxODkyNjQsImV4cCI6MTczNDI3NTY2NH0.d8cRY4ynkv3sXGr4T3KqLqAD8uQXJEn8ZaVRJXs2iJI",
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Admin Stats Response:");
      console.log("Total Users:", data.users);
      console.log("Total Employees:", data.employees);
      console.log("Total Departments:", data.departments);
      console.log("Attendance:", data.attendance);
      console.log("Department Stats:", data.departmentStats);
    } else {
      console.log("❌ Error:", response.status, response.statusText);
      const errorText = await response.text();
      console.log("Error details:", errorText);
    }
  } catch (error) {
    console.log("❌ Request failed:", error.message);
  }
};

testAdminStats();
