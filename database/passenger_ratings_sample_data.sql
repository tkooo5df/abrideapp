-- بيانات تجريبية لتقييمات الركاب
-- Sample data for passenger ratings

-- Note: Replace the UUIDs below with actual driver and passenger IDs from your database
-- You can get these by running: SELECT id, full_name, role FROM profiles;

-- Sample passenger ratings (drivers rating passengers)
-- Adjust the UUIDs to match your actual database

-- Example format:
-- INSERT INTO passenger_ratings (booking_id, driver_id, passenger_id, rating, comment, created_at)
-- VALUES 
-- (booking_id, 'driver-uuid', 'passenger-uuid', rating, 'comment', timestamp);

-- Good passenger examples (4-5 stars)
INSERT INTO passenger_ratings (booking_id, driver_id, passenger_id, rating, comment, created_at)
SELECT 
    b.id,
    b.driver_id,
    b.passenger_id,
    5,
    'راكب ممتاز، محترم ودقيق في المواعيد',
    NOW() - INTERVAL '2 days'
FROM bookings b
WHERE b.status = 'completed'
AND b.passenger_id IS NOT NULL
AND b.driver_id IS NOT NULL
LIMIT 1
ON CONFLICT (booking_id, driver_id, passenger_id) DO NOTHING;

INSERT INTO passenger_ratings (booking_id, driver_id, passenger_id, rating, comment, created_at)
SELECT 
    b.id,
    b.driver_id,
    b.passenger_id,
    5,
    'راكب مثالي، تعامل راقي وأخلاق عالية',
    NOW() - INTERVAL '5 days'
FROM bookings b
WHERE b.status = 'completed'
AND b.passenger_id IS NOT NULL
AND b.driver_id IS NOT NULL
AND b.id NOT IN (SELECT booking_id FROM passenger_ratings)
LIMIT 1
ON CONFLICT (booking_id, driver_id, passenger_id) DO NOTHING;

INSERT INTO passenger_ratings (booking_id, driver_id, passenger_id, rating, comment, created_at)
SELECT 
    b.id,
    b.driver_id,
    b.passenger_id,
    4,
    'راكب جيد، لكنه تأخر قليلاً في نقطة الالتقاء',
    NOW() - INTERVAL '1 week'
FROM bookings b
WHERE b.status = 'completed'
AND b.passenger_id IS NOT NULL
AND b.driver_id IS NOT NULL
AND b.id NOT IN (SELECT booking_id FROM passenger_ratings)
LIMIT 1
ON CONFLICT (booking_id, driver_id, passenger_id) DO NOTHING;

INSERT INTO passenger_ratings (booking_id, driver_id, passenger_id, rating, comment, created_at)
SELECT 
    b.id,
    b.driver_id,
    b.passenger_id,
    5,
    'راكب ممتاز، نظيف ومهذب',
    NOW() - INTERVAL '10 days'
FROM bookings b
WHERE b.status = 'completed'
AND b.passenger_id IS NOT NULL
AND b.driver_id IS NOT NULL
AND b.id NOT IN (SELECT booking_id FROM passenger_ratings)
LIMIT 1
ON CONFLICT (booking_id, driver_id, passenger_id) DO NOTHING;

-- Average passengers (3 stars)
INSERT INTO passenger_ratings (booking_id, driver_id, passenger_id, rating, comment, created_at)
SELECT 
    b.id,
    b.driver_id,
    b.passenger_id,
    3,
    'راكب عادي، لا ملاحظات خاصة',
    NOW() - INTERVAL '2 weeks'
FROM bookings b
WHERE b.status = 'completed'
AND b.passenger_id IS NOT NULL
AND b.driver_id IS NOT NULL
AND b.id NOT IN (SELECT booking_id FROM passenger_ratings)
LIMIT 1
ON CONFLICT (booking_id, driver_id, passenger_id) DO NOTHING;

-- Below average passengers (2 stars)
INSERT INTO passenger_ratings (booking_id, driver_id, passenger_id, rating, comment, created_at)
SELECT 
    b.id,
    b.driver_id,
    b.passenger_id,
    2,
    'تأخر كثيراً في نقطة الالتقاء',
    NOW() - INTERVAL '3 weeks'
FROM bookings b
WHERE b.status = 'completed'
AND b.passenger_id IS NOT NULL
AND b.driver_id IS NOT NULL
AND b.id NOT IN (SELECT booking_id FROM passenger_ratings)
LIMIT 1
ON CONFLICT (booking_id, driver_id, passenger_id) DO NOTHING;

-- Update all passenger stats after inserting sample data
-- This will calculate total trips and cancellations for all passengers
DO $$
DECLARE
    passenger_record RECORD;
BEGIN
    FOR passenger_record IN 
        SELECT DISTINCT id FROM profiles WHERE role = 'passenger' OR id IN (SELECT DISTINCT passenger_id FROM bookings WHERE passenger_id IS NOT NULL)
    LOOP
        UPDATE profiles 
        SET 
            total_trips_as_passenger = (
                SELECT COUNT(*) 
                FROM bookings 
                WHERE passenger_id = passenger_record.id 
                AND status = 'completed'
            ),
            total_cancellations_as_passenger = (
                SELECT COUNT(*) 
                FROM bookings 
                WHERE passenger_id = passenger_record.id 
                AND status = 'cancelled'
            )
        WHERE id = passenger_record.id;
    END LOOP;
END $$;

-- Verify the data
SELECT 
    p.full_name AS passenger_name,
    p.passenger_average_rating,
    p.passenger_ratings_count,
    p.total_trips_as_passenger,
    p.total_cancellations_as_passenger
FROM profiles p
WHERE p.passenger_ratings_count > 0 OR p.total_trips_as_passenger > 0
ORDER BY p.passenger_average_rating DESC;

