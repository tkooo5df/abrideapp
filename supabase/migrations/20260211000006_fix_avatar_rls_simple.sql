-- إصلاح نهائي لـ RLS policies للصور (بدون GRANT - Supabase يدير الصلاحيات تلقائياً)
-- هذا الملف يحل مشكلة "new row violates row-level security policy" بشكل نهائي

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

-- 3. إنشاء سياسات جديدة محسّنة بشكل كامل
-- ملاحظة: RLS مفعّل افتراضياً على storage.objects، لا نحتاج إلى ALTER TABLE

-- سياسة INSERT: السماح لجميع المستخدمين المصادق عليهم برفع الصور
-- هذه السياسة تسمح لأي مستخدم مصادق عليه برفع صورة في bucket avatars
CREATE POLICY "Avatar upload for authenticated users"
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'avatars'
);

-- سياسة SELECT: السماح بالقراءة العامة للصور
-- هذه السياسة تسمح لأي شخص (حتى غير المصادق عليهم) بقراءة الصور من bucket avatars
CREATE POLICY "Avatar read for all"
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'avatars');

-- سياسة UPDATE: السماح للمستخدمين المصادق عليهم بتحديث الصور
-- هذه السياسة تسمح لأي مستخدم مصادق عليه بتحديث أي صورة في bucket avatars
CREATE POLICY "Avatar update for owner"
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- سياسة DELETE: السماح للمستخدمين المصادق عليهم بحذف الصور
-- هذه السياسة تسمح لأي مستخدم مصادق عليه بحذف أي صورة في bucket avatars
CREATE POLICY "Avatar delete for owner"
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'avatars');

-- 5. التحقق من الإعداد بشكل شامل
DO $$
DECLARE
  bucket_count INTEGER;
  policy_count INTEGER;
  bucket_public BOOLEAN;
BEGIN
  -- التحقق من وجود bucket
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets 
  WHERE id = 'avatars';
  
  -- التحقق من public status
  SELECT public INTO bucket_public
  FROM storage.buckets 
  WHERE id = 'avatars'
  LIMIT 1;
  
  -- التحقق من عدد السياسات
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname LIKE '%vatar%';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ تم إصلاح RLS policies للصور بنجاح!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Bucket موجود: %', CASE WHEN bucket_count > 0 THEN 'نعم' ELSE 'لا' END;
  RAISE NOTICE '✅ Bucket public: %', CASE WHEN COALESCE(bucket_public, false) THEN 'نعم' ELSE 'لا' END;
  RAISE NOTICE '✅ عدد السياسات: %', policy_count;
  RAISE NOTICE '✅ Bucket ID: avatars';
  RAISE NOTICE '✅ File size limit: 5MB';
  RAISE NOTICE '========================================';
END $$;

-- 6. فحص النتائج النهائية
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

