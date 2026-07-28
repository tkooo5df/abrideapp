import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { locationTrackingService } from '@/services/locationTracking';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MapPin, AlertCircle } from 'lucide-react';

interface LocationPermissionRequestProps {
  children: React.ReactNode;
}

/**
 * Component that requests location permission when user first opens the website
 * Only for passengers and drivers, not for admins
 */
export const LocationPermissionRequest = ({ children }: LocationPermissionRequestProps) => {
  const { user, profile } = useAuth();
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('loading');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);

  // Check if user is admin
  const isAdmin = profile?.role === 'admin' || user?.role === 'admin';
  const isDriver = profile?.role === 'driver' || user?.role === 'driver';
  const isPassenger = profile?.role === 'passenger' || (!isAdmin && !isDriver);

  useEffect(() => {
    // Skip if admin or not authenticated
    if (isAdmin || !user?.id) {
      setLocationPermission('granted');
      return;
    }

    // Skip if already requested
    if (hasRequested) {
      return;
    }

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
            setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');

            if (result.state === 'granted') {
              // Already granted, get location
              try {
                await locationTrackingService.getCurrentLocation();
                toast({
                  title: "✅ تم الحصول على الموقع",
                  description: "تم تفعيل خدمة الموقع بنجاح",
                });
              } catch (error) {
              }
            } else if (result.state === 'prompt') {
              // Request permission automatically
              requestLocation();
            } else {
              setPermissionError('يجب السماح بالوصول إلى موقعك لاستخدام التطبيق بشكل كامل');
            }

            // Listen for permission changes
            result.addEventListener('change', () => {
              setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
              if (result.state === 'granted') {
                locationTrackingService.getCurrentLocation().then(() => {
                  toast({
                    title: "✅ تم تفعيل الموقع",
                    description: "شكراً لسماحك بالوصول إلى موقعك",
                  });
                }).catch(() => {});
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

    const requestLocation = () => {
      setHasRequested(true);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocationPermission('granted');
          setPermissionError(null);
          // Save location for driver/passenger
          try {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading || null,
              speed: position.coords.speed || null,
            };

            if (isDriver) {
              await locationTrackingService.saveLocationUpdate(
                user.id,
                location,
                'driver'
              );
            } else if (isPassenger) {
              await locationTrackingService.saveLocationUpdate(
                user.id,
                location,
                'passenger'
              );
            }
          } catch (error) {
          }
        },
        (error) => {
          setLocationPermission('denied');
          
          let errorMessage = 'لم يتم الحصول على إذن الموقع';
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'تم رفض الوصول إلى الموقع. يرجى السماح بالوصول من إعدادات المتصفح';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = 'الموقع غير متاح حالياً';
          } else if (error.code === error.TIMEOUT) {
            errorMessage = 'انتهت مهلة طلب الموقع';
          }
          
          setPermissionError(errorMessage);
          
          toast({
            title: "⚠️ لم يتم الحصول على الموقع",
            description: errorMessage,
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    requestLocationPermission();
  }, [user?.id, isAdmin, isDriver, isPassenger, hasRequested]);

  // Show permission request UI if needed
  if (!isAdmin && locationPermission === 'denied' && permissionError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>إذن الموقع مطلوب</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>{permissionError}</p>
            <Button
              onClick={() => {
                setHasRequested(false);
                setLocationPermission('prompt');
                // Trigger permission request again
                navigator.geolocation.getCurrentPosition(
                  () => {
                    setLocationPermission('granted');
                    setPermissionError(null);
                    window.location.reload();
                  },
                  () => {
                    toast({
                      title: "يرجى السماح بالوصول من إعدادات المتصفح",
                      description: "اذهب إلى إعدادات المتصفح > الموقع > السماح",
                      variant: "destructive",
                    });
                  },
                  { enableHighAccuracy: true, timeout: 10000 }
                );
              }}
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              طلب إذن الموقع مرة أخرى
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render children normally
  return <>{children}</>;
};

