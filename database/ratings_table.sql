-- إنشاء جدول التقييمات المنفصل
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

-- بيانات تجريبية للتقييمات
INSERT INTO ratings (booking_id, driver_id, passenger_id, rating, comment, created_at) VALUES
-- تقييمات للسائق الأول (يجب أن يكون له حجوزات موجودة)
(1, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 5, 'سائق ممتاز ومهذب جداً، الرحلة كانت مريحة وآمنة', NOW() - INTERVAL '2 days'),
(2, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 4, 'جيد جداً، لكن تأخر قليلاً', NOW() - INTERVAL '1 day'),
(3, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 5, 'أفضل سائق في المدينة!', NOW() - INTERVAL '5 hours'),

-- تقييمات للسائق الثاني
(4, '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 3, 'مقبول، لكن السيارة تحتاج تنظيف', NOW() - INTERVAL '3 days'),
(5, '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 4, 'سائق محترف، أوصي به', NOW() - INTERVAL '1 day'),
(6, '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 2, 'لم يكن راضياً عن الخدمة', NOW() - INTERVAL '6 hours'),

-- تقييمات للسائق الثالث
(7, '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 5, 'خدمة استثنائية، سائق محترف جداً', NOW() - INTERVAL '4 days'),
(8, '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 5, 'ممتاز في كل شيء!', NOW() - INTERVAL '2 days'),
(9, '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440004', 4, 'جيد جداً، أوصي به', NOW() - INTERVAL '1 day'),
(10, '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 5, 'أفضل تجربة ركوب في حياتي!', NOW() - INTERVAL '3 hours'),

-- تقييمات إضافية متنوعة
(11, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 4, 'سائق جيد ومهذب', NOW() - INTERVAL '1 week'),
(12, '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 3, 'مقبول، لكن يمكن أن يكون أفضل', NOW() - INTERVAL '5 days'),
(13, '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 5, 'سائق محترف جداً، أوصي به بشدة', NOW() - INTERVAL '2 weeks'),
(14, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', 4, 'جيد جداً، لكن تأخر قليلاً في الوصول', NOW() - INTERVAL '1 week'),
(15, '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 2, 'لم أكن راضياً عن الخدمة', NOW() - INTERVAL '3 days');

-- تحديث متوسط التقييمات لجميع السائقين
UPDATE profiles SET 
    average_rating = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM ratings 
        WHERE driver_id = profiles.id
    ),
    ratings_count = (
        SELECT COUNT(*) 
        FROM ratings 
        WHERE driver_id = profiles.id
    )
WHERE role = 'driver';

-- عرض إحصائيات التقييمات
SELECT 
    p.full_name as "اسم السائق",
    p.average_rating as "متوسط التقييم",
    p.ratings_count as "عدد التقييمات",
    COUNT(r.id) as "تقييمات فعلية"
FROM profiles p
LEFT JOIN ratings r ON p.id = r.driver_id
WHERE p.role = 'driver'
GROUP BY p.id, p.full_name, p.average_rating, p.ratings_count
ORDER BY p.average_rating DESC;
