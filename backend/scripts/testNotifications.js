import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../");

// Load environment variables
dotenv.config({ path: path.join(rootDir, ".env") });

// Define the port
const PORT = process.env.PORT || 5003;
const BASE_URL = `http://localhost:${PORT}`;
let authToken = '';

console.log(`Testing notification system on port ${PORT}...`);

// Login and get token
async function login(email = 'admin', password = 'admin123') {
  try {
    console.log(`Logging in as ${email}...`);
    
    // Try different login endpoints
    const endpoints = [
      `${BASE_URL}/api/auth/login`,
      `${BASE_URL}/api/users/login`
    ];
    
    let success = false;
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying login endpoint: ${endpoint}`);        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: endpoint.includes('/auth/login') 
            ? JSON.stringify({ username: email, password }) // Auth endpoint uses username
            : JSON.stringify({ email, password }), // Other endpoints might use email
        });
        
        // Get response as text first to handle potential non-JSON responses
        const responseText = await response.text();
        let data;
        
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Response is not valid JSON:', responseText);
          data = { error: 'Invalid JSON response', raw: responseText };
        }
        
        if (response.ok && data.token) {
          console.log('Login successful!');
          authToken = data.token;
          success = true;
          break;
        } else {
          lastError = data;
          console.log(`Login failed at ${endpoint}:`, data);
        }
      } catch (endpointError) {
        console.log(`Error with endpoint ${endpoint}:`, endpointError.message);
        lastError = endpointError;
      }
    }
    
    if (success) {
      return true;
    } else {
      console.error('All login attempts failed. Last error:', lastError);
      return false;
    }
  } catch (error) {
    console.error('Unexpected error during login:', error);
    return false;
  }
}

// Test API connectivity
async function testApiConnectivity() {
  try {
    console.log('Testing API connectivity...');
    const response = await fetch(`${BASE_URL}/api/debug`);
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      console.log('API connection successful!');
      console.log('API INFO:', data);
      return true;
    } else {
      console.error('API connection failed:', data);
      return false;
    }
  } catch (error) {
    console.error('Error connecting to API:', error);
    console.log('Attempting connection to alternative endpoint...');
    
    try {
      // Attempt to connect to the health check or another endpoint
      const altResponse = await fetch(`${BASE_URL}/api/health`);
      if (altResponse.ok) {
        console.log('Alternative API connection successful!');
        return true;
      } else {
        console.error('Alternative API connection failed');
        return false;
      }
    } catch (altError) {
      console.error('Error connecting to alternative endpoint:', altError);
      return false;
    }
  }
}

// Test notifications endpoint
async function testNotificationsEndpoint() {
  try {
    console.log('Testing notifications endpoint...');
    
    if (!authToken) {
      console.error('No auth token available. Please login first.');
      return false;
    }
    
    const response = await fetch(`${BASE_URL}/api/notifications`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Notifications endpoint test successful!');
      console.log('Notifications data:', {
        success: data.success,
        count: data.count,
        total: data.total,
        unread: data.unread
      });
      return true;
    } else {
      console.error('Notifications endpoint test failed:', data);
      return false;
    }
  } catch (error) {
    console.error('Error testing notifications endpoint:', error);
    return false;
  }
}

// Create a notification
async function createNotification() {
  try {
    console.log('Creating a test notification...');
    
    if (!authToken) {
      console.error('No auth token available. Please login first.');
      return false;
    }
    
    // Create a unique message to help identify this notification
    const timestamp = new Date().toISOString();
    const uniqueId = Math.floor(Math.random() * 1000000);
    
    const notificationData = {
      title: `Test Notification [${uniqueId}]`,
      message: `This is a test notification created by the diagnostic script at ${timestamp}. Unique ID: ${uniqueId}`,
      all_employees: true,
      priority: 'medium',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };
    
    console.log('Notification data to send:', notificationData);
    console.log('Using auth token:', authToken.substring(0, 10) + '...');
    
    const response = await fetch(`${BASE_URL}/api/notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationData)
    });
    
    // Get the raw response text first
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Response is not valid JSON:', responseText);
      return false;
    }
    
    if (response.ok && data.success) {
      console.log('Notification created successfully!');
      console.log('Notification data:', {
        id: data.data?._id || 'N/A',
        title: data.data?.title || 'N/A',
        recipients: data.data?.recipients?.length || 0
      });
      
      // Store the created notification ID for verification
      const createdNotificationId = data.data?._id;
      
      // Verify the notification was actually created
      if (createdNotificationId) {
        await verifyNotificationCreated(createdNotificationId, uniqueId);
      }
      
      return true;
    } else {
      console.error('Failed to create notification. Status:', response.status);
      console.error('Response data:', data);
      return false;
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

// Verify the notification was created
async function verifyNotificationCreated(notificationId, uniqueId) {
  try {
    console.log(`Verifying notification creation (ID: ${notificationId}, Unique ID: ${uniqueId})...`);
    
    // Fetch user notifications
    const response = await fetch(`${BASE_URL}/api/notifications`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch notifications for verification');
      return false;
    }
    
    const data = await response.json();
    
    if (data.success && data.data && data.data.length > 0) {
      // Look for our notification by ID or unique identifier in title
      const foundById = data.data.find(n => n._id === notificationId);
      const foundByUniqueId = data.data.find(n => n.title.includes(`[${uniqueId}]`));
      
      if (foundById) {
        console.log('✅ Notification verified by ID!');
        return true;
      } else if (foundByUniqueId) {
        console.log('✅ Notification verified by unique identifier!');
        return true;
      } else {
        console.error('❌ Notification was created but not found in user notifications');
        console.log('Available notifications:', data.data.map(n => ({ id: n._id, title: n.title })));
        return false;
      }
    } else {
      console.error('❌ No notifications found for verification');
      return false;
    }
  } catch (error) {
    console.error('Error verifying notification:', error);
    return false;
  }
}

// Print API route information
function printApiRoutes() {
  console.log('\n🛣️  API Route Information:');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('Expected endpoints:');
  console.log('  - Login: /api/auth/login or /api/users/login');
  console.log('  - Notifications: /api/notifications');
  console.log('  - Debug: /api/debug');
  console.log('  - Health: /api/health');
}

// Main test function
async function runTests() {
  console.log('\n🔍 NOTIFICATION SYSTEM TEST 🔍');
  console.log('===============================');
  
  // Print API route information
  printApiRoutes();
  
  // Test results
  const results = {
    apiConnectivity: false,
    login: false,
    notificationsEndpoint: false,
    createNotification: false
  };
  
  // Test API connectivity
  results.apiConnectivity = await testApiConnectivity();
  if (!results.apiConnectivity) {
    console.error('❌ API connectivity test failed. Continuing with other tests...');
  }
  
  // Login
  results.login = await login();
  if (!results.login) {
    console.error('❌ Login failed. Some tests may not work.');
  }
  
  // Test notifications endpoint
  results.notificationsEndpoint = await testNotificationsEndpoint();
  if (!results.notificationsEndpoint) {
    console.error('❌ Notifications endpoint test failed.');
  }
  
  // Create a notification
  results.createNotification = await createNotification();
  if (!results.createNotification) {
    console.error('❌ Create notification test failed.');
  }
  
  // Print test summary
  console.log('\n📊 Test Summary:');
  console.log('===============================');
  console.log(`API Connectivity:        ${results.apiConnectivity ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Login Authentication:    ${results.login ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Notifications Endpoint:  ${results.notificationsEndpoint ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Create Notification:     ${results.createNotification ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('===============================');
  
  // Overall result
  const overallSuccess = Object.values(results).every(result => result === true);
  console.log(`\n🔍 TEST ${overallSuccess ? '✅ PASSED' : '❌ FAILED'} 🔍`);
  
  // Further debugging suggestions if tests failed
  if (!overallSuccess) {
    console.log('\n🛠️  Debugging Suggestions:');
    if (!results.apiConnectivity) {
      console.log('- Check if the backend server is running');
      console.log(`- Verify the server is listening on port ${PORT}`);
      console.log('- Check for network/firewall issues blocking connections');
    }
    if (!results.login) {
      console.log('- Verify admin credentials in the backend database');
      console.log('- Check the authentication routes in the backend');
    }
    if (!results.notificationsEndpoint) {
      console.log('- Check the notifications routes in the backend');
      console.log('- Verify the route permissions and middleware');
    }
    if (!results.createNotification) {
      console.log('- Check the notification creation controller logic');
      console.log('- Verify the request format matches what the API expects');
      console.log('- Look for validation errors in the request handling');
    }
  }
}

// Run the tests
runTests().catch(console.error);
