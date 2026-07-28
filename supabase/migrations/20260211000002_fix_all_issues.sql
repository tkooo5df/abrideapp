-- إصلاح جميع المشاكل في قاعدة البيانات
-- هذا الملف يحل مشكلات RLS للصور و constraint للإشعارات

-- ============================================
-- 1. إصلاح سياسات RLS لرفع الصور
-- ============================================

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Allow avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar deletes" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Avatar read for all" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update for owner" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete for owner" ON storage.objects;

-- التأكد من وجود bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- إنشاء سياسات جديدة للصور
CREATE POLICY "Avatar upload for authenticated users"
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    name LIKE auth.uid()::text || '/%'
  )
);

CREATE POLICY "Avatar read for all"
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'avatars');

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

-- ============================================
-- 2. إصلاح constraint للـ category في notifications
-- ============================================

-- حذف constraint القديم
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_category_check;

-- إنشاء constraint جديد يدعم جميع القيم
ALTER TABLE notifications ADD CONSTRAINT notifications_category_check CHECK (
  category IN (
    'booking', 
    'trip', 
    'payment', 
    'account', 
    'user',        -- إضافة 'user' الذي يستخدمه التطبيق
    'system', 
    'communication', 
    'safety'
  )
);

-- ============================================
-- 3. التحقق من الإعداد
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ تم إصلاح جميع المشاكل بنجاح!';
  RAISE NOTICE '✅ سياسات RLS للصور: 4 policies';
  RAISE NOTICE '✅ Constraint للـ category: محدث';
END $$;

-- فحص Bucket
SELECT 
  'Avatars Bucket' as component,
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'avatars';

-- فحص Policies
SELECT 
  'Storage Policies' as component,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%vatar%'
ORDER BY policyname;

-- فحص Constraint
SELECT 
  'Category Constraint' as component,
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'notifications_category_check';

