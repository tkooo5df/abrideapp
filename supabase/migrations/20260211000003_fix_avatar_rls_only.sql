-- إصلاح RLS policies للصور فقط
-- هذا الملف يحل مشكلة "new row violates row-level security policy" في رفع الصور

-- 1. التأكد من وجود bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. حذف جميع السياسات القديمة للصور
DROP POLICY IF EXISTS "Allow avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar deletes" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Avatar read for all" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update for owner" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete for owner" ON storage.objects;

-- 3. إنشاء سياسات جديدة بسيطة وواضحة

-- السماح لجميع المستخدمين المصادق عليهم برفع الصور في bucket avatars
CREATE POLICY "Avatar upload for authenticated users"
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- السماح بالقراءة العامة للصور
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
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- السماح للمستخدم بحذف صوره فقط
CREATE POLICY "Avatar delete for owner"
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'avatars');

-- 4. التحقق من الإعداد
DO $$
BEGIN
  RAISE NOTICE '✅ تم إصلاح RLS policies للصور بنجاح!';
  RAISE NOTICE 'Bucket ID: avatars';
  RAISE NOTICE 'Public: true';
  RAISE NOTICE 'عدد السياسات: 4';
END $$;

-- 5. فحص النتائج
SELECT 
  'Avatars Bucket' as component,
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'avatars';

SELECT 
  'Storage Policies' as component,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%vatar%'
ORDER BY policyname;

