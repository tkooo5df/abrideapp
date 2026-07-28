-- اختبار مباشر لعرض التقييمات في بروفايل السائق
-- هذا الملف يجب تشغيله في Supabase SQL Editor

-- فحص التقييمات الموجودة
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

-- فحص التقييمات مع معلومات الراكب
SELECT '=== فحص التقييمات مع معلومات الراكب ===' as info;
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
    CASE 
        WHEN p.id IS NOT NULL THEN 
            'https://kobsavfggcnfemdzsnpj.supabase.co/storage/v1/object/public/avatars/' || p.id::text
        ELSE 'لا توجد صورة'
    END as avatar_url
FROM ratings r
LEFT JOIN profiles p ON r.passenger_id = p.id
ORDER BY r.created_at DESC;

-- فحص التقييمات لكل سائق
SELECT '=== التقييمات لكل سائق ===' as info;
SELECT 
    r.driver_id,
    COUNT(r.id) as ratings_count,
    AVG(r.rating) as average_rating
FROM ratings r
GROUP BY r.driver_id
ORDER BY ratings_count DESC;

-- إنشاء دالة مبسطة للاختبار
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
            WHEN p.id IS NOT NULL THEN 
                'https://kobsavfggcnfemdzsnpj.supabase.co/storage/v1/object/public/avatars/' || p.id::text
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
-- استبدل بالمعرف الحقيقي للسائق
SELECT '=== اختبار الدالة ===' as info;

-- عرض جميع السائقين المتاحين للاختبار
SELECT 
    'السائقين المتاحين:' as info,
    id as driver_id,
    full_name as driver_name
FROM profiles 
WHERE role = 'driver'
LIMIT 5;

-- اختبار الدالة مع أول سائق له تقييمات
-- استبدل بالمعرف الحقيقي للسائق
-- SELECT * FROM get_driver_ratings('معرف-السائق-الحقيقي-هنا');

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

SELECT 'تم إنشاء الدالة وفحص البيانات!' as message;
