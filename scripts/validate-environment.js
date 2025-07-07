#!/usr/bin/env node

/**
 * Pre-commit Environment Validation Script
 * 
 * This script ensures all critical environment variables are set
 * and validates the project structure before allowing commits.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-commit validation...\n');

// Critical files that must exist
const criticalFiles = [
  'server/.env',
  'client/package.json',
  'server/package.json',
  'client/src/components/PersonaSelector.tsx',
  'server/src/middleware/auth0-middleware.ts',
  'server/src/utils/web-scraper.ts'
];

// Environment variables that must be set
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'AUTH0_DOMAIN',
  'AUTH0_AUDIENCE',
  'JWT_SECRET',
  'MONGODB_URI'
];

let hasErrors = false;

// Check critical files
console.log('📁 Checking critical files...');
for (const file of criticalFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing critical file: ${file}`);
    hasErrors = true;
  } else {
    console.log(`✅ Found: ${file}`);
  }
}

// Check environment variables
console.log('\n🔐 Checking environment variables...');
const envPath = path.join(__dirname, '..', 'server', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  const envVars = {};
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
  
  for (const envVar of requiredEnvVars) {
    if (!envVars[envVar] || envVars[envVar] === '') {
      console.error(`❌ Missing or empty environment variable: ${envVar}`);
      hasErrors = true;
    } else {
      console.log(`✅ Found: ${envVar}`);
    }
  }
} else {
  console.error('❌ Missing .env file in server directory');
  hasErrors = true;
}

// Check for naming inconsistencies
console.log('\n📝 Checking for naming inconsistencies...');
const serverSrcPath = path.join(__dirname, '..', 'server', 'src');
if (fs.existsSync(serverSrcPath)) {
  const checkNamingConsistency = (dir, relativePath = '') => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const relativeFile = path.join(relativePath, file);
      
      if (fs.statSync(fullPath).isDirectory()) {
        checkNamingConsistency(fullPath, relativeFile);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        // Check for inconsistent naming patterns
        if (file.includes('webScraper') && !file.includes('web-scraper')) {
          console.warn(`⚠️  Potential naming inconsistency: ${relativeFile} (consider using kebab-case)`);
        }
        if (file.includes('serializeUser') && file.includes('Test') && !file.includes('test')) {
          console.warn(`⚠️  Potential test file naming inconsistency: ${relativeFile}`);
        }
      }
    });
  };
  
  checkNamingConsistency(serverSrcPath);
}

// Summary
console.log('\n📊 Validation Summary:');
if (hasErrors) {
  console.error('❌ Validation failed! Please fix the above issues before committing.');
  process.exit(1);
} else {
  console.log('✅ All validation checks passed! Ready for commit.');
  process.exit(0);
}
