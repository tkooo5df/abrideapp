-- Fix RLS policies for bookings table to allow proper booking creation

-- Enable RLS on bookings table (if not already enabled)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own bookings as passenger" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings as driver" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings as passenger" ON bookings;
DROP POLICY IF EXISTS "Drivers can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;

-- Allow passengers to view their bookings
CREATE POLICY "Users can view their own bookings as passenger"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (passenger_id = auth.uid());

-- Allow drivers to view bookings for their trips
CREATE POLICY "Users can view their own bookings as driver"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Allow authenticated users to create bookings as passengers
-- Removed restrictive CHECK to allow any authenticated user to create bookings
CREATE POLICY "Users can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow drivers to update bookings for their trips
CREATE POLICY "Drivers can update bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());

-- Allow passengers to update their own bookings (e.g., cancel)
CREATE POLICY "Passengers can update their bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (passenger_id = auth.uid());

-- Allow admins to manage all bookings
CREATE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'developer')
    )
  );

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

