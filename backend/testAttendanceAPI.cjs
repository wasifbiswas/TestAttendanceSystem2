const http = require("http");

console.log('🧪 Testing Admin Dashboard Endpoints...\n');

// Test system stats endpoint (Total Employees section)
console.log('📊 Testing /api/admin/stats (Total Employees section)...');

const options1 = {
  hostname: "localhost",
  port: 5003,
  path: "/api/admin/stats",
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

const req1 = http.request(options1, (res) => {
  console.log(`Status: ${res.statusCode}`);

  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const jsonData = JSON.parse(data);
      console.log("✅ System Stats Response:");
      console.log(`   Total Employees: ${jsonData.employees} (should include ALL employees including managers)`);
      console.log(`   Total Users: ${jsonData.users}`);
      console.log(`   Total Departments: ${jsonData.departments}`);
      console.log(`   Attendance: Present=${jsonData.attendance.present}, Absent=${jsonData.attendance.absent}, On Leave=${jsonData.attendance.onLeave}`);
      
      // Test role counts endpoint after this completes
      testRoleCounts();
      
    } catch (error) {
      console.log("Raw response:", data);
      console.log("Parse error:", error.message);
    }
  });
});

req1.on("error", (error) => {
  console.error("❌ Request failed:", error.message);
});

req1.end();

function testRoleCounts() {
  console.log('\n👥 Testing /api/admin/users/role-counts (Employee Summary by Role section)...');
  
  const options2 = {
    hostname: "localhost",
    port: 5003,
    path: "/api/admin/users/role-counts",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const req2 = http.request(options2, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const jsonData = JSON.parse(data);
        console.log("✅ Role Counts Response:");
        console.log(`   Employees: ${jsonData.employees.count} (should exclude managers)`);
        console.log(`   Managers: ${jsonData.managers.count} (managers only)`);
        console.log(`   Admins: ${jsonData.admins.count} (admins only)`);
        console.log('\n📋 Employee IDs:', jsonData.employees.ids);
        console.log('📋 Manager IDs:', jsonData.managers.ids);
        console.log('📋 Admin IDs:', jsonData.admins.ids);
        
        // Verify the logic
        const totalByRole = jsonData.employees.count + jsonData.managers.count + jsonData.admins.count;
        console.log(`\n🧮 Verification: ${jsonData.employees.count} + ${jsonData.managers.count} + ${jsonData.admins.count} = ${totalByRole}`);
        
        console.log('\n🎯 EXPECTED BEHAVIOR:');
        console.log('✅ Total Employees section should show ALL employees (including managers)');
        console.log('✅ Employee Summary by Role section should show:');
        console.log('   - Employees: only regular employees (excluding managers)');
        console.log('   - Managers: only managers');
        console.log('   - Admins: only admins');
        
      } catch (error) {
        console.log("Raw response:", data);
        console.log("Parse error:", error.message);
      }
    });
  });

  req2.on("error", (error) => {
    console.error("❌ Request failed:", error.message);
  });

  req2.end();
}
