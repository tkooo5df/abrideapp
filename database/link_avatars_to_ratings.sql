-- ربط صور الحسابات مع التقييمات
-- هذا الملف يجب تشغيله في Supabase SQL Editor

-- حذف الدالة القديمة أولاً
DROP FUNCTION IF EXISTS get_driver_ratings(UUID);

-- إنشاء دالة جديدة مع ربط صور الحسابات
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

-- التحقق من إنشاء الدالة
SELECT 'تم ربط صور الحسابات مع التقييمات بنجاح!' as message;
