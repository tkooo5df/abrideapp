-- إصلاح سياسات RLS لرفع الصور
-- هذا الملف يحل مشكلة "new row violates row-level security policy"

-- 1. حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Allow avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar deletes" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Avatar read for all" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update for owner" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete for owner" ON storage.objects;

-- 2. التأكد من وجود bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. إنشاء سياسات جديدة محسّنة

-- السماح لجميع المستخدمين المصادق عليهم برفع الصور في مجلدهم الخاص
-- هذا يسمح بالرفع في مجلد userId/ بدون قيود إضافية للINSERT
CREATE POLICY "Avatar upload for authenticated users"
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    -- السماح بالرفع في مجلد المستخدم الخاص
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- السماح بالرفع مباشرة (لتوافق مع الكود القديم)
    name LIKE auth.uid()::text || '/%'
  )
);

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
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    name LIKE auth.uid()::text || '/%'
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND 
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    name LIKE auth.uid()::text || '/%'
  )
);

-- السماح للمستخدم بحذف صوره فقط
CREATE POLICY "Avatar delete for owner"
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    name LIKE auth.uid()::text || '/%'
  )
);

-- 4. التحقق من الإعداد
DO $$
BEGIN
  RAISE NOTICE '✅ تم إصلاح سياسات avatars storage بنجاح!';
  RAISE NOTICE 'Bucket ID: avatars';
  RAISE NOTICE 'Public: true';
  RAISE NOTICE 'عدد السياسات: 4';
END $$;

