-- ══════════════════════════════════════════════════════════════════
-- الحصول على UUID حقيقي للسائق
-- Get Real Driver UUID
-- ══════════════════════════════════════════════════════════════════

-- الخطوة 1: عرض جميع السائقين مع معلوماتهم
-- Step 1: Show all drivers with their info

SELECT 
    id AS driver_uuid,          -- ← انسخ هذا UUID
    full_name,
    phone,
    email,
    average_rating,
    ratings_count,
    created_at,
    -- عدد الرحلات
    (SELECT COUNT(*) FROM trips WHERE driver_id = profiles.id) AS trips_count,
    -- عدد الحجوزات
    (SELECT COUNT(*) FROM bookings WHERE driver_id = profiles.id) AS bookings_count
FROM profiles
WHERE role = 'driver'
ORDER BY created_at DESC;

-- ══════════════════════════════════════════════════════════════════
-- أو ابحث عن سائق معين:
-- ══════════════════════════════════════════════════════════════════

-- بالاسم:
SELECT id, full_name, phone, email 
FROM profiles 
WHERE role = 'driver' 
AND full_name ILIKE '%اسم السائق%'  -- ← ضع اسم السائق هنا
LIMIT 10;

-- أو برقم الهاتف:
SELECT id, full_name, phone, email 
FROM profiles 
WHERE role = 'driver' 
AND phone LIKE '%0555%'  -- ← ضع جزء من رقم الهاتف
LIMIT 10;

-- أو بالبريد الإلكتروني:
SELECT id, full_name, phone, email 
FROM profiles 
WHERE role = 'driver' 
AND email ILIKE '%example%'  -- ← ضع جزء من البريد
LIMIT 10;

-- ══════════════════════════════════════════════════════════════════
-- مثال UUID حقيقي يبدو هكذا:
-- ══════════════════════════════════════════════════════════════════
-- 4d8c32b3-6590-47cc-8f5b-73c17b383524
-- a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789
-- ══════════════════════════════════════════════════════════════════

