# CodeForge AI - Heroku Deployment Guide (Backend)

Write-Host "🚀 CodeForge AI - Heroku Backend Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Heroku CLI is installed
$herokuInstalled = Get-Command heroku -ErrorAction SilentlyContinue

if (-not $herokuInstalled) {
    Write-Host "📦 Heroku CLI not found. Installing..." -ForegroundColor Yellow
    Write-Host "Please download from: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Yellow
    Write-Host ""
    exit
} else {
    Write-Host "✅ Heroku CLI is installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Deployment Steps:" -ForegroundColor Yellow
Write-Host "-----------------------------------"
Write-Host ""

Write-Host "1️⃣  Login to Heroku:" -ForegroundColor White
Write-Host "   heroku login" -ForegroundColor Cyan
Write-Host ""

Write-Host "2️⃣  Create a new Heroku app:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   heroku create codeforge-ai-backend" -ForegroundColor Cyan
Write-Host "   (or use your preferred app name)" -ForegroundColor Gray
Write-Host ""

Write-Host "3️⃣  Set environment variables:" -ForegroundColor White
Write-Host "   heroku config:set NODE_ENV=production" -ForegroundColor Cyan
Write-Host "   heroku config:set OPENAI_API_KEY=your_key" -ForegroundColor Cyan
Write-Host "   heroku config:set SUPABASE_URL=your_url" -ForegroundColor Cyan
Write-Host "   heroku config:set SUPABASE_ANON_KEY=your_key" -ForegroundColor Cyan
Write-Host "   heroku config:set SUPABASE_SERVICE_KEY=your_key" -ForegroundColor Cyan
Write-Host "   heroku config:set FRONTEND_URL=https://your-frontend.vercel.app" -ForegroundColor Cyan
Write-Host ""

Write-Host "4️⃣  Deploy to Heroku:" -ForegroundColor White
Write-Host "   Option A - Direct push from backend folder:" -ForegroundColor Gray
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   git init" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host "   git commit -m 'Initial backend deployment'" -ForegroundColor Cyan
Write-Host "   heroku git:remote -a codeforge-ai-backend" -ForegroundColor Cyan
Write-Host "   git push heroku main" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Option B - Push from monorepo root:" -ForegroundColor Gray
Write-Host "   git subtree push --prefix backend heroku main" -ForegroundColor Cyan
Write-Host ""

Write-Host "5️⃣  Check logs:" -ForegroundColor White
Write-Host "   heroku logs --tail" -ForegroundColor Cyan
Write-Host ""

Write-Host "6️⃣  Open the app:" -ForegroundColor White
Write-Host "   heroku open" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 Additional Commands:" -ForegroundColor Yellow
Write-Host "-----------------------------------"
Write-Host "Check app info:        heroku info" -ForegroundColor Cyan
Write-Host "Scale dynos:           heroku ps:scale web=1" -ForegroundColor Cyan
Write-Host "Restart app:           heroku restart" -ForegroundColor Cyan
Write-Host "View config:           heroku config" -ForegroundColor Cyan
Write-Host "Enable WebSockets:     heroku features:enable http-session-affinity" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  Important Notes:" -ForegroundColor Yellow
Write-Host "-----------------------------------"
Write-Host "- Socket.io requires session affinity (sticky sessions)" -ForegroundColor White
Write-Host "- Make sure to enable http-session-affinity feature" -ForegroundColor White
Write-Host "- Update FRONTEND_URL in backend to match your Vercel URL" -ForegroundColor White
Write-Host "- Update VITE_API_URL in frontend to match your Heroku URL" -ForegroundColor White
Write-Host ""

$response = Read-Host "Do you want to start deployment now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "🚀 Starting Heroku deployment..." -ForegroundColor Cyan
    Write-Host "First, let's login to Heroku..." -ForegroundColor Yellow
    heroku login
} else {
    Write-Host ""
    Write-Host "👋 Run this script again when you're ready to deploy!" -ForegroundColor Yellow
}
