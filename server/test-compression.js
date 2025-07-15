/**
 * Test script to verify compression middleware is working
 *
 * This script tests the compression middleware by making requests
 * to the server and checking if the response is compressed.
 */

const http = require('http');

async function testCompression() {
  console.log('🧪 Testing compression middleware...');

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);

      const contentEncoding = res.headers['content-encoding'];

      if (contentEncoding) {
        console.log(`✅ Response is compressed with: ${contentEncoding}`);
      } else {
        console.log('❌ Response is not compressed');
      }

      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        console.log(`Response length: ${data.length} bytes`);
        console.log(`Response: ${data}`);
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error);
      reject(error);
    });

    req.end();
  });
}

// Test with larger response
async function testLargeResponse() {
  console.log('\n🧪 Testing compression with larger response...');

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/transform/personas',
    method: 'GET',
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);

      const contentEncoding = res.headers['content-encoding'];

      if (contentEncoding) {
        console.log(`✅ Large response is compressed with: ${contentEncoding}`);
      } else {
        console.log('❌ Large response is not compressed');
      }

      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        console.log(`Response length: ${data.length} bytes`);
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error);
      reject(error);
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    await testCompression();
    await testLargeResponse();
    console.log('\n✅ Compression testing completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests();
