-- Create view for recent bookings (last 30 days)
CREATE OR REPLACE VIEW public.v_recent_bookings AS
SELECT
  id,
  created_at,
  pickup_location,
  destination_location,
  passenger_id,
  driver_id,
  status,
  trip_id,
  seats_booked,
  total_amount,
  payment_method,
  notes,
  pickup_time,
  special_requests,
  updated_at
FROM
  bookings b
WHERE
  created_at >= (NOW() - INTERVAL '30 days');

-- Grant permissions to authenticated users
GRANT SELECT ON public.v_recent_bookings TO authenticated;

-- Add comment to the view
COMMENT ON VIEW public.v_recent_bookings IS 'View for recent bookings from the last 30 days';
