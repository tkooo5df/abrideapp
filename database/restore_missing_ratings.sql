-- استعادة التقييمات المفقودة
-- هذا الملف يساعد في استعادة التقييمات المفقودة

-- فحص التقييمات الموجودة في جدول ratings
SELECT '=== فحص التقييمات الموجودة ===' as info;
SELECT 
    id,
    booking_id,
    driver_id,
    passenger_id,
    rating,
    comment,
    created_at
FROM ratings 
ORDER BY created_at DESC;

-- فحص عدد التقييمات لكل سائق
SELECT '=== عدد التقييمات لكل سائق ===' as info;
SELECT 
    driver_id,
    COUNT(*) as ratings_count,
    AVG(rating) as average_rating,
    MIN(created_at) as first_rating,
    MAX(created_at) as last_rating
FROM ratings 
GROUP BY driver_id
ORDER BY ratings_count DESC;

-- فحص التقييمات مع معلومات الراكب
SELECT '=== التقييمات مع معلومات الراكب ===' as info;
SELECT 
    r.id as rating_id,
    r.booking_id,
    r.driver_id,
    r.passenger_id,
    r.rating,
    r.comment,
    r.created_at,
    p.full_name as passenger_name,
    p.email as passenger_email,
    p.avatar_url
FROM ratings r
LEFT JOIN profiles p ON r.passenger_id = p.id
ORDER BY r.created_at DESC
LIMIT 10;

-- إنشاء دالة get_driver_ratings مع تسجيل مفصل
DROP FUNCTION IF EXISTS get_driver_ratings(UUID);

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

-- اختبار الدالة مع جميع السائقين
SELECT '=== اختبار الدالة مع جميع السائقين ===' as info;
SELECT 
    p.id as driver_id,
    p.full_name as driver_name,
    COUNT(r.id) as ratings_count
FROM profiles p
LEFT JOIN ratings r ON p.id = r.driver_id
WHERE p.role = 'driver'
GROUP BY p.id, p.full_name
ORDER BY ratings_count DESC;

-- اختبار الدالة مع أول سائق له تقييمات
-- استبدل بالمعرف الحقيقي للسائق
-- SELECT * FROM get_driver_ratings('معرف-السائق-الحقيقي');

-- فحص التقييمات المفقودة
SELECT '=== فحص التقييمات المفقودة ===' as info;
SELECT 
    r.id,
    r.driver_id,
    r.passenger_id,
    r.rating,
    r.comment,
    r.created_at,
    CASE 
        WHEN p.id IS NULL THEN 'الراكب غير موجود في profiles'
        WHEN p.full_name IS NULL OR p.full_name = '' THEN 'اسم الراكب فارغ'
        ELSE 'الراكب موجود'
    END as passenger_status
FROM ratings r
LEFT JOIN profiles p ON r.passenger_id = p.id
ORDER BY r.created_at DESC;

SELECT 'تم فحص التقييمات وإنشاء الدالة!' as message;
