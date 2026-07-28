-- ===================================================
-- التحقق من الإحصائيات الحقيقية في Supabase
-- ===================================================
-- استخدم هذا الاستعلام في Supabase SQL Editor للتحقق

-- ⚠️ الخطوة 1: احصل على UUID السائق أولاً
-- نسّق هذا أولاً لرؤية السائقين:
SELECT 
    id, 
    full_name,
    role,
    average_rating,
    ratings_count
FROM profiles 
WHERE role = 'driver' 
ORDER BY created_at DESC
LIMIT 10;

-- ⚠️ الخطوة 2: انسخ UUID السائق من النتائج أعلاه
-- ثم استبدل 'YOUR_DRIVER_UUID_HERE' بالـ UUID الحقيقي

-- ===================================================
-- الاستعلام الرئيسي - احصائيات السائق الكاملة
-- ===================================================
WITH driver_stats AS (
  SELECT 
    -- معلومات السائق
    p.id AS driver_id,
    p.full_name AS driver_name,
    p.phone,
    p.average_rating,
    p.ratings_count,
    p.created_at AS driver_since,
    
    -- إحصائيات الرحلات
    (SELECT COUNT(*) FROM trips WHERE driver_id = p.id) AS total_trips,
    (SELECT COUNT(*) FROM trips WHERE driver_id = p.id AND status = 'completed') AS completed_trips,
    (SELECT COUNT(*) FROM trips WHERE driver_id = p.id AND status = 'scheduled') AS scheduled_trips,
    (SELECT COUNT(*) FROM trips WHERE driver_id = p.id AND status = 'cancelled') AS cancelled_trips,
    
    -- إحصائيات الحجوزات
    (SELECT COUNT(*) FROM bookings WHERE driver_id = p.id) AS total_bookings,
    (SELECT COUNT(*) FROM bookings WHERE driver_id = p.id AND status = 'completed') AS completed_bookings,
    (SELECT COUNT(*) FROM bookings WHERE driver_id = p.id AND status = 'confirmed') AS confirmed_bookings,
    (SELECT COUNT(*) FROM bookings WHERE driver_id = p.id AND status = 'pending') AS pending_bookings,
    (SELECT COUNT(*) FROM bookings WHERE driver_id = p.id AND status = 'cancelled') AS cancelled_bookings,
    
    -- المقاعد والأرباح
    (SELECT COALESCE(SUM(seats_booked), 0) FROM bookings WHERE driver_id = p.id) AS total_booked_seats,
    (SELECT COALESCE(SUM(seats_booked), 0) FROM bookings WHERE driver_id = p.id AND status = 'completed') AS completed_booked_seats,
    (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE driver_id = p.id) AS total_earnings,
    (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE driver_id = p.id AND status = 'completed') AS completed_earnings,
    
    -- المركبات
    (SELECT COUNT(*) FROM vehicles WHERE driver_id = p.id) AS total_vehicles,
    (SELECT COUNT(*) FROM vehicles WHERE driver_id = p.id AND is_active = true) AS active_vehicles
    
  FROM profiles p
  WHERE p.id = 'YOUR_DRIVER_UUID_HERE'  -- ⚠️ استبدل هذا بالـ UUID الحقيقي
)
SELECT * FROM driver_stats;

-- ===================================================
-- تفاصيل كل رحلة مع عدد الحجوزات
-- ===================================================
SELECT 
    t.id AS trip_id,
    t.status AS trip_status,
    t.departure_date,
    t.departure_time,
    t.total_seats,
    t.available_seats,
    t.price_per_seat,
    
    -- عدد الحجوزات لهذه الرحلة
    COUNT(b.id) AS bookings_count,
    
    -- المقاعد المحجوزة
    COALESCE(SUM(b.seats_booked), 0) AS seats_booked,
    
    -- الأرباح من هذه الرحلة
    COALESCE(SUM(b.total_amount), 0) AS trip_earnings,
    
    -- تفصيل حالات الحجوزات
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) AS completed_bookings,
    COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) AS confirmed_bookings,
    COUNT(CASE WHEN b.status = 'pending' THEN 1 END) AS pending_bookings,
    COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) AS cancelled_bookings
    
FROM trips t
LEFT JOIN bookings b ON t.id = b.trip_id
WHERE t.driver_id = 'YOUR_DRIVER_UUID_HERE'  -- ⚠️ استبدل هذا
GROUP BY t.id, t.status, t.departure_date, t.departure_time, t.total_seats, t.available_seats, t.price_per_seat
ORDER BY t.departure_date DESC, t.departure_time DESC;

