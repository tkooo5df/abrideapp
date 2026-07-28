/*
  # Create admin management tables

  1. New Tables
    - `system_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (jsonb)
      - `description` (text)
      - `updated_at` (timestamp)
      - `updated_by` (uuid, references auth.users)
    
    - `admin_logs`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, references auth.users)
      - `action` (text)
      - `target_type` (text)
      - `target_id` (text)
      - `details` (jsonb)
      - `created_at` (timestamp)

    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `message` (text)
      - `type` (text)
      - `read` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access only
    - Add policies for user notifications

  3. Functions
    - Create function to log admin actions
    - Create function to send notifications
*/

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for system_settings (admin only)
CREATE POLICY "Only admins can read system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policies for admin_logs (admin only)
CREATE POLICY "Only admins can read admin logs"
  ON admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can create admin logs"
  ON admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policies for notifications
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

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action text,
  p_target_type text DEFAULT NULL,
  p_target_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info'
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (p_user_id, p_title, p_message, p_type)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('site_name', '"DZ Taxi"', 'اسم الموقع'),
  ('site_description', '"أفضل خدمة نقل في الجزائر"', 'وصف الموقع'),
  ('support_phone', '"+213 555 123 456"', 'رقم الدعم'),
  ('support_email', '"support@dztaxi.dz"', 'بريد الدعم'),
  ('default_language', '"ar"', 'اللغة الافتراضية'),
  ('enable_notifications', 'true', 'تفعيل الإشعارات'),
  ('enable_sms', 'true', 'تفعيل رسائل SMS'),
  ('enable_email', 'true', 'تفعيل رسائل البريد'),
  ('maintenance_mode', 'false', 'وضع الصيانة'),
  ('registration_enabled', 'true', 'تفعيل التسجيل'),
  ('driver_approval_required', 'true', 'مراجعة طلبات السائقين'),
  ('min_booking_price', '500', 'الحد الأدنى للسعر'),
  ('max_booking_price', '10000', 'الحد الأقصى للسعر'),
  ('commission_rate', '10', 'عمولة الموقع'),
  ('cancellation_fee', '200', 'رسوم الإلغاء')
ON CONFLICT (key) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);