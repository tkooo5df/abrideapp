-- Migration: Add age and ksar fields to profiles table
-- Replace wilaya and commune with age and ksar for M'zab Valley users

-- Add age column (integer)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE profiles ADD COLUMN age integer;
  END IF;
END;
$$;

-- Add ksar column (text) - for the 7 ksour of M'zab Valley
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ksar'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ksar text;
  END IF;
END;
$$;

-- Update handle_new_user function to include age and ksar
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
  v_age integer;
  v_ksar text;
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
  
  -- Handle age (integer)
  BEGIN
    v_age := NULLIF(NEW.raw_user_meta_data->>'age', '')::integer;
  EXCEPTION WHEN OTHERS THEN
    v_age := NULL;
  END;
  
  -- Handle ksar (text)
  v_ksar := COALESCE(NEW.raw_user_meta_data->>'ksar', NULL);
  
  BEGIN
    v_dob := NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '')::date;
  EXCEPTION WHEN OTHERS THEN
    v_dob := NULL;
  END;

  INSERT INTO profiles (
    id, email, first_name, last_name, full_name, role,
    phone, wilaya, commune, address, date_of_birth, language, avatar_url,
    age, ksar
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
    v_age,
    v_ksar
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      phone = EXCLUDED.phone,
      wilaya = EXCLUDED.wilaya,
      commune = EXCLUDED.commune,
      address = EXCLUDED.address,
      date_of_birth = EXCLUDED.date_of_birth,
      language = EXCLUDED.language,
      avatar_url = EXCLUDED.avatar_url,
      age = EXCLUDED.age,
      ksar = EXCLUDED.ksar,
      updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON COLUMN profiles.age IS 'Age of the user (integer)';
COMMENT ON COLUMN profiles.ksar IS 'Ksar (one of the 7 ksour of M''zab Valley: غرداية، بني يزقن، المنيعة، بنوران، العطف، بريان، القرارة)';

