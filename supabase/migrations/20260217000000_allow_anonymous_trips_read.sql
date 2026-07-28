-- Allow anonymous users (non-authenticated) to read trips
-- This enables guests to view available trips without logging in

-- Enable RLS on trips table if not already enabled
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can view scheduled trips" ON trips;

-- Create policy to allow anyone (including anonymous users) to read scheduled trips
CREATE POLICY "Anyone can view scheduled trips"
  ON trips
  FOR SELECT
  TO anon, authenticated
  USING (status = 'scheduled' AND is_demo = false);

-- Also allow authenticated users to view their own trips regardless of status
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
CREATE POLICY "Users can view their own trips"
  ON trips
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Allow drivers to view all their trips (including cancelled, completed, etc.)
DROP POLICY IF EXISTS "Drivers can view all their trips" ON trips;
CREATE POLICY "Drivers can view all their trips"
  ON trips
  FOR SELECT
  TO authenticated
  USING (
    driver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'developer')
    )
  );

