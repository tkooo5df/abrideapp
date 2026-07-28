-- إصلاح constraint للـ category في جدول notifications
-- هذا الملف يحل مشكلة "violates check constraint notifications_category_check"

-- 1. حذف constraint القديم إن وجد
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_category_check;

-- 2. إنشاء constraint جديد يدعم جميع القيم المستخدمة في التطبيق
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

-- 3. التحقق من الإعداد
DO $$
BEGIN
  RAISE NOTICE '✅ تم إصلاح notifications_category_check constraint بنجاح!';
  RAISE NOTICE 'القيم المسموحة: booking, trip, payment, account, user, system, communication, safety';
END $$;

