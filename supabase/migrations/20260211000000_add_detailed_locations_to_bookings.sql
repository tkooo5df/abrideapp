-- Add detailed location fields to bookings table
-- This migration adds pickup_point and destination_point for more specific location information

DO $$
BEGIN
  -- Add pickup_point column for specific pickup location
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'bookings' 
    AND column_name = 'pickup_point'
  ) THEN
    ALTER TABLE bookings ADD COLUMN pickup_point text;
    COMMENT ON COLUMN bookings.pickup_point IS 'النقطة المحددة للانطلاق (مثل: محطة الحافلات، ساحة معينة، إلخ)';
  END IF;

  -- Add destination_point column for specific destination location
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'bookings' 
    AND column_name = 'destination_point'
  ) THEN
    ALTER TABLE bookings ADD COLUMN destination_point text;
    COMMENT ON COLUMN bookings.destination_point IS 'النقطة المحددة للوصول (مثل: محطة الحافلات، ساحة معينة، إلخ)';
  END IF;
END $$;

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_point ON bookings(pickup_point);
CREATE INDEX IF NOT EXISTS idx_bookings_destination_point ON bookings(destination_point);

-- Verify the changes
SELECT 
  'تم إضافة الحقول التالية بنجاح:' as message,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'bookings'
  AND column_name IN ('pickup_point', 'destination_point')
ORDER BY column_name;

SELECT '✅ Migration completed successfully!' as status;