-- ===================================================
-- تفصيل جميع الحجوزات
-- ===================================================
SELECT 
    b.id AS booking_id,
    b.status AS booking_status,
    b.seats_booked,
    b.total_amount,
    b.created_at,
    
    -- معلومات الرحلة
    t.id AS trip_id,
    t.status AS trip_status,
    t.departure_date,
    
    -- معلومات الراكب
    p.full_name AS passenger_name,
    p.phone AS passenger_phone
    
FROM bookings b
LEFT JOIN trips t ON b.trip_id = t.id
LEFT JOIN profiles p ON b.passenger_id = p.id
WHERE b.driver_id = 'YOUR_DRIVER_UUID_HERE'  -- ⚠️ استبدل هذا
ORDER BY b.created_at DESC
LIMIT 100;

-- ===================================================
-- كشف المشاكل المحتملة
-- ===================================================

-- 1. حجوزات بدون رحلة (orphan bookings)
SELECT 
    b.id AS booking_id,
    b.driver_id,
    b.trip_id,
    b.status,
    'Booking without valid trip' AS issue
FROM bookings b
WHERE b.driver_id = 'YOUR_DRIVER_UUID_HERE'  -- ⚠️ استبدل هذا
AND b.trip_id NOT IN (SELECT id FROM trips);

-- 2. رحلات بعدد كبير جداً من الحجوزات (ممكن خطأ)
SELECT 
    t.id AS trip_id,
    t.status,
    t.total_seats,
    COUNT(b.id) AS bookings_count,
    COALESCE(SUM(b.seats_booked), 0) AS total_booked,
    CASE 
        WHEN COALESCE(SUM(b.seats_booked), 0) > t.total_seats * 2 THEN '⚠️ Over-booked!'
        WHEN COUNT(b.id) > 50 THEN '⚠️ Too many bookings'
        ELSE '✅ Normal'
    END AS status_flag
FROM trips t
LEFT JOIN bookings b ON t.id = b.trip_id
WHERE t.driver_id = 'YOUR_DRIVER_UUID_HERE'  -- ⚠️ استبدل هذا
GROUP BY t.id, t.status, t.total_seats
HAVING COUNT(b.id) > 10
ORDER BY bookings_count DESC;

-- 3. حجوزات بدون راكب
SELECT 
    b.id AS booking_id,
    b.passenger_id,
    b.status,
    'Booking without valid passenger' AS issue
FROM bookings b
WHERE b.driver_id = 'YOUR_DRIVER_UUID_HERE'  -- ⚠️ استبدل هذا
AND b.passenger_id NOT IN (SELECT id FROM profiles);

-- ===================================================
-- مقارنة مع البيانات المعروضة في الواجهة
-- ===================================================
-- هذا الاستعلام يعطيك نفس النتائج التي تراها في Profile.tsx

SELECT 
    'إجمالي الرحلات' AS stat_name,
    COUNT(*) AS value
FROM trips 
WHERE driver_id = 'YOUR_DRIVER_UUID_HERE'  -- ⚠️ استبدل هذا

UNION ALL

SELECT 
    'الرحلات المكتملة' AS stat_name,
    COUNT(*) AS value
FROM trips 
WHERE driver_id = 'YOUR_DRIVER_UUID_HERE'  -- ⚠️ استبدل هذا
AND status = 'completed'

UNION ALL

SELECT 
    'إجمالي الحجوزات' AS stat_name,
    COUNT(*) AS value
FROM bookings 
WHERE driver_id = 'YOUR_DRIVER_UUID_HERE'  -- ⚠️ استبدل هذا

UNION ALL

SELECT 
    'المقاعد المحجوزة' AS stat_name,
    COALESCE(SUM(seats_booked), 0) AS value
FROM bookings 
WHERE driver_id = 'YOUR_DRIVER_UUID_HERE'  -- ⚠️ استبدل هذا

UNION ALL

SELECT 
    'الحجوزات المكتملة' AS stat_name,
    COUNT(*) AS value
FROM bookings 
WHERE driver_id = 'YOUR_DRIVER_UUID_HERE'  -- ⚠️ استبدل هذا
AND status = 'completed'

UNION ALL

SELECT 
    'الأرباح' AS stat_name,
    COALESCE(SUM(total_amount), 0) AS value
FROM bookings 
WHERE driver_id = 'YOUR_DRIVER_UUID_HERE';  -- ⚠️ استبدل هذا

-- ===================================================
-- تعليمات الاستخدام:
-- ===================================================
-- 1. شغّل الاستعلام الأول للحصول على UUID السائق
-- 2. انسخ UUID السائق
-- 3. استبدل كل 'YOUR_DRIVER_UUID_HERE' بالـ UUID الحقيقي
-- 4. شغّل الاستعلامات واحداً تلو الآخر
-- 5. قارن النتائج مع ما تراه في الواجهة
-- 
-- النتائج يجب أن تكون متطابقة تماماً! ✅
-- ===================================================

