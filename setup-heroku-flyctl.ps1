#!/usr/bin/env pwsh
# Setup script to configure Heroku buildpacks for flyctl support
# This script adds the necessary buildpacks to enable flyctl CLI on Heroku dynos

param(
    [Parameter(Mandatory=$true)]
    [string]$AppName,
    
    [Parameter(Mandatory=$false)]
    [string]$FlyApiToken = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Heroku Flyctl Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Heroku CLI is installed
Write-Host "Checking for Heroku CLI..." -ForegroundColor Yellow
try {
    $herokuVersion = heroku --version
    Write-Host "✓ Heroku CLI found: $herokuVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Heroku CLI not found. Please install it first: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Adding vendor binaries buildpack..." -ForegroundColor Yellow
try {
    heroku buildpacks:add --index 1 https://github.com/diowa/heroku-buildpack-vendorbinaries.git -a $AppName
    Write-Host "✓ Vendor binaries buildpack added" -ForegroundColor Green
} catch {
    Write-Host "⚠ Buildpack may already exist, continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Adding Node.js buildpack..." -ForegroundColor Yellow
try {
    heroku buildpacks:add heroku/nodejs -a $AppName
    Write-Host "✓ Node.js buildpack added" -ForegroundColor Green
} catch {
    Write-Host "⚠ Buildpack may already exist, continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Verifying buildpacks..." -ForegroundColor Yellow
heroku buildpacks -a $AppName

Write-Host ""
Write-Host "Step 4: Configuring PATH for flyctl..." -ForegroundColor Yellow
heroku config:set PATH="/app/vendor/flyctl:`$PATH" -a $AppName
Write-Host "✓ PATH configured" -ForegroundColor Green

# Set Fly.io API token if provided
if ($FlyApiToken -ne "") {
    Write-Host ""
    Write-Host "Step 5: Setting FLY_API_TOKEN..." -ForegroundColor Yellow
    heroku config:set FLY_API_TOKEN=$FlyApiToken -a $AppName
    Write-Host "✓ FLY_API_TOKEN configured" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Step 5: Skipping FLY_API_TOKEN (not provided)" -ForegroundColor Yellow
    Write-Host "To set it manually, run:" -ForegroundColor Cyan
    Write-Host "  heroku config:set FLY_API_TOKEN=your-token -a $AppName" -ForegroundColor Cyan
    Write-Host "Get your token by running: flyctl auth token" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Ensure Vendorfile exists in your project root" -ForegroundColor White
Write-Host "2. Commit and push your changes:" -ForegroundColor White
Write-Host "   git add Vendorfile" -ForegroundColor Cyan
Write-Host "   git commit -m 'Add flyctl via Vendorfile'" -ForegroundColor Cyan
Write-Host "   git push heroku main" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Test flyctl installation after deploy:" -ForegroundColor White
Write-Host "   heroku run flyctl version -a $AppName" -ForegroundColor Cyan
Write-Host ""
