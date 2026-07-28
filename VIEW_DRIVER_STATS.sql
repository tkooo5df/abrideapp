-- ══════════════════════════════════════════════════════════════════
-- استعلام شامل لعرض إحصائيات السائق
-- Complete Driver Statistics Query
-- ══════════════════════════════════════════════════════════════════

-- استبدل 'YOUR-DRIVER-UUID-HERE' بمعرف السائق الفعلي
-- Replace 'YOUR-DRIVER-UUID-HERE' with actual driver UUID

SELECT 
    -- ═══ المعلومات الأساسية ═══
    p.id AS driver_id,
    p.full_name AS driver_name,
    p.phone,
    p.email,
    p.role,
    p.is_verified,
    p.created_at AS joined_date,
    
    -- ═══ التقييمات ═══
    p.average_rating,
    p.ratings_count,
    
    -- ═══ الرحلات ═══
    (SELECT COUNT(*) 
     FROM trips t 
     WHERE t.driver_id = p.id 
     AND t.status = 'completed') AS completed_trips,
     
    (SELECT COUNT(*) 
     FROM trips t 
     WHERE t.driver_id = p.id) AS total_trips,
    
    -- ═══ الحجوزات ═══
    (SELECT COALESCE(SUM(b.seats_booked), 0) 
     FROM bookings b 
     WHERE b.driver_id = p.id) AS total_booked_seats,
     
    (SELECT COUNT(*) 
     FROM bookings b 
     WHERE b.driver_id = p.id 
     AND b.status = 'completed') AS completed_bookings,
     
    (SELECT COUNT(*) 
     FROM bookings b 
     WHERE b.driver_id = p.id) AS total_bookings,
    
    -- ═══ الأرباح ═══
    (SELECT COALESCE(SUM(b.total_amount), 0) 
     FROM bookings b 
     WHERE b.driver_id = p.id) AS total_earnings,
     
    (SELECT COALESCE(SUM(b.total_amount), 0) 
     FROM bookings b 
     WHERE b.driver_id = p.id 
     AND b.status = 'completed') AS completed_earnings,
    
    -- ═══ المركبات ═══
    (SELECT COUNT(*) 
     FROM vehicles v 
     WHERE v.driver_id = p.id) AS total_vehicles,
     
    (SELECT COUNT(*) 
     FROM vehicles v 
     WHERE v.driver_id = p.id 
     AND v.is_active = true) AS active_vehicles

FROM profiles p
WHERE p.id = 'YOUR-DRIVER-UUID-HERE';  -- ← ضع UUID السائق هنا


-- ══════════════════════════════════════════════════════════════════
-- تفاصيل التقييمات (آخر 10 تقييمات)
-- ══════════════════════════════════════════════════════════════════

SELECT 
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    -- معلومات الراكب
    p.full_name AS passenger_name,
    p.avatar_url AS passenger_avatar,
    -- معلومات الحجز
    b.id AS booking_id,
    b.total_amount
FROM ratings r
LEFT JOIN profiles p ON r.passenger_id = p.id
LEFT JOIN bookings b ON r.booking_id = b.id
WHERE r.driver_id = 'YOUR-DRIVER-UUID-HERE'  -- ← ضع UUID السائق هنا
ORDER BY r.created_at DESC
LIMIT 10;


-- ══════════════════════════════════════════════════════════════════
-- المركبات النشطة
-- ══════════════════════════════════════════════════════════════════

SELECT 
    id,
    make,
    model,
    year,
    license_plate,
    color,
    seats,
    is_active,
    created_at
FROM vehicles
WHERE driver_id = 'YOUR-DRIVER-UUID-HERE'  -- ← ضع UUID السائق هنا
AND is_active = true
ORDER BY created_at DESC;


-- ══════════════════════════════════════════════════════════════════
-- آخر 10 رحلات
-- ══════════════════════════════════════════════════════════════════

SELECT 
    t.id,
    t.from_wilaya_id,
    t.to_wilaya_id,
    t.departure_date,
    t.departure_time,
    t.available_seats,
    t.price_per_seat,
    t.status,
    t.created_at,
    -- عدد الحجوزات لكل رحلة
    (SELECT COUNT(*) FROM bookings WHERE trip_id = t.id) AS bookings_count
FROM trips t
WHERE t.driver_id = 'YOUR-DRIVER-UUID-HERE'  -- ← ضع UUID السائق هنا
ORDER BY t.created_at DESC
LIMIT 10;


-- ══════════════════════════════════════════════════════════════════
-- الأرباح الشهرية
-- ══════════════════════════════════════════════════════════════════

SELECT 
    DATE_TRUNC('month', b.created_at) AS month,
    COUNT(DISTINCT b.id) AS bookings_count,
    SUM(b.seats_booked) AS seats_booked,
    SUM(b.total_amount) AS earnings,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) AS completed_bookings
FROM bookings b
WHERE b.driver_id = 'YOUR-DRIVER-UUID-HERE'  -- ← ضع UUID السائق هنا
GROUP BY DATE_TRUNC('month', b.created_at)
ORDER BY month DESC
LIMIT 12;


-- ══════════════════════════════════════════════════════════════════
-- الحصول على UUID السائق من البريد الإلكتروني أو رقم الهاتف
-- ══════════════════════════════════════════════════════════════════

-- إذا كنت تعرف البريد الإلكتروني:
SELECT id, full_name, email, phone 
FROM profiles 
WHERE email = 'driver@example.com'  -- ← ضع البريد الإلكتروني هنا
AND role = 'driver';

-- أو إذا كنت تعرف رقم الهاتف:
SELECT id, full_name, email, phone 
FROM profiles 
WHERE phone = '0555123456'  -- ← ضع رقم الهاتف هنا
AND role = 'driver';

-- أو عرض جميع السائقين:
SELECT id, full_name, email, phone, average_rating
FROM profiles 
WHERE role = 'driver'
ORDER BY created_at DESC
LIMIT 20;

