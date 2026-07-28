-- Migration: Add from_ksar field to trips and bookings tables
-- This field is used to specify the ksar (قصر) when the from_wilaya_id is 47 (غرداية)

-- Add from_ksar to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'from_ksar'
  ) THEN
    ALTER TABLE trips ADD COLUMN from_ksar text;
    COMMENT ON COLUMN trips.from_ksar IS 'القصر (ksar) للانطلاق - يُستخدم فقط عندما تكون from_wilaya_id = 47 (غرداية)';
  END IF;
END $$;

-- Add from_ksar to bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'from_ksar'
  ) THEN
    ALTER TABLE bookings ADD COLUMN from_ksar text;
    COMMENT ON COLUMN bookings.from_ksar IS 'القصر (ksar) للانطلاق - يُستخدم فقط عندما تكون الولاية غرداية (47)';
  END IF;
END $$;

-- Create index for faster filtering by ksar (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_trips_from_ksar ON trips(from_ksar) WHERE from_ksar IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_from_ksar ON bookings(from_ksar) WHERE from_ksar IS NOT NULL;

