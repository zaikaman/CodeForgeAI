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

// Create a clean package.json without workspace: dependencies
function createDeployPackageJson(sourcePackage) {
  const pkg = JSON.parse(fs.readFileSync(sourcePackage, 'utf8'));
  
  // Remove workspace: dependencies from devDependencies
  if (pkg.devDependencies) {
    for (const dep in pkg.devDependencies) {
      if (pkg.devDependencies[dep].startsWith('workspace:')) {
        delete pkg.devDependencies[dep];
      }
    }
  }
  
  // Keep only necessary fields for deployment
  // Fix paths - remove dist/ prefix since files are already in root
  const main = pkg.main ? pkg.main.replace('dist/', '') : 'index.js';
  const types = pkg.types ? pkg.types.replace('dist/', '') : 'index.d.ts';
  
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    main: main,
    types: types,
    dependencies: pkg.dependencies,
    peerDependencies: pkg.peerDependencies,
    peerDependenciesMeta: pkg.peerDependenciesMeta
  };
}

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

  // Create clean package.json without workspace dependencies
  if (fs.existsSync(packageJsonSource)) {
    const cleanPackage = createDeployPackageJson(packageJsonSource);
    fs.writeFileSync(packageJsonTarget, JSON.stringify(cleanPackage, null, 2));
    console.log('✓ Created clean package.json (removed workspace dependencies)');
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
