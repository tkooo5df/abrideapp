-- Migration: Add admin function to delete users
-- This function allows admins to delete users and all related data

-- Function to delete user and all related data (admin only)
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean := false;
  v_result jsonb;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'developer')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Delete all related data first (to avoid foreign key constraints)
  -- Delete bookings
  DELETE FROM bookings WHERE passenger_id = p_user_id OR driver_id = p_user_id;
  
  -- Delete trips
  DELETE FROM trips WHERE driver_id = p_user_id;
  
  -- Delete vehicles
  DELETE FROM vehicles WHERE driver_id = p_user_id;
  
  -- Delete notifications
  DELETE FROM notifications WHERE user_id = p_user_id;
  
  -- Delete ratings
  DELETE FROM ratings WHERE rated_user_id = p_user_id OR rater_user_id = p_user_id;
  
  -- Delete passenger ratings
  DELETE FROM passenger_ratings WHERE rated_user_id = p_user_id OR rater_user_id = p_user_id;
  
  -- Delete passenger locations
  DELETE FROM passenger_locations WHERE passenger_id = p_user_id;
  
  -- Delete cancellation tracking
  DELETE FROM cancellation_tracking WHERE user_id = p_user_id;
  
  -- Delete account suspensions
  DELETE FROM account_suspensions WHERE user_id = p_user_id;
  
  -- Delete profile (this will cascade to auth.users if CASCADE is set)
  DELETE FROM profiles WHERE id = p_user_id;

  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'message', 'User and all related data deleted successfully',
    'user_id', p_user_id
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    v_result := jsonb_build_object(
      'success', false,
      'message', SQLERRM,
      'user_id', p_user_id
    );
    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users (RLS will check admin status)
GRANT EXECUTE ON FUNCTION admin_delete_user(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION admin_delete_user(uuid) IS 'Allows admins to delete users and all related data. Requires admin or developer role.';

