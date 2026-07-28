-- إعداد Supabase Storage لصور الملفات الشخصية (Avatars)
-- هذا الملف يضمن وجود bucket avatars مع السياسات الصحيحة

-- 1. إنشاء bucket avatars إذا لم يكن موجوداً
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Allow avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar deletes" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Avatar read for all" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update for owner" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete for owner" ON storage.objects;

-- 3. إنشاء سياسات جديدة للصور

-- السماح لجميع المستخدمين المصادق عليهم برفع الصور
CREATE POLICY "Avatar upload for authenticated users"
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- السماح بالقراءة العامة للصور (حتى للزوار)
CREATE POLICY "Avatar read for all"
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'avatars');

-- السماح للمستخدم بتحديث صوره فقط
CREATE POLICY "Avatar update for owner"
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- السماح للمستخدم بحذف صوره فقط
CREATE POLICY "Avatar delete for owner"
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. التحقق من الإعداد
DO $$
BEGIN
  RAISE NOTICE '✅ تم إعداد avatars storage bucket بنجاح!';
  RAISE NOTICE 'Bucket ID: avatars';
  RAISE NOTICE 'Public: true';
  RAISE NOTICE 'عدد السياسات: 4';
END $$;

-- 5. فحص الإعداد
SELECT 
  'Avatars Bucket' as component,
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'avatars';

-- 6. فحص السياسات
SELECT 
  'Storage Policies' as component,
  policyname,
  cmd as operation,
  CASE 
    WHEN roles @> ARRAY['authenticated'::regrole] THEN 'authenticated'
    WHEN roles @> ARRAY['public'::regrole] THEN 'public'
    ELSE 'other'
  END as allowed_role
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%vatar%'
ORDER BY policyname;

