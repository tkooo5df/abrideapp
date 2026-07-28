/*
  # Align profiles roles and notification policies with application usage

  1. Updates
    - Extend the profiles.role constraint to allow the 'developer' role used by the app
    - Ensure profiles role values remain limited to supported roles
    - Allow authenticated users to insert notifications for themselves so client-side
      welcome flows and reminders no longer fail RLS checks
*/

-- Allow the developer role alongside existing roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('passenger', 'driver', 'admin', 'developer'));

-- Permit authenticated users to create notifications for themselves
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
CREATE POLICY "Users can insert their own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
