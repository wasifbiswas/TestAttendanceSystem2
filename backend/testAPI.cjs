const http = require('http');

function testAttendanceSummaryAPI() {
  console.log('🧪 Testing /api/user/attendance/summary endpoint...\n');
  
  // We need to test without authentication first to see the response
  const options = {
    hostname: 'localhost',
    port: 5004,
    path: '/api/user/attendance/summary',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📡 Response Status: ${res.statusCode}`);
    console.log(`📡 Response Headers: ${JSON.stringify(res.headers, null, 2)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n📄 Response Body:');
      try {
        const jsonResponse = JSON.parse(data);
        console.log(JSON.stringify(jsonResponse, null, 2));
        
        if (res.statusCode === 401) {
          console.log('\n🔐 Expected: Unauthorized (need valid JWT token)');
          console.log('✅ This confirms the endpoint is protected and working');
        } else if (res.statusCode === 200) {
          console.log('\n✅ Success! API returned attendance data');
          if (jsonResponse.stats) {
            console.log('\n📊 Attendance Stats:', jsonResponse.stats);
          }
        }
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
  });

  req.end();
}

// Test the endpoint
testAttendanceSummaryAPI();
