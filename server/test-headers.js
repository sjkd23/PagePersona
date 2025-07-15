const http = require('http');

// Test the security headers implementation
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET',
};

console.log('Testing security headers...');

const req = http.request(options, (res) => {
  console.log('✓ Server is running');
  console.log('Status Code:', res.statusCode);
  console.log('Security Headers:');
  console.log('  Content-Security-Policy:', res.headers['content-security-policy'] || 'Not set');
  console.log(
    '  Strict-Transport-Security:',
    res.headers['strict-transport-security'] || 'Not set',
  );
  console.log('  X-Frame-Options:', res.headers['x-frame-options'] || 'Not set');
  console.log('  X-Content-Type-Options:', res.headers['x-content-type-options'] || 'Not set');
  console.log('  Referrer-Policy:', res.headers['referrer-policy'] || 'Not set');
  console.log('  X-Powered-By:', res.headers['x-powered-by'] || 'Not set (Good!)');

  process.exit(0);
});

req.on('error', (error) => {
  console.error('✗ Error connecting to server:', error.message);
  console.log('Make sure the server is running on localhost:5000');
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.error('✗ Request timed out');
  console.log('Make sure the server is running on localhost:5000');
  process.exit(1);
});

req.end();
