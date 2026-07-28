# 🔧 دليل حل مشكلة رسائل البريد الإلكتروني في Spam

## المشكلة
الرسائل الإلكترونية من Supabase تذهب إلى صندوق الرسائل غير المرغوب فيها (Spam/Junk).

## الحلول المطلوبة

### 1. ✅ إعداد Custom SMTP في Supabase (الأهم)

**الخطوات:**

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: `kobsavfggcnfemdzsnpj`
3. اذهب إلى **Settings** → **Auth** → **SMTP Settings**
4. فعّل **Custom SMTP** واملأ البيانات:

**للحصول على SMTP موثوق، استخدم أحد الخدمات التالية:**

#### خيار 1: SendGrid (موصى به)
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: [Your SendGrid API Key]
Sender Email: noreply@abride.online
Sender Name: أبريد
```

#### خيار 2: Mailgun
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: [Your Mailgun SMTP Username]
SMTP Pass: [Your Mailgun SMTP Password]
Sender Email: noreply@abride.online
Sender Name: أبريد
```

#### خيار 3: Resend (موصى به للمشاريع الصغيرة)
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Pass: [Your Resend API Key]
Sender Email: noreply@abride.online
Sender Name: أبريد
```

#### خيار 4: Amazon SES
```
SMTP Host: email-smtp.[region].amazonaws.com
SMTP Port: 587
SMTP User: [Your SES SMTP Username]
SMTP Pass: [Your SES SMTP Password]
Sender Email: noreply@abride.online
Sender Name: أبريد
```

### 2. 🔐 إعداد SPF Record في DNS

أضف السجل التالي في DNS الخاص بـ `abride.online`:

#### إذا كنت تستخدم SendGrid:
```
Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all
```

#### إذا كنت تستخدم Mailgun:
```
Type: TXT
Name: @
Value: v=spf1 include:mailgun.org ~all
```

#### إذا كنت تستخدم Resend:
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

#### إذا كنت تستخدم Amazon SES:
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
```

### 3. 🔑 إعداد DKIM Record في DNS

#### SendGrid:
1. في SendGrid Dashboard، اذهب إلى **Settings** → **Sender Authentication**
2. أضف النطاق `abride.online`
3. انسخ سجلات DKIM وأضفها في DNS

#### Mailgun:
1. في Mailgun Dashboard، اذهب إلى **Sending** → **Domain Settings**
2. أضف النطاق `abride.online`
3. انسخ سجلات DKIM وأضفها في DNS

#### Resend:
1. في Resend Dashboard، اذهب إلى **Domains**
2. أضف النطاق `abride.online`
3. انسخ سجلات DKIM وأضفها في DNS

### 4. 🛡️ إعداد DMARC Record في DNS

أضف السجل التالي:

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@abride.online; ruf=mailto:dmarc@abride.online; fo=1
```

**ملاحظة:** ابدأ بـ `p=none` للاختبار، ثم غيّر إلى `p=quarantine` ثم `p=reject` بعد التأكد من أن كل شيء يعمل.

### 5. ✅ استخدام نطاق مخصص للإرسال

**مهم جداً:** تأكد من استخدام نطاقك المخصص `abride.online` وليس `@supabase.co`:

- ✅ `noreply@abride.online`
- ✅ `support@abride.online`
- ❌ `noreply@supabase.co`

### 6. 📧 تحسين قوالب البريد الإلكتروني

استخدم القوالب المحسّنة في:
- `supabase/email-templates-improved.html` (لتأكيد التسجيل)
- `supabase/email-templates-reset-password.html` (لإعادة تعيين كلمة المرور)

**المزايا:**
- ✅ بنية HTML صحيحة ومتوافقة مع جميع عملاء البريد
- ✅ نص بديل (preheader) لعرض معاينة الرسالة
- ✅ روابط بديلة في حالة فشل الزر
- ✅ تذييل احترافي مع معلومات الاتصال
- ✅ رسائل أمان واضحة

### 7. 🔍 التحقق من السجلات

استخدم الأدوات التالية للتحقق من إعداداتك:

1. **SPF Checker:** https://mxtoolbox.com/spf.aspx
2. **DKIM Checker:** https://mxtoolbox.com/dkim.aspx
3. **DMARC Checker:** https://mxtoolbox.com/dmarc.aspx
4. **Email Test:** https://www.mail-tester.com/

### 8. 📋 خطوات التنفيذ السريعة

1. ✅ سجّل في خدمة SMTP (SendGrid/Mailgun/Resend)
2. ✅ أضف النطاق `abride.online` في خدمة SMTP
3. ✅ أضف سجلات SPF في DNS
4. ✅ أضف سجلات DKIM في DNS
5. ✅ أضف سجل DMARC في DNS
6. ✅ انتظر 24-48 ساعة لانتشار DNS
7. ✅ فعّل Custom SMTP في Supabase
8. ✅ اختبر إرسال بريد إلكتروني
9. ✅ استخدم https://www.mail-tester.com/ للتحقق

### 9. ⚠️ نصائح إضافية

- **لا تستخدم كلمات محظورة:** تجنب كلمات مثل "Free", "Click Here", "Act Now" في الموضوع
- **نسبة النص إلى الصور:** تأكد من وجود نص كافٍ في الرسالة
- **تجنب الروابط المشبوهة:** استخدم روابط HTTPS فقط
- **معدل الإرسال:** لا ترسل الكثير من الرسائل في وقت قصير
- **قائمة Unsubscribe:** أضف رابط إلغاء الاشتراك للرسائل التسويقية (غير مطلوب لرسائل المصادقة)

### 10. 🎯 الأولويات

**عالية الأولوية (يجب تنفيذها):**
1. ✅ إعداد Custom SMTP
2. ✅ إعداد SPF Record
3. ✅ استخدام نطاق مخصص

**متوسطة الأولوية (موصى بها):**
4. ✅ إعداد DKIM Record
5. ✅ إعداد DMARC Record
6. ✅ تحسين قوالب البريد

**منخفضة الأولوية (تحسينات):**
7. ✅ استخدام Mail-tester للتحقق
8. ✅ مراقبة معدل التسليم

---

## 📞 الدعم

إذا واجهت مشاكل، تأكد من:
1. ✅ الانتظار 24-48 ساعة بعد إضافة سجلات DNS
2. ✅ التحقق من صحة السجلات باستخدام أدوات التحقق
3. ✅ التأكد من أن النطاق مُفعّل في خدمة SMTP
4. ✅ التحقق من صحة بيانات SMTP في Supabase

---

## 🔗 روابط مفيدة

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Mailgun Documentation](https://documentation.mailgun.com/)
- [Resend Documentation](https://resend.com/docs)
- [Supabase SMTP Settings](https://supabase.com/docs/guides/auth/auth-smtp)

