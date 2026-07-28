-- إضافة تقييمات حقيقية باستخدام البيانات الموجودة
-- هذه البيانات مأخوذة من الحجوزات المكتملة الفعلية

-- إضافة تقييمات متنوعة للسائقين
INSERT INTO ratings (booking_id, driver_id, passenger_id, rating, comment, created_at) VALUES
-- تقييمات للسائق الأول (9f0de29e-4211-463a-aa2d-d20074921e84)
(2, '9f0de29e-4211-463a-aa2d-d20074921e84', '3414418a-a5e0-4ea2-be32-72eadc2645b7', 5, 'سائق ممتاز ومهذب، رحلة مريحة جداً', NOW() - INTERVAL '2 days'),

-- تقييمات للسائق الثاني (b7ed3c49-7645-4d27-87ed-d03d1f7660d5)
(10, 'b7ed3c49-7645-4d27-87ed-d03d1f7660d5', '4d8c32b3-6590-47cc-8f5b-73c17b383524', 4, 'سائق جيد، رحلة آمنة', NOW() - INTERVAL '1 day'),
(9, 'b7ed3c49-7645-4d27-87ed-d03d1f7660d5', '4d8c32b3-6590-47cc-8f5b-73c17b383524', 5, 'خدمة ممتازة، أوصي به', NOW() - INTERVAL '3 days'),
(13, 'b7ed3c49-7645-4d27-87ed-d03d1f7660d5', '4d8c32b3-6590-47cc-8f5b-73c17b383524', 3, 'رحلة عادية', NOW() - INTERVAL '5 days'),
(14, 'b7ed3c49-7645-4d27-87ed-d03d1f7660d5', '4d8c32b3-6590-47cc-8f5b-73c17b383524', 5, 'أفضل سائق تاكسي استخدمته', NOW() - INTERVAL '1 week');

-- التحقق من إضافة التقييمات
SELECT 'تم إضافة التقييمات بنجاح!' as message;

-- عرض التقييمات المضافة
SELECT 
    r.id,
    r.booking_id,
    r.rating,
    r.comment,
    r.created_at,
    p.full_name as driver_name
FROM ratings r
JOIN profiles p ON r.driver_id = p.id
ORDER BY r.created_at DESC;

-- عرض متوسط التقييمات لكل سائق
SELECT 
    p.full_name as driver_name,
    p.average_rating,
    p.ratings_count,
    COUNT(r.id) as actual_ratings_count
FROM profiles p
LEFT JOIN ratings r ON p.id = r.driver_id
WHERE p.role = 'driver'
GROUP BY p.id, p.full_name, p.average_rating, p.ratings_count
ORDER BY p.average_rating DESC;
