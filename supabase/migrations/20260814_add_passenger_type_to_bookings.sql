-- Add passenger_type column to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_type text NULL;
