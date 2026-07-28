-- إنشاء جدول تقييمات الركاب (من قبل السائقين)
-- Passenger Ratings Table (Ratings given by drivers to passengers)

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS passenger_ratings (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate ratings for same booking
    UNIQUE(booking_id, driver_id, passenger_id)
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_passenger_ratings_passenger_id ON passenger_ratings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_passenger_ratings_driver_id ON passenger_ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_passenger_ratings_booking_id ON passenger_ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_passenger_ratings_created_at ON passenger_ratings(created_at);

-- إضافة حقول تقييمات الركاب إلى جدول profiles إذا لم تكن موجودة
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS passenger_average_rating REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS passenger_ratings_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_trips_as_passenger INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cancellations_as_passenger INTEGER DEFAULT 0;

-- إنشاء دالة لحساب متوسط تقييمات الراكب تلقائياً
CREATE OR REPLACE FUNCTION update_passenger_average_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_passenger_id UUID;
BEGIN
    -- Determine which passenger_id to update based on operation
    IF TG_OP = 'DELETE' THEN
        v_passenger_id := OLD.passenger_id;
    ELSE
        v_passenger_id := NEW.passenger_id;
    END IF;

    -- Update passenger profile with new average and count
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

-- إنشاء trigger لتحديث المتوسط تلقائياً
DROP TRIGGER IF EXISTS trigger_update_passenger_rating ON passenger_ratings;
CREATE TRIGGER trigger_update_passenger_rating
    AFTER INSERT OR UPDATE OR DELETE ON passenger_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_passenger_average_rating();

-- إنشاء دالة لحساب إحصائيات الراكب
CREATE OR REPLACE FUNCTION update_passenger_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_passenger_id UUID;
    v_status TEXT;
BEGIN
    -- Get passenger_id and status based on operation
    IF TG_OP = 'DELETE' THEN
        v_passenger_id := OLD.passenger_id;
        v_status := OLD.status;
    ELSE
        v_passenger_id := NEW.passenger_id;
        v_status := NEW.status;
    END IF;

    -- Only update if passenger_id exists
    IF v_passenger_id IS NOT NULL THEN
        -- Update total trips (completed bookings only)
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

-- إنشاء trigger لتحديث إحصائيات الراكب
DROP TRIGGER IF EXISTS trigger_update_passenger_stats ON bookings;
CREATE TRIGGER trigger_update_passenger_stats
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_passenger_stats();

-- تعليقات على الجدول والأعمدة
COMMENT ON TABLE passenger_ratings IS 'تقييمات الركاب من قبل السائقين';
COMMENT ON COLUMN passenger_ratings.rating IS 'التقييم من 1 إلى 5 نجوم';
COMMENT ON COLUMN passenger_ratings.comment IS 'تعليق السائق على الراكب';
COMMENT ON COLUMN profiles.passenger_average_rating IS 'متوسط تقييم الراكب';
COMMENT ON COLUMN profiles.passenger_ratings_count IS 'عدد التقييمات التي حصل عليها الراكب';
COMMENT ON COLUMN profiles.total_trips_as_passenger IS 'عدد الرحلات المكتملة كراكب';
COMMENT ON COLUMN profiles.total_cancellations_as_passenger IS 'عدد الإلغاءات كراكب';

-- إنشاء view لعرض معلومات تقييمات الركاب مع التفاصيل
CREATE OR REPLACE VIEW passenger_ratings_detailed AS
SELECT 
    pr.id,
    pr.booking_id,
    pr.rating,
    pr.comment,
    pr.created_at,
    pr.updated_at,
    -- Passenger info
    p_passenger.id AS passenger_id,
    p_passenger.full_name AS passenger_name,
    p_passenger.avatar_url AS passenger_avatar,
    p_passenger.passenger_average_rating,
    p_passenger.passenger_ratings_count,
    -- Driver info
    p_driver.id AS driver_id,
    p_driver.full_name AS driver_name,
    p_driver.avatar_url AS driver_avatar,
    -- Booking info
    b.trip_id,
    b.status AS booking_status,
    b.seats_booked
FROM passenger_ratings pr
LEFT JOIN profiles p_passenger ON pr.passenger_id = p_passenger.id
LEFT JOIN profiles p_driver ON pr.driver_id = p_driver.id
LEFT JOIN bookings b ON pr.booking_id = b.id
ORDER BY pr.created_at DESC;

COMMENT ON VIEW passenger_ratings_detailed IS 'عرض شامل لتقييمات الركاب مع كافة التفاصيل';

