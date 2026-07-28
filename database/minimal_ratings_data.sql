-- حل مبسط جداً: استخدام البيانات الموجودة فقط
-- هذا الحل الأكثر أماناً

-- 1. فحص البيانات الموجودة
SELECT '=== فحص البيانات الموجودة ===' as info;

-- عرض السائقين الموجودين
SELECT 'السائقين الموجودين:' as info;
SELECT id, full_name, email FROM profiles WHERE role = 'driver' LIMIT 3;

-- عرض الركاب الموجودين  
SELECT 'الركاب الموجودين:' as info;
SELECT id, full_name, email FROM profiles WHERE role = 'passenger' LIMIT 3;

-- عرض الحجوزات المكتملة الموجودة
SELECT 'الحجوزات المكتملة الموجودة:' as info;
SELECT id, driver_id, passenger_id, status FROM bookings WHERE status = 'completed' LIMIT 3;

-- 2. إذا كانت هناك حجوزات مكتملة، أضف تقييمات لها مباشرة
-- إذا لم تكن هناك حجوزات مكتملة، أنشئ حجوزات تجريبية أولاً

-- إنشاء حجوزات تجريبية مكتملة
-- استخدام معرفات UUID صحيحة
INSERT INTO bookings (id, pickup_location, destination_location, passenger_id, driver_id, seats_booked, total_amount, payment_method, status, created_at, updated_at)
VALUES 
    (5001, 'الجزائر العاصمة', 'وهران', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 1, 2500, 'cod', 'completed', NOW() - INTERVAL '2 days', NOW()),
    (5002, 'وهران', 'الجزائر العاصمة', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 1, 2500, 'cod', 'completed', NOW() - INTERVAL '1 day', NOW()),
    (5003, 'الجزائر العاصمة', 'قسنطينة', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 1, 3000, 'cod', 'completed', NOW() - INTERVAL '5 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- إدراج التقييمات
INSERT INTO ratings (booking_id, driver_id, passenger_id, rating, comment, created_at) VALUES
(5001, '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 5, 'سائق ممتاز ومهذب جداً، الرحلة كانت مريحة وآمنة', NOW() - INTERVAL '2 days'),
(5002, '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 4, 'جيد جداً، لكن تأخر قليلاً', NOW() - INTERVAL '1 day'),
(5003, '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 5, 'أفضل سائق في المدينة!', NOW() - INTERVAL '5 hours');

-- التحقق من النتائج
SELECT '=== النتائج النهائية ===' as info;
SELECT 
    p.full_name as "اسم السائق",
    p.average_rating as "متوسط التقييم",
    p.ratings_count as "عدد التقييمات"
FROM profiles p
WHERE p.role = 'driver' AND p.id = '22222222-2222-2222-2222-222222222222';

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
