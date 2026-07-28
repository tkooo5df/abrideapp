/*
  # Ensure full Supabase schema for DZ Taxi app

  This migration makes sure all tables and columns required by the
  application exist in Supabase. It is idempotent and can be applied
  safely even if parts of the schema already exist.
*/

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure profiles table has all expected columns
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

-- Ensure vehicles table exists
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

-- Ensure trips table exists
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

-- Extend bookings table with additional fields used by the application
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

-- Update notifications table to match application expectations
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN ('booking', 'trip', 'system', 'payment', 'info', 'success', 'warning', 'error')
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_read boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END;
$$;

-- Ensure system_settings table exists and has timestamps
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'system_settings' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'system_settings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END;
$$;

-- Ensure admin_logs table exists
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
