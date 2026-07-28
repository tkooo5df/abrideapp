import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Find expired pending bookings
    const { data: expiredBookings, error: fetchError } = await supabase
      .from("bookings")
      .select("id, trip_id, seats_booked")
      .eq("status", "pending")
      .lt("created_at", twentyFourHoursAgo);

    if (fetchError) {
      throw fetchError;
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No expired bookings found",
          cancelled: 0,
          checkedBefore: twentyFourHoursAgo,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    let cancelledCount = 0;
    const errors: string[] = [];
    const cancelledBookingIds: string[] = [];

    // Cancel each expired booking
    for (const booking of expiredBookings) {
      try {
        // Update booking status to cancelled
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", booking.id);

        if (updateError) {
          errors.push(`Booking ${booking.id}: ${updateError.message}`);
          continue;
        }

        // Update trip availability (seats will be returned automatically)
        if (booking.trip_id) {
          // Get all bookings for this trip (excluding cancelled ones)
          const { data: tripBookings, error: bookingsError } = await supabase
            .from("bookings")
            .select("seats_booked")
            .eq("trip_id", booking.trip_id)
            .in("status", ["pending", "confirmed", "in_progress", "completed"]);

          if (bookingsError) {
            errors.push(`Trip ${booking.trip_id}: ${bookingsError.message}`);
            continue;
          }

          // Calculate total seats booked
          const seatsBooked = (tripBookings ?? []).reduce(
            (sum, b) => sum + (b.seats_booked ?? 0),
            0
          );

          // Get trip details
          const { data: trip, error: tripError } = await supabase
            .from("trips")
            .select("total_seats, status")
            .eq("id", booking.trip_id)
            .maybeSingle();

          if (tripError || !trip) {
            errors.push(`Trip ${booking.trip_id}: ${tripError?.message || "Trip not found"}`);
            continue;
          }

          // Calculate available seats
          const availableSeats = Math.max(trip.total_seats - seatsBooked, 0);

          // Update trip status based on availability
          let newStatus = trip.status;
          if (availableSeats === 0 && trip.status === "scheduled") {
            newStatus = "fully_booked";
          } else if (availableSeats > 0 && trip.status === "fully_booked") {
            newStatus = "scheduled";
          }

          // Update trip
          const { error: tripUpdateError } = await supabase
            .from("trips")
            .update({
              available_seats: availableSeats,
              status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", booking.trip_id);

          if (tripUpdateError) {
            errors.push(`Trip ${booking.trip_id}: ${tripUpdateError.message}`);
            continue;
          }
        }

        cancelledCount++;
        cancelledBookingIds.push(String(booking.id));
      } catch (error) {
        errors.push(
          `Booking ${booking.id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cancelled ${cancelledCount} expired bookings`,
        cancelled: cancelledCount,
        total: expiredBookings.length,
        checkedBefore: twentyFourHoursAgo,
        cancelledBookingIds,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: formatError(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

