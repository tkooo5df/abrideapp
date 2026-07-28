-- فحص البيانات الموجودة في جدول profiles
-- هذا الملف يساعد في تشخيص المشكلة

-- فحص البيانات الموجودة في profiles
SELECT '=== فحص جدول profiles ===' as info;
SELECT 
    id,
    full_name,
    email,
    avatar_url,
    role,
    created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;

-- فحص التقييمات الموجودة
SELECT '=== فحص جدول ratings ===' as info;
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
LIMIT 5;

-- فحص التقييمات مع معلومات الراكب
SELECT '=== فحص التقييمات مع معلومات الراكب ===' as info;
SELECT 
    r.id as rating_id,
    r.booking_id,
    r.driver_id,
    r.passenger_id,
    r.rating,
    r.comment,
    r.created_at as rating_date,
    p.full_name as passenger_name,
    p.email as passenger_email,
    p.avatar_url as passenger_avatar_url,
    CASE 
        WHEN p.avatar_url IS NOT NULL AND p.avatar_url != '' THEN 
            'https://kobsavfggcnfemdzsnpj.supabase.co/storage/v1/object/public/avatars/' || p.avatar_url
        ELSE 'لا توجد صورة'
    END as full_avatar_url
FROM ratings r
LEFT JOIN profiles p ON r.passenger_id = p.id
ORDER BY r.created_at DESC
LIMIT 5;

-- فحص المستخدمين الموجودين
SELECT '=== فحص المستخدمين ===' as info;
SELECT 
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- فحص المطابقة بين users و profiles
SELECT '=== فحص المطابقة بين users و profiles ===' as info;
SELECT 
    u.id as user_id,
    u.email as user_email,
    p.id as profile_id,
    p.full_name,
    p.email as profile_email,
    p.avatar_url,
    p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;
