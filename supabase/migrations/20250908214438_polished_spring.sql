/*
  # Add missing columns to bookings table

  1. Changes
    - Add `destination_location` column if it doesn't exist
    - Ensure all required columns are present for booking functionality
    - Add proper indexes for performance

  2. Security
    - Enable RLS on bookings table
    - Add policies for authenticated users to manage their bookings
*/

-- Add missing columns to bookings table if they don't exist
DO $$
BEGIN
  -- Check and add destination_location column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'destination_location'
  ) THEN
    ALTER TABLE bookings ADD COLUMN destination_location TEXT NOT NULL DEFAULT '';
  END IF;

  -- Check and add pickup_location column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'pickup_location'
  ) THEN
    ALTER TABLE bookings ADD COLUMN pickup_location TEXT NOT NULL DEFAULT '';
  END IF;

  -- Check and add passenger_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'passenger_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN passenger_id UUID REFERENCES auth.users(id);
  END IF;

  -- Check and add driver_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'driver_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN driver_id UUID REFERENCES auth.users(id);
  END IF;

  -- Check and add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
  END IF;
END $$;

-- Enable RLS on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings as passenger"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (passenger_id = auth.uid());

CREATE POLICY "Users can view their own bookings as driver"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Users can create bookings as passenger"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (passenger_id = auth.uid());

CREATE POLICY "Drivers can update their bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);