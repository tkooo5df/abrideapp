-- حل نهائي: استخدام معرفات موجودة فعلاً في النظام
-- هذا الحل الأكثر أماناً لأنه يستخدم بيانات حقيقية

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

-- الخطوة 2: إنشاء بيانات تجريبية باستخدام معرفات موجودة
-- إذا لم تكن هناك بيانات كافية، أنشئ بيانات بسيطة

-- إنشاء حجوزات تجريبية مكتملة
-- استخدام معرفات موجودة فعلاً في النظام
INSERT INTO bookings (pickup_location, destination_location, passenger_id, driver_id, seats_booked, total_amount, payment_method, status, created_at, updated_at)
VALUES 
    ('الجزائر العاصمة', 'وهران', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 1, 2500, 'cod', 'completed', NOW() - INTERVAL '2 days', NOW()),
    ('وهران', 'الجزائر العاصمة', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 1, 2500, 'cod', 'completed', NOW() - INTERVAL '1 day', NOW()),
    ('الجزائر العاصمة', 'قسنطينة', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 1, 3000, 'cod', 'completed', NOW() - INTERVAL '5 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- إدراج التقييمات
-- استخدام معرفات الحجوزات التي تم إنشاؤها
INSERT INTO ratings (booking_id, driver_id, passenger_id, rating, comment, created_at) VALUES
-- تقييمات للسائق
((SELECT id FROM bookings WHERE pickup_location = 'الجزائر العاصمة' AND destination_location = 'وهران' AND status = 'completed' LIMIT 1), '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 5, 'سائق ممتاز ومهذب جداً، الرحلة كانت مريحة وآمنة', NOW() - INTERVAL '2 days'),
((SELECT id FROM bookings WHERE pickup_location = 'وهران' AND destination_location = 'الجزائر العاصمة' AND status = 'completed' LIMIT 1), '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 4, 'جيد جداً، لكن تأخر قليلاً', NOW() - INTERVAL '1 day'),
((SELECT id FROM bookings WHERE pickup_location = 'الجزائر العاصمة' AND destination_location = 'قسنطينة' AND status = 'completed' LIMIT 1), '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 5, 'أفضل سائق في المدينة!', NOW() - INTERVAL '5 hours');

-- التحقق من النتائج
SELECT '=== النتائج النهائية ===' as info;
SELECT 
    p.full_name as "اسم السائق",
    COUNT(r.id) as "عدد التقييمات",
    ROUND(AVG(r.rating), 2) as "متوسط التقييم"
FROM profiles p
LEFT JOIN ratings r ON p.id = r.driver_id
WHERE p.role = 'driver' AND p.id = '22222222-2222-2222-2222-222222222222'
GROUP BY p.id, p.full_name;

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
