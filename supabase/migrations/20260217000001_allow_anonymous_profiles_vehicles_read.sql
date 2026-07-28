-- Allow anonymous users to read profiles and vehicles for trip display
-- This is needed so guests can see driver names and vehicle info when viewing trips

-- Enable RLS on profiles and vehicles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Update existing policy to allow anonymous users to read public profile info
-- First drop the existing policy that only allows authenticated users
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Anonymous can view public profile info" ON profiles;

-- Create new policy that allows both anonymous and authenticated users
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anonymous users to read vehicle info (for trip display)
DROP POLICY IF EXISTS "Anyone can view vehicles" ON vehicles;
CREATE POLICY "Anyone can view vehicles"
  ON vehicles
  FOR SELECT
  TO anon, authenticated
  USING (true);

