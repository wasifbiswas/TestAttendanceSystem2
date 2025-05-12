// Test script to verify notification endpoints
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

// Function to get a test token (this would normally be done through login)
async function getTestToken() {
  try {
    const response = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },      body: JSON.stringify({
        username: 'admin', // admin user with default password
        password: 'admin123' // default admin password
      }),
    });

    const data = await response.json();
    
    if (data.token) {
      return data.token;
    } else {
      console.error('Failed to get token:', data);
      return null;
    }
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

// Function to test the notification endpoint
async function testNotificationEndpoint(token) {
  if (!token) {
    console.error('No token provided');
    return;
  }

  try {
    console.log('Testing GET notifications endpoint...');
    const response = await fetch(`http://localhost:${PORT}/api/notifications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const statusCode = response.status;
    const data = await response.json();
    
    console.log('Status Code:', statusCode);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { statusCode, data };
  } catch (error) {
    console.error('Error testing notification endpoint:', error);
    return { error: error.message };
  }
}

// Main function
async function main() {
  console.log(`Testing notifications API on port ${PORT}...`);
  const token = await getTestToken();
  
  if (token) {
    console.log('Got token, testing endpoints...');
    await testNotificationEndpoint(token);
  } else {
    console.log('Failed to get token. Please check your credentials.');
  }
}

main().catch(console.error);
