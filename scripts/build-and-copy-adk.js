#!/usr/bin/env node

/**
 * Build local ADK and copy to backend node_modules
 * This ensures we use the custom ADK with GPT-5 support and custom base URL
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

console.log('🔨 Building local ADK with custom modifications...');

try {
  // Check if ADK source exists
  if (!fs.existsSync(adkRoot)) {
    console.error('✗ ADK source directory not found:', adkRoot);
    console.log('ℹ️  Skipping custom ADK build, will use npm package instead');
    process.exit(0); // Don't fail the build
  }

  // Check if pnpm is available
  let hasPnpm = false;
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    hasPnpm = true;
  } catch {
    console.log('⚠️  pnpm not found, installing...');
    try {
      execSync('npm install -g pnpm@9.0.0', { stdio: 'inherit' });
      hasPnpm = true;
    } catch (error) {
      console.log('⚠️  Could not install pnpm, trying with npm...');
    }
  }

  // Install ADK dependencies if node_modules doesn't exist
  const adkNodeModules = path.join(adkRoot, 'node_modules');
  if (!fs.existsSync(adkNodeModules)) {
    console.log('📦 Installing ADK dependencies...');
    const adkTsRoot = path.join(__dirname, '..', 'adk-ts');
    
    if (hasPnpm) {
      execSync('pnpm install --filter @iqai/adk', { 
        cwd: adkTsRoot,
        stdio: 'inherit'
      });
    } else {
      // Fallback to npm
      execSync('npm install', { 
        cwd: adkRoot,
        stdio: 'inherit'
      });
    }
  }

  // Build ADK
  console.log('🏗️  Building ADK...');
  if (hasPnpm) {
    execSync('pnpm build', {
      cwd: adkRoot,
      stdio: 'inherit'
    });
  } else {
    execSync('npm run build', {
      cwd: adkRoot,
      stdio: 'inherit'
    });
  }

  // Verify build output
  if (!fs.existsSync(sourceDir)) {
    console.error('✗ Build failed: dist directory not found');
    process.exit(1);
  }

  console.log('📦 Copying custom ADK to backend node_modules...');

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
  }

  console.log('✅ Custom ADK with GPT-5 support built and copied successfully!');
  console.log('   Files available at:', targetDir);
} catch (error) {
  console.error('✗ Error building/copying ADK:', error.message);
  console.log('ℹ️  Build will continue using npm package instead');
  process.exit(0); // Don't fail the main build
}
