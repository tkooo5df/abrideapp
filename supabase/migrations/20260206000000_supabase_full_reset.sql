  /*
    # DZ Taxi Supabase full schema reset

    This idempotent migration rebuilds the public schema pieces that the
    application needs when Supabase projects were created without running the
    historical migrations. It can be pasted directly into the Supabase SQL
    editor or executed through the CLI.
  */

  -- Make sure UUID helpers exist
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  /* -------------------------------------------------------------------------- */
  /*                              PROFILES SETUP                                 */
  /* -------------------------------------------------------------------------- */

  CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    first_name text,
    last_name text,
    full_name text,
    phone text,
    role text DEFAULT 'passenger',
    avatar_url text,
    wilaya text,
    commune text,
    address text,
    date_of_birth date,
    is_verified boolean DEFAULT false,
    language text DEFAULT 'ar',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
    ) THEN
      ALTER TABLE profiles ADD COLUMN full_name text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'language'
    ) THEN
      ALTER TABLE profiles ADD COLUMN language text DEFAULT 'ar';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
      ALTER TABLE profiles ADD COLUMN avatar_url text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'commune'
    ) THEN
      ALTER TABLE profiles ADD COLUMN commune text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address'
    ) THEN
      ALTER TABLE profiles ADD COLUMN address text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE profiles ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
  END;
  $$;

  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('passenger', 'driver', 'admin', 'developer'));

  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  CREATE POLICY "Users can read own profile"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  -- Helper SECURITY DEFINER function to check admin status without recursive RLS
  CREATE OR REPLACE FUNCTION is_admin()
  RETURNS boolean AS $$
  DECLARE
    result boolean := false;
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','developer')
    ) INTO result;
    RETURN COALESCE(result, false);
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

  GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated;

  -- Allow admins and developers to manage all profiles
  DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
  CREATE POLICY "Admins can manage profiles"
    ON profiles
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

  -- Error log table for signup trigger failures
  CREATE TABLE IF NOT EXISTS _signup_errors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    email text,
    error_text text,
    context jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
  );

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

    INSERT INTO profiles (
      id, email, first_name, last_name, full_name, role,
      phone, wilaya, commune, address, date_of_birth, language, avatar_url
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
      v_avatar_url
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

  CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
  RETURNS trigger AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

  DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
  CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

  /* -------------------------------------------------------------------------- */
  /*                            NOTIFICATIONS SETUP                              */
  /* -------------------------------------------------------------------------- */

  CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL DEFAULT 'info',
    category text DEFAULT 'system',
    priority text DEFAULT 'medium',
    status text DEFAULT 'pending',
    related_id text,
    related_type text,
    action_url text,
    image_url text,
    scheduled_for timestamptz,
    expires_at timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  DO $$
  DECLARE
    has_read boolean;
    has_is_read boolean;
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read'
    ) INTO has_read;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'is_read'
    ) INTO has_is_read;

    IF has_read AND NOT has_is_read THEN
      ALTER TABLE notifications RENAME COLUMN "read" TO is_read;
    ELSIF has_read AND has_is_read THEN
      -- Both exist? Drop the legacy "read" to avoid conflicts
      BEGIN
        ALTER TABLE notifications DROP COLUMN "read";
      EXCEPTION WHEN undefined_column THEN
        -- ignore
      END;
    END IF;
  END;
  $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'category'
    ) THEN
      ALTER TABLE notifications ADD COLUMN category text DEFAULT 'system';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'priority'
    ) THEN
      ALTER TABLE notifications ADD COLUMN priority text DEFAULT 'medium';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'status'
    ) THEN
      ALTER TABLE notifications ADD COLUMN status text DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'related_id'
    ) THEN
      ALTER TABLE notifications ADD COLUMN related_id text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'related_type'
    ) THEN
      ALTER TABLE notifications ADD COLUMN related_type text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'action_url'
    ) THEN
      ALTER TABLE notifications ADD COLUMN action_url text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'image_url'
    ) THEN
      ALTER TABLE notifications ADD COLUMN image_url text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'scheduled_for'
    ) THEN
      ALTER TABLE notifications ADD COLUMN scheduled_for timestamptz;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'expires_at'
    ) THEN
      ALTER TABLE notifications ADD COLUMN expires_at timestamptz;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'metadata'
    ) THEN
      ALTER TABLE notifications ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;
  END;
  $$;

  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

  ALTER TABLE notifications
    ALTER COLUMN type SET NOT NULL,
    ALTER COLUMN type SET DEFAULT 'info',
    ALTER COLUMN updated_at SET DEFAULT now(),
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN is_read SET DEFAULT false;

  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
  CREATE POLICY "Users can read their own notifications"
    ON notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

  DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
  CREATE POLICY "Users can update their own notifications"
    ON notifications
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

  DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
  CREATE POLICY "Users can insert their own notifications"
    ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (
      -- Allow users to insert notifications for themselves
      user_id = auth.uid() 
      -- OR allow admins to insert notifications for any user
      OR is_admin()
    );

  DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
  CREATE POLICY "Admins can manage all notifications"
    ON notifications
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

  DROP TRIGGER IF EXISTS set_notifications_updated_at ON notifications;
  CREATE TRIGGER set_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
  CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

  /* -------------------------------------------------------------------------- */
  /*                                RPC: version                                */
  /* -------------------------------------------------------------------------- */

  CREATE OR REPLACE FUNCTION version()
  RETURNS text
  LANGUAGE sql
  STABLE
  AS $$
    SELECT '1.0.0'::text;
  $$;

  GRANT EXECUTE ON FUNCTION version() TO anon, authenticated;

  /* -------------------------------------------------------------------------- */
  /*                         SYSTEM SETTINGS & ADMIN LOGS                        */
  /* -------------------------------------------------------------------------- */

  CREATE TABLE IF NOT EXISTS system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL DEFAULT '{}'::jsonb,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
  );

  ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Admins can read system settings" ON system_settings;
  CREATE POLICY "Admins can read system settings"
    ON system_settings
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'developer')
      )
    );

  DROP POLICY IF EXISTS "Admins can manage system settings" ON system_settings;
  CREATE POLICY "Admins can manage system settings"
    ON system_settings
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'developer')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'developer')
      )
    );

  DROP TRIGGER IF EXISTS set_system_settings_updated_at ON system_settings;
  CREATE TRIGGER set_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

  CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

  CREATE TABLE IF NOT EXISTS admin_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    target_type text,
    target_id text,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
  );

  ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Admins can read admin logs" ON admin_logs;
  CREATE POLICY "Admins can read admin logs"
    ON admin_logs
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'developer')
      )
    );

  DROP POLICY IF EXISTS "Admins can insert admin logs" ON admin_logs;
  CREATE POLICY "Admins can insert admin logs"
    ON admin_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'developer')
      )
    );

  CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
  CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

  /* -------------------------------------------------------------------------- */
  /*                            VEHICLES / TRIPS / BOOKINGS                      */
  /* -------------------------------------------------------------------------- */

  CREATE TABLE IF NOT EXISTS vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    make text NOT NULL,
    model text NOT NULL,
    year integer,
    color text,
    license_plate text,
    seats integer,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);

  -- Enable RLS on vehicles table
  ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

  -- Allow drivers to view their own vehicles
  DROP POLICY IF EXISTS "Drivers can view their own vehicles" ON vehicles;
  CREATE POLICY "Drivers can view their own vehicles"
    ON vehicles
    FOR SELECT
    TO authenticated
    USING (driver_id = auth.uid());

  -- Allow drivers to insert their own vehicles
  DROP POLICY IF EXISTS "Drivers can insert their own vehicles" ON vehicles;
  CREATE POLICY "Drivers can insert their own vehicles"
    ON vehicles
    FOR INSERT
    TO authenticated
    WITH CHECK (driver_id = auth.uid());

  -- Allow drivers to update their own vehicles
  DROP POLICY IF EXISTS "Drivers can update their own vehicles" ON vehicles;
  CREATE POLICY "Drivers can update their own vehicles"
    ON vehicles
    FOR UPDATE
    TO authenticated
    USING (driver_id = auth.uid())
    WITH CHECK (driver_id = auth.uid());

  -- Allow drivers to delete their own vehicles
  DROP POLICY IF EXISTS "Drivers can delete their own vehicles" ON vehicles;
  CREATE POLICY "Drivers can delete their own vehicles"
    ON vehicles
    FOR DELETE
    TO authenticated
    USING (driver_id = auth.uid());

  -- Allow admins to manage all vehicles
  DROP POLICY IF EXISTS "Admins can manage all vehicles" ON vehicles;
  CREATE POLICY "Admins can manage all vehicles"
    ON vehicles
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

  -- Create trigger for updating timestamps
  DROP TRIGGER IF EXISTS set_vehicles_updated_at ON vehicles;
  CREATE TRIGGER set_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

  CREATE TABLE IF NOT EXISTS trips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
    from_wilaya_id integer NOT NULL,
    to_wilaya_id integer NOT NULL,
    from_wilaya_name text,
    to_wilaya_name text,
    departure_date date NOT NULL,
    departure_time text NOT NULL,
    price_per_seat numeric NOT NULL,
    total_seats integer NOT NULL,
    available_seats integer NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'scheduled',
    is_demo boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
  CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);

  CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    pickup_location text NOT NULL,
    destination_location text NOT NULL,
    passenger_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'pending',
    trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
    seats_booked integer DEFAULT 1,
    total_amount numeric,
    payment_method text DEFAULT 'cod',
    notes text,
    pickup_time text,
    special_requests text,
    updated_at timestamptz DEFAULT now()
  );

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'trip_id'
    ) THEN
      ALTER TABLE bookings ADD COLUMN trip_id uuid REFERENCES trips(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'seats_booked'
    ) THEN
      ALTER TABLE bookings ADD COLUMN seats_booked integer DEFAULT 1;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'total_amount'
    ) THEN
      ALTER TABLE bookings ADD COLUMN total_amount numeric;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'payment_method'
    ) THEN
      ALTER TABLE bookings ADD COLUMN payment_method text DEFAULT 'cod';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'notes'
    ) THEN
      ALTER TABLE bookings ADD COLUMN notes text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'pickup_time'
    ) THEN
      ALTER TABLE bookings ADD COLUMN pickup_time text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'special_requests'
    ) THEN
      ALTER TABLE bookings ADD COLUMN special_requests text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE bookings ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
  END;
  $$;

  CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON bookings(passenger_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);

  /* -------------------------------------------------------------------------- */
  /*                                 DEFAULT DATA                               */
  /* -------------------------------------------------------------------------- */

  INSERT INTO system_settings (key, value, description)
  VALUES
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
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      description = EXCLUDED.description,
      updated_at = now();
