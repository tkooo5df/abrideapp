import React, { useEffect, useState } from "react";
import MapboxMap from "@/components/map/MapboxMap";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, Users, Car } from "lucide-react";
import { MAPBOX_CONFIG, MARKER_ICONS, GHARDAIA_CENTER } from "@/config/mapbox";
import { locationTrackingService } from "@/services/locationTracking";
import { toast } from "@/hooks/use-toast";

interface DriverPosition {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  updated_at?: string;
}

interface BookingDetails {
  id: number;
  pickup_location: string;
  destination_location: string;
  driver_id: string;
  status: string;
  seats_booked: number;
  total_amount: number;
  pickup_time?: string;
  notes?: string;
  driver_name?: string;
  driver_phone?: string;
}

interface PassengerMapMapboxProps {
  bookingId: number;
}

export default function PassengerMapMapbox({ bookingId }: PassengerMapMapboxProps) {
  const [driverPosition, setDriverPosition] = useState<DriverPosition | null>(null);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mapCenter, setMapCenter] = useState(GHARDAIA_CENTER);
  const [mapZoom, setMapZoom] = useState(12);
  const [passengerPosition, setPassengerPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Request passenger location on component mount
  useEffect(() => {
    const requestPassengerLocation = async () => {
      try {
        // Show a toast to inform user that location is being requested
        toast({
          title: "طلب الموقع",
          description: "جاري طلب إذن الوصول إلى موقعك...",
        });
        
        // Get current location
        const location = await locationTrackingService.getCurrentLocation();
        if (location) {
          setPassengerPosition({
            lat: location.latitude,
            lng: location.longitude
          });
          setMapCenter({
            lat: location.latitude,
            lng: location.longitude
          });
          toast({
            title: "تم الحصول على الموقع",
            description: "تم الحصول على موقعك بنجاح",
          });
        }
      } catch (error) {
        toast({
          title: "خطأ في الحصول على الموقع",
          description: "فشل في الحصول على موقعك. يرجى التحقق من إعدادات المتصفح.",
          variant: "destructive",
        });
      }
    };
    
    requestPassengerLocation();
  }, []);

  // Parse location string to coordinates
  const parseLocation = (locationStr: string): { lat: number; lng: number } | null => {
    try {
      const parsed = JSON.parse(locationStr);
      if (parsed.lat && parsed.lng) {
        return { lat: parsed.lat, lng: parsed.lng };
      }
    } catch {
      const coords = locationStr.match(/-?\d+\.?\d*/g);
      if (coords && coords.length >= 2) {
        return { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) };
      }
    }
    return null;
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate ETA based on distance and average speed
  const calculateETA = (distanceKm: number): string => {
    const averageSpeedKmh = 30; // Average city speed in km/h
    const timeHours = distanceKm / averageSpeedKmh;
    const timeMinutes = Math.round(timeHours * 60);
    
    if (timeMinutes < 60) {
      return `${timeMinutes} min`;
    } else {
      const hours = Math.floor(timeMinutes / 60);
      const minutes = timeMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            pickup_location,
            destination_location,
            driver_id,
            status,
            seats_booked,
            total_amount,
            pickup_time,
            notes
          `)
          .eq("id", bookingId)
          .single();

        if (error) throw error;

        // Fetch driver profile if driver is assigned
        let driverName = 'Unknown Driver';
        let driverPhone = 'N/A';
        
        if (data.driver_id) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("first_name, last_name, phone")
            .eq("id", data.driver_id)
            .single();
            
          if (!profileError && profileData) {
            driverName = `${profileData.first_name} ${profileData.last_name}`;
            driverPhone = profileData.phone || 'N/A';
          }
        }

        const bookingData = {
          id: data.id,
          pickup_location: data.pickup_location,
          destination_location: data.destination_location,
          driver_id: data.driver_id,
          status: data.status,
          seats_booked: data.seats_booked,
          total_amount: data.total_amount,
          pickup_time: data.pickup_time,
          notes: data.notes,
          driver_name: driverName,
          driver_phone: driverPhone,
        };

        setBooking(bookingData);

        // Parse coordinates
        const pickup = parseLocation(data.pickup_location);
        const destination = parseLocation(data.destination_location);
        
        setPickupCoords(pickup);
        setDestinationCoords(destination);

        // Update map center to pickup location
        if (pickup) {
          setMapCenter(pickup);
        }

        // If driver is assigned, fetch their current location
        if (data.driver_id) {
          const { data: driverLocation, error: driverError } = await supabase
            .from("driver_locations")
            .select("*")
            .eq("driver_id", data.driver_id)
            .single();

          if (driverError) {
          } else if (driverLocation) {
            setDriverPosition({
              lat: driverLocation.lat,
              lng: driverLocation.lng,
              heading: driverLocation.heading,
              speed: driverLocation.speed,
              accuracy: driverLocation.accuracy,
              updated_at: driverLocation.updated_at,
            });
          }
        }
      } catch (error) {
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Subscribe to real-time driver location updates
  useEffect(() => {
    if (!booking?.driver_id) return;

    const channel = supabase
      .channel("driver_locations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "driver_locations",
          filter: `driver_id=eq.${booking.driver_id}`,
        },
        (payload) => {
          if (payload.new) {
            const newPosition = payload.new as DriverPosition;
            setDriverPosition(newPosition);
            setIsConnected(true);
            
            // Update map center to driver position
            setMapCenter({ lat: newPosition.lat, lng: newPosition.lng });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.driver_id]);

  // Calculate distance and ETA when driver position changes
  useEffect(() => {
    if (driverPosition && pickupCoords) {
      const dist = calculateDistance(
        driverPosition.lat,
        driverPosition.lng,
        pickupCoords.lat,
        pickupCoords.lng
      );
      setDistance(dist);
      setEta(calculateETA(dist));
    }
  }, [driverPosition, pickupCoords]);

  // Prepare markers for MapboxMap component
  const mapMarkers = [];
  
  // Add driver position marker
  if (driverPosition) {
    mapMarkers.push({
      id: 'driver',
      position: { lat: driverPosition.lat, lng: driverPosition.lng },
      icon: 'driver' as keyof typeof MARKER_ICONS,
      title: 'Driver Location',
      onClick: () => {},
      popupContent: `
        <div class="p-2 text-center">
          <h3 class="font-semibold">Driver Location</h3>
          <p class="text-sm">${booking?.driver_name}</p>
          <p class="text-sm">${driverPosition.lat.toFixed(6)}, ${driverPosition.lng.toFixed(6)}</p>
          ${driverPosition.speed ? `<p class="text-sm">Speed: ${(driverPosition.speed * 3.6).toFixed(1)} km/h</p>` : ''}
          ${driverPosition.updated_at ? `<p class="text-xs text-gray-500">Updated: ${new Date(driverPosition.updated_at).toLocaleTimeString()}</p>` : ''}
        </div>
      `
    });
  }

  // Add pickup location marker
  if (pickupCoords) {
    mapMarkers.push({
      id: 'pickup',
      position: pickupCoords,
      icon: 'pickup' as keyof typeof MARKER_ICONS,
      title: 'Pickup Location',
      onClick: () => {},
      popupContent: `
        <div class="p-2 text-center">
          <h3 class="font-semibold">Pickup Location</h3>
          <p class="text-sm">Your pickup point</p>
          ${booking?.pickup_time ? `<p class="text-sm">Time: ${new Date(booking.pickup_time).toLocaleString()}</p>` : ''}
        </div>
      `
    });
  }

  // Add destination location marker
  if (destinationCoords) {
    mapMarkers.push({
      id: 'destination',
      position: destinationCoords,
      icon: 'destination' as keyof typeof MARKER_ICONS,
      title: 'Destination',
      onClick: () => {},
      popupContent: `
        <div class="p-2 text-center">
          <h3 class="font-semibold">Destination</h3>
          <p class="text-sm">Your destination</p>
        </div>
      `
    });
  }

  return (
    <div className="space-y-4">
      {/* Booking Info */}
      {booking && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Driver Information</h3>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <span>{booking.driver_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.driver_phone}</span>
                </div>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Driver Online" : "Driver Offline"}
                </Badge>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Trip Information</h3>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{booking.seats_booked} seat{booking.seats_booked > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{booking.total_amount} DZD</span>
                </div>
                <Badge variant="outline">{booking.status}</Badge>
              </div>
            </div>

            {/* Distance and ETA */}
            {distance && eta && (
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="font-semibold">{distance.toFixed(1)} km</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">ETA</p>
                  <p className="font-semibold">{eta}</p>
                </div>
                {driverPosition?.speed && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Speed</p>
                    <p className="font-semibold">
                      {(driverPosition.speed * 3.6).toFixed(0)} km/h
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div className="w-full h-[80vh] rounded-lg">
            <MapboxMap
              center={mapCenter}
              zoom={mapZoom}
              markers={mapMarkers}
              showControls={true}
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}