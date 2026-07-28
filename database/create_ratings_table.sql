-- إنشاء جدول ratings أولاً
-- هذا الملف يجب تشغيله في Supabase SQL Editor

-- إنشاء جدول التقييمات
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_ratings_driver_id ON ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_ratings_passenger_id ON ratings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_ratings_booking_id ON ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at);

-- إنشاء دالة لحساب متوسط التقييمات تلقائياً
CREATE OR REPLACE FUNCTION update_driver_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles 
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM ratings 
            WHERE driver_id = NEW.driver_id
        ),
        ratings_count = (
            SELECT COUNT(*) 
            FROM ratings 
            WHERE driver_id = NEW.driver_id
        ),
        updated_at = NOW()
    WHERE id = NEW.driver_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث المتوسط تلقائياً
DROP TRIGGER IF EXISTS trigger_update_driver_rating ON ratings;
CREATE TRIGGER trigger_update_driver_rating
    AFTER INSERT OR UPDATE OR DELETE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_driver_average_rating();

-- إضافة حقول التقييمات إلى جدول profiles إذا لم تكن موجودة
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS average_rating REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ratings_count INTEGER DEFAULT 0;

-- التحقق من إنشاء الجدول
SELECT 'تم إنشاء جدول ratings بنجاح!' as message;

-- عرض هيكل الجدول
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ratings' 
ORDER BY ordinal_position;
