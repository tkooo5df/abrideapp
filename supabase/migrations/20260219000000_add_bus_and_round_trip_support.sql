-- Migration to support Bus Trips (>30 seats) and Round-Trip (Return) Bookings

-- 1. Add bus and return trip fields to 'trips'
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS return_date DATE,
ADD COLUMN IF NOT EXISTS return_time TIME,
ADD COLUMN IF NOT EXISTS is_bus_trip BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_return_trip BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_trip_id UUID REFERENCES trips(id) ON DELETE CASCADE;

-- 2. Add trip_type, return_date, and return_time fields to 'bookings'
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS trip_type TEXT DEFAULT 'outbound',
ADD COLUMN IF NOT EXISTS return_date DATE,
ADD COLUMN IF NOT EXISTS return_time TIME;

-- 3. Comments for documentation
COMMENT ON COLUMN trips.return_date IS 'Return date for bus or round trips';
COMMENT ON COLUMN trips.return_time IS 'Return time for bus or round trips';
COMMENT ON COLUMN trips.is_bus_trip IS 'True if vehicle/trip has > 30 seats (Bus)';
COMMENT ON COLUMN trips.is_return_trip IS 'True if this trip is the automatically generated return leg of a bus trip';

COMMENT ON COLUMN bookings.trip_type IS 'Booking type: outbound (ذهاب فقط), return (عودة فقط), or round_trip (ذهاب وإياد)';
