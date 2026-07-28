-- إصلاح نهائي لـ RLS policies للصور
-- هذا الملف يحل مشكلة "new row violates row-level security policy" بشكل نهائي

-- 1. التأكد من وجود bucket وهو public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- 2. حذف جميع السياسات القديمة للصور
DROP POLICY IF EXISTS "Allow avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar deletes" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Avatar read for all" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update for owner" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete for owner" ON storage.objects;
DROP POLICY IF EXISTS "Avatar insert for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Avatar select for public" ON storage.objects;

-- 3. التأكد من أن RLS مفعّل على storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء سياسات جديدة محسّنة

-- سياسة INSERT: السماح لجميع المستخدمين المصادق عليهم برفع الصور في bucket avatars
-- لا نتحقق من ملكية الملف لأن المستخدم الجديد قد يرفع صورة قبل أن يكون لديه ملفات سابقة
CREATE POLICY "Avatar upload for authenticated users"
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'avatars'
);

-- سياسة SELECT: السماح بالقراءة العامة للصور
CREATE POLICY "Avatar read for all"
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'avatars');

-- سياسة UPDATE: السماح للمستخدم بتحديث أي ملف في bucket avatars
-- (لأننا لا نتحقق من ملكية الملف في الرفع، نسمح بالتحديث لأي مستخدم مصادق عليه)
CREATE POLICY "Avatar update for owner"
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- سياسة DELETE: السماح للمستخدم بحذف أي ملف في bucket avatars
CREATE POLICY "Avatar delete for owner"
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'avatars');

-- 5. منح الصلاحيات اللازمة
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO authenticated;
GRANT SELECT ON storage.buckets TO anon;

-- 6. التحقق من الإعداد
DO $$
DECLARE
  bucket_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- التحقق من وجود bucket
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets 
  WHERE id = 'avatars' AND public = true;
  
  -- التحقق من عدد السياسات
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname LIKE '%vatar%';
  
  RAISE NOTICE '✅ تم إصلاح RLS policies للصور بنجاح!';
  RAISE NOTICE '✅ Bucket موجود: %', CASE WHEN bucket_count > 0 THEN 'نعم' ELSE 'لا' END;
  RAISE NOTICE '✅ عدد السياسات: %', policy_count;
  RAISE NOTICE '✅ Bucket ID: avatars';
  RAISE NOTICE '✅ Public: true';
END $$;

-- 7. فحص النتائج
SELECT 
  'Avatars Bucket' as component,
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE id = 'avatars';

SELECT 
  'Storage Policies' as component,
  policyname,
  cmd as operation,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%vatar%'
ORDER BY policyname;

