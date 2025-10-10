# CodeForge AI - Quick Deployment Script for Vercel (PowerShell)

Write-Host "🚀 CodeForge AI - Vercel Deployment Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
} else {
    Write-Host "✅ Vercel CLI is already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔐 Required Environment Variables:" -ForegroundColor Yellow
Write-Host "-----------------------------------"
Write-Host "Backend:" -ForegroundColor White
Write-Host "  - OPENAI_API_KEY"
Write-Host "  - SUPABASE_URL"
Write-Host "  - SUPABASE_ANON_KEY"
Write-Host "  - SUPABASE_SERVICE_KEY"
Write-Host "  - NODE_ENV=production"
Write-Host ""
Write-Host "Frontend:" -ForegroundColor White
Write-Host "  - VITE_SUPABASE_URL"
Write-Host "  - VITE_SUPABASE_ANON_KEY"
Write-Host "  - VITE_API_URL"
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "-----------------------------------"
Write-Host "1. Login to Vercel:" -ForegroundColor White
Write-Host "   vercel login" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Deploy the project:" -ForegroundColor White
Write-Host "   vercel" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. For production deployment:" -ForegroundColor White
Write-Host "   vercel --prod" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Set environment variables in Vercel Dashboard:" -ForegroundColor White
Write-Host "   https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Run Supabase migrations" -ForegroundColor White
Write-Host ""
Write-Host "📚 Full documentation: See DEPLOYMENT.md" -ForegroundColor Green
Write-Host ""

# Ask if user wants to continue with deployment
$response = Read-Host "Do you want to start deployment now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "🚀 Starting Vercel deployment..." -ForegroundColor Cyan
    vercel
} else {
    Write-Host ""
    Write-Host "👋 Run 'vercel' when you're ready to deploy!" -ForegroundColor Yellow
}
