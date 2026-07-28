-- حل بسيط: استخدام البيانات الموجودة فعلاً فقط
-- هذا الحل الأكثر أماناً لأنه لا ينشئ بيانات جديدة

-- الخطوة 1: فحص البيانات الموجودة
SELECT '=== فحص البيانات الموجودة ===' as info;

-- عرض المستخدمين الموجودين
SELECT 'المستخدمين الموجودين:' as info;
SELECT id, email FROM auth.users LIMIT 5;

-- عرض الملفات الشخصية الموجودة
SELECT 'الملفات الشخصية الموجودة:' as info;
SELECT id, full_name, email, role FROM profiles LIMIT 10;

-- عرض الحجوزات المكتملة الموجودة
SELECT 'الحجوزات المكتملة الموجودة:' as info;
SELECT id, driver_id, passenger_id, status FROM bookings WHERE status = 'completed' LIMIT 5;

-- ===========================================
-- تعليمات لإضافة التقييمات يدوياً:
-- ===========================================
-- 
-- بعد تشغيل الاستعلامات أعلاه، انسخ المعرفات الحقيقية من النتائج
-- واستبدلها في الاستعلامات التالية:
--
-- مثال:
-- إذا كان لديك سائق ID: aaaaa-bbbbb-ccccc
-- وراكب ID: xxxxx-yyyyy-zzzzz  
-- وحجز ID: 123
--
-- استخدم هذا الاستعلام:
--
-- INSERT INTO ratings (booking_id, driver_id, passenger_id, rating, comment, created_at) VALUES
-- (123, 'aaaaa-bbbbb-ccccc', 'xxxxx-yyyyy-zzzzz', 5, 'سائق ممتاز', NOW());
--
-- ===========================================

-- الخطوة 2: إذا لم يكن لديك حجوزات مكتملة، قم بتحديث حجز موجود:
-- UPDATE bookings SET status = 'completed' WHERE id = [ضع رقم الحجز هنا];

-- الخطوة 3: بعد ذلك أضف التقييم:
-- INSERT INTO ratings (booking_id, driver_id, passenger_id, rating, comment) VALUES
-- ([رقم الحجز], '[معرف السائق]', '[معرف الراكب]', 5, 'تعليق هنا');

SELECT 'تم! استخدم المعرفات الموجودة في النتائج أعلاه لإضافة التقييمات' as instructions;