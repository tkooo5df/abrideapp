-- تحديث دالة get_driver_ratings لتشمل الاسم والصورة الحقيقية للراكب
-- هذا الملف يجب تشغيله في Supabase SQL Editor

-- حذف الدالة الموجودة أولاً
DROP FUNCTION IF EXISTS get_driver_ratings(UUID);

-- إنشاء دالة جديدة لجلب تقييمات السائق مع معلومات الراكب الكاملة
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
        COALESCE(p.full_name, 'راكب') AS passenger_name,
        CASE
            WHEN p.avatar_url ILIKE 'http%' THEN p.avatar_url
            WHEN p.avatar_url IS NOT NULL AND p.avatar_url <> '' THEN
                'https://kobsavfggcnfemdzsnpj.supabase.co/storage/v1/object/public/avatars/' || p.avatar_url
            ELSE avatar_object.public_url
        END AS passenger_avatar_url,
        p.email AS passenger_email
    FROM ratings r
    LEFT JOIN profiles p ON r.passenger_id = p.id
    LEFT JOIN LATERAL (
        SELECT
            'https://kobsavfggcnfemdzsnpj.supabase.co/storage/v1/object/public/avatars/' || so.name AS public_url
        FROM storage.objects so
        WHERE so.bucket_id = 'avatars'
          AND (
            (p.avatar_url IS NOT NULL AND p.avatar_url <> '' AND so.name = p.avatar_url)
            OR so.name = p.id::text
            OR so.name LIKE p.id::text || '.%'
            OR so.name LIKE p.id::text || '/%'
          )
        ORDER BY so.created_at DESC
        LIMIT 1
    ) AS avatar_object ON TRUE
    WHERE r.driver_id = driver_id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- اختبار الدالة المحدثة
-- SELECT * FROM get_driver_ratings('معرف-السائق-هنا');

-- التحقق من وجود الدالة
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'get_driver_ratings';

-- عرض هيكل الجدول profiles للتأكد من وجود الحقول المطلوبة
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('full_name', 'avatar_url', 'email')
ORDER BY ordinal_position;
