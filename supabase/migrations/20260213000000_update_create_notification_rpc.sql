/*
  # Update create_notification RPC Function
  
  This migration updates the create_notification function to support all notification fields
  including category, priority, status, related_id, metadata, etc.
  
  This allows the application to create notifications with full metadata through RPC,
  bypassing RLS policies (since it's SECURITY DEFINER).
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_notification(uuid, text, text, text);

-- Create updated function with all parameters
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_category text DEFAULT 'system',
  p_priority text DEFAULT 'medium',
  p_status text DEFAULT 'active',
  p_related_id text DEFAULT NULL,
  p_related_type text DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_image_url text DEFAULT NULL,
  p_scheduled_for timestamptz DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    category,
    priority,
    status,
    related_id,
    related_type,
    action_url,
    image_url,
    scheduled_for,
    expires_at,
    metadata
  )
  VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_category,
    p_priority,
    p_status,
    p_related_id,
    p_related_type,
    p_action_url,
    p_image_url,
    p_scheduled_for,
    p_expires_at,
    p_metadata
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_notification(uuid, text, text, text, text, text, text, text, text, text, text, timestamptz, timestamptz, jsonb) TO authenticated;

