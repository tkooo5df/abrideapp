-- إصلاح عرض التقييمات في بروفايل السائق
-- هذا الملف يجب تشغيله في Supabase SQL Editor

-- حذف الدالة القديمة أولاً
DROP FUNCTION IF EXISTS get_driver_ratings(UUID);

-- إنشاء دالة جديدة مع ربط صحيح للصور والأسماء
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
                -- الصورة تُسمى بنفس اسم passenger_id
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
ORDER BY created_at DESC
LIMIT 10;

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
    p.id as passenger_profile_id,
    CASE 
        WHEN p.id IS NOT NULL THEN 
            'https://kobsavfggcnfemdzsnpj.supabase.co/storage/v1/object/public/avatars/' || p.id::text
        ELSE 'لا توجد صورة'
    END as avatar_url
FROM ratings r
LEFT JOIN profiles p ON r.passenger_id = p.id
ORDER BY r.created_at DESC
LIMIT 10;

-- فحص التقييمات لكل سائق
SELECT '=== التقييمات لكل سائق ===' as info;
SELECT 
    r.driver_id,
    p.full_name as driver_name,
    COUNT(r.id) as ratings_count,
    AVG(r.rating) as average_rating
FROM ratings r
LEFT JOIN profiles p ON r.driver_id = p.id
GROUP BY r.driver_id, p.full_name
ORDER BY ratings_count DESC;

-- اختبار الدالة مع معرف سائق حقيقي
-- استبدل بالمعرف الحقيقي للسائق
-- SELECT * FROM get_driver_ratings('معرف-السائق-الحقيقي');

-- فحص الصور في Storage
SELECT '=== فحص الصور في Storage ===' as info;
SELECT 
    p.id as passenger_id,
    p.full_name as passenger_name,
    'https://kobsavfggcnfemdzsnpj.supabase.co/storage/v1/object/public/avatars/' || p.id::text as avatar_url
FROM profiles p
WHERE p.id IN (
    SELECT DISTINCT passenger_id 
    FROM ratings 
    WHERE driver_id = 'b7ed3c49-7645-4d27-87ed-d03d1f7660d5'  -- استبدل بمعرف سائق حقيقي
)
LIMIT 5;

SELECT 'تم إنشاء الدالة مع ربط الصور والأسماء الصحيح!' as message;
