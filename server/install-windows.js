#!/usr/bin/env node

/**
 * Windows Installation Helper
 * Handles bcrypt installation issues on Windows systems
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Monthly Updates - Windows Installation Helper');
console.log('='.repeat(50));

function runCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function checkPackageJson() {
  const packagePath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json not found. Are you in the server directory?');
    process.exit(1);
  }
}

function main() {
  checkPackageJson();

  console.log('\n🔍 Attempting to install dependencies...');
  
  // Try normal npm install first
  if (runCommand('npm install', 'Standard npm install')) {
    console.log('\n🎉 Installation completed successfully!');
    return;
  }

  console.log('\n⚠️  Standard installation failed. Trying alternative methods...');

  // Try with strict SSL disabled
  console.log('\n🔧 Attempting with strict SSL disabled...');
  runCommand('npm config set strict-ssl false', 'Disabling strict SSL');
  
  if (runCommand('npm install', 'npm install with strict SSL disabled')) {
    console.log('\n🎉 Installation completed with SSL disabled!');
    console.log('⚠️  Note: SSL was disabled for this installation. You may want to re-enable it later with:');
    console.log('   npm config set strict-ssl true');
    return;
  }

  // Try alternative registry
  console.log('\n🔧 Attempting with HTTP registry...');
  runCommand('npm config set registry http://registry.npmjs.org/', 'Setting HTTP registry');
  
  if (runCommand('npm install', 'npm install with HTTP registry')) {
    console.log('\n🎉 Installation completed with HTTP registry!');
    return;
  }

  // Try installing without sqlite3 first
  console.log('\n🔧 Installing dependencies without sqlite3...');
  runCommand('npm install --omit=optional', 'Installing without optional dependencies');
  
  // Try to get sqlite3 prebuilt binary
  console.log('\n🔧 Attempting to install sqlite3 with prebuilt binary...');
  if (runCommand('npm install sqlite3@5.1.7 --fallback-to-build=false', 'Installing sqlite3 prebuilt')) {
    console.log('\n🎉 Installation completed with sqlite3!');
    return;
  }
  
  console.log('\n⚠️  Could not install sqlite3 - will run without SQLite support');
  console.log('The server will use MySQL only mode.');

  console.log('\n❌ All installation methods failed.');
  console.log('💡 Manual steps to try:');
  console.log('   1. Install Visual Studio Build Tools');
  console.log('   2. Install Python 3.x');
  console.log('   3. Set npm config: npm config set msvs_version 2019');
  console.log('   4. Try: npm install --build-from-source');
  console.log('   5. Consider using WSL (Windows Subsystem for Linux)');
}

main();