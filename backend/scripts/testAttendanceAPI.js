import fetch from 'node-fetch';

// Test the attendance summary API
const testAttendanceSummary = async () => {
  try {
    // You'll need to replace this with a valid JWT token from a logged-in user
    const token = 'your-jwt-token-here';
    
    const response = await fetch('http://localhost:5003/api/user/attendance/summary', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Attendance Summary Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.error('Network error:', error.message);
  }
};

console.log('Testing attendance summary API...');
console.log('Note: You need to replace the token with a valid JWT token from the frontend.');
testAttendanceSummary();
