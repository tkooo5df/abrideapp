-- حل مبسط: استخدام معرفات موجودة فعلاً في النظام
-- أولاً، دعنا نتحقق من البيانات الموجودة

-- 1. عرض السائقين الموجودين
SELECT 'السائقين الموجودين:' as info;
SELECT id, full_name, email FROM profiles WHERE role = 'driver' LIMIT 5;

-- 2. عرض الركاب الموجودين
SELECT 'الركاب الموجودين:' as info;
SELECT id, full_name, email FROM profiles WHERE role = 'passenger' LIMIT 5;

-- 3. عرض الحجوزات المكتملة
SELECT 'الحجوزات المكتملة:' as info;
SELECT id, driver_id, passenger_id, status FROM bookings WHERE status = 'completed' LIMIT 5;

-- إذا كانت هناك بيانات موجودة، استخدمها
-- إذا لم تكن هناك بيانات، أنشئ بيانات بسيطة

-- إنشاء بيانات تجريبية بسيطة
INSERT INTO profiles (id, full_name, email, phone, role, created_at, updated_at) 
VALUES 
    ('driver-001', 'أحمد السائق', 'driver1@abridas.com', '0555123456', 'driver', NOW(), NOW()),
    ('driver-002', 'محمد السائق', 'driver2@abridas.com', '0555123457', 'driver', NOW(), NOW()),
    ('passenger-001', 'فاطمة الراكبة', 'passenger1@abridas.com', '0555123458', 'passenger', NOW(), NOW()),
    ('passenger-002', 'سارة الراكبة', 'passenger2@abridas.com', '0555123459', 'passenger', NOW(), NOW()),
    ('passenger-003', 'نور الراكب', 'passenger3@abridas.com', '0555123460', 'passenger', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- إنشاء حجوزات تجريبية
INSERT INTO bookings (id, pickup_location, destination_location, passenger_id, driver_id, seats_booked, total_amount, payment_method, status, created_at, updated_at)
VALUES 
    (2001, 'الجزائر العاصمة', 'وهران', 'passenger-001', 'driver-001', 1, 2500, 'cod', 'completed', NOW() - INTERVAL '2 days', NOW()),
    (2002, 'وهران', 'الجزائر العاصمة', 'passenger-002', 'driver-001', 1, 2500, 'cod', 'completed', NOW() - INTERVAL '1 day', NOW()),
    (2003, 'الجزائر العاصمة', 'قسنطينة', 'passenger-003', 'driver-001', 1, 3000, 'cod', 'completed', NOW() - INTERVAL '5 hours', NOW()),
    (2004, 'قسنطينة', 'الجزائر العاصمة', 'passenger-001', 'driver-002', 1, 3000, 'cod', 'completed', NOW() - INTERVAL '3 days', NOW()),
    (2005, 'الجزائر العاصمة', 'عنابة', 'passenger-002', 'driver-002', 1, 3500, 'cod', 'completed', NOW() - INTERVAL '1 day', NOW()),
    (2006, 'عنابة', 'الجزائر العاصمة', 'passenger-003', 'driver-002', 1, 3500, 'cod', 'completed', NOW() - INTERVAL '6 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- إدراج التقييمات
INSERT INTO ratings (booking_id, driver_id, passenger_id, rating, comment, created_at) VALUES
-- تقييمات للسائق الأول
(2001, 'driver-001', 'passenger-001', 5, 'سائق ممتاز ومهذب جداً، الرحلة كانت مريحة وآمنة', NOW() - INTERVAL '2 days'),
(2002, 'driver-001', 'passenger-002', 4, 'جيد جداً، لكن تأخر قليلاً', NOW() - INTERVAL '1 day'),
(2003, 'driver-001', 'passenger-003', 5, 'أفضل سائق في المدينة!', NOW() - INTERVAL '5 hours'),

-- تقييمات للسائق الثاني
(2004, 'driver-002', 'passenger-001', 3, 'مقبول، لكن السيارة تحتاج تنظيف', NOW() - INTERVAL '3 days'),
(2005, 'driver-002', 'passenger-002', 4, 'سائق محترف، أوصي به', NOW() - INTERVAL '1 day'),
(2006, 'driver-002', 'passenger-003', 2, 'لم يكن راضياً عن الخدمة', NOW() - INTERVAL '6 hours');

-- التحقق من النتائج
SELECT 'النتائج النهائية:' as info;
SELECT 
    p.full_name as "اسم السائق",
    p.average_rating as "متوسط التقييم",
    p.ratings_count as "عدد التقييمات"
FROM profiles p
WHERE p.role = 'driver' AND p.id IN ('driver-001', 'driver-002')
ORDER BY p.average_rating DESC;

-- عرض التقييمات المفصلة
SELECT 'التقييمات المفصلة:' as info;
SELECT 
    r.rating as "التقييم",
    r.comment as "التعليق",
    driver.full_name as "السائق",
    passenger.full_name as "الراكب",
    r.created_at as "التاريخ"
FROM ratings r
JOIN profiles driver ON r.driver_id = driver.id
JOIN profiles passenger ON r.passenger_id = passenger.id
ORDER BY r.created_at DESC;
