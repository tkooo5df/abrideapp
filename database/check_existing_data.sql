-- حل بسيط: فحص واستخدام البيانات الموجودة
-- ========================================

-- الخطوة 1: فحص البيانات الموجودة فقط
SELECT 'الخطوة 1: عرض الملفات الشخصية الموجودة' as step;
SELECT id, full_name, email, role FROM profiles ORDER BY created_at DESC LIMIT 10;

-- الخطوة 2: عرض الحجوزات الموجودة
SELECT 'الخطوة 2: عرض الحجوزات الموجودة' as step;
SELECT id, driver_id, passenger_id, status FROM bookings ORDER BY created_at DESC LIMIT 10;

-- ===========================================
-- تعليمات لإضافة التقييمات يدوياً:
-- ===========================================
-- 
-- بعد تشغيل الاستعلامين أعلاه، انسخ المعرفات الحقيقية من النتائج
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

-- الخطوة 3: إذا لم يكن لديك حجوزات مكتملة، قم بتحديث حجز موجود:
-- UPDATE bookings SET status = 'completed' WHERE id = [ضع رقم الحجز هنا];

-- الخطوة 4: بعد ذلك أضف التقييم:
-- INSERT INTO ratings (booking_id, driver_id, passenger_id, rating, comment) VALUES
-- ([رقم الحجز], '[معرف السائق]', '[معرف الراكب]', 5, 'تعليق هنا');

SELECT 'تم! استخدم المعرفات الموجودة في النتائج أعلاه لإضافة التقييمات' as instructions;
