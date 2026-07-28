-- حل صحيح لمشكلة Foreign Key و UUID
-- أولاً، دعنا نتحقق من البيانات الموجودة

-- 1. عرض المستخدمين الموجودين
SELECT 'المستخدمين الموجودين:' as info;
SELECT id, email FROM auth.users LIMIT 5;

-- 2. عرض الملفات الشخصية الموجودة
SELECT 'الملفات الشخصية الموجودة:' as info;
SELECT id, full_name, email, role FROM profiles LIMIT 10;

-- 3. عرض الحجوزات المكتملة الموجودة
SELECT 'الحجوزات المكتملة الموجودة:' as info;
SELECT id, driver_id, passenger_id, status FROM bookings WHERE status = 'completed' LIMIT 5;

-- إذا كانت هناك بيانات موجودة، استخدمها مباشرة
-- إذا لم تكن هناك بيانات، أنشئ بيانات صحيحة

-- إنشاء مستخدمين تجريبيين أولاً (إذا لم يكونوا موجودين)
-- ملاحظة: في Supabase، المستخدمين يتم إنشاؤهم عبر auth، لكن يمكننا استخدام معرفات موجودة

-- استخدام معرفات UUID صحيحة ومتوافقة مع auth.users
INSERT INTO profiles (id, full_name, email, phone, role, created_at, updated_at) 
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'أحمد السائق', 'driver1@abridas.com', '0555123456', 'driver', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000002', 'محمد السائق', 'driver2@abridas.com', '0555123457', 'driver', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000003', 'فاطمة الراكبة', 'passenger1@abridas.com', '0555123458', 'passenger', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000004', 'سارة الراكبة', 'passenger2@abridas.com', '0555123459', 'passenger', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000005', 'نور الراكب', 'passenger3@abridas.com', '0555123460', 'passenger', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- إنشاء حجوزات تجريبية
INSERT INTO bookings (id, pickup_location, destination_location, passenger_id, driver_id, seats_booked, total_amount, payment_method, status, created_at, updated_at)
VALUES 
    (3001, 'الجزائر العاصمة', 'وهران', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 1, 2500, 'cod', 'completed', NOW() - INTERVAL '2 days', NOW()),
    (3002, 'وهران', 'الجزائر العاصمة', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 1, 2500, 'cod', 'completed', NOW() - INTERVAL '1 day', NOW()),
    (3003, 'الجزائر العاصمة', 'قسنطينة', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 1, 3000, 'cod', 'completed', NOW() - INTERVAL '5 hours', NOW()),
    (3004, 'قسنطينة', 'الجزائر العاصمة', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 1, 3000, 'cod', 'completed', NOW() - INTERVAL '3 days', NOW()),
    (3005, 'الجزائر العاصمة', 'عنابة', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 1, 3500, 'cod', 'completed', NOW() - INTERVAL '1 day', NOW()),
    (3006, 'عنابة', 'الجزائر العاصمة', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 1, 3500, 'cod', 'completed', NOW() - INTERVAL '6 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- إدراج التقييمات
INSERT INTO ratings (booking_id, driver_id, passenger_id, rating, comment, created_at) VALUES
-- تقييمات للسائق الأول
(3001, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 5, 'سائق ممتاز ومهذب جداً، الرحلة كانت مريحة وآمنة', NOW() - INTERVAL '2 days'),
(3002, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 4, 'جيد جداً، لكن تأخر قليلاً', NOW() - INTERVAL '1 day'),
(3003, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 5, 'أفضل سائق في المدينة!', NOW() - INTERVAL '5 hours'),

-- تقييمات للسائق الثاني
(3004, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 3, 'مقبول، لكن السيارة تحتاج تنظيف', NOW() - INTERVAL '3 days'),
(3005, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 4, 'سائق محترف، أوصي به', NOW() - INTERVAL '1 day'),
(3006, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 2, 'لم يكن راضياً عن الخدمة', NOW() - INTERVAL '6 hours');

-- التحقق من النتائج
SELECT 'النتائج النهائية:' as info;
SELECT 
    p.full_name as "اسم السائق",
    p.average_rating as "متوسط التقييم",
    p.ratings_count as "عدد التقييمات"
FROM profiles p
WHERE p.role = 'driver' AND p.id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
ORDER BY p.average_rating DESC;

-- عرض التقييمات المفصلة
SELECT 'التقييمات المفصلة:' as info;
SELECT 
    r.rating as "التقييم",
    r.comment as "التعليق",
    driver.full_name as "السائق",
    passenger.full_name as "الراكب",
    r.created_at as "التاريخ"
FROM ratings r
JOIN profiles driver ON r.driver_id = driver.id
JOIN profiles passenger ON r.passenger_id = passenger.id
ORDER BY r.created_at DESC;
