-- Update handle_new_user function to support auto-approve drivers
-- This function will check the auto_approve_drivers setting and automatically approve drivers if enabled

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_first text;
  v_last text;
  v_full text;
  v_role text;
  v_phone text;
  v_wilaya text;
  v_commune text;
  v_address text;
  v_dob date;
  v_language text;
  v_avatar_url text;
  v_auto_approve boolean;
  v_is_verified boolean;
BEGIN
  v_first := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last  := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_full  := NULLIF(TRIM(CONCAT(v_first, ' ', v_last)), '');
  v_role  := COALESCE(NEW.raw_user_meta_data->>'role', 'passenger');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NULL);
  v_wilaya := COALESCE(NEW.raw_user_meta_data->>'wilaya', NULL);
  v_commune := COALESCE(NEW.raw_user_meta_data->>'commune', NULL);
  v_address := COALESCE(NEW.raw_user_meta_data->>'address', NULL);
  v_language := COALESCE(NEW.raw_user_meta_data->>'language', NULL);
  v_avatar_url := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'avatarURL');
  BEGIN
    v_dob := NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '')::date;
  EXCEPTION WHEN OTHERS THEN
    v_dob := NULL;
  END;

  -- Check auto_approve_drivers setting
  SELECT COALESCE((value::text)::boolean, false) INTO v_auto_approve
  FROM system_settings
  WHERE key = 'auto_approve_drivers'
  LIMIT 1;

  -- Determine if_verified based on role and auto_approve setting
  IF v_role = 'driver' AND v_auto_approve THEN
    v_is_verified := true;  -- Auto-approve drivers if setting is enabled
  ELSE
    v_is_verified := false; -- Require manual approval
  END IF;

  INSERT INTO profiles (
    id, email, first_name, last_name, full_name, role,
    phone, wilaya, commune, address, date_of_birth, language, avatar_url,
    is_verified
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first,
    v_last,
    COALESCE(v_full, ''),
    v_role,
    v_phone,
    v_wilaya,
    v_commune,
    v_address,
    v_dob,
    v_language,
    v_avatar_url,
    v_is_verified
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        role = COALESCE(EXCLUDED.role, profiles.role),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        wilaya = COALESCE(EXCLUDED.wilaya, profiles.wilaya),
        commune = COALESCE(EXCLUDED.commune, profiles.commune),
        address = COALESCE(EXCLUDED.address, profiles.address),
        date_of_birth = COALESCE(EXCLUDED.date_of_birth, profiles.date_of_birth),
        language = COALESCE(EXCLUDED.language, profiles.language),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = now();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO _signup_errors (user_id, email, error_text, context)
    VALUES (
      NEW.id,
      NEW.email,
      SQLSTATE || ': ' || SQLERRM,
      jsonb_build_object('function', 'handle_new_user') || COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
    );
  EXCEPTION WHEN OTHERS THEN
    -- swallow logging failure
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

