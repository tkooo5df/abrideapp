-- إضافة constraint فريد لجدول ratings
-- هذا يمنع إضافة تقييمات مكررة لنفس الحجز من نفس الراكب

-- إضافة constraint فريد
ALTER TABLE ratings 
ADD CONSTRAINT unique_booking_passenger_rating 
UNIQUE (booking_id, passenger_id);

-- التحقق من إضافة الـ constraint
SELECT 
    constraint_name, 
    constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'ratings' 
AND constraint_type = 'UNIQUE';

-- عرض هيكل الجدول المحدث
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ratings' 
ORDER BY ordinal_position;
