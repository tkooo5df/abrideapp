import React, { useEffect, useState, useCallback } from "react";
import MapboxMap from "@/components/map/MapboxMap";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Users, Clock } from "lucide-react";
import { MAPBOX_CONFIG, MARKER_ICONS, GHARDAIA_CENTER } from "@/config/mapbox";
import { locationTrackingService } from "@/services/locationTracking";
import { toast } from "@/hooks/use-toast";

interface DriverPosition {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

interface PassengerBooking {
  id: number;
  pickup_location: string;
  destination_location: string;
  passenger_id: string;
  created_at: string;
  seats_booked: number;
  total_amount: number;
  notes?: string;
  pickup_time?: string;
}

export default function DriverMapMapbox() {
  const { user } = useAuth();
  const [position, setPosition] = useState<DriverPosition | null>(null);
  const [passengers, setPassengers] = useState<PassengerBooking[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<PassengerBooking | null>(null);
  const [mapCenter, setMapCenter] = useState(GHARDAIA_CENTER);
  const [mapZoom, setMapZoom] = useState(12);

  // Request location permissions on component mount
  useEffect(() => {
    if (user?.id) {
      // Automatically request location permissions when driver accesses the map
      const requestLocation = async () => {
        try {
          // Show a toast to inform user that location is being requested
          toast({
            title: "طلب الموقع",
            description: "جاري طلب إذن الوصول إلى موقعك...",
          });
          
          // Start tracking automatically
          startTracking();
        } catch (error) {
        }
      };
      
      requestLocation();
    }
  }, [user?.id]);

  // Start GPS tracking
  const startTracking = useCallback(() => {
    if (!user?.id) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لبدء التتبع",
        variant: "destructive",
      });
      return;
    }

    setIsTracking(true);
    locationTrackingService.startTracking(
      user.id,
      (location) => {
        const coords: DriverPosition = {
          lat: location.latitude,
          lng: location.longitude,
          heading: location.heading || undefined,
          speed: location.speed || undefined,
          accuracy: location.accuracy || undefined,
        };
        setPosition(coords);
        setMapCenter({ lat: coords.lat, lng: coords.lng });
      }
    ).then((success) => {
      if (!success) {
        toast({
          title: "خطأ في التتبع",
          description: "فشل في بدء تتبع الموقع. يرجى التحقق من إعدادات المتصفح.",
          variant: "destructive",
        });
        setIsTracking(false);
      } else {
        toast({
          title: "تم التتبع",
          description: "بدأ تتبع موقعك بنجاح",
        });
      }
    }).catch((error) => {
      toast({
        title: "خطأ في التتبع",
        description: "فشل في بدء تتبع الموقع. يرجى التحقق من إعدادات المتصفح.",
        variant: "destructive",
      });
      setIsTracking(false);
    });
  }, [user?.id]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    locationTrackingService.stopTracking();
    setIsTracking(false);
  }, []);

  // Fetch nearby pending passengers
  useEffect(() => {
    const fetchPassengers = async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            pickup_location,
            destination_location,
            passenger_id,
            created_at,
            seats_booked,
            total_amount,
            notes,
            pickup_time
          `)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPassengers(data || []);
      } catch (error) {
      }
    };

    fetchPassengers();
    
    // Refresh passengers every 30 seconds
    const interval = setInterval(fetchPassengers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // Parse location string to coordinates
  const parseLocation = (locationStr: string): { lat: number; lng: number } | null => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(locationStr);
      if (parsed.lat && parsed.lng) {
        return { lat: parsed.lat, lng: parsed.lng };
      }
    } catch {
      // If not JSON, try to extract coordinates from string
      const coords = locationStr.match(/-?\d+\.?\d*/g);
      if (coords && coords.length >= 2) {
        return { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) };
      }
    }
    return null;
  };

  // Prepare markers for MapboxMap component
  const mapMarkers = [];
  
  // Add driver position marker
  if (position) {
    mapMarkers.push({
      id: 'driver',
      position: { lat: position.lat, lng: position.lng },
      icon: 'driver' as keyof typeof MARKER_ICONS,
      title: 'Your Location',
      onClick: () => {},
      popupContent: `
        <div class="p-2 text-center">
          <h3 class="font-semibold">Your Location</h3>
          <p class="text-sm">${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}</p>
          ${position.speed ? `<p class="text-sm">Speed: ${(position.speed * 3.6).toFixed(1)} km/h</p>` : ''}
          ${position.accuracy ? `<p class="text-sm">Accuracy: ±${position.accuracy.toFixed(0)}m</p>` : ''}
        </div>
      `
    });
  }

  // Add passenger pickup points
  passengers.forEach(passenger => {
    const coords = parseLocation(passenger.pickup_location);
    if (!coords) return;

    mapMarkers.push({
      id: `passenger-${passenger.id}`,
      position: coords,
      icon: 'passenger' as keyof typeof MARKER_ICONS,
      title: `Passenger Pickup #${passenger.id}`,
      onClick: () => setSelectedPassenger(passenger),
      popupContent: `
        <div class="p-2 text-center">
          <h3 class="font-semibold">Passenger Pickup</h3>
          <p class="text-sm">Booking #${passenger.id}</p>
          <p class="text-sm">${passenger.seats_booked} seat${passenger.seats_booked > 1 ? 's' : ''}</p>
          <p class="text-sm font-semibold text-green-600">${passenger.total_amount} DZD</p>
          ${passenger.notes ? `<p class="text-sm text-gray-600 mt-1">${passenger.notes}</p>` : ''}
        </div>
      `
    });
  });

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Driver Map Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={isTracking ? stopTracking : startTracking}
              variant={isTracking ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              {isTracking ? "Stop Tracking" : "Start Tracking"}
            </Button>
            
            {position && (
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
              </Badge>
            )}
          </div>

          {/* Passengers List */}
          {passengers.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pending Pickups ({passengers.length})
              </h3>
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {passengers.map((passenger) => (
                  <div
                    key={passenger.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPassenger?.id === passenger.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      setSelectedPassenger(passenger);
                      const coords = parseLocation(passenger.pickup_location);
                      if (coords) {
                        setMapCenter(coords);
                        setMapZoom(15);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Booking #{passenger.id}</p>
                        <p className="text-sm text-gray-600">
                          {passenger.seats_booked} seat{passenger.seats_booked > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm font-semibold text-green-600">
                          {passenger.total_amount} DZD
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(passenger.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    {passenger.notes && (
                      <p className="text-sm text-gray-600 mt-1">{passenger.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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