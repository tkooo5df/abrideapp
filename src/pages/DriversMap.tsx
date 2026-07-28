import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MapboxMap from '@/components/map/MapboxMap';
import { MAPBOX_CONFIG, MARKER_ICONS, GHARDAIA_CENTER } from '@/config/mapbox';
import { locationTrackingService } from '@/services/locationTracking';
import { useDatabase } from '@/hooks/useDatabase';
import { geocodingService } from '@/services/geocoding';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Filter, MapPin, Star, Car, Navigation } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TrackingButton } from '@/components/tracking/TrackingButton';

interface DriverMarker {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  rating: number;
  totalTrips: number;
  vehicleType: string;
  isAvailable: boolean;
  currentTrip?: {
    from: string;
    to: string;
    availableSeats: number;
  };
}

const DriversMap = () => {
  const navigate = useNavigate();
  const { getAllDrivers, getActiveBookingsForMap } = useDatabase();
  const { user } = useAuth();
  
  const [drivers, setDrivers] = useState<DriverMarker[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverMarker | null>(null);
  const [routes, setRoutes] = useState<Array<{ id: string; coordinates: Array<[number, number]>; color?: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [mapCenter, setMapCenter] = useState(GHARDAIA_CENTER);
  const [mapZoom, setMapZoom] = useState(12);
  const [isTracking, setIsTracking] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currentUserAccuracy, setCurrentUserAccuracy] = useState<number | null>(null);
  const [currentUserUpdatedAt, setCurrentUserUpdatedAt] = useState<number | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Request location permissions on component mount - only for drivers
  useEffect(() => {
    // Only request location if user is a driver
    if (!user?.id) return;
    
    const requestLocation = async () => {
      try {
        // First, load last saved location from database
        const lastSavedLocation = await locationTrackingService.getLastKnownLocation(user.id, 'driver');
        if (lastSavedLocation) {
          setCurrentUserLocation(lastSavedLocation);
          setMapCenter(lastSavedLocation);
          setMapZoom(15);
          
          // Also fetch last saved timestamp
          try {
            const { data } = await supabase
              .from('driver_locations')
              .select('updated_at')
              .eq('driver_id', user.id)
              .single();
            if (data?.updated_at) {
              setLastSavedAt(data.updated_at);
            }
          } catch (e) {
          }
        }
        
        // Get current location to center the map and save it
        const location = await locationTrackingService.getCurrentLocation();
        if (location) {
          const userLocation = {
            lat: location.latitude,
            lng: location.longitude
          };
          
          setCurrentUserLocation(userLocation);
          setMapCenter(userLocation);
          setMapZoom(15);
          
          // Save location to database if user is a driver
          await locationTrackingService.updateLocation(user.id, userLocation, 'driver');
          setLastSavedAt(new Date().toISOString());
          
          // Start continuous tracking every 2 seconds
          await locationTrackingService.startTracking(
            user.id,
            async (loc) => {
              const newLocation = { lat: loc.latitude, lng: loc.longitude };
              setCurrentUserLocation(newLocation);
              setCurrentUserAccuracy(loc.accuracy ?? null);
              setCurrentUserUpdatedAt(Date.now());
              // Save immediately to database
              await locationTrackingService.updateLocation(user.id, newLocation, 'driver');
              setLastSavedAt(new Date().toISOString());
            },
            'driver',
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 },
            { frequencyMs: 2000, accuracyThresholdMeters: 30, minDistanceMeters: 5, maxStaleMs: 10000, smoothing: true }
          );
          
          // Reload drivers to show updated location
          loadDrivers();
        } else if (lastSavedLocation) {
          // If GPS not available but we have saved location, use it
          loadDrivers();
        }
      } catch (error) {
        // Try to load last saved location even if GPS fails
        if (user?.id) {
          const lastSavedLocation = await locationTrackingService.getLastKnownLocation(user.id, 'driver');
          if (lastSavedLocation) {
            setCurrentUserLocation(lastSavedLocation);
            setMapCenter(lastSavedLocation);
            setMapZoom(15);
            loadDrivers();
          }
        }
      }
    };
    
    requestLocation();
    return () => {
      locationTrackingService.stopTracking();
    };
  }, [user?.id]);

  // Recenter map when my live location updates
  useEffect(() => {
    if (currentUserLocation) {
      setMapCenter(currentUserLocation);
      setMapZoom(15);
    }
  }, [currentUserLocation]);

  // Load drivers
  useEffect(() => {
    loadDrivers();
    loadActiveBookingsRoutes();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDrivers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Ensure current user marker appears when GPS becomes available
  const hasLoadedWithGPS = useRef(false);
  useEffect(() => {
    if (currentUserLocation && !hasLoadedWithGPS.current) {
      hasLoadedWithGPS.current = true;
      loadDrivers();
    }
  }, [currentUserLocation]);

  const loadDrivers = async () => {
    try {
      const allDrivers = await getAllDrivers();
      // Fallback to mock data if no drivers available
      const sourceDrivers = (allDrivers && allDrivers.length > 0)
        ? allDrivers
        : [
            { id: 'demo-1', fullName: 'Driver One', email: 'driver1@example.com', rating: 4.7, totalTrips: 120, vehicleType: 'Toyota Camry', isAvailable: true },
            { id: 'demo-2', fullName: 'Driver Two', email: 'driver2@example.com', rating: 4.5, totalTrips: 85, vehicleType: 'Hyundai Elantra', isAvailable: true },
            { id: 'demo-3', fullName: 'Driver Three', email: 'driver3@example.com', rating: 4.9, totalTrips: 200, vehicleType: 'Kia Sorento', isAvailable: false },
          ];
      
      // Transform drivers data to markers
      const driverMarkers: (DriverMarker | null)[] = await Promise.all(
        sourceDrivers.map(async (driver: any) => {
          // For current user, ALWAYS use live GPS location, never fallback
          if (driver.id === user?.id) {
            if (!currentUserLocation) {
              // Skip current user marker until GPS is ready
              return null;
            }
            return {
              id: driver.id,
              name: driver.fullName || driver.full_name || driver.email || 'سائق',
              location: currentUserLocation,
              rating: driver.rating || 4.5,
              totalTrips: driver.totalTrips || driver.total_trips || 0,
              vehicleType: driver.vehicleType || driver.vehicle_type || 'سيارة',
              isAvailable: driver.isAvailable !== false,
              currentTrip: driver.currentTrip,
            };
          }

          // For other drivers, get last known location or use random location near Ghardaia for demo
          let location = await locationTrackingService.getLastKnownLocation(driver.id, 'driver');
          
          if (!location) {
            // Generate random location near Ghardaia for demo
            location = {
              lat: GHARDAIA_CENTER.lat + (Math.random() - 0.5) * 0.1,
              lng: GHARDAIA_CENTER.lng + (Math.random() - 0.5) * 0.1,
            };
          }

          const marker: DriverMarker = {
            id: driver.id,
            name: driver.fullName || driver.full_name || driver.email || 'سائق',
            location,
            rating: driver.rating || 4.5,
            totalTrips: driver.totalTrips || driver.total_trips || 0,
            vehicleType: driver.vehicleType || driver.vehicle_type || 'سيارة',
            isAvailable: driver.isAvailable !== false,
            currentTrip: driver.currentTrip,
          };
          return marker;
        })
      );

      // Filter out null markers (current user without GPS yet)
      const validMarkers = driverMarkers.filter((m): m is DriverMarker => m !== null);
      
      // If current user has GPS location but wasn't in drivers list, add them
      if (user?.id && currentUserLocation && !validMarkers.some(d => d.id === user.id)) {
        // Try to get user profile from auth
        const currentUserMarker: DriverMarker = {
          id: user.id,
          name: user.email || user.full_name || 'أنت',
          location: currentUserLocation,
          rating: 5.0,
          totalTrips: 0,
          vehicleType: 'سيارة',
          isAvailable: true,
        };
        validMarkers.push(currentUserMarker);
      }
      
      setDrivers(validMarkers);
    } catch (error) {
    }
  };

  const loadActiveBookingsRoutes = async () => {
    try {
      const bookings = await getActiveBookingsForMap();
      const routeResults: Array<{ id: string; coordinates: Array<[number, number]>; color?: string }> = [];

      for (const b of bookings) {
        const pickup = b.pickup_point || b.pickupLocation || b.pickup;
        const destination = b.destination_point || b.destinationLocation || b.destination;
        if (!pickup || !destination) continue;

        const [g1, g2] = await Promise.all([
          geocodingService.forward(String(pickup), { country: 'DZ', language: 'en' }),
          geocodingService.forward(String(destination), { country: 'DZ', language: 'en' }),
        ]);

        if (g1 && g2) {
          routeResults.push({
            id: b.id?.toString() || Math.random().toString(36).slice(2),
            coordinates: [
              [g1.coordinates.lng, g1.coordinates.lat],
              [g2.coordinates.lng, g2.coordinates.lat],
            ],
            color: b.status === 'in_progress' ? '#10b981' : '#3b82f6',
          });
        }
      }

      setRoutes(routeResults);
    } catch (error) {
    }
  };

  // Filter drivers
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = !showAvailableOnly || driver.isAvailable;
    return matchesSearch && matchesAvailability;
  });

  // Handle marker click
  const handleMarkerClick = (driver: DriverMarker) => {
    setSelectedDriver(driver);
    setMapCenter(driver.location);
    setMapZoom(15);
  };

  // Handle driver card click
  const handleDriverCardClick = (driver: DriverMarker) => {
    setMapCenter(driver.location);
    setMapZoom(15);
    setSelectedDriver(driver);
  };

  // Prepare markers for MapboxMap component
  const mapMarkers = [];
  
  // Always add current user marker first with live GPS location
  if (user?.id && currentUserLocation) {
    // Find current user info from drivers list if available
    const currentUserDriver = drivers.find(d => d.id === user.id);
    mapMarkers.push({
      id: user.id,
      position: currentUserLocation,
      icon: 'driver' as keyof typeof MARKER_ICONS,
      title: currentUserDriver?.name || user.email || 'أنت',
      onClick: () => handleMarkerClick(currentUserDriver || {
        id: user.id,
        name: user.email || 'أنت',
        location: currentUserLocation,
        rating: 5.0,
        totalTrips: 0,
        vehicleType: 'سيارة',
        isAvailable: true,
      }),
      popupContent: `
        <div class="p-3 min-w-[200px]" dir="rtl">
          <h3 class="font-bold text-lg mb-2">
            🟢 أنت - ${currentUserDriver?.name || user.email || 'أنت'}
          </h3>
          <div class="flex items-center gap-1 mb-2">
            <Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span class="text-sm">${(currentUserDriver?.rating || 5.0).toFixed(1)}</span>
          </div>
          <div class="text-sm text-gray-600 mb-2">
            ${currentUserDriver?.vehicleType || 'سيارة'}
          </div>
          <div class="mt-2 p-2 bg-green-50 rounded text-sm">
            <div class="text-green-700 font-medium">
              📍 موقعك الحالي (GPS مباشر)
            </div>
            <div class="text-xs text-gray-600 mt-1">
              ${currentUserLocation.lat.toFixed(6)}, ${currentUserLocation.lng.toFixed(6)}
            </div>
            ${currentUserAccuracy !== null ? `
              <div class="text-xs text-gray-600 mt-1">
                الدقة: ${Math.round(currentUserAccuracy)}م
              </div>
            ` : ''}
          </div>
        </div>
      `
    });
  }
  
  // Add other drivers (excluding current user to avoid duplicates)
  filteredDrivers.filter(driver => driver.id !== user?.id).forEach(driver => {
    mapMarkers.push({
      id: driver.id,
      position: driver.location,
      icon: 'driver' as keyof typeof MARKER_ICONS, // All drivers use orange/yellow color
      title: driver.name,
      onClick: () => handleMarkerClick(driver),
      popupContent: `
        <div class="p-3 min-w-[200px]" dir="rtl">
          <h3 class="font-bold text-lg mb-2">
            ${driver.name}
          </h3>
          <div class="flex items-center gap-1 mb-2">
            <Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span class="text-sm">${driver.rating.toFixed(1)} (${driver.totalTrips} رحلة)</span>
          </div>
          <div class="text-sm text-gray-600 mb-2">
            ${driver.vehicleType}
          </div>
          <Badge variant=${driver.isAvailable ? '"default"' : '"secondary"'}>
            ${driver.isAvailable ? '🟢 متاح' : '🔴 مشغول'}
          </Badge>
          ${driver.currentTrip ? `
            <div class="mt-2 p-2 bg-blue-50 rounded text-sm">
              <div class="flex items-center gap-1 text-blue-700 mb-1">
                <MapPin class="h-3 w-3" />
                <span class="font-medium">رحلة حالية</span>
              </div>
              <div class="text-xs text-gray-600">
                ${driver.currentTrip.from} ← ${driver.currentTrip.to}
              </div>
              <div class="text-xs text-gray-600 mt-1">
                ${driver.currentTrip.availableSeats} مقعد متاح
              </div>
            </div>
          ` : ''}
        </div>
      `
    });
  });

  // Check if current user is a driver without location
  const currentUserIsDriver = user?.id && filteredDrivers.some(d => d.id === user.id);
  const currentUserHasLocation = currentUserLocation !== null;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          {/* Driver Location Notice */}
          {currentUserIsDriver && !currentUserHasLocation && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Navigation className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 mb-1">
                    🟢 أنت سائق مسجل - قم بتفعيل موقعك للظهور على الخريطة
                  </p>
                  <p className="text-xs text-green-700 mb-2">
                    اذهب إلى "خريطتي" لتفعيل تتبع GPS وحفظ موقعك الحقيقي
                  </p>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-xs"
                    onClick={() => navigate('/driver-map')}
                  >
                    <Navigation className="h-3 w-3 ml-1" />
                    فتح خريطتي
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              رجوع
            </Button>
            
            <h1 className="text-xl font-bold">🗺️ خريطة السائقين</h1>
            
            <Badge variant="secondary" className="gap-2">
              <Car className="h-4 w-4" />
              {filteredDrivers.length} سائق
            </Badge>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="ابحث عن سائق..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button
              variant={showAvailableOnly ? 'default' : 'outline'}
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              المتاحون فقط
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Live debug info for current driver */}
        {user?.id && currentUserLocation && (
          <div className="mb-3 p-2 rounded border text-xs inline-flex items-center gap-3 bg-white/80">
            <div>🟢 موقعك: {currentUserLocation.lat.toFixed(6)}, {currentUserLocation.lng.toFixed(6)}</div>
            {currentUserAccuracy !== null && (
              <div>الدقة ≈ {Math.round(currentUserAccuracy)}م</div>
            )}
            {currentUserUpdatedAt && (
              <div>آخر تحديث GPS: {new Date(currentUserUpdatedAt).toLocaleTimeString()}</div>
            )}
            {lastSavedAt && (
              <div className="text-green-600 font-medium">💾 آخر حفظ: {new Date(lastSavedAt).toLocaleString('ar-DZ')}</div>
            )}
          </div>
        )}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Drivers List */}
          <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {filteredDrivers.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">
                لا يوجد سائقون متاحون حالياً
              </Card>
            ) : (
              filteredDrivers.map((driver) => {
                const isCurrentUser = driver.id === user?.id;
                return (
                  <Card
                    key={driver.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedDriver?.id === driver.id ? 'ring-2 ring-primary' : ''
                    } ${isCurrentUser ? 'border-2 border-green-500 bg-green-50' : ''}`}
                    onClick={() => handleDriverCardClick(driver)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white text-lg ${
                        isCurrentUser 
                          ? 'bg-gradient-to-br from-green-500 to-green-600' 
                          : 'bg-gradient-to-br from-primary to-primary/70'
                      }`}>
                        {isCurrentUser ? '🟢' : '🚗'}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-bold">
                            {isCurrentUser && '🟢 '}{driver.name}
                            {isCurrentUser && <span className="text-xs font-normal text-green-700"> (أنت)</span>}
                          </h3>
                          {driver.isAvailable ? (
                            <Badge variant="default" className="bg-green-500">
                              متاح
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              مشغول
                            </Badge>
                          )}
                        </div>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{driver.rating.toFixed(1)}</span>
                        <span className="text-gray-400">•</span>
                        <span>{driver.totalTrips} رحلة</span>
                      </div>

                      <div className="text-sm text-gray-600">
                        {driver.vehicleType}
                      </div>

                      {driver.currentTrip && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <div className="flex items-center gap-1 text-blue-700 mb-1">
                            <MapPin className="h-3 w-3" />
                            <span className="font-medium">رحلة حالية</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {driver.currentTrip.from} ← {driver.currentTrip.to}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {driver.currentTrip.availableSeats} مقعد متاح
                          </div>
                          <div className="mt-2">
                            <TrackingButton bookingId={driver.currentTrip.bookingId} variant="outline" size="sm" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
                );
              })
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden h-[calc(100vh-150px)]">
              <MapboxMap
                center={mapCenter}
                zoom={mapZoom}
                markers={mapMarkers}
                routes={routes}
                showControls={true}
                className="w-full h-full"
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriversMap;