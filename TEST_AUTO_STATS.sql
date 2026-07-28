-- ===================================================
-- اختبار النظام التلقائي لحساب الرحلات
-- ===================================================

-- الخطوة 1: احصل على UUID سائق
SELECT id, full_name, total_trips_as_driver, completed_trips_as_driver
FROM profiles
WHERE role = 'driver'
LIMIT 1;

-- انسخ UUID السائق واستبدل 'YOUR_DRIVER_UUID' في الاستعلامات التالية

-- ===================================================
-- اختبار 1: قبل إنشاء رحلة
-- ===================================================

SELECT 
    'قبل إنشاء الرحلة' AS test_stage,
    total_trips_as_driver,
    completed_trips_as_driver
FROM profiles
WHERE id = 'YOUR_DRIVER_UUID';

-- ===================================================
-- اختبار 2: إنشاء رحلة جديدة
-- ===================================================

INSERT INTO trips (
    driver_id,
    from_wilaya_id,
    to_wilaya_id,
    departure_date,
    departure_time,
    price_per_seat,
    total_seats,
    available_seats,
    status
) VALUES (
    'YOUR_DRIVER_UUID',  -- استبدل هذا
    47,                  -- غرداية
    16,                  -- الجزائر
    CURRENT_DATE + INTERVAL '1 day',
    '09:00',
    1500,
    4,
    4,
    'scheduled'
) RETURNING id, status;

-- ===================================================
-- اختبار 3: بعد إنشاء الرحلة (يجب أن يزيد العدد تلقائياً)
-- ===================================================

SELECT 
    'بعد إنشاء الرحلة' AS test_stage,
    total_trips_as_driver,
    completed_trips_as_driver
FROM profiles
WHERE id = 'YOUR_DRIVER_UUID';

-- النتيجة المتوقعة: total_trips_as_driver زاد بمقدار 1 ✅

-- ===================================================
-- اختبار 4: تحديث حالة الرحلة إلى completed
-- ===================================================

-- احصل على UUID آخر رحلة
SELECT id, status FROM trips 
WHERE driver_id = 'YOUR_DRIVER_UUID' 
ORDER BY created_at DESC 
LIMIT 1;

-- حدّث الرحلة إلى completed
UPDATE trips
SET status = 'completed'
WHERE id = 'TRIP_UUID_HERE'  -- استبدل بـ UUID الرحلة من الاستعلام السابق
AND driver_id = 'YOUR_DRIVER_UUID';

-- ===================================================
-- اختبار 5: بعد إكمال الرحلة
-- ===================================================

SELECT 
    'بعد إكمال الرحلة' AS test_stage,
    total_trips_as_driver,
    completed_trips_as_driver
FROM profiles
WHERE id = 'YOUR_DRIVER_UUID';

-- النتيجة المتوقعة: completed_trips_as_driver زاد بمقدار 1 ✅

-- ===================================================
-- اختبار 6: حذف الرحلة
-- ===================================================

DELETE FROM trips
WHERE id = 'TRIP_UUID_HERE'  -- استبدل بـ UUID الرحلة
AND driver_id = 'YOUR_DRIVER_UUID';

-- ===================================================
-- اختبار 7: بعد حذف الرحلة
-- ===================================================

SELECT 
    'بعد حذف الرحلة' AS test_stage,
    total_trips_as_driver,
    completed_trips_as_driver
FROM profiles
WHERE id = 'YOUR_DRIVER_UUID';

-- النتيجة المتوقعة: الأعداد انخفضت تلقائياً ✅

-- ===================================================
-- النتائج المتوقعة:
-- ===================================================
-- قبل إنشاء: total=0, completed=0
-- بعد إنشاء: total=1, completed=0 ✅
-- بعد إكمال: total=1, completed=1 ✅
-- بعد حذف: total=0, completed=0 ✅
-- ===================================================

-- ✅ إذا كانت النتائج مطابقة، النظام يعمل بشكل مثالي!

