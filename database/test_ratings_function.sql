-- اختبار دالة get_driver_ratings مع بيانات حقيقية
-- هذا الملف يساعد في تشخيص المشكلة

-- حذف الدالة القديمة أولاً
DROP FUNCTION IF EXISTS get_driver_ratings(UUID);

-- إنشاء دالة جديدة مع تسجيل مفصل
CREATE FUNCTION get_driver_ratings(driver_id UUID)
RETURNS TABLE (
    id INTEGER,
    booking_id INTEGER,
    passenger_id UUID,
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    passenger_name TEXT,
    passenger_avatar_url TEXT,
    passenger_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.booking_id,
        r.passenger_id,
        r.rating,
        r.comment,
        r.created_at,
        COALESCE(p.full_name, 'راكب') as passenger_name,
        CASE 
            WHEN p.avatar_url IS NOT NULL AND p.avatar_url != '' THEN 
                'https://kobsavfggcnfemdzsnpj.supabase.co/storage/v1/object/public/avatars/' || p.avatar_url
            ELSE NULL 
        END as passenger_avatar_url,
        p.email as passenger_email
    FROM ratings r
    LEFT JOIN profiles p ON r.passenger_id = p.id
    WHERE r.driver_id = driver_id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- اختبار الدالة مع معرف سائق حقيقي
-- استبدل بالمعرف الحقيقي للسائق من النتائج أعلاه
SELECT '=== اختبار الدالة ===' as info;

-- عرض جميع السائقين المتاحين للاختبار
SELECT 
    'السائقين المتاحين:' as info,
    id as driver_id,
    full_name as driver_name,
    email as driver_email
FROM profiles 
WHERE role = 'driver'
LIMIT 5;

-- اختبار الدالة مع أول سائق متاح
-- استبدل بالمعرف الحقيقي
-- SELECT * FROM get_driver_ratings('معرف-السائق-الحقيقي-هنا');

-- فحص التقييمات لكل سائق
SELECT '=== التقييمات لكل سائق ===' as info;
SELECT 
    p.id as driver_id,
    p.full_name as driver_name,
    COUNT(r.id) as ratings_count,
    AVG(r.rating) as average_rating
FROM profiles p
LEFT JOIN ratings r ON p.id = r.driver_id
WHERE p.role = 'driver'
GROUP BY p.id, p.full_name
ORDER BY ratings_count DESC;

SELECT 'تم إنشاء الدالة واختبارها!' as message;
