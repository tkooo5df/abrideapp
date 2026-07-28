import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, Users, Clock } from "lucide-react";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons
const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const passengerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
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

export default function DriverMap() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [position, setPosition] = useState<DriverPosition | null>(null);
  const [passengers, setPassengers] = useState<PassengerBooking[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<PassengerBooking | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('loading');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Default center for Algeria
  const defaultCenter: [number, number] = [36.7538, 3.0588]; // Algiers, Algeria

  // Start GPS tracking
  const startTracking = () => {
    if (!user?.id) {
      return;
    }
    setIsTracking(true);
    setPermissionError(null);
    
    // First get immediate position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const initialCoords: DriverPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading || undefined,
          speed: pos.coords.speed || undefined,
          accuracy: pos.coords.accuracy || undefined,
        };
        setPosition(initialCoords);
        
        // Show accuracy feedback
        const accuracyMeters = Math.round(pos.coords.accuracy || 0);
        if (accuracyMeters < 20) {
          toast({ title: "✅ GPS ممتاز", description: `الدقة: ${accuracyMeters}م` });
        } else if (accuracyMeters < 50) {
          toast({ title: "✅ GPS جيد", description: `الدقة: ${accuracyMeters}م` });
        } else {
          toast({ 
            title: "⚠️ دقة GPS منخفضة", 
            description: `الدقة: ${accuracyMeters}م - اخرج للمكان المفتوح`,
            variant: "default"
          });
        }
      },
      (error) => {
        toast({
          title: "خطأ في GPS",
          description: "تأكد من تفعيل GPS والسماح بالموقع",
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
    
    // Watch GPS position with high accuracy settings
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracyMeters = Math.round(pos.coords.accuracy || 0);
        const coords: DriverPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading || undefined,
          speed: pos.coords.speed || undefined,
          accuracy: pos.coords.accuracy || undefined,
        };
        setPosition(coords);
        
        // Warn if accuracy is poor
        if (pos.coords.accuracy && pos.coords.accuracy > 100) {
        } else if (pos.coords.accuracy && pos.coords.accuracy < 20) {
        }
      },
      (error) => {
        let errorMessage = "خطأ في GPS";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "تم رفض الوصول إلى GPS - اذهب لإعدادات المتصفح";
            setLocationPermission('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "GPS غير متاح - تأكد من تفعيله على جهازك";
            break;
          case error.TIMEOUT:
            errorMessage = "انتهت مهلة GPS - تأكد من الخروج للمكان المفتوح";
            break;
        }
        
        toast({
          title: "خطأ GPS",
          description: errorMessage,
          variant: "destructive"
        });
        setPermissionError(errorMessage);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,  // ⭐ استخدام GPS الحقيقي (مهم جداً!)
        timeout: 30000,             // 30 ثانية مهلة
        maximumAge: 0,              // دائماً موقع جديد (لا تستخدم موقع مخزن)
      }
    );

    // Update location in database every 5 seconds
    updateIntervalRef.current = setInterval(async () => {
      if (position && user?.id) {
        try {
          await supabase
            .from("driver_locations")
            .upsert({
              driver_id: user.id,
              lat: position.lat,
              lng: position.lng,
              heading: position.heading,
              speed: position.speed,
              accuracy: position.accuracy,
            });
        } catch (error) {
        }
      }
    }, 5000);
  };

  // Stop GPS tracking
  const stopTracking = () => {
    setIsTracking(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  };

  // Request location permission automatically on mount
  useEffect(() => {
    if (!user?.id) return;

    const requestLocationPermission = async () => {
      try {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
          setLocationPermission('denied');
          setPermissionError('متصفحك لا يدعم خاصية تحديد الموقع');
          return;
        }

        // Check current permission state
        if ('permissions' in navigator) {
          try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            setLocationPermission(result.state);

            if (result.state === 'granted') {
              // Automatically start tracking if already granted
              setTimeout(() => startTracking(), 100);
            } else if (result.state === 'prompt') {
              // Request permission
              requestLocation();
            } else {
              setPermissionError('يجب السماح بالوصول إلى موقعك لاستخدام خريطة السائق');
            }

            // Listen for permission changes
            result.addEventListener('change', () => {
              setLocationPermission(result.state);
              if (result.state === 'granted') {
                setTimeout(() => startTracking(), 100);
              } else {
                stopTracking();
              }
            });
          } catch (permError) {
            requestLocation();
          }
        } else {
          // Fallback for browsers without permissions API
          requestLocation();
        }
      } catch (error) {
        setLocationPermission('prompt');
        requestLocation();
      }
    };

    requestLocationPermission();
  }, [user?.id]);

  // Helper function to request location
  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationPermission('granted');
        setPermissionError(null);
        startTracking();
      },
      (error) => {
        setLocationPermission('denied');
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionError('تم رفض الوصول إلى الموقع. يجب السماح بالموقع للمتابعة.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setPermissionError('الموقع غير متاح حالياً. تأكد من تفعيل GPS.');
        } else if (error.code === error.TIMEOUT) {
          setPermissionError('انتهت مهلة طلب الموقع. يرجى المحاولة مرة أخرى.');
        } else {
          setPermissionError('حدث خطأ في الحصول على الموقع.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

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
  }, []);

  // Parse location string to coordinates
  const parseLocation = (locationStr: string): [number, number] | null => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(locationStr);
      if (parsed.lat && parsed.lng) {
        return [parsed.lat, parsed.lng];
      }
    } catch {
      // If not JSON, try to extract coordinates from string
      const coords = locationStr.match(/-?\d+\.?\d*/g);
      if (coords && coords.length >= 2) {
        return [parseFloat(coords[0]), parseFloat(coords[1])];
      }
    }
    return null;
  };

  // Show permission request screen if location is denied or not granted
  if (locationPermission === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-md p-8 text-center" dir="rtl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <CardTitle className="mb-2">جاري التحقق من الموقع...</CardTitle>
          <p className="text-muted-foreground">الرجاء الانتظار</p>
        </Card>
      </div>
    );
  }

  if (locationPermission === 'denied') {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <Card className="max-w-md p-8 text-center" dir="rtl">
          <div className="mb-6">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="mb-4 text-xl">
              ⚠️ الوصول إلى الموقع مطلوب
            </CardTitle>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {permissionError || 'يجب السماح بالوصول إلى موقعك الجغرافي لاستخدام خريطة السائق. هذا ضروري لتتبع موقعك وعرض الحجوزات القريبة منك.'}
            </p>
          </div>
          
          <div className="space-y-3 bg-blue-50 p-4 rounded-lg mb-6 text-right">
            <p className="font-semibold text-blue-900 mb-2">📍 كيفية تفعيل الموقع:</p>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>اضغط على أيقونة القفل 🔒 في شريط العنوان</li>
              <li>ابحث عن "الموقع" أو "Location"</li>
              <li>اختر "السماح" أو "Allow"</li>
              <li>أعد تحميل الصفحة</li>
            </ol>
          </div>

          <Button 
            onClick={requestLocation}
            className="w-full"
            size="lg"
          >
            <Navigation className="h-5 w-5 ml-2" />
            طلب الوصول إلى الموقع
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            🔒 موقعك آمن ولن يتم مشاركته إلا مع الركاب الذين حجزوا معك
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" dir="rtl">
            <Navigation className="h-5 w-5" />
            لوحة تحكم خريطة السائق
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" dir="rtl">
          {/* GPS Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Badge 
                variant={isTracking ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                <Navigation className="h-3 w-3" />
                {isTracking ? "🟢 التتبع نشط" : "⚪ التتبع متوقف"}
              </Badge>
              
              {position && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                </Badge>
              )}
            </div>

            <Button
              onClick={isTracking ? stopTracking : startTracking}
              variant={isTracking ? "destructive" : "default"}
              size="sm"
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              {isTracking ? "إيقاف التتبع" : "بدء التتبع"}
            </Button>
          </div>
          
          {/* Info message when tracking is stopped */}
          {!isTracking && locationPermission === 'granted' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 font-medium mb-1">
                ℹ️ التتبع متوقف
              </p>
              <p className="text-xs text-blue-700">
                اضغط على زر "بدء التتبع" أعلاه لبدء مشاركة موقعك الحقيقي مع الركاب
              </p>
            </div>
          )}

          {/* Location accuracy info */}
          {position?.accuracy && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>دقة الموقع:</span>
                <Badge 
                  variant={position.accuracy > 100 ? "destructive" : position.accuracy > 50 ? "secondary" : "default"}
                  className={position.accuracy <= 50 ? "bg-green-600" : ""}
                >
                  ±{position.accuracy.toFixed(0)} متر
                </Badge>
              </div>
              
              {/* Warning for poor accuracy */}
              {position.accuracy > 100 && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <p className="text-yellow-900 font-medium mb-1">⚠️ دقة GPS منخفضة</p>
                  <p className="text-yellow-700">
                    • تأكد من تفعيل GPS على جهازك<br/>
                    • اخرج إلى مكان مفتوح بعيداً عن المباني<br/>
                    • انتظر قليلاً حتى يتحسن الإشارة
                  </p>
                </div>
              )}
              
              {position.accuracy > 50 && position.accuracy <= 100 && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                  <p className="text-blue-700">
                    💡 دقة متوسطة. للحصول على دقة أفضل، اخرج إلى مكان مفتوح
                  </p>
                </div>
              )}
              
              {position.accuracy <= 50 && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                  <p className="text-green-700">
                    ✅ دقة ممتازة - موقعك محدد بدقة عالية
                  </p>
                </div>
              )}
            </div>
          )}

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
                    onClick={() => setSelectedPassenger(passenger)}
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
          <MapContainer
            center={defaultCenter}
            zoom={13}
            className="w-full h-[80vh] rounded-lg"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Map Controller - Updates center and zoom when position changes */}
            {position && <MapController position={position} />}
            
            {/* Driver Position */}
            {position && (
              <Marker position={[position.lat, position.lng]} icon={driverIcon}>
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold">Your Location</h3>
                    <p className="text-sm">
                      {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                    </p>
                    {position.speed && (
                      <p className="text-sm">Speed: {(position.speed * 3.6).toFixed(1)} km/h</p>
                    )}
                    {position.accuracy && (
                      <p className="text-sm">Accuracy: ±{position.accuracy.toFixed(0)}m</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Passenger Pickup Points */}
            {passengers.map((passenger) => {
              const coords = parseLocation(passenger.pickup_location);
              if (!coords) return null;

              return (
                <Marker
                  key={passenger.id}
                  position={coords}
                  icon={passengerIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <h3 className="font-semibold">Passenger Pickup</h3>
                      <p className="text-sm">Booking #{passenger.id}</p>
                      <p className="text-sm">{passenger.seats_booked} seat{passenger.seats_booked > 1 ? 's' : ''}</p>
                      <p className="text-sm font-semibold text-green-600">
                        {passenger.total_amount} DZD
                      </p>
                      {passenger.notes && (
                        <p className="text-sm text-gray-600 mt-1">{passenger.notes}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Routing Control */}
            {position && selectedPassenger && (
              <RoutingControl
                driverPosition={position}
                passengerLocation={selectedPassenger.pickup_location}
              />
            )}
          </MapContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Routing Control Component
function RoutingControl({
  driverPosition,
  passengerLocation,
}: {
  driverPosition: DriverPosition;
  passengerLocation: string;
}) {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    const passengerCoords = parseLocationForRouting(passengerLocation);
    if (!passengerCoords) return;

    // Remove existing routing control
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    // Create new routing control
    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(driverPosition.lat, driverPosition.lng),
        L.latLng(passengerCoords.lat, passengerCoords.lng),
      ],
      routeWhileDragging: false,
      show: true,
      addWaypoints: false,
      draggableWaypoints: false,
      createMarker: () => null, // Don't create additional markers
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 4, opacity: 0.8 }],
      },
    }).addTo(map);

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [driverPosition, passengerLocation, map]);

  return null;
}

// Map Controller Component - Updates map center when driver position changes
function MapController({ position }: { position: DriverPosition }) {
  const map = useMap();

  useEffect(() => {
    if (position && map) {
      // Update map center to driver position
      map.setView([position.lat, position.lng], 15, { animate: true });
    }
  }, [position, map]);

  return null;
}

// Helper function to parse location for routing
function parseLocationForRouting(locationStr: string): { lat: number; lng: number } | null {
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
}
