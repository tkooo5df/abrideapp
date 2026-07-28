-- فحص نتائج Migration
-- هذا الملف للتحقق من نجاح Migration

-- 1. فحص Bucket
SELECT 
  'Avatars Bucket' as component,
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'avatars';

-- 2. فحص Policies
SELECT 
  'Storage Policies' as component,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%vatar%'
ORDER BY policyname;

-- 3. فحص Constraint (تم التحقق منه - يعمل!)
SELECT 
  'Category Constraint' as component,
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'notifications_category_check';

