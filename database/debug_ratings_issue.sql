-- تشخيص مشكلة عدم ظهور التقييمات في ملف السائق
-- هذا الملف يساعد في تشخيص المشكلة

-- الخطوة 1: فحص جدول ratings
SELECT '=== فحص جدول ratings ===' as info;
SELECT COUNT(*) as total_ratings FROM ratings;

-- الخطوة 2: فحص التقييمات الموجودة
SELECT '=== التقييمات الموجودة ===' as info;
SELECT 
    id,
    booking_id,
    driver_id,
    passenger_id,
    rating,
    comment,
    created_at
FROM ratings 
ORDER BY created_at DESC
LIMIT 10;

-- الخطوة 3: فحص التقييمات لكل سائق
SELECT '=== التقييمات لكل سائق ===' as info;
SELECT 
    driver_id,
    COUNT(*) as ratings_count,
    AVG(rating) as average_rating,
    MIN(created_at) as first_rating,
    MAX(created_at) as last_rating
FROM ratings 
GROUP BY driver_id
ORDER BY ratings_count DESC;

-- الخطوة 4: فحص دالة get_driver_ratings
SELECT '=== اختبار دالة get_driver_ratings ===' as info;
-- استبدل بالمعرف الحقيقي للسائق
-- SELECT * FROM get_driver_ratings('معرف-السائق-هنا');

-- الخطوة 5: فحص الملفات الشخصية للسائقين
SELECT '=== الملفات الشخصية للسائقين ===' as info;
SELECT 
    id,
    full_name,
    email,
    role,
    average_rating,
    ratings_count
FROM profiles 
WHERE role = 'driver'
ORDER BY average_rating DESC;

-- الخطوة 6: فحص الحجوزات المكتملة
SELECT '=== الحجوزات المكتملة ===' as info;
SELECT 
    id,
    driver_id,
    passenger_id,
    status,
    created_at
FROM bookings 
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 10;

-- الخطوة 7: فحص التقييمات المرتبطة بالحجوزات
SELECT '=== التقييمات المرتبطة بالحجوزات ===' as info;
SELECT 
    r.id as rating_id,
    r.booking_id,
    r.driver_id,
    r.passenger_id,
    r.rating,
    r.comment,
    r.created_at as rating_date,
    b.status as booking_status,
    b.created_at as booking_date
FROM ratings r
JOIN bookings b ON r.booking_id = b.id
ORDER BY r.created_at DESC;

-- الخطوة 8: فحص الأخطاء المحتملة
SELECT '=== فحص الأخطاء المحتملة ===' as info;
-- فحص التقييمات بدون حجوزات مرتبطة
SELECT 
    r.id,
    r.booking_id,
    r.driver_id,
    r.passenger_id,
    r.rating,
    r.created_at
FROM ratings r
LEFT JOIN bookings b ON r.booking_id = b.id
WHERE b.id IS NULL;

-- فحص التقييمات بدون ملفات شخصية مرتبطة
SELECT 
    r.id,
    r.driver_id,
    r.passenger_id,
    r.rating,
    r.created_at
FROM ratings r
LEFT JOIN profiles p ON r.driver_id = p.id
WHERE p.id IS NULL;
