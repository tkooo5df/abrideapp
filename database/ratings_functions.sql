-- إنشاء دالة RPC لجلب تقييمات السائق
-- هذا الملف يجب تشغيله في Supabase SQL Editor

-- إنشاء دالة لجلب تقييمات السائق مع معلومات الراكب الكاملة
CREATE OR REPLACE FUNCTION get_driver_ratings(driver_id UUID)
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

-- إنشاء دالة لحساب متوسط التقييمات للسائق
CREATE OR REPLACE FUNCTION get_driver_average_rating(driver_id UUID)
RETURNS REAL AS $$
DECLARE
    avg_rating REAL;
BEGIN
    SELECT COALESCE(AVG(rating), 0) INTO avg_rating
    FROM ratings
    WHERE ratings.driver_id = driver_id;
    
    RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة لحساب عدد التقييمات للسائق
CREATE OR REPLACE FUNCTION get_driver_ratings_count(driver_id UUID)
RETURNS INTEGER AS $$
DECLARE
    ratings_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ratings_count
    FROM ratings
    WHERE ratings.driver_id = driver_id;
    
    RETURN ratings_count;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة شاملة لجلب إحصائيات السائق
CREATE OR REPLACE FUNCTION get_driver_stats(driver_id UUID)
RETURNS TABLE (
    total_ratings INTEGER,
    average_rating REAL,
    five_star_count INTEGER,
    four_star_count INTEGER,
    three_star_count INTEGER,
    two_star_count INTEGER,
    one_star_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_ratings,
        COALESCE(AVG(rating), 0)::REAL as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END)::INTEGER as five_star_count,
        COUNT(CASE WHEN rating = 4 THEN 1 END)::INTEGER as four_star_count,
        COUNT(CASE WHEN rating = 3 THEN 1 END)::INTEGER as three_star_count,
        COUNT(CASE WHEN rating = 2 THEN 1 END)::INTEGER as two_star_count,
        COUNT(CASE WHEN rating = 1 THEN 1 END)::INTEGER as one_star_count
    FROM ratings
    WHERE ratings.driver_id = driver_id;
END;
$$ LANGUAGE plpgsql;

-- اختبار الدوال
-- SELECT * FROM get_driver_ratings('your-driver-id-here');
-- SELECT get_driver_average_rating('your-driver-id-here');
-- SELECT get_driver_ratings_count('your-driver-id-here');
-- SELECT * FROM get_driver_stats('your-driver-id-here');
