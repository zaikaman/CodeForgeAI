#!/usr/bin/env node

/**
 * Copy pre-built ADK dist to backend node_modules
 * The ADK dist is committed to the repo with custom GPT-5 support and custom base URL
 */

const fs = require('fs');
const path = require('path');

const adkRoot = path.join(__dirname, '..', 'adk-ts', 'packages', 'adk');
const sourceDir = path.join(adkRoot, 'dist');
const targetDir = path.join(__dirname, '..', 'backend', 'node_modules', '@iqai', 'adk');
const packageJsonSource = path.join(adkRoot, 'package.json');
const packageJsonTarget = path.join(targetDir, 'package.json');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('� Copying pre-built custom ADK to backend node_modules...');

try {
  // Check if pre-built dist exists
  if (!fs.existsSync(sourceDir)) {
    console.error('✗ Pre-built ADK dist not found:', sourceDir);
    console.log('ℹ️  Please run "npm run build" in adk-ts/packages/adk first');
    console.log('ℹ️  Skipping custom ADK, will use npm package instead');
    process.exit(0); // Don't fail the build
  }

  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('✓ Created target directory:', targetDir);
  }

  // Copy dist files
  copyRecursiveSync(sourceDir, targetDir);
  console.log('✓ Copied ADK dist files');

  // Copy package.json
  if (fs.existsSync(packageJsonSource)) {
    fs.copyFileSync(packageJsonSource, packageJsonTarget);
    console.log('✓ Copied package.json');
  } else {
    console.error('✗ package.json not found:', packageJsonSource);
    process.exit(1);
  }

  console.log('✅ Custom ADK with GPT-5 support copied successfully!');
  console.log('   Files available at:', targetDir);
} catch (error) {
  console.error('✗ Error copying ADK:', error.message);
  console.log('ℹ️  Build will continue using npm package instead');
  process.exit(0); // Don't fail the main build
}
