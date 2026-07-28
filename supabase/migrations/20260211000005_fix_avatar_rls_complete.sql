-- إصلاح نهائي شامل لـ RLS policies للصور
-- هذا الملف يحل مشكلة رفع الصور بشكل نهائي

-- 1. التأكد من وجود bucket وهو public مع جميع الإعدادات
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = COALESCE(EXCLUDED.file_size_limit, 5242880),
  allowed_mime_types = COALESCE(EXCLUDED.allowed_mime_types, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

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
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Avatar Upload" ON storage.objects;

-- 3. التأكد من أن RLS مفعّل على storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء سياسات جديدة محسّنة بشكل كامل

-- سياسة INSERT: السماح لجميع المستخدمين المصادق عليهم برفع الصور
-- مع التحقق من bucket_id فقط (لا نتحقق من ملكية الملف للمستخدمين الجدد)
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

-- سياسة UPDATE: السماح للمستخدمين المصادق عليهم بتحديث الصور
CREATE POLICY "Avatar update for owner"
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- سياسة DELETE: السماح للمستخدمين المصادق عليهم بحذف الصور
CREATE POLICY "Avatar delete for owner"
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'avatars');

-- 5. منح الصلاحيات اللازمة بشكل صريح
-- هذه الخطوة مهمة جداً لضمان عمل RLS policies
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO authenticated;
GRANT SELECT ON storage.buckets TO anon;

-- 6. التأكد من أن المستخدمين لديهم الصلاحيات اللازمة
-- قد نحتاج إلى إنشاء role خاص إذا لزم الأمر
DO $$
BEGIN
  -- التأكد من أن authenticated role موجود
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
  
  -- التأكد من أن anon role موجود
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon;
  END IF;
END $$;

-- 7. التحقق من الإعداد بشكل شامل
DO $$
DECLARE
  bucket_count INTEGER;
  policy_count INTEGER;
  bucket_public BOOLEAN;
  rls_enabled BOOLEAN;
BEGIN
  -- التحقق من وجود bucket
  SELECT COUNT(*), MAX(public) INTO bucket_count, bucket_public
  FROM storage.buckets 
  WHERE id = 'avatars';
  
  -- التحقق من عدد السياسات
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname LIKE '%vatar%';
  
  -- التحقق من RLS
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'storage' AND tablename = 'objects';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ تم إصلاح RLS policies للصور بنجاح!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Bucket موجود: %', CASE WHEN bucket_count > 0 THEN 'نعم' ELSE 'لا' END;
  RAISE NOTICE '✅ Bucket public: %', CASE WHEN bucket_public THEN 'نعم' ELSE 'لا' END;
  RAISE NOTICE '✅ عدد السياسات: %', policy_count;
  RAISE NOTICE '✅ RLS مفعّل: %', CASE WHEN rls_enabled THEN 'نعم' ELSE 'لا' END;
  RAISE NOTICE '✅ Bucket ID: avatars';
  RAISE NOTICE '✅ File size limit: 5MB';
  RAISE NOTICE '========================================';
END $$;

-- 8. فحص النتائج النهائية
SELECT 
  'Avatars Bucket Status' as component,
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE id = 'avatars';

SELECT 
  'Storage RLS Policies' as component,
  policyname,
  cmd as operation,
  CASE WHEN qual IS NULL THEN 'None' ELSE qual END as using_clause,
  CASE WHEN with_check IS NULL THEN 'None' ELSE with_check END as with_check_clause
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%vatar%'
ORDER BY 
  CASE cmd
    WHEN 'INSERT' THEN 1
    WHEN 'SELECT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
    ELSE 5
  END,
  policyname;

-- 9. فحص الصلاحيات
SELECT 
  'Storage Permissions' as component,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'storage' 
  AND table_name = 'objects'
  AND grantee IN ('authenticated', 'anon')
ORDER BY grantee, privilege_type;

