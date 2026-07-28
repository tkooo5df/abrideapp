# ⚡ حل سريع لمشكلة Spam في البريد الإلكتروني

## الخطوات الأساسية (5 دقائق)

### 1. إعداد Custom SMTP في Supabase

1. اذهب إلى Supabase Dashboard → **Settings** → **Auth** → **SMTP Settings**
2. فعّل **Custom SMTP**
3. استخدم إحدى الخدمات التالية:

#### الخيار الأسهل: Resend (موصى به)
- سجّل في https://resend.com (مجاني لـ 3,000 رسالة/شهر)
- أنشئ API Key
- في Supabase:
  ```
  SMTP Host: smtp.resend.com
  SMTP Port: 587
  SMTP User: resend
  SMTP Pass: [Your Resend API Key]
  Sender Email: noreply@abride.online
  Sender Name: أبريد
  ```

### 2. إعداد DNS Records

أضف في DNS الخاص بـ `abride.online`:

#### SPF Record:
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

#### DMARC Record:
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@abride.online
```

### 3. تحديث قوالب البريد

1. افتح `supabase/email-templates-improved.html`
2. انسخ المحتوى
3. في Supabase Dashboard → **Authentication** → **Email Templates**
4. الصق في **Confirm Signup** template

### 4. التحقق

1. انتظر 24 ساعة لانتشار DNS
2. أرسل رسالة اختبار
3. تحقق من https://www.mail-tester.com/

---

## 📖 للتفاصيل الكاملة

راجع الدليل الكامل: **`supabase/EMAIL_SPAM_FIX_GUIDE.md`**

---

## ⚠️ ملاحظات مهمة

- ✅ **يجب** استخدام Custom SMTP (هذا هو الأهم!)
- ✅ **يجب** استخدام نطاقك المخصص (`noreply@abride.online`)
- ✅ **يجب** إضافة SPF Record
- ⏳ انتظر 24-48 ساعة بعد إضافة DNS Records

