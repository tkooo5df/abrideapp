import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MapboxMap from '@/components/map/MapboxMap';
import { MAPBOX_CONFIG, DEFAULT_MAP_OPTIONS, MARKER_ICONS, ROUTE_COLORS } from '@/config/mapbox';
import { locationTrackingService, LocationUpdate } from '@/services/locationTracking';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Navigation, MapPin, Phone, User, Clock, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const TripTrackingMapbox = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal, getBookingById } = useDatabase();
  
  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [passengerLocation, setPassengerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<'driver' | 'passenger' | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const user = isLocal ? localUser : (session?.user || null);
  const isDriver = profile?.role === 'driver' || user?.role === 'driver';

  // Fetch booking data
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      
      try {
        // Mock booking data for demonstration
        const mockBooking = {
          id: bookingId,
          pickupLocation: 'غرداية',
          destinationLocation: 'الجزائر',
          driver_name: 'محمد أحمد',
          driver_phone: '0555 123 456',
          passenger_name: 'علي عبد الله',
          passenger_phone: '0555 987 654',
          status: 'confirmed',
          totalAmount: 1500,
          seatsBooked: 2,
        };
        
        setBooking(mockBooking);
        
        // Mock locations
        setDriverLocation({ lat: 32.4913, lng: 3.6745 });
        setPassengerLocation({ lat: 32.5500, lng: 3.7500 });
      } catch (error) {
        toast({
          title: 'خطأ',
          description: 'فشل في تحميل تفاصيل الرحلة',
          variant: 'destructive',
        });
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Start location tracking
  const startTracking = useCallback(() => {
    if (!user?.id) return;

    setIsTracking(true);
    locationTrackingService.startTracking(
      user.id,
      (location: LocationUpdate) => {
        if (isDriver) {
          setDriverLocation({
            lat: location.latitude,
            lng: location.longitude,
          });
        } else {
          setPassengerLocation({
            lat: location.latitude,
            lng: location.longitude,
          });
        }
      }
    ).catch((error) => {
      toast({
        title: 'خطأ في التتبع',
        description: 'فشل في بدء تتبع الموقع',
        variant: 'destructive',
      });
      setIsTracking(false);
    });
  }, [user?.id, isDriver]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    locationTrackingService.stopTracking();
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // Calculate distance and ETA (mock implementation)
  useEffect(() => {
    if (driverLocation && passengerLocation) {
      // Mock distance calculation (in a real app, you'd use Mapbox Directions API)
      const mockDistance = 45.2; // km
      const mockDuration = '45 دقيقة'; // minutes
      
      setDistance(mockDistance);
      setDuration(mockDuration);
    }
  }, [driverLocation, passengerLocation]);

  const handleBack = () => {
    navigate(-1);
  };

  // Prepare markers for MapboxMap component
  const mapMarkers = [];
  
  if (driverLocation) {
    mapMarkers.push({
      id: 'driver',
      position: driverLocation,
      icon: 'driver' as keyof typeof MARKER_ICONS,
      title: 'موقع السائق',
      onClick: () => setSelectedMarker('driver'),
      popupContent: `
        <div class="p-2">
          <h3 class="font-bold mb-1">
            🚗 السائق
          </h3>
          <p class="text-sm text-gray-600">
            الموقع الحالي
          </p>
        </div>
      `
    });
  }
  
  if (passengerLocation) {
    mapMarkers.push({
      id: 'passenger',
      position: passengerLocation,
      icon: 'passenger' as keyof typeof MARKER_ICONS,
      title: 'موقع الراكب',
      onClick: () => setSelectedMarker('passenger'),
      popupContent: `
        <div class="p-2">
          <h3 class="font-bold mb-1">
            👤 الراكب
          </h3>
          <p class="text-sm text-gray-600">
            الموقع الحالي
          </p>
        </div>
      `
    });
  }

  if (!bookingId || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">لم يتم العثور على الرحلة</h2>
          <Button onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            العودة للخلف
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              رجوع
            </Button>
            <h1 className="text-xl font-bold">تتبع الرحلة</h1>
            <Button
              onClick={isTracking ? stopTracking : startTracking}
              variant={isTracking ? "destructive" : "default"}
              className="gap-2"
            >
              <Navigation className="h-4 w-4" />
              {isTracking ? 'إيقاف التتبع' : 'بدء التتبع'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Trip Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Distance and ETA */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">المسافة المتبقية</p>
                <p className="font-bold">
                  {distance ? `${distance.toFixed(1)} كم` : 'جاري الحساب...'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">الوقت المقدر</p>
                <p className="font-bold">
                  {duration || 'جاري الحساب...'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">المبلغ الإجمالي</p>
                <p className="font-bold">
                  {booking.totalAmount?.toLocaleString()} دج
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Trip Details */}
        <Card>
          <div className="p-4">
            <h2 className="text-lg font-bold mb-3">تفاصيل الرحلة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="font-medium">نقطة الانطلاق:</span>
                  <span>{booking.pickupLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span className="font-medium">الوجهة:</span>
                  <span>{booking.destinationLocation}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">المقاعد:</span>
                  <span>{booking.seatsBooked}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">الحالة:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    مؤكدة
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Driver/Passenger Info */}
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium">
                    {isDriver ? 'الراكب' : 'السائق'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isDriver ? booking.passenger_name : booking.driver_name}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Phone className="h-4 w-4" />
                اتصال
              </Button>
            </div>
          </div>
        </Card>

        {/* Map */}
        <Card className="overflow-hidden">
          <div className="h-[500px] w-full">
            <MapboxMap
              center={driverLocation || { lat: 32.4913, lng: 3.6745 }}
              zoom={13}
              markers={mapMarkers}
              showControls={true}
              className="w-full h-full"
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TripTrackingMapbox;