-- إعداد Supabase Storage للصور والسياسات
-- هذا الملف يجب تشغيله في Supabase SQL Editor

-- إنشاء bucket للصور إذا لم يكن موجوداً
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- سياسات RLS للـ Storage
-- السماح للمستخدمين المصادق عليهم برفع الصور
CREATE POLICY "Allow avatar uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- السماح بالقراءة العامة للصور
CREATE POLICY "Allow public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- السماح للمستخدمين بتحديث صورهم الخاصة
CREATE POLICY "Allow avatar updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid()::text))
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid()::text));

-- السماح للمستخدمين بحذف صورهم الخاصة
CREATE POLICY "Allow avatar deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid()::text));

-- حذف الدالة القديمة وإنشاء الجديدة مع ربط Storage الصحيح
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

-- التحقق من إعداد Storage
SELECT 'فحص إعداد Storage:' as info;
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets 
WHERE id = 'avatars';

-- فحص السياسات
SELECT 'فحص السياسات:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- فحص الصور الموجودة
SELECT 'فحص الصور الموجودة:' as info;
SELECT 
    p.full_name,
    p.avatar_url,
    CASE 
        WHEN p.avatar_url IS NOT NULL AND p.avatar_url != '' THEN 
            'https://kobsavfggcnfemdzsnpj.supabase.co/storage/v1/object/public/avatars/' || p.avatar_url
        ELSE 'لا توجد صورة'
    END as full_avatar_url
FROM profiles p 
WHERE p.avatar_url IS NOT NULL AND p.avatar_url != ''
LIMIT 5;

-- اختبار الدالة
-- SELECT * FROM get_driver_ratings('معرف-السائق-هنا');

SELECT 'تم إعداد Storage والدالة بنجاح!' as message;
