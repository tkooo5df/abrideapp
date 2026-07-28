# Quick Fly.io Deploy Script

Write-Host "🚀 Starting Fly.io Deployment..." -ForegroundColor Green

# Navigate to project directory
Set-Location "d:\amine codes\abridev4-codex-fix-completed-trip-visibility-in-search (2)\abridev4-codex-fix-completed-trip-visibility-in-search"

Write-Host "📦 Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check if fly.toml exists
if (Test-Path "fly.toml") {
    Write-Host "✅ fly.toml found" -ForegroundColor Green
} else {
    Write-Host "❌ fly.toml not found!" -ForegroundColor Red
    exit 1
}

# Check if Dockerfile exists
if (Test-Path "Dockerfile") {
    Write-Host "✅ Dockerfile found" -ForegroundColor Green
} else {
    Write-Host "❌ Dockerfile not found!" -ForegroundColor Red
    exit 1
}

# Deploy
Write-Host "`n🚀 Deploying to Fly.io..." -ForegroundColor Cyan
flyctl deploy --app abride-app --remote-only --ha=false

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "📱 Access your app at: https://abride-app.fly.dev" -ForegroundColor Yellow

