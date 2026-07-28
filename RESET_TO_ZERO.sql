-- ===================================================
-- إعادة تعيين البيانات إلى الصفر - الحفاظ على المستخدمين
-- ===================================================
-- هذا الاستعلام سيحذف:
-- ✅ جميع الحجوزات (bookings)
-- ✅ جميع الرحلات (trips)
-- ✅ جميع التقييمات (ratings و passenger_ratings)
-- ✅ جميع المركبات (vehicles)
-- ✅ جميع الإشعارات (notifications)
-- ❌ المستخدمين محفوظون (profiles)

BEGIN;

-- 1. حذف التقييمات للركاب
DELETE FROM passenger_ratings;

-- 2. حذف تقييمات السائقين
DELETE FROM ratings;

-- 3. حذف الحجوزات
DELETE FROM bookings;

-- 4. حذف الرحلات
DELETE FROM trips;

-- 5. حذف المركبات
DELETE FROM vehicles;

-- 6. حذف الإشعارات
DELETE FROM notifications;

-- 7. إعادة تعيين الإحصائيات في جدول profiles
UPDATE profiles
SET 
    average_rating = 0,
    ratings_count = 0,
    passenger_average_rating = 0,
    passenger_ratings_count = 0,
    total_trips_as_passenger = 0,
    total_cancellations_as_passenger = 0;

COMMIT;

-- ===================================================
-- التحقق من النتائج
-- ===================================================

SELECT 
    'bookings' AS table_name,
    COUNT(*) AS count
FROM bookings

UNION ALL

SELECT 
    'trips' AS table_name,
    COUNT(*) AS count
FROM trips

UNION ALL

SELECT 
    'ratings' AS table_name,
    COUNT(*) AS count
FROM ratings

UNION ALL

SELECT 
    'passenger_ratings' AS table_name,
    COUNT(*) AS count
FROM passenger_ratings

UNION ALL

SELECT 
    'vehicles' AS table_name,
    COUNT(*) AS count
FROM vehicles

UNION ALL

SELECT 
    'notifications' AS table_name,
    COUNT(*) AS count
FROM notifications

UNION ALL

SELECT 
    'profiles (المستخدمين محفوظون)' AS table_name,
    COUNT(*) AS count
FROM profiles;

-- ===================================================
-- النتيجة المتوقعة:
-- ===================================================
-- bookings: 0
-- trips: 0
-- ratings: 0
-- passenger_ratings: 0
-- vehicles: 0
-- notifications: 0
-- profiles: [عدد المستخدمين الحاليين - محفوظ]
-- ===================================================

