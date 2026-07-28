-- ══════════════════════════════════════════════════════════════════
-- تشخيص مشكلة الإحصائيات - Debug Driver Statistics
-- ══════════════════════════════════════════════════════════════════

-- استبدل UUID هنا
-- Replace with your driver UUID
DO $$
DECLARE
    v_driver_id UUID := '4d8c32b3-6590-47cc-8f5b-73c17b383524';  -- ← ضع UUID السائق هنا
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE 'Driver Statistics Diagnosis';
    RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;


-- 1. معلومات السائق الأساسية
SELECT 
    '1. Driver Basic Info' AS section,
    id,
    full_name,
    phone,
    role,
    average_rating,
    ratings_count,
    created_at
FROM profiles
WHERE id = '4d8c32b3-6590-47cc-8f5b-73c17b383524';  -- ← ضع UUID السائق هنا


-- 2. تحليل الرحلات (Trips)
SELECT 
    '2. Trips Analysis' AS section,
    COUNT(*) AS total_trips,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_trips,
    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) AS scheduled_trips,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_trips,
    COUNT(CASE WHEN status NOT IN ('completed', 'scheduled', 'cancelled') THEN 1 END) AS other_status
FROM trips
WHERE driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524';  -- ← ضع UUID السائق هنا


-- 3. تحليل الحجوزات (Bookings)
SELECT 
    '3. Bookings Analysis' AS section,
    COUNT(*) AS total_bookings,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_bookings,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed_bookings,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_bookings,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_bookings,
    SUM(seats_booked) AS total_seats_booked,
    SUM(CASE WHEN status = 'completed' THEN seats_booked ELSE 0 END) AS completed_seats,
    SUM(total_amount) AS total_earnings,
    SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) AS completed_earnings
FROM bookings
WHERE driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524';  -- ← ضع UUID السائق هنا


-- 4. الحجوزات لكل رحلة (المشكلة المحتملة!)
SELECT 
    '4. Bookings Per Trip' AS section,
    t.id AS trip_id,
    t.from_wilaya_id,
    t.to_wilaya_id,
    t.status AS trip_status,
    t.departure_date,
    COUNT(b.id) AS bookings_count,
    SUM(b.seats_booked) AS seats_booked,
    SUM(b.total_amount) AS trip_earnings
FROM trips t
LEFT JOIN bookings b ON t.id = b.trip_id
WHERE t.driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524'  -- ← ضع UUID السائق هنا
GROUP BY t.id, t.from_wilaya_id, t.to_wilaya_id, t.status, t.departure_date
ORDER BY t.created_at DESC;


-- 5. الحجوزات بدون رحلات (مشكلة!)
SELECT 
    '5. Bookings Without Trips' AS section,
    COUNT(*) AS orphan_bookings
FROM bookings b
WHERE b.driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524'  -- ← ضع UUID السائق هنا
AND b.trip_id NOT IN (SELECT id FROM trips WHERE driver_id = b.driver_id);


-- 6. المركبات
SELECT 
    '6. Vehicles Analysis' AS section,
    COUNT(*) AS total_vehicles,
    COUNT(CASE WHEN is_active THEN 1 END) AS active_vehicles,
    COUNT(CASE WHEN NOT is_active THEN 1 END) AS inactive_vehicles
FROM vehicles
WHERE driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524';  -- ← ضع UUID السائق هنا


-- 7. التقييمات
SELECT 
    '7. Ratings Analysis' AS section,
    COUNT(*) AS total_ratings,
    AVG(rating) AS average_rating,
    MIN(rating) AS min_rating,
    MAX(rating) AS max_rating
FROM ratings
WHERE driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524';  -- ← ضع UUID السائق هنا


-- ══════════════════════════════════════════════════════════════════
-- 8. ملخص المشكلة
-- ══════════════════════════════════════════════════════════════════

SELECT 
    '8. SUMMARY - Problem Detection' AS section,
    
    -- عدد الرحلات
    (SELECT COUNT(*) FROM trips 
     WHERE driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524') AS total_trips,
    
    (SELECT COUNT(*) FROM trips 
     WHERE driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524' 
     AND status = 'completed') AS completed_trips,
    
    -- عدد الحجوزات
    (SELECT COUNT(*) FROM bookings 
     WHERE driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524') AS total_bookings,
    
    -- متوسط الحجوزات لكل رحلة
    CASE 
        WHEN (SELECT COUNT(*) FROM trips 
              WHERE driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524') > 0 
        THEN (SELECT COUNT(*) FROM bookings 
              WHERE driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524')::DECIMAL / 
             (SELECT COUNT(*) FROM trips 
              WHERE driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524')
        ELSE 0 
    END AS avg_bookings_per_trip,
    
    -- هل هناك حجوزات بدون رحلات؟
    (SELECT COUNT(*) FROM bookings b
     WHERE b.driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524'
     AND b.trip_id NOT IN (
         SELECT id FROM trips WHERE driver_id = b.driver_id
     )) AS bookings_without_trips,
    
    -- تشخيص المشكلة
    CASE 
        WHEN (SELECT COUNT(*) FROM trips 
              WHERE driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524' 
              AND status = 'completed') = 1
        AND (SELECT COUNT(*) FROM bookings 
             WHERE driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524') > 100
        THEN '⚠️ Problem: Only 1 completed trip but many bookings!'
        
        WHEN (SELECT COUNT(*) FROM bookings b
              WHERE b.driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524'
              AND b.trip_id NOT IN (
                  SELECT id FROM trips WHERE driver_id = b.driver_id
              )) > 0
        THEN '⚠️ Problem: Some bookings are not linked to trips!'
        
        ELSE '✅ Data looks OK'
    END AS diagnosis;


-- ══════════════════════════════════════════════════════════════════
-- 9. تفاصيل الرحلات مع عدد حجوزاتها
-- ══════════════════════════════════════════════════════════════════

SELECT 
    '9. Trip Details with Booking Count' AS section,
    t.id,
    t.from_wilaya_id || ' → ' || t.to_wilaya_id AS route,
    t.status,
    t.departure_date,
    t.available_seats,
    (SELECT COUNT(*) FROM bookings WHERE trip_id = t.id) AS bookings_for_this_trip,
    (SELECT SUM(seats_booked) FROM bookings WHERE trip_id = t.id) AS seats_booked_for_this_trip
FROM trips t
WHERE t.driver_id = '4d8c32b3-6590-47cc-8f5b-73c17b383524'  -- ← ضع UUID السائق هنا
ORDER BY (SELECT COUNT(*) FROM bookings WHERE trip_id = t.id) DESC;

