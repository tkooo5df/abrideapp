-- ===================================================
-- إضافة أعمدة إحصائيات الرحلات للسائقين
-- ===================================================
-- هذا سيحل مشكلة عدم ظهور إجمالي الرحلات فوراً
-- بدلاً من الحساب كل مرة، سيتم التخزين والتحديث تلقائياً

BEGIN;

-- ===================================================
-- الخطوة 1: إضافة الأعمدة الجديدة
-- ===================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_trips_as_driver INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_trips_as_driver INTEGER DEFAULT 0;

COMMENT ON COLUMN profiles.total_trips_as_driver IS 'إجمالي عدد الرحلات للسائق (جميع الحالات)';
COMMENT ON COLUMN profiles.completed_trips_as_driver IS 'عدد الرحلات المكتملة للسائق فقط';

-- ===================================================
-- الخطوة 2: إنشاء Function لتحديث الإحصائيات
-- ===================================================

CREATE OR REPLACE FUNCTION update_driver_trip_stats()
RETURNS TRIGGER AS $$
DECLARE
  affected_driver_id UUID;
BEGIN
  -- Determine which driver_id to update
  IF TG_OP = 'DELETE' THEN
    affected_driver_id := OLD.driver_id;
  ELSE
    affected_driver_id := NEW.driver_id;
  END IF;

  -- Update driver trip statistics
  UPDATE profiles
  SET 
    total_trips_as_driver = (
      SELECT COUNT(*) 
      FROM trips 
      WHERE driver_id = affected_driver_id
    ),
    completed_trips_as_driver = (
      SELECT COUNT(*) 
      FROM trips 
      WHERE driver_id = affected_driver_id 
      AND status = 'completed'
    ),
    updated_at = NOW()
  WHERE id = affected_driver_id;
  
  -- Also update old driver if driver_id changed
  IF TG_OP = 'UPDATE' AND OLD.driver_id IS DISTINCT FROM NEW.driver_id THEN
    UPDATE profiles
    SET 
      total_trips_as_driver = (
        SELECT COUNT(*) 
        FROM trips 
        WHERE driver_id = OLD.driver_id
      ),
      completed_trips_as_driver = (
        SELECT COUNT(*) 
        FROM trips 
        WHERE driver_id = OLD.driver_id 
        AND status = 'completed'
      ),
      updated_at = NOW()
    WHERE id = OLD.driver_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_driver_trip_stats() IS 'تحديث تلقائي لإحصائيات رحلات السائق';

-- ===================================================
-- الخطوة 3: إنشاء Triggers
-- ===================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_driver_stats_on_insert ON trips;
DROP TRIGGER IF EXISTS trigger_update_driver_stats_on_update ON trips;
DROP TRIGGER IF EXISTS trigger_update_driver_stats_on_delete ON trips;

-- Trigger عند إنشاء رحلة جديدة
CREATE TRIGGER trigger_update_driver_stats_on_insert
AFTER INSERT ON trips
FOR EACH ROW
EXECUTE FUNCTION update_driver_trip_stats();

-- Trigger عند تحديث رحلة (مثل تغيير الحالة)
CREATE TRIGGER trigger_update_driver_stats_on_update
AFTER UPDATE ON trips
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.driver_id IS DISTINCT FROM NEW.driver_id)
EXECUTE FUNCTION update_driver_trip_stats();

-- Trigger عند حذف رحلة
CREATE TRIGGER trigger_update_driver_stats_on_delete
AFTER DELETE ON trips
FOR EACH ROW
EXECUTE FUNCTION update_driver_trip_stats();

-- ===================================================
-- الخطوة 4: ملء البيانات الحالية
-- ===================================================

-- تحديث جميع السائقين بالإحصائيات الحالية
UPDATE profiles p
SET 
  total_trips_as_driver = COALESCE((
    SELECT COUNT(*) 
    FROM trips 
    WHERE driver_id = p.id
  ), 0),
  completed_trips_as_driver = COALESCE((
    SELECT COUNT(*) 
    FROM trips 
    WHERE driver_id = p.id 
    AND status = 'completed'
  ), 0),
  updated_at = NOW()
WHERE role = 'driver';

COMMIT;

-- ===================================================
-- التحقق من النتائج
-- ===================================================

SELECT 
    p.id,
    p.full_name,
    p.role,
    p.total_trips_as_driver,
    p.completed_trips_as_driver,
    (SELECT COUNT(*) FROM trips WHERE driver_id = p.id) AS actual_trips,
    (SELECT COUNT(*) FROM trips WHERE driver_id = p.id AND status = 'completed') AS actual_completed
FROM profiles p
WHERE role = 'driver'
ORDER BY p.total_trips_as_driver DESC
LIMIT 10;

-- ===================================================
-- النتيجة المتوقعة:
-- ===================================================
-- total_trips_as_driver = actual_trips (يجب أن يكونوا متطابقين)
-- completed_trips_as_driver = actual_completed (يجب أن يكونوا متطابقين)
-- ===================================================

-- ===================================================
-- اختبار التحديث التلقائي:
-- ===================================================
-- الآن عند إنشاء رحلة جديدة أو تحديثها:
-- INSERT INTO trips (...) → سيتم تحديث total_trips_as_driver تلقائياً
-- UPDATE trips SET status = 'completed' → سيتم تحديث completed_trips_as_driver تلقائياً
-- DELETE FROM trips → سيتم تحديث الإحصائيات تلقائياً
-- ===================================================

