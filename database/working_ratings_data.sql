-- حل بديل: استخدام البيانات الموجودة فعلاً في النظام
-- هذا الحل أكثر أماناً لأنه لا ينشئ بيانات جديدة

-- 1. أولاً، دعنا نتحقق من البيانات الموجودة
SELECT '=== فحص البيانات الموجودة ===' as info;

-- عرض السائقين الموجودين
SELECT 'السائقين الموجودين:' as info;
SELECT id, full_name, email FROM profiles WHERE role = 'driver' LIMIT 5;

-- عرض الركاب الموجودين
SELECT 'الركاب الموجودين:' as info;
SELECT id, full_name, email FROM profiles WHERE role = 'passenger' LIMIT 5;

-- عرض الحجوزات المكتملة الموجودة
SELECT 'الحجوزات المكتملة الموجودة:' as info;
SELECT id, driver_id, passenger_id, status FROM bookings WHERE status = 'completed' LIMIT 5;

-- 2. إذا كانت هناك حجوزات مكتملة، أضف تقييمات لها
-- إذا لم تكن هناك حجوزات مكتملة، أنشئ حجوزات تجريبية أولاً

-- إنشاء حجوزات تجريبية مكتملة باستخدام معرفات موجودة
-- ملاحظة: تأكد من وجود سائقين وركاب في النظام أولاً

-- إذا لم تكن هناك بيانات كافية، أنشئ بيانات بسيطة
-- استخدام معرفات UUID صحيحة ومتوافقة مع النظام

-- إنشاء مستخدمين تجريبيين (إذا لم يكونوا موجودين)
-- ملاحظة: في Supabase، المستخدمين يتم إنشاؤهم عبر auth
-- لكن يمكننا استخدام معرفات UUID صحيحة

-- استخدام معرفات UUID صحيحة
INSERT INTO profiles (id, full_name, email, phone, role, created_at, updated_at) 
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'أحمد السائق', 'driver1@abridas.com', '0555123456', 'driver', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'محمد السائق', 'driver2@abridas.com', '0555123457', 'driver', NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'فاطمة الراكبة', 'passenger1@abridas.com', '0555123458', 'passenger', NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'سارة الراكبة', 'passenger2@abridas.com', '0555123459', 'passenger', NOW(), NOW()),
    ('55555555-5555-5555-5555-555555555555', 'نور الراكب', 'passenger3@abridas.com', '0555123460', 'passenger', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- إنشاء حجوزات تجريبية مكتملة
INSERT INTO bookings (id, pickup_location, destination_location, passenger_id, driver_id, seats_booked, total_amount, payment_method, status, created_at, updated_at)
VALUES 
    (4001, 'الجزائر العاصمة', 'وهران', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 1, 2500, 'cod', 'completed', NOW() - INTERVAL '2 days', NOW()),
    (4002, 'وهران', 'الجزائر العاصمة', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 1, 2500, 'cod', 'completed', NOW() - INTERVAL '1 day', NOW()),
    (4003, 'الجزائر العاصمة', 'قسنطينة', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 1, 3000, 'cod', 'completed', NOW() - INTERVAL '5 hours', NOW()),
    (4004, 'قسنطينة', 'الجزائر العاصمة', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 1, 3000, 'cod', 'completed', NOW() - INTERVAL '3 days', NOW()),
    (4005, 'الجزائر العاصمة', 'عنابة', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 1, 3500, 'cod', 'completed', NOW() - INTERVAL '1 day', NOW()),
    (4006, 'عنابة', 'الجزائر العاصمة', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 1, 3500, 'cod', 'completed', NOW() - INTERVAL '6 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- إدراج التقييمات
INSERT INTO ratings (booking_id, driver_id, passenger_id, rating, comment, created_at) VALUES
-- تقييمات للسائق الأول
(4001, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 5, 'سائق ممتاز ومهذب جداً، الرحلة كانت مريحة وآمنة', NOW() - INTERVAL '2 days'),
(4002, '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 4, 'جيد جداً، لكن تأخر قليلاً', NOW() - INTERVAL '1 day'),
(4003, '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 5, 'أفضل سائق في المدينة!', NOW() - INTERVAL '5 hours'),

-- تقييمات للسائق الثاني
(4004, '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 3, 'مقبول، لكن السيارة تحتاج تنظيف', NOW() - INTERVAL '3 days'),
(4005, '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 4, 'سائق محترف، أوصي به', NOW() - INTERVAL '1 day'),
(4006, '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 2, 'لم يكن راضياً عن الخدمة', NOW() - INTERVAL '6 hours');

-- التحقق من النتائج
SELECT '=== النتائج النهائية ===' as info;
SELECT 
    p.full_name as "اسم السائق",
    p.average_rating as "متوسط التقييم",
    p.ratings_count as "عدد التقييمات"
FROM profiles p
WHERE p.role = 'driver' AND p.id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ORDER BY p.average_rating DESC;

-- عرض التقييمات المفصلة
SELECT '=== التقييمات المفصلة ===' as info;
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
