CREATE TABLE bookings (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pickup_location TEXT NOT NULL,
    destination_location TEXT NOT NULL,
    passenger_id UUID REFERENCES auth.users(id),
    driver_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending' -- e.g., pending, confirmed, completed, canceled
);