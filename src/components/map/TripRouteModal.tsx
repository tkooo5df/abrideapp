import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import MapboxMap from './MapboxMap';
import { geocodingService } from '@/services/geocoding';
import { MAPBOX_CONFIG } from '@/config/mapbox';
import { Loader2 } from 'lucide-react';

interface TripRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromWilaya: string;
  toWilaya: string;
  fromWilayaId?: number;
  toWilayaId?: number;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
}

// Wilaya coordinates (approximate center points)
const WILAYA_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
  '47': { lat: 32.4913, lng: 3.6745 }, // غرداية
  '16': { lat: 36.7538, lng: 3.0588 }, // الجزائر
  '31': { lat: 35.6971, lng: -0.6337 }, // وهران
  '25': { lat: 36.3570, lng: 6.6147 }, // قسنطينة
  '19': { lat: 36.1911, lng: 5.4137 }, // سطيف
  '23': { lat: 36.9000, lng: 7.7667 }, // عنابة
  '06': { lat: 36.7519, lng: 5.0844 }, // بجاية
  '15': { lat: 36.7139, lng: 4.0458 }, // تيزي وزو
  '09': { lat: 36.4736, lng: 2.8077 }, // البليدة
  '01': { lat: 27.8767, lng: -0.2833 }, // أدرار
  '02': { lat: 36.1654, lng: 1.3345 }, // الشلف
  '03': { lat: 33.8078, lng: 2.8833 }, // الأغواط
  '04': { lat: 35.8783, lng: 7.1167 }, // أم البواقي
  '05': { lat: 35.5558, lng: 6.1744 }, // باتنة
  '07': { lat: 34.8500, lng: 5.7333 }, // بسكرة
  '08': { lat: 31.6167, lng: -2.2167 }, // بشار
  '10': { lat: 36.3744, lng: 3.9000 }, // البويرة
  '11': { lat: 22.7850, lng: 5.5228 }, // تمنراست
  '12': { lat: 35.4042, lng: 8.1242 }, // تبسة
  '13': { lat: 34.8828, lng: -1.3150 }, // تلمسان
  '14': { lat: 35.3703, lng: 1.3150 }, // تيارت
  '17': { lat: 34.6714, lng: 3.2500 }, // الجلفة
  '18': { lat: 36.8206, lng: 5.7667 }, // جيجل
  '20': { lat: 34.8403, lng: 0.1450 }, // سعيدة
  '21': { lat: 36.8667, lng: 6.9000 }, // سكيكدة
  '22': { lat: 35.2081, lng: -0.6308 }, // سيدي بلعباس
  '24': { lat: 36.4622, lng: 7.4333 }, // قالمة
  '26': { lat: 36.2639, lng: 2.7531 }, // المدية
  '27': { lat: 35.9333, lng: 0.0833 }, // مستغانم
  '28': { lat: 35.7058, lng: 4.5419 }, // المسيلة
  '29': { lat: 35.3967, lng: 0.1403 }, // معسكر
  '30': { lat: 31.9497, lng: 5.3250 }, // ورقلة
  '32': { lat: 33.6831, lng: 1.0192 }, // البيض
  '33': { lat: 26.4833, lng: 8.4667 }, // إليزي
  '34': { lat: 36.0731, lng: 4.7581 }, // برج بوعريريج
  '35': { lat: 36.7583, lng: 3.4772 }, // بومرداس
  '36': { lat: 36.7672, lng: 8.3139 }, // الطارف
  '37': { lat: 27.6711, lng: -8.1475 }, // تندوف
  '38': { lat: 35.6072, lng: 1.8106 }, // تيسمسيلت
  '39': { lat: 33.3569, lng: 6.8631 }, // الوادي
  '40': { lat: 35.4350, lng: 7.1433 }, // خنشلة
  '41': { lat: 36.2833, lng: 7.9500 }, // سوق أهراس
  '42': { lat: 36.5944, lng: 2.4478 }, // تيبازة
  '43': { lat: 36.4500, lng: 6.2639 }, // ميلة
  '44': { lat: 36.2642, lng: 2.2167 }, // عين الدفلى
  '45': { lat: 33.2667, lng: -0.3167 }, // النعامة
  '46': { lat: 35.3050, lng: -1.1389 }, // عين تموشنت
  '48': { lat: 35.7372, lng: 0.5558 }, // غليزان
};

// Function to get route from Mapbox Directions API
const getRouteFromMapbox = async (
  from: { lat: number; lng: number }, 
  to: { lat: number; lng: number }
): Promise<{
  coordinates: Array<[number, number]> | null;
  distance?: number; // in meters
  duration?: number; // in seconds
} | null> => {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_CONFIG.accessToken}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        coordinates: route.geometry.coordinates as Array<[number, number]>,
        distance: route.distance, // in meters
        duration: route.duration, // in seconds
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

const TripRouteModal = ({ open, onOpenChange, fromWilaya, toWilaya, fromWilayaId, toWilayaId, fromLat, fromLng, toLat, toLng }: TripRouteModalProps) => {
  const [route, setRoute] = useState<{ id: string; coordinates: Array<[number, number]>; color?: string } | null>(null);
  const [markers, setMarkers] = useState<Array<{ id: string; position: { lat: number; lng: number }; icon?: keyof typeof import('@/config/mapbox').MARKER_ICONS; title?: string }>>([]);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 36.7538, lng: 3.0588 });
  const [zoom, setZoom] = useState(6);
  const [loading, setLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance?: number; duration?: number } | null>(null);

  useEffect(() => {
    if (!open) return;

    const loadRoute = async () => {
      setLoading(true);
      setRouteInfo(null);
      try {
        // Get coordinates for wilayas
        let fromCoords: { lat: number; lng: number } | null = null;
        let toCoords: { lat: number; lng: number } | null = null;

        // Use saved coordinates if available
        if (fromLat !== undefined && fromLng !== undefined) {
          fromCoords = { lat: fromLat, lng: fromLng };
        }
        
        if (toLat !== undefined && toLng !== undefined) {
          toCoords = { lat: toLat, lng: toLng };
        }

        // If coordinates not provided, try to get from wilaya ID
        if (!fromCoords && fromWilayaId !== undefined) {
          const fromKey = fromWilayaId.toString().padStart(2, '0');
          fromCoords = WILAYA_COORDINATES[fromKey];
        }
        
        if (!toCoords && toWilayaId !== undefined) {
          const toKey = toWilayaId.toString().padStart(2, '0');
          toCoords = WILAYA_COORDINATES[toKey];
        }

        // If not found by ID, try geocoding
        if (!fromCoords) {
          try {
            const geoResult = await geocodingService.forward(fromWilaya, { country: 'DZ' });
            if (geoResult) {
              fromCoords = { lat: geoResult.coordinates.lat, lng: geoResult.coordinates.lng };
            }
          } catch (e) {
          }
        }

        if (!toCoords) {
          try {
            const geoResult = await geocodingService.forward(toWilaya, { country: 'DZ' });
            if (geoResult) {
              toCoords = { lat: geoResult.coordinates.lat, lng: geoResult.coordinates.lng };
            }
          } catch (e) {
          }
        }

        // Fallback to default coordinates if geocoding fails
        if (!fromCoords) {
          fromCoords = { lat: 36.7538, lng: 3.0588 }; // Algiers default
        }
        if (!toCoords) {
          toCoords = { lat: 36.7538, lng: 3.0588 }; // Algiers default
        }

        // Set markers
        setMarkers([
          {
            id: 'from',
            position: fromCoords,
            icon: 'pickup',
            title: fromWilaya,
          },
          {
            id: 'to',
            position: toCoords,
            icon: 'destination',
            title: toWilaya,
          },
        ]);

        // Get actual route from Mapbox Directions API
        let routeCoordinates: Array<[number, number]> = [
          [fromCoords.lng, fromCoords.lat],
          [toCoords.lng, toCoords.lat],
        ];

        // Try to get real route from Mapbox
        const routeResult = await getRouteFromMapbox(fromCoords, toCoords);
        if (routeResult && routeResult.coordinates && routeResult.coordinates.length > 0) {
          routeCoordinates = routeResult.coordinates;
          // Save route info
          if (routeResult.distance || routeResult.duration) {
            setRouteInfo({
              distance: routeResult.distance,
              duration: routeResult.duration,
            });
          }
          
          // Calculate bounds from route coordinates for better view
          const lngs = routeResult.coordinates.map(coord => coord[0]);
          const lats = routeResult.coordinates.map(coord => coord[1]);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          setCenter({ lat: centerLat, lng: centerLng });
          
          // Adjust zoom based on route bounds
          const latDiff = maxLat - minLat;
          const lngDiff = maxLng - minLng;
          const maxDiff = Math.max(latDiff, lngDiff);
          if (maxDiff > 5) {
            setZoom(6);
          } else if (maxDiff > 2) {
            setZoom(8);
          } else if (maxDiff > 1) {
            setZoom(10);
          } else {
            setZoom(12);
          }
        } else {
          setRouteInfo(null);
          // Fallback to center between two points
          const centerLat = (fromCoords.lat + toCoords.lat) / 2;
          const centerLng = (fromCoords.lng + toCoords.lng) / 2;
          setCenter({ lat: centerLat, lng: centerLng });
          setZoom(6);
        }

        // Create route line - only update if coordinates changed
        const newRoute = {
          id: 'route-1',
          coordinates: routeCoordinates,
          color: '#3b82f6',
        };
        
        // Only update if coordinates actually changed
        setRoute(prevRoute => {
          if (prevRoute && 
              prevRoute.coordinates.length === routeCoordinates.length &&
              JSON.stringify(prevRoute.coordinates) === JSON.stringify(routeCoordinates)) {
            return prevRoute; // No change, return previous route
          }
          return newRoute;
        });
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    loadRoute();
  }, [open, fromWilaya, toWilaya, fromWilayaId, toWilayaId, fromLat, fromLng, toLat, toLng]);

  useEffect(() => {
  }, [open]);

  // Memoize routes array to prevent unnecessary re-renders
  const routesArray = useMemo(() => {
    return route ? [route] : [];
  }, [route]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-2 flex-shrink-0">
          <DialogTitle className="text-xl font-bold">
            مسار الرحلة: {fromWilaya} → {toWilaya}
          </DialogTitle>
          <DialogDescription className="sr-only">
            خريطة تظهر مسار الرحلة من {fromWilaya} إلى {toWilaya}
          </DialogDescription>
          {routeInfo && (
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              {routeInfo.distance && (
                <span>المسافة: {(routeInfo.distance / 1000).toFixed(1)} كم</span>
              )}
              {routeInfo.duration && (
                <span>
                  الوقت المتوقع: {(() => {
                    const totalMinutes = Math.round(routeInfo.duration / 60);
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    if (hours > 0 && minutes > 0) {
                      return `${hours} ساعة و ${minutes} دقيقة`;
                    } else if (hours > 0) {
                      return `${hours} ساعة`;
                    } else {
                      return `${minutes} دقيقة`;
                    }
                  })()}
                </span>
              )}
            </div>
          )}
        </DialogHeader>
        <div className="flex-1 relative p-6 pt-2 min-h-0">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <MapboxMap
              center={center}
              zoom={zoom}
              markers={markers}
              routes={routesArray}
              showControls={true}
              className="w-full h-full rounded-lg"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripRouteModal;

