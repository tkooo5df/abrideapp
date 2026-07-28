/*
  # Update user role to admin

  1. Updates
    - Set a specific user's role to 'admin' in the profiles table
    - This allows access to the admin dashboard

  Note: Replace the email with your actual email address
*/

-- Update a specific user's role to admin (replace with your email)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- If you need to create an admin user manually, you can use this instead:
-- INSERT INTO profiles (id, email, full_name, role) 
-- VALUES (
--   'your-user-id-here',
--   'admin@dztaxi.dz', 
--   'Admin User',
--   'admin'
-- ) ON CONFLICT (id) DO UPDATE SET role = 'admin';