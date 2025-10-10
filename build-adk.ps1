# Build ADK before deployment (PowerShell)

Write-Host "📦 Building local ADK package..." -ForegroundColor Cyan

# Check if pnpm exists, if not install it
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm@9.0.0
}

# Navigate to ADK directory and build
Push-Location adk-ts/packages/adk

Write-Host "Installing ADK dependencies..." -ForegroundColor Yellow
try {
    pnpm install --frozen-lockfile
} catch {
    npm install
}

Write-Host "Building ADK..." -ForegroundColor Yellow
try {
    pnpm run build
} catch {
    npm run build
}

Write-Host "✅ ADK build complete!" -ForegroundColor Green

# Go back to root
Pop-Location
