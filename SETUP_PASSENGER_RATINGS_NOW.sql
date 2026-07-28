-- ════════════════════════════════════════════════════════════════
-- نظام تقييم الركاب - تشغيل فوري في Supabase
-- Passenger Rating System - Run This in Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- الخطوة 1: إنشاء جدول passenger_ratings
CREATE TABLE IF NOT EXISTS passenger_ratings (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id, driver_id, passenger_id)
);

-- الخطوة 2: إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_passenger_ratings_passenger_id ON passenger_ratings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_passenger_ratings_driver_id ON passenger_ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_passenger_ratings_booking_id ON passenger_ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_passenger_ratings_created_at ON passenger_ratings(created_at);

-- الخطوة 3: إضافة أعمدة جديدة لجدول profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS passenger_average_rating REAL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS passenger_ratings_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_trips_as_passenger INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_cancellations_as_passenger INTEGER DEFAULT 0;

-- الخطوة 4: دالة تحديث متوسط تقييم الراكب
CREATE OR REPLACE FUNCTION update_passenger_average_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_passenger_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_passenger_id := OLD.passenger_id;
    ELSE
        v_passenger_id := NEW.passenger_id;
    END IF;

    UPDATE profiles 
    SET 
        passenger_average_rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM passenger_ratings 
            WHERE passenger_id = v_passenger_id
        ),
        passenger_ratings_count = (
            SELECT COUNT(*) 
            FROM passenger_ratings 
            WHERE passenger_id = v_passenger_id
        ),
        updated_at = NOW()
    WHERE id = v_passenger_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- الخطوة 5: trigger لتحديث التقييم
DROP TRIGGER IF EXISTS trigger_update_passenger_rating ON passenger_ratings;
CREATE TRIGGER trigger_update_passenger_rating
    AFTER INSERT OR UPDATE OR DELETE ON passenger_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_passenger_average_rating();

-- الخطوة 6: دالة تحديث إحصائيات الراكب
CREATE OR REPLACE FUNCTION update_passenger_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_passenger_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_passenger_id := OLD.passenger_id;
    ELSE
        v_passenger_id := NEW.passenger_id;
    END IF;

    IF v_passenger_id IS NOT NULL THEN
        UPDATE profiles 
        SET 
            total_trips_as_passenger = (
                SELECT COUNT(*) 
                FROM bookings 
                WHERE passenger_id = v_passenger_id 
                AND status = 'completed'
            ),
            total_cancellations_as_passenger = (
                SELECT COUNT(*) 
                FROM bookings 
                WHERE passenger_id = v_passenger_id 
                AND status = 'cancelled'
            ),
            updated_at = NOW()
        WHERE id = v_passenger_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- الخطوة 7: trigger لتحديث الإحصائيات
DROP TRIGGER IF EXISTS trigger_update_passenger_stats ON bookings;
CREATE TRIGGER trigger_update_passenger_stats
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_passenger_stats();

-- الخطوة 8: تحديث الإحصائيات للركاب الحاليين
UPDATE profiles 
SET 
    total_trips_as_passenger = (
        SELECT COUNT(*) 
        FROM bookings 
        WHERE passenger_id = profiles.id 
        AND status = 'completed'
    ),
    total_cancellations_as_passenger = (
        SELECT COUNT(*) 
        FROM bookings 
        WHERE passenger_id = profiles.id 
        AND status = 'cancelled'
    )
WHERE id IN (
    SELECT DISTINCT passenger_id 
    FROM bookings 
    WHERE passenger_id IS NOT NULL
);

-- ════════════════════════════════════════════════════════════════
-- التحقق من النجاح
-- ════════════════════════════════════════════════════════════════

-- تحقق من إنشاء الجدول
SELECT 
    'passenger_ratings table created' AS status,
    COUNT(*) AS row_count 
FROM passenger_ratings;

-- تحقق من الأعمدة الجديدة
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE '%passenger%'
ORDER BY column_name;

-- تحقق من الإحصائيات المحدثة
SELECT 
    full_name,
    passenger_average_rating,
    passenger_ratings_count,
    total_trips_as_passenger,
    total_cancellations_as_passenger
FROM profiles
WHERE total_trips_as_passenger > 0 OR total_cancellations_as_passenger > 0
LIMIT 10;

-- ════════════════════════════════════════════════════════════════
-- تم بنجاح! ✅
-- ════════════════════════════════════════════════════════════════

