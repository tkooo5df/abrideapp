-- استعلامات SQL لاختبار نظام التقييمات

-- 1. عرض جميع التقييمات مع تفاصيل الراكب والسائق
SELECT 
    r.id as "رقم التقييم",
    r.rating as "التقييم",
    r.comment as "التعليق",
    r.created_at as "تاريخ التقييم",
    b.id as "رقم الحجز",
    driver.full_name as "اسم السائق",
    passenger.full_name as "اسم الراكب"
FROM ratings r
JOIN profiles driver ON r.driver_id = driver.id
JOIN profiles passenger ON r.passenger_id = passenger.id
JOIN bookings b ON r.booking_id = b.id
ORDER BY r.created_at DESC;

-- 2. إحصائيات التقييمات للسائقين
SELECT 
    p.id as "معرف السائق",
    p.full_name as "اسم السائق",
    p.average_rating as "متوسط التقييم",
    p.ratings_count as "عدد التقييمات",
    COUNT(r.id) as "تقييمات فعلية",
    MIN(r.rating) as "أقل تقييم",
    MAX(r.rating) as "أعلى تقييم"
FROM profiles p
LEFT JOIN ratings r ON p.id = r.driver_id
WHERE p.role = 'driver'
GROUP BY p.id, p.full_name, p.average_rating, p.ratings_count
ORDER BY p.average_rating DESC;

-- 3. التقييمات الأخيرة (آخر 10 تقييمات)
SELECT 
    r.rating as "التقييم",
    r.comment as "التعليق",
    driver.full_name as "السائق",
    passenger.full_name as "الراكب",
    r.created_at as "التاريخ"
FROM ratings r
JOIN profiles driver ON r.driver_id = driver.id
JOIN profiles passenger ON r.passenger_id = passenger.id
ORDER BY r.created_at DESC
LIMIT 10;

-- 4. توزيع التقييمات حسب النجوم
SELECT 
    rating as "عدد النجوم",
    COUNT(*) as "عدد التقييمات",
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ratings), 2) as "النسبة المئوية"
FROM ratings
GROUP BY rating
ORDER BY rating DESC;

-- 5. أفضل السائقين حسب التقييم
SELECT 
    p.full_name as "اسم السائق",
    p.average_rating as "متوسط التقييم",
    p.ratings_count as "عدد التقييمات",
    STRING_AGG(DISTINCT r.comment, ' | ' ORDER BY r.created_at DESC) as "آخر التعليقات"
FROM profiles p
JOIN ratings r ON p.id = r.driver_id
WHERE p.role = 'driver' 
    AND p.ratings_count >= 3  -- سائقين لديهم 3 تقييمات على الأقل
GROUP BY p.id, p.full_name, p.average_rating, p.ratings_count
ORDER BY p.average_rating DESC, p.ratings_count DESC
LIMIT 5;

-- 6. التقييمات حسب الشهر
SELECT 
    DATE_TRUNC('month', created_at) as "الشهر",
    COUNT(*) as "عدد التقييمات",
    ROUND(AVG(rating), 2) as "متوسط التقييم الشهري"
FROM ratings
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY "الشهر" DESC;

-- 7. السائقين الذين يحتاجون تقييمات أكثر
SELECT 
    p.full_name as "اسم السائق",
    p.average_rating as "متوسط التقييم",
    p.ratings_count as "عدد التقييمات",
    COUNT(b.id) as "إجمالي الحجوزات"
FROM profiles p
LEFT JOIN ratings r ON p.id = r.driver_id
LEFT JOIN bookings b ON p.id = b.driver_id
WHERE p.role = 'driver'
GROUP BY p.id, p.full_name, p.average_rating, p.ratings_count
HAVING COUNT(b.id) > p.ratings_count  -- لديهم حجوزات أكثر من التقييمات
ORDER BY (COUNT(b.id) - p.ratings_count) DESC;

-- 8. إضافة تقييم تجريبي جديد
INSERT INTO ratings (booking_id, driver_id, passenger_id, rating, comment, created_at) 
VALUES (
    16,  -- رقم حجز موجود
    '550e8400-e29b-41d4-a716-446655440001',  -- معرف سائق موجود
    '550e8400-e29b-41d4-a716-446655440002',  -- معرف راكب موجود
    5,
    'تجربة رائعة! السائق كان محترف جداً والرحلة كانت مريحة وآمنة',
    NOW()
);

-- 9. تحديث تقييم موجود
UPDATE ratings 
SET 
    rating = 4,
    comment = 'تقييم محدث: جيد جداً لكن يمكن أن يكون أفضل',
    updated_at = NOW()
WHERE booking_id = 1 AND passenger_id = '550e8400-e29b-41d4-a716-446655440002';

-- 10. حذف تقييم (للمراجعة فقط)
-- DELETE FROM ratings WHERE id = 1;

-- 11. إحصائيات شاملة للنظام
SELECT 
    'إجمالي التقييمات' as "المقياس",
    COUNT(*) as "القيمة"
FROM ratings
UNION ALL
SELECT 
    'متوسط التقييم العام',
    ROUND(AVG(rating), 2)
FROM ratings
UNION ALL
SELECT 
    'عدد السائقين المقييمين',
    COUNT(DISTINCT driver_id)
FROM ratings
UNION ALL
SELECT 
    'عدد الركاب الذين قيموا',
    COUNT(DISTINCT passenger_id)
FROM ratings
UNION ALL
SELECT 
    'أعلى تقييم',
    MAX(rating)
FROM ratings
UNION ALL
SELECT 
    'أقل تقييم',
    MIN(rating)
FROM ratings;
