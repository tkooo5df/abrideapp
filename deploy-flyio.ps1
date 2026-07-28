# 🚀 سكريبت النشر السريع على Fly.io
# PowerShell Script for Fly.io Deployment

Write-Host "🚀 بدء النشر على Fly.io..." -ForegroundColor Cyan

# التحقق من تثبيت flyctl
Write-Host "`n📦 التحقق من تثبيت Fly CLI..." -ForegroundColor Yellow
try {
    $flyctlVersion = flyctl version 2>&1
    Write-Host "✅ Fly CLI مثبت: $flyctlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Fly CLI غير مثبت!" -ForegroundColor Red
    Write-Host "📥 قم بتثبيته من: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
    exit 1
}

# التحقق من تسجيل الدخول
Write-Host "`n🔐 التحقق من تسجيل الدخول..." -ForegroundColor Yellow
try {
    $whoami = flyctl auth whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ مسجل الدخول كـ: $whoami" -ForegroundColor Green
    } else {
        Write-Host "⚠️  غير مسجل الدخول. جارٍ تسجيل الدخول..." -ForegroundColor Yellow
        flyctl auth login
    }
} catch {
    Write-Host "❌ خطأ في تسجيل الدخول" -ForegroundColor Red
    exit 1
}

# بناء المشروع
Write-Host "`n🔨 بناء المشروع..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل بناء المشروع!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ تم بناء المشروع بنجاح" -ForegroundColor Green

# النشر على Fly.io
Write-Host "`n🚀 النشر على Fly.io..." -ForegroundColor Yellow
flyctl deploy --app abride-app

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ تم النشر بنجاح!" -ForegroundColor Green
    Write-Host "🌐 رابط التطبيق: https://abride-app.fly.dev" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ فشل النشر!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ اكتمل!" -ForegroundColor Green

