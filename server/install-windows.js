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

  // Try replacing bcrypt with bcryptjs
  console.log('\n🔧 Attempting to replace bcrypt with bcryptjs...');
  runCommand('npm uninstall bcrypt', 'Uninstalling bcrypt');
  
  if (runCommand('npm install bcryptjs', 'Installing bcryptjs as alternative')) {
    console.log('\n⚠️  bcrypt has been replaced with bcryptjs.');
    console.log('⚠️  You may need to update imports in your code from "bcrypt" to "bcryptjs"');
    
    // Install remaining dependencies
    if (runCommand('npm install', 'Installing remaining dependencies')) {
      console.log('\n🎉 Installation completed with bcryptjs alternative!');
      return;
    }
  }

  console.log('\n❌ All installation methods failed.');
  console.log('💡 Manual steps to try:');
  console.log('   1. Install Visual Studio Build Tools');
  console.log('   2. Install Python 3.x');
  console.log('   3. Set npm config: npm config set msvs_version 2019');
  console.log('   4. Try: npm install --build-from-source');
  console.log('   5. Consider using WSL (Windows Subsystem for Linux)');
}

main();