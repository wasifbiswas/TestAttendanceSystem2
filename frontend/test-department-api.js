// Simple Department API Test
// Run this in your browser console on the department management page

async function testDepartmentAPI() {
  console.log("🧪 Testing Department API...\n");

  const baseURL = "http://localhost:5003/api";

  // Get token from localStorage (same way the app does)
  const storedAuth = localStorage.getItem("auth-storage");
  let token = null;

  if (storedAuth) {
    try {
      const parsedAuth = JSON.parse(storedAuth);
      token = parsedAuth.state?.token;
    } catch (error) {
      console.error("❌ Error parsing auth storage:", error);
      return;
    }
  }

  if (!token) {
    console.error(
      "❌ No authentication token found. Please login as admin first."
    );
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    // Test 1: Get Department Statistics
    console.log("1️⃣ Testing GET /api/departments/stats...");
    const statsResponse = await fetch(`${baseURL}/departments/stats`, {
      headers,
    });
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log("✅ Department Stats:", stats);
    } else {
      console.error("❌ Stats failed:", await statsResponse.text());
    }

    // Test 2: Get All Departments
    console.log("\n2️⃣ Testing GET /api/departments...");
    const deptsResponse = await fetch(`${baseURL}/departments?page=1&limit=5`, {
      headers,
    });
    if (deptsResponse.ok) {
      const depts = await deptsResponse.json();
      console.log("✅ Departments List:", depts);

      // Test 3: Get Department Details (if any departments exist)
      if (depts.departments && depts.departments.length > 0) {
        const firstDept = depts.departments[0];
        console.log(`\n3️⃣ Testing GET /api/departments/${firstDept._id}...`);
        const detailResponse = await fetch(
          `${baseURL}/departments/${firstDept._id}`,
          { headers }
        );
        if (detailResponse.ok) {
          const details = await detailResponse.json();
          console.log("✅ Department Details:", details);
        } else {
          console.error(
            "❌ Department details failed:",
            await detailResponse.text()
          );
        }
      }
    } else {
      console.error("❌ Departments list failed:", await deptsResponse.text());
    }

    // Test 4: Create Test Department
    console.log("\n4️⃣ Testing POST /api/departments (create)...");
    const testDepartment = {
      dept_name: `Test Dept ${Date.now()}`,
      description: "API Test Department",
      status: "ACTIVE",
      location: "API Test Location",
      budget: 25000,
    };

    const createResponse = await fetch(`${baseURL}/departments`, {
      method: "POST",
      headers,
      body: JSON.stringify(testDepartment),
    });

    if (createResponse.ok) {
      const created = await createResponse.json();
      console.log("✅ Department Created:", created);

      // Test 5: Update the created department
      console.log("\n5️⃣ Testing PUT /api/departments/:id (update)...");
      const updateData = {
        description: "Updated API Test Department",
        budget: 30000,
      };

      const updateResponse = await fetch(
        `${baseURL}/departments/${created.department._id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(updateData),
        }
      );

      if (updateResponse.ok) {
        const updated = await updateResponse.json();
        console.log("✅ Department Updated:", updated);
      } else {
        console.error(
          "❌ Department update failed:",
          await updateResponse.text()
        );
      }

      // Test 6: Delete the test department
      console.log("\n6️⃣ Testing DELETE /api/departments/:id...");
      const deleteResponse = await fetch(
        `${baseURL}/departments/${created.department._id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (deleteResponse.ok) {
        const deleted = await deleteResponse.json();
        console.log("✅ Department Deleted:", deleted);
      } else {
        console.error(
          "❌ Department deletion failed:",
          await deleteResponse.text()
        );
      }
    } else {
      console.error(
        "❌ Department creation failed:",
        await createResponse.text()
      );
    }

    console.log("\n🎉 Department API tests completed!");
    console.log("\nℹ️  If you see any ❌ errors above, check:");
    console.log("   • Backend server is running on port 5003");
    console.log("   • You are logged in as an admin user");
    console.log("   • Database connection is working");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test
testDepartmentAPI();
