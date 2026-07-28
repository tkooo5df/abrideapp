import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import { locationTrackingService } from "@/services/locationTracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, Users, Car } from "lucide-react";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons
const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const passengerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

interface PassengerMapProps {
  bookingId: number;
}

export default function PassengerMap({ bookingId }: PassengerMapProps) {
  const [driverPosition, setDriverPosition] = useState<DriverPosition | null>(null);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [passengerLocation, setPassengerLocation] = useState<[number, number] | null>(null);

  // Default center for Algeria
  const defaultCenter: [number, number] = [36.7538, 3.0588]; // Algiers, Algeria

  // Parse location string to coordinates
  const parseLocation = (locationStr: string): [number, number] | null => {
    try {
      const parsed = JSON.parse(locationStr);
      if (parsed.lat && parsed.lng) {
        return [parsed.lat, parsed.lng];
      }
    } catch {
      const coords = locationStr.match(/-?\d+\.?\d*/g);
      if (coords && coords.length >= 2) {
        return [parseFloat(coords[0]), parseFloat(coords[1])];
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

        // If driver is assigned, fetch their current location
        if (data.driver_id) {
          const { data: driverLocation, error: driverError } = await supabase
            .from("driver_locations")
            .select("*")
            .eq("driver_id", data.driver_id)
            .single();

          if (driverError) {
            setIsConnected(false);
          } else if (driverLocation) {
            setDriverPosition({
              lat: driverLocation.lat,
              lng: driverLocation.lng,
              heading: driverLocation.heading,
              speed: driverLocation.speed,
              accuracy: driverLocation.accuracy,
              updated_at: driverLocation.updated_at,
            });
            setIsConnected(true);
          } else {
            setIsConnected(false);
          }
        } else {
          setIsConnected(false);
        }
      } catch (error) {
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Get passenger current location (for centering and showing "you are here")
  useEffect(() => {
    const requestLocation = async () => {
      try {
        const loc = await locationTrackingService.getCurrentLocation();
        if (loc) {
          setPassengerLocation([loc.latitude, loc.longitude]);
        }
      } catch (e) {
        // Silent fail; map will fall back to pickup/default center
      }
    };
    requestLocation();
  }, []);

  // Subscribe to real-time driver location updates
  useEffect(() => {
    if (!booking?.driver_id) return;
    // Initial fetch
    const fetchDriverLocation = async () => {
      try {
        const { data, error } = await supabase
          .from("driver_locations")
          .select("*")
          .eq("driver_id", booking.driver_id)
          .single();

        if (error) {
          setIsConnected(false);
        } else if (data) {
          setDriverPosition({
            lat: data.lat,
            lng: data.lng,
            heading: data.heading,
            speed: data.speed,
            accuracy: data.accuracy,
            updated_at: data.updated_at,
          });
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (err) {
        setIsConnected(false);
      }
    };

    fetchDriverLocation();

    // Set up polling as backup (every 3 seconds)
    const pollInterval = setInterval(fetchDriverLocation, 3000);

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`driver_locations_${booking.driver_id}`)
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
            const newPos = payload.new as DriverPosition;
            setDriverPosition({
              lat: newPos.lat,
              lng: newPos.lng,
              heading: newPos.heading,
              speed: newPos.speed,
              accuracy: newPos.accuracy,
              updated_at: newPos.updated_at,
            });
            setIsConnected(true);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [booking?.driver_id]);

  // Calculate distance and ETA when driver position changes
  useEffect(() => {
    if (driverPosition && pickupCoords) {
      const dist = calculateDistance(
        driverPosition.lat,
        driverPosition.lng,
        pickupCoords[0],
        pickupCoords[1]
      );
      setDistance(dist);
      setEta(calculateETA(dist));
    }
  }, [driverPosition, pickupCoords]);

  // Update map center preference: driver -> passenger -> pickup -> default
  const mapCenter = driverPosition 
    ? [driverPosition.lat, driverPosition.lng] as [number, number]
    : passengerLocation
      ? passengerLocation
      : (pickupCoords || defaultCenter);

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
                {driverPosition && driverPosition.updated_at && (
                  <div className="text-xs text-gray-500 mt-1">
                    آخر تحديث: {new Date(driverPosition.updated_at).toLocaleTimeString('ar-DZ')}
                  </div>
                )}
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

            {/* Warning if driver location not available */}
            {booking?.driver_id && !driverPosition && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ لا يمكن رؤية موقع السائق حالياً. قد يكون السائق غير متصل أو لم يفعّل GPS.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <MapContainer
            center={mapCenter}
            zoom={13}
            className="w-full h-[80vh] rounded-lg"
            key={`${driverPosition?.lat || 0}-${driverPosition?.lng || 0}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Driver Position */}
            {driverPosition && (
              <Marker position={[driverPosition.lat, driverPosition.lng]} icon={driverIcon}>
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold">Driver Location</h3>
                    <p className="text-sm">{booking?.driver_name}</p>
                    <p className="text-sm">
                      {driverPosition.lat.toFixed(6)}, {driverPosition.lng.toFixed(6)}
                    </p>
                    {driverPosition.speed && (
                      <p className="text-sm">
                        Speed: {(driverPosition.speed * 3.6).toFixed(1)} km/h
                      </p>
                    )}
                    {driverPosition.updated_at && (
                      <p className="text-xs text-gray-500">
                        Updated: {new Date(driverPosition.updated_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Passenger (You are here) */}
            {passengerLocation && (
              <Marker position={passengerLocation} icon={passengerIcon}>
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold">Your Location</h3>
                    <p className="text-sm">
                      {passengerLocation[0].toFixed(6)}, {passengerLocation[1].toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Pickup Location */}
            {pickupCoords && (
              <Marker position={pickupCoords} icon={pickupIcon}>
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold">Pickup Location</h3>
                    <p className="text-sm">Your pickup point</p>
                    {booking?.pickup_time && (
                      <p className="text-sm">
                        Time: {new Date(booking.pickup_time).toLocaleString()}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Destination Location */}
            {destinationCoords && (
              <Marker position={destinationCoords} icon={destinationIcon}>
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold">Destination</h3>
                    <p className="text-sm">Your destination</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Route Line */}
            {driverPosition && pickupCoords && (
              <Polyline
                positions={[
                  [driverPosition.lat, driverPosition.lng],
                  pickupCoords,
                ]}
                color="#3b82f6"
                weight={4}
                opacity={0.8}
              />
            )}

            {/* Trip Route */}
            {pickupCoords && destinationCoords && (
              <Polyline
                positions={[pickupCoords, destinationCoords]}
                color="#10b981"
                weight={3}
                opacity={0.6}
                dashArray="10, 10"
              />
            )}

            {/* Auto-center map when driver moves */}
            <MapUpdater center={mapCenter} />
          </MapContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Component to update map center
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}
