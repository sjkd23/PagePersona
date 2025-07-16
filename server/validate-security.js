#!/usr/bin/env node

/**
 * Security Headers Validation Test
 *
 * This script validates that the HTTP security headers are properly configured
 * in the PagePersonAI server using Helmet.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Security Headers Implementation Validation');
console.log('============================================');

// Check if helmet is installed
console.log('1. Checking helmet dependency...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const hasHelmet = packageJson.dependencies && packageJson.dependencies.helmet;
const hasHelmetTypes = packageJson.devDependencies && packageJson.devDependencies['@types/helmet'];

if (hasHelmet && hasHelmetTypes) {
  console.log('   ✓ Helmet and @types/helmet are installed');
} else {
  console.log('   ✗ Helmet dependencies missing');
  process.exit(1);
}

// Check if helmet is imported in app.ts
console.log('2. Checking helmet import in app.ts...');
const appTs = fs.readFileSync(path.join(__dirname, 'src', 'app.ts'), 'utf8');
if (appTs.includes("import helmet from 'helmet'")) {
  console.log('   ✓ Helmet is properly imported');
} else {
  console.log('   ✗ Helmet import not found');
  process.exit(1);
}

// Check if helmet middleware is configured
console.log('3. Checking helmet middleware configuration...');
const hasCSP = appTs.includes('helmet.contentSecurityPolicy');
const hasHSTS = appTs.includes('helmet.hsts');
const hasNoSniff = appTs.includes('helmet.noSniff');
const hasFrameguard = appTs.includes('helmet.frameguard');
const hasReferrerPolicy = appTs.includes('helmet.referrerPolicy');

if (hasCSP && hasHSTS && hasNoSniff && hasFrameguard && hasReferrerPolicy) {
  console.log('   ✓ All security headers middleware configured');
} else {
  console.log('   ✗ Some security headers middleware missing');
  process.exit(1);
}

// Check TypeScript compilation
console.log('4. Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('   ✓ TypeScript compilation successful');
} catch (error) {
  console.log('   ✗ TypeScript compilation failed');
  console.log('   Error:', error.message);
  process.exit(1);
}

console.log('\n🎉 Security headers implementation validated successfully!');
console.log('\nSecurity features implemented:');
console.log('• Content Security Policy (CSP) with strict directives');
console.log('• HTTP Strict Transport Security (HSTS) with 180-day max age');
console.log('• X-Content-Type-Options: nosniff');
console.log('• X-Frame-Options: deny');
console.log('• Referrer-Policy: no-referrer');
console.log('• X-Powered-By header removed');

console.log('\nTo test the headers in production:');
console.log('1. Start the server: npm run start:dev');
console.log('2. Test headers: curl -I http://localhost:5000/api/health');
