const http = require("http");

const options = {
  hostname: "localhost",
  port: 5003,
  path: "/api/admin/stats",
  method: "GET",
  headers: {
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkwNmRlMmZhMTUwZjgyOTg1MDYxYTMiLCJpYXQiOjE3MzQxODkyNjQsImV4cCI6MTczNDI3NTY2NH0.d8cRY4ynkv3sXGr4T3KqLqAD8uQXJEn8ZaVRJXs2iJI",
    "Content-Type": "application/json",
  },
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const jsonData = JSON.parse(data);
      console.log("\n✅ Admin Stats Response:");
      console.log("Total Users:", jsonData.users);
      console.log("Total Employees:", jsonData.employees);
      console.log("Total Departments:", jsonData.departments);
      console.log("Attendance Today:", jsonData.attendance);
      if (jsonData.departmentStats) {
        console.log("Department Stats:", jsonData.departmentStats);
      }
    } catch (error) {
      console.log("Raw response:", data);
      console.log("Parse error:", error.message);
    }
  });
});

req.on("error", (error) => {
  console.error("Request failed:", error.message);
});

req.end();
