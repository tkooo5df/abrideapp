/*
  # Fix Notifications RLS Policies

  1. Changes
    - Add INSERT policy to allow users to create notifications for themselves
    - This fixes the 403 Forbidden errors when creating notifications

  2. Security
    - Maintains existing RLS policies
    - Only allows users to create notifications for themselves
    - Admins can still create notifications for anyone
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;

-- Recreate policies with proper permissions
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
