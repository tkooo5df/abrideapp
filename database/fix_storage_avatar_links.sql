-- حل مشكلة ربط الصور المحفوظة في Storage مع التقييمات
-- هذا الملف يجب تشغيله في Supabase SQL Editor

-- حذف الدالة القديمة أولاً
DROP FUNCTION IF EXISTS get_driver_ratings(UUID);

-- إنشاء دالة جديدة مع ربط صحيح للصور المحفوظة في Storage
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
                -- بناء رابط Storage كامل من اسم الملف المحفوظ
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

-- فحص البيانات الموجودة في profiles
SELECT '=== فحص بيانات profiles ===' as info;
SELECT 
    id,
    full_name,
    email,
    avatar_url,
    role
FROM profiles 
WHERE avatar_url IS NOT NULL AND avatar_url != ''
LIMIT 5;

-- فحص التقييمات مع الصور المحفوظة
SELECT '=== فحص التقييمات مع الصور ===' as info;
SELECT 
    r.id as rating_id,
    r.passenger_id,
    p.full_name as passenger_name,
    p.avatar_url as stored_filename,
    CASE 
        WHEN p.avatar_url IS NOT NULL AND p.avatar_url != '' THEN 
            'https://kobsavfggcnfemdzsnpj.supabase.co/storage/v1/object/public/avatars/' || p.avatar_url
        ELSE 'لا توجد صورة'
    END as full_avatar_url
FROM ratings r
LEFT JOIN profiles p ON r.passenger_id = p.id
WHERE r.driver_id = 'b7ed3c49-7645-4d27-87ed-d03d1f7660d5'  -- استبدل بمعرف سائق حقيقي
ORDER BY r.created_at DESC
LIMIT 5;

-- اختبار الدالة مع معرف سائق حقيقي
-- SELECT * FROM get_driver_ratings('b7ed3c49-7645-4d27-87ed-d03d1f7660d5');

SELECT 'تم إنشاء الدالة مع ربط الصور المحفوظة في Storage!' as message;
