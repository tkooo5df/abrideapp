# 🔗 إعدادات abride.online

## Site URL Configuration

**Site URL:**
```
https://abride.online
```

**Redirect URLs:**
```
https://abride.online/**
https://abride.online/auth/callback
https://abride.online/auth/confirm
https://abride.online/auth/reset-password
https://abride.online/#/auth/callback
```

## CORS Origins

```
https://abride.online
```

## Email Templates Configuration

### ⚠️ مهم: حل مشكلة Spam

لحل مشكلة وصول الرسائل إلى Spam، راجع الدليل الكامل في:
**`supabase/EMAIL_SPAM_FIX_GUIDE.md`**

**الأولويات:**
1. ✅ إعداد Custom SMTP في Supabase
2. ✅ إعداد SPF Record في DNS
3. ✅ استخدام نطاق مخصص (`noreply@abride.online`)

---

### Confirm Signup Template

**Subject:**
```
تأكيد التسجيل في أبريد
```

**Body (استخدم القالب المحسّن):**
انسخ المحتوى من `supabase/email-templates-improved.html` والصقه في Supabase Dashboard.

**القالب البسيط (إذا لم يعمل HTML):**
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f5f5f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 8px; padding: 30px;">
                    <tr>
                        <td style="text-align: center;">
                            <h2 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">تأكيد التسجيل</h2>
                            <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">انقر لتأكيد الايميل الخاص بك في منصة أبريد:</p>
                            <p style="margin: 0;"><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px;">تأكيد البريد</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

### Reset Password Template

**Subject:**
```
إعادة تعيين كلمة المرور - أبريد
```

**Body (استخدم القالب المحسّن):**
انسخ المحتوى من `supabase/email-templates-reset-password.html` والصقه في Supabase Dashboard.

**القالب البسيط (إذا لم يعمل HTML):**
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f5f5f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 8px; padding: 30px;">
                    <tr>
                        <td style="text-align: center;">
                            <h2 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">إعادة تعيين كلمة المرور</h2>
                            <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">انقر على الرابط أدناه لإعادة تعيين كلمة المرور الخاصة بك في منصة أبريد:</p>
                            <p style="margin: 0;"><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px;">إعادة تعيين كلمة المرور</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

## Environment Variables

```env
VITE_SITE_URL=https://abride.online
VITE_SUPABASE_URL=https://kobsavfggcnfemdzsnpj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYnNhdmZnZ2NuZmVtZHpzbnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTk3ODEsImV4cCI6MjA3NDM3NTc4MX0._TfXDauroKe8EAv_Fv4PQAZfOqk-rHbXAlF8bOU3-Qk
```

