#!/usr/bin/env node

/**
 * Copy local ADK dist files to backend node_modules
 * This ensures TypeScript can find type declarations during Vercel build
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'adk-ts', 'packages', 'adk', 'dist');
const targetDir = path.join(__dirname, '..', 'backend', 'node_modules', '@iqai', 'adk');
const packageJsonSource = path.join(__dirname, '..', 'adk-ts', 'packages', 'adk', 'package.json');
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

console.log('📦 Copying local ADK to backend node_modules...');

try {
  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('✓ Created target directory:', targetDir);
  }

  // Copy dist files
  if (fs.existsSync(sourceDir)) {
    copyRecursiveSync(sourceDir, targetDir);
    console.log('✓ Copied ADK dist files');
  } else {
    console.error('✗ Source directory not found:', sourceDir);
    process.exit(1);
  }

  // Copy package.json
  if (fs.existsSync(packageJsonSource)) {
    fs.copyFileSync(packageJsonSource, packageJsonTarget);
    console.log('✓ Copied package.json');
  } else {
    console.error('✗ package.json not found:', packageJsonSource);
    process.exit(1);
  }

  console.log('✅ ADK copied successfully!');
  console.log('   Files available at:', targetDir);
} catch (error) {
  console.error('✗ Error copying ADK:', error.message);
  process.exit(1);
}
