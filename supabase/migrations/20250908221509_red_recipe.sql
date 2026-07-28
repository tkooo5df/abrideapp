/*
  # Update admin role for specific user

  1. Changes
    - Set admin role for user with email 'AMINEKERKARR@GMAIL.COM'
    - Ensure the user has admin privileges

  2. Security
    - Only updates the specific user's role
    - Maintains existing RLS policies
*/

-- Update the user role to admin for the specified email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'AMINEKERKARR@GMAIL.COM';

-- If the profile doesn't exist yet, we'll create it
-- This handles cases where the user signed up but profile wasn't created
INSERT INTO profiles (id, email, role, full_name, is_verified, created_at, updated_at)
SELECT 
  auth.users.id,
  auth.users.email,
  'admin',
  COALESCE(auth.users.raw_user_meta_data->>'full_name', 'Admin User'),
  true,
  now(),
  now()
FROM auth.users 
WHERE auth.users.email = 'AMINEKERKARR@GMAIL.COM'
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
  );

-- Ensure the user is verified
UPDATE profiles 
SET is_verified = true 
WHERE email = 'AMINEKERKARR@GMAIL.COM';