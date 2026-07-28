# 🚀 سكريبت نشر Edge Function لإرسال البريد الإلكتروني
# PowerShell Script to Deploy Email Edge Function

Write-Host "🚀 بدء نشر Edge Function لإرسال البريد الإلكتروني..." -ForegroundColor Cyan

# التحقق من تثبيت Supabase CLI
Write-Host "`n📦 التحقق من تثبيت Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "✅ Supabase CLI مثبت: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI غير مثبت!" -ForegroundColor Red
    Write-Host "📥 قم بتثبيته من: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# التحقق من تسجيل الدخول
Write-Host "`n🔐 التحقق من تسجيل الدخول..." -ForegroundColor Yellow
try {
    $whoami = supabase projects list 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ مسجل الدخول" -ForegroundColor Green
    } else {
        Write-Host "⚠️  غير مسجل الدخول. جارٍ تسجيل الدخول..." -ForegroundColor Yellow
        supabase login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ فشل تسجيل الدخول" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "⚠️  غير مسجل الدخول. جارٍ تسجيل الدخول..." -ForegroundColor Yellow
    supabase login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ فشل تسجيل الدخول" -ForegroundColor Red
        exit 1
    }
}

# ربط المشروع
Write-Host "`n🔗 ربط المشروع..." -ForegroundColor Yellow
try {
    supabase link --project-ref kobsavfggcnfemdzsnpj
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ تم ربط المشروع بنجاح" -ForegroundColor Green
    } else {
        Write-Host "⚠️  المشروع مربوط بالفعل أو حدث خطأ" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  خطأ في ربط المشروع (قد يكون مربوطاً بالفعل)" -ForegroundColor Yellow
}

# نشر Edge Function
Write-Host "`n📧 نشر Edge Function send-email..." -ForegroundColor Yellow
try {
    supabase functions deploy send-email
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ تم نشر Edge Function بنجاح!" -ForegroundColor Green
        Write-Host "`n📋 الخطوات التالية:" -ForegroundColor Cyan
        Write-Host "1. اذهب إلى Supabase Dashboard → Settings → Edge Functions → Secrets" -ForegroundColor White
        Write-Host "2. أضف Secret:" -ForegroundColor White
        Write-Host "   Name: RESEND_API_KEY" -ForegroundColor Yellow
        Write-Host "   Value: <YOUR_RESEND_API_KEY>" -ForegroundColor Yellow
        Write-Host "3. تأكد من أن النطاق abride.online مُفعّل في Resend Dashboard" -ForegroundColor White
        Write-Host "4. اختبر إرسال بريد من التطبيق" -ForegroundColor White
    } else {
        Write-Host "`n❌ فشل نشر Edge Function!" -ForegroundColor Red
        Write-Host "راجع الأخطاء أعلاه" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "`n❌ خطأ في نشر Edge Function: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ اكتمل!" -ForegroundColor Green

