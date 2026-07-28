# سكريبت تطبيق هجرات Supabase
# هذا السكريبت يطبق جميع الهجرات على قاعدة البيانات السحابية

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "تطبيق هجرات Supabase" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من وجود Supabase CLI
Write-Host "التحقق من وجود Supabase CLI..." -ForegroundColor Yellow
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI غير مثبت!" -ForegroundColor Red
    Write-Host ""
    Write-Host "قم بتثبيته باستخدام:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host ""
    Write-Host "أو استخدم npx:" -ForegroundColor Yellow
    Write-Host "  npx supabase db push" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Supabase CLI موجود" -ForegroundColor Green
Write-Host ""

# قراءة project_id من config.toml
$configPath = "supabase\config.toml"
if (Test-Path $configPath) {
    $configContent = Get-Content $configPath -Raw
    if ($configContent -match 'project_id\s*=\s*"([^"]+)"') {
        $projectId = $matches[1]
        Write-Host "📋 Project ID: $projectId" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "⚠️  لم يتم العثور على project_id في config.toml" -ForegroundColor Yellow
        Write-Host ""
    }
}

# محاولة ربط المشروع
Write-Host "🔗 محاولة ربط المشروع..." -ForegroundColor Yellow
if ($projectId) {
    Write-Host "   استخدم: supabase link --project-ref $projectId" -ForegroundColor White
} else {
    Write-Host "   استخدم: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor White
}
Write-Host ""

# تطبيق الهجرات
Write-Host "📦 تطبيق الهجرات..." -ForegroundColor Yellow
Write-Host "   استخدم: supabase db push" -ForegroundColor White
Write-Host ""

# خيارات للمستخدم
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "الخيارات المتاحة:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. استخدام Supabase CLI (موصى به):" -ForegroundColor Green
Write-Host "   supabase login" -ForegroundColor White
if ($projectId) {
    Write-Host "   supabase link --project-ref $projectId" -ForegroundColor White
} else {
    Write-Host "   supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor White
}
Write-Host "   supabase db push" -ForegroundColor White
Write-Host ""
Write-Host "2. استخدام SQL Editor في لوحة Supabase:" -ForegroundColor Green
Write-Host "   - افتح: https://app.supabase.com/" -ForegroundColor White
Write-Host "   - اذهب إلى مشروعك" -ForegroundColor White
Write-Host "   - افتح: SQL Editor" -ForegroundColor White
Write-Host "   - انسخ محتوى ملف: supabase\migrations\20260206000000_supabase_full_reset.sql" -ForegroundColor White
Write-Host "   - الصق في SQL Editor واضغط Run" -ForegroundColor White
Write-Host ""

# محاولة تطبيق الهجرات تلقائياً
$applyNow = Read-Host "هل تريد تطبيق الهجرات الآن؟ (y/n)"

if ($applyNow -eq "y" -or $applyNow -eq "Y") {
    Write-Host ""
    Write-Host "🚀 بدء تطبيق الهجرات..." -ForegroundColor Green
    Write-Host ""
    
    # التحقق من تسجيل الدخول
    Write-Host "التحقق من تسجيل الدخول..." -ForegroundColor Yellow
    $loginCheck = supabase projects list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  يبدو أنك غير مسجل الدخول" -ForegroundColor Yellow
        Write-Host "   قم بتسجيل الدخول أولاً: supabase login" -ForegroundColor White
        Write-Host ""
        $login = Read-Host "هل تريد تسجيل الدخول الآن؟ (y/n)"
        if ($login -eq "y" -or $login -eq "Y") {
            supabase login
        } else {
            Write-Host "❌ تم الإلغاء" -ForegroundColor Red
            exit 1
        }
    }
    
    # ربط المشروع
    if ($projectId) {
        Write-Host ""
        Write-Host "ربط المشروع..." -ForegroundColor Yellow
        supabase link --project-ref $projectId
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  فشل ربط المشروع. تأكد من project_id الصحيح" -ForegroundColor Yellow
            Write-Host ""
        }
    }
    
    # تطبيق الهجرات
    Write-Host ""
    Write-Host "تطبيق الهجرات..." -ForegroundColor Yellow
    supabase db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ تم تطبيق الهجرات بنجاح!" -ForegroundColor Green
        Write-Host ""
        Write-Host "يمكنك الآن محاولة إنشاء حساب جديد" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ فشل تطبيق الهجرات" -ForegroundColor Red
        Write-Host ""
        Write-Host "استخدم الطريقة اليدوية عبر SQL Editor:" -ForegroundColor Yellow
        Write-Host "1. افتح: https://app.supabase.com/" -ForegroundColor White
        Write-Host "2. اذهب إلى مشروعك → SQL Editor" -ForegroundColor White
        Write-Host "3. انسخ محتوى: supabase\migrations\20260206000000_supabase_full_reset.sql" -ForegroundColor White
        Write-Host "4. الصق واضغط Run" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "📝 اتبع التعليمات أعلاه لتطبيق الهجرات يدوياً" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

