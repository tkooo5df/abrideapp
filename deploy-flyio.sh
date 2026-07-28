#!/bin/bash
# 🚀 سكريبت النشر السريع على Fly.io
# Bash Script for Fly.io Deployment

echo "🚀 بدء النشر على Fly.io..."

# التحقق من تثبيت flyctl
echo ""
echo "📦 التحقق من تثبيت Fly CLI..."
if ! command -v flyctl &> /dev/null; then
    echo "❌ Fly CLI غير مثبت!"
    echo "📥 قم بتثبيته من: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi
echo "✅ Fly CLI مثبت"

# التحقق من تسجيل الدخول
echo ""
echo "🔐 التحقق من تسجيل الدخول..."
if ! flyctl auth whoami &> /dev/null; then
    echo "⚠️  غير مسجل الدخول. جارٍ تسجيل الدخول..."
    flyctl auth login
fi
echo "✅ مسجل الدخول"

# بناء المشروع
echo ""
echo "🔨 بناء المشروع..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ فشل بناء المشروع!"
    exit 1
fi
echo "✅ تم بناء المشروع بنجاح"

# النشر على Fly.io
echo ""
echo "🚀 النشر على Fly.io..."
flyctl deploy --app abride-app

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ تم النشر بنجاح!"
    echo "🌐 رابط التطبيق: https://abride-app.fly.dev"
else
    echo ""
    echo "❌ فشل النشر!"
    exit 1
fi

echo ""
echo "✨ اكتمل!"

