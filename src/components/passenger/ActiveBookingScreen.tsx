import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { shouldShowPassengerMap, getBookingStatusText } from '@/lib/statusMap';
import { useSubscribeDriverLocation } from '@/hooks/useLiveDriverLocation';
import PassengerMapActiveBookingMapbox from './PassengerMapActiveBookingMapbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import RatingStars from '@/components/RatingStars';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';

type LatLng = { lat: number; lng: number };

interface Booking {
  id: number;
  status: string;
  driver_id: string;
  pickup_location: LatLng;
  destination_location: LatLng;
  driver_name?: string;
  driver_phone?: string;
  driver_rating?: number;
  created_at: string;
  updated_at: string;
  trip_id?: string;
}

interface Trip {
  id: string;
  from_wilaya_id: number;
  to_wilaya_id: number;
  from_wilaya_name?: string;
  to_wilaya_name?: string;
}

interface DriverProfile {
  id: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

interface ActiveBookingScreenProps {
  bookingId: number;
  onBookingComplete?: () => void;
  onBookingCancel?: () => void;
}

export default function ActiveBookingScreen({ 
  bookingId, 
  onBookingComplete,
  onBookingCancel 
}: ActiveBookingScreenProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [driverRatingSummary, setDriverRatingSummary] = useState<{ averageRating: number; totalRatings: number }>({ averageRating: 0, totalRatings: 0 });

  const driverId = booking?.driver_id as string | undefined;
  const { position: driverPos, lastUpdate } = useSubscribeDriverLocation(driverId || '');

  // Fetch booking details
  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (error) {
          setError('Failed to load booking details');
        } else {
          setBooking(data);
          
          // Fetch trip details if trip_id exists
          if (data.trip_id) {
            const { data: tripData, error: tripError } = await supabase
              .from('trips')
              .select('id, from_wilaya_id, to_wilaya_id, from_wilaya_name, to_wilaya_name')
              .eq('id', data.trip_id)
              .single();

            if (tripError) {
            } else {
              setTrip(tripData);
            }
          }
          
          // Fetch driver profile if driver is assigned
          if (data.driver_id) {
            const { data: driverData, error: driverError } = await supabase
              .from('profiles')
              .select('id, full_name, phone, avatar_url')
              .eq('id', data.driver_id)
              .single();

            if (driverError) {
            } else {
              setDriverProfile(driverData);
            }

            try {
              const summary = await BrowserDatabaseService.getDriverRatingsSummary(data.driver_id);
              setDriverRatingSummary(summary);
            } catch (ratingError) {
              setDriverRatingSummary({ averageRating: 0, totalRatings: 0 });
            }
          } else {
            setDriverRatingSummary({ averageRating: 0, totalRatings: 0 });
          }
        }
      } catch (err) {
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();

    // Set up realtime subscription for booking updates
    const channel = supabase
      .channel('passenger_booking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedBooking = payload.new as Booking;
            setBooking(updatedBooking);
            
            // If booking is completed or cancelled, trigger callback
            if (['completed', 'cancelled'].includes(updatedBooking.status)) {
              if (updatedBooking.status === 'completed' && onBookingComplete) {
                onBookingComplete();
              } else if (updatedBooking.status === 'cancelled' && onBookingCancel) {
                onBookingCancel();
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, onBookingComplete, onBookingCancel]);

  const showMap = shouldShowPassengerMap(booking?.status as any);
  const pickup = booking?.pickup_location as LatLng | null;
  const destination = booking?.destination_location as LatLng | null;

  const handleCancelBooking = async () => {
    if (!booking) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) {
        setError('Failed to cancel booking');
      } else {
        if (onBookingCancel) {
          onBookingCancel();
        }
      }
    } catch (err) {
      setError('Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'enroute': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading booking details...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !booking) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">{error || 'Booking not found'}</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare wilaya information for the map
  const fromWilaya = trip ? { 
    id: trip.from_wilaya_id, 
    name: trip.from_wilaya_name || '' 
  } : null;
  
  const toWilaya = trip ? { 
    id: trip.to_wilaya_id, 
    name: trip.to_wilaya_name || '' 
  } : null;

  return (
    <div className="space-y-6">
      {/* Booking Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Trip Status</span>
            <Badge className={getStatusColor(booking.status)}>
              {getBookingStatusText(booking.status as any)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-1">Trip ID</h4>
              <p className="text-sm font-mono">#{booking.id}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-1">Created</h4>
              <p className="text-sm">{formatTime(booking.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Information */}
      {driverProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Your Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                {driverProfile.avatar_url ? (
                  <img 
                    src={driverProfile.avatar_url} 
                    alt="Driver" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-gray-600">
                    {driverProfile.full_name?.charAt(0) || 'D'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{driverProfile.full_name || 'Driver'}</h3>
                {driverProfile.phone && (
                  <p className="text-sm text-gray-600">{driverProfile.phone}</p>
                )}
                {driverRatingSummary.averageRating > 0 && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <RatingStars rating={driverRatingSummary.averageRating} iconClassName="h-3 w-3" />
                    <span>{driverRatingSummary.averageRating.toFixed(1)}</span>
                    {driverRatingSummary.totalRatings > 0 && (
                      <span className="text-xs text-gray-500">({driverRatingSummary.totalRatings})</span>
                    )}
                  </div>
                )}
              </div>
              {driverPos && (
                <div className="text-right">
                  <div className="text-sm text-green-600 font-medium">Live Tracking</div>
                  <div className="text-xs text-gray-500">
                    Updated {lastUpdate ? formatTime(new Date(lastUpdate).toISOString()) : 'Now'}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trip Details */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-1">Pickup Location</h4>
            <p className="text-sm">
              {pickup ? `${pickup.lat.toFixed(6)}, ${pickup.lng.toFixed(6)}` : 'Not specified'}
            </p>
            {fromWilaya?.name && (
              <p className="text-sm text-gray-600 mt-1">Wilaya: {fromWilaya.name}</p>
            )}
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-1">Destination</h4>
            <p className="text-sm">
              {destination ? `${destination.lat.toFixed(6)}, ${destination.lng.toFixed(6)}` : 'Not specified'}
            </p>
            {toWilaya?.name && (
              <p className="text-sm text-gray-600 mt-1">Wilaya: {toWilaya.name}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map Section */}
      <Card>
        <CardHeader>
          <CardTitle>Live Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          {showMap ? (
            <PassengerMapActiveBookingMapbox 
              driverPos={driverPos} 
              pickup={pickup} 
              destination={destination}
              fromWilaya={fromWilaya} // Pass wilaya info
              toWilaya={toWilaya}     // Pass wilaya info
              showDriverRoute={true}
            />
          ) : (
            <div className="p-8 text-center rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-gray-500">
                <p className="font-medium">Map will appear when your trip is confirmed</p>
                <p className="text-sm mt-1">
                  {booking.status === 'pending' && 'Waiting for driver confirmation...'}
                  {booking.status === 'completed' && 'Trip completed successfully!'}
                  {booking.status === 'cancelled' && 'Trip was cancelled'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {['pending', 'confirmed'].includes(booking.status) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancelBooking}
                disabled={actionLoading}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Trip'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
              className="mt-2"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
