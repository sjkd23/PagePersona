/**
 * Test script to verify body size limits and clustering functionality
 */

import http from 'http';

// Test data - create a payload larger than 50KB
const largePayload = {
  data: 'a'.repeat(60 * 1024), // 60KB of data
};

const smallPayload = {
  data: 'hello world',
};

// Test function to make HTTP requests
function testRequest(payload, description) {
  const postData = JSON.stringify(payload);

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = http.request(options, (res) => {
    console.log(`${description}: Status ${res.statusCode}`);
    res.on('data', (chunk) => {
      console.log(`${description}: Response: ${chunk.toString()}`);
    });
  });

  req.on('error', (e) => {
    console.error(`${description}: Error: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

// Run tests
console.log('Testing body size limits...');
testRequest(smallPayload, 'Small payload (should succeed)');
testRequest(largePayload, 'Large payload (should fail with 413)');
