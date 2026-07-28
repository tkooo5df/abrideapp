-- Migration: Add to_ksar field to trips table
-- This field is used to specify the ksar (قصر) when the to_wilaya_id is 47 (غرداية)

-- Add to_ksar to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'to_ksar'
  ) THEN
    ALTER TABLE trips ADD COLUMN to_ksar text;
    COMMENT ON COLUMN trips.to_ksar IS 'القصر (ksar) للوصول - يُستخدم فقط عندما تكون to_wilaya_id = 47 (غرداية)';
  END IF;
END $$;

-- Create index for faster filtering by to_ksar (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_trips_to_ksar ON trips(to_ksar) WHERE to_ksar IS NOT NULL;

