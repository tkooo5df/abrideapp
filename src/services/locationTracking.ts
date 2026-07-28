// Location Tracking Service
import { supabase } from '@/integrations/supabase/client';
import { browserDatabase } from '@/integrations/database/browserDatabase';
import { toast } from '@/hooks/use-toast';

export interface LocationUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

export interface TripLocation {
  tripId: string;
  driverId: string;
  currentLocation: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
}

type TrackingTarget = 'driver' | 'passenger';
interface TrackingTuning {
  frequencyMs?: number;              // upsert frequency
  accuracyThresholdMeters?: number;  // discard updates worse than this
  minDistanceMeters?: number;        // require movement to save
  maxStaleMs?: number;               // force save if long time passed
  smoothing?: boolean;               // apply simple smoothing
}

class LocationTrackingService {
  private watchId: number | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private isTracking = false;
  private lastLocation: LocationUpdate | null = null;
  private lastSavedAt: number = 0;

  /**
   * Start tracking user location
   */
  async startTracking(
    userId: string,
    onLocationUpdate?: (location: LocationUpdate) => void,
    target: TrackingTarget = 'driver',
    options: PositionOptions = {
      enableHighAccuracy: true,  // استخدام GPS الفعلي
      timeout: 30000,             // 30 ثانية للحصول على موقع دقيق
      maximumAge: 0,              // عدم استخدام الموقع المخزن مؤقتاً
    },
    frequencyMsOrTuning: number | TrackingTuning = 2000
  ): Promise<boolean> {
    const tuning: TrackingTuning = typeof frequencyMsOrTuning === 'number' ? {
      frequencyMs: frequencyMsOrTuning,
      accuracyThresholdMeters: 50,
      minDistanceMeters: 10,
      maxStaleMs: 15000,
      smoothing: true,
    } : {
      frequencyMs: frequencyMsOrTuning.frequencyMs ?? 2000,
      accuracyThresholdMeters: frequencyMsOrTuning.accuracyThresholdMeters ?? 50,
      minDistanceMeters: frequencyMsOrTuning.minDistanceMeters ?? 10,
      maxStaleMs: frequencyMsOrTuning.maxStaleMs ?? 15000,
      smoothing: frequencyMsOrTuning.smoothing ?? true,
    };
    if (!navigator.geolocation) {
      toast({
        title: "غير مدعوم",
        description: "جهازك لا يدعم خاصية تحديد الموقع",
        variant: "destructive",
      });
      return false;
    }

    return new Promise((resolve) => {
      this.watchId = navigator.geolocation.watchPosition(
        async (position) => {
          let locationUpdate: LocationUpdate = {
            userId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          };

          // Optional smoothing (simple EMA weighted by accuracy)
          if (tuning.smoothing && this.lastLocation && (locationUpdate.accuracy ?? 999) <= 200) {
            const prev = this.lastLocation;
            const a1 = Math.max(1, Math.min(200, prev.accuracy ?? 100));
            const a2 = Math.max(1, Math.min(200, locationUpdate.accuracy ?? 100));
            const w1 = 1 / a1;
            const w2 = 1 / a2;
            const wSum = w1 + w2;
            locationUpdate = {
              ...locationUpdate,
              latitude: (prev.latitude * w1 + locationUpdate.latitude * w2) / wSum,
              longitude: (prev.longitude * w1 + locationUpdate.longitude * w2) / wSum,
            };
          }

          const now = Date.now();
          const last = this.lastLocation;
          const acc = locationUpdate.accuracy ?? 9999;
          const accOk = acc <= (tuning.accuracyThresholdMeters as number);

          // Decide whether to save immediately
          let shouldSave = false;
          if (!last) {
            shouldSave = true;
          } else {
            const movedMeters = this.calculateDistance(
              last.latitude, last.longitude,
              locationUpdate.latitude, locationUpdate.longitude,
            ) * 1000;
            const timeSinceSave = now - this.lastSavedAt;
            if (accOk && movedMeters >= (tuning.minDistanceMeters as number)) shouldSave = true;
            if (timeSinceSave >= (tuning.maxStaleMs as number)) shouldSave = true;
          }

          if (shouldSave) {
            await this.saveLocationUpdate(locationUpdate, target);
            this.lastSavedAt = now;
          }

          // Call callback if provided
          if (onLocationUpdate) {
            onLocationUpdate(locationUpdate);
          }

          // cache last location
          this.lastLocation = locationUpdate;

          // kick off periodic upserts every frequencyMs
          if (this.updateInterval === null) {
            this.updateInterval = setInterval(async () => {
              if (!this.lastLocation) return;
              try {
                // Periodic safeguard save even if no movement
                await this.saveLocationUpdate(this.lastLocation, target);
                this.lastSavedAt = Date.now();
              } catch (e) {
                // no-op
              }
            }, Math.max(1000, tuning.frequencyMs as number));
          }

          this.isTracking = true;
          resolve(true);
        },
        (error) => {
          let errorMessage = "فشل في الحصول على الموقع";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "تم رفض إذن الوصول إلى الموقع. يرجى تمكين إذن الموقع من إعدادات المتصفح.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "معلومات الموقع غير متاحة.";
              break;
            case error.TIMEOUT:
              errorMessage = "انتهت مهلة طلب الموقع.";
              break;
          }
          
          toast({
            title: "خطأ في تحديد الموقع",
            description: errorMessage,
            variant: "destructive",
          });
          
          this.isTracking = false;
          resolve(false);
        },
        options
      );
    });
  }

  /**
   * Stop tracking user location
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isTracking = false;
  }

  /**
   * Get current location once
   */
  async getCurrentLocation(): Promise<LocationUpdate | null> {
    if (!navigator.geolocation) {
      toast({
        title: "غير مدعوم",
        description: "جهازك لا يدعم خاصية تحديد الموقع",
        variant: "destructive",
      });
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            userId: '',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          });
        },
        (error) => {
          let errorMessage = "فشل في الحصول على الموقع";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "تم رفض إذن الوصول إلى الموقع. يرجى تمكين إذن الموقع من إعدادات المتصفح.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "معلومات الموقع غير متاحة.";
              break;
            case error.TIMEOUT:
              errorMessage = "انتهت مهلة طلب الموقع.";
              break;
          }
          
          toast({
            title: "خطأ في تحديد الموقع",
            description: errorMessage,
            variant: "destructive",
          });
          
          resolve(null);
        },
        {
          enableHighAccuracy: true,  // استخدام GPS الفعلي
          timeout: 30000,             // زيادة المهلة لإعطاء GPS وقت للحصول على إشارة جيدة
          maximumAge: 0,              // دائماً احصل على موقع جديد وليس من الذاكرة المؤقتة
        }
      );
    });
  }

  /**
   * Save location update to database
   */
  private async saveLocationUpdate(location: LocationUpdate, target: TrackingTarget = 'driver') {
    try {
      // Basic validation & normalization
      let lat = Number(location.latitude);
      let lng = Number(location.longitude);
      const acc = location.accuracy ?? undefined;

      // Ignore clearly invalid points
      if (!isFinite(lat) || !isFinite(lng)) return;
      if (lat === 0 && lng === 0) return;

      // Detect and fix swapped lat/lng (heuristic)
      // If |lat| > 90 and |lng| <= 90, treat as swapped
      if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
        const tmp = lat; lat = lng; lng = tmp;
      }
      // Clamp to valid ranges
      lat = Math.max(-90, Math.min(90, lat));
      lng = Math.max(-180, Math.min(180, lng));

      // Round to 6 decimals to reduce churn
      lat = Math.round(lat * 1e6) / 1e6;
      lng = Math.round(lng * 1e6) / 1e6;

      // Check if using local database
      const isLocal = localStorage.getItem('demo_mode') === 'true';

      if (isLocal) {
        // Save to local database
        const data = browserDatabase['getData']();
        
        if (!data.locations) {
          data.locations = [];
        }

        data.locations.push({
          id: Date.now().toString(),
          userId: location.userId,
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          timestamp: location.timestamp.toISOString(),
          speed: location.speed,
          heading: location.heading,
        });

        // Keep only last 100 locations per user
        const userLocations = data.locations.filter(
          (l: any) => l.userId === location.userId
        );
        if (userLocations.length > 100) {
          data.locations = data.locations.filter(
            (l: any) => l.userId !== location.userId
          ).concat(userLocations.slice(-100));
        }

        browserDatabase['saveData'](data);
      } else {
        // Save to Supabase table based on target
        const table = target === 'driver' ? 'driver_locations' : 'passenger_locations';
        const idKey = target === 'driver' ? 'driver_id' : 'passenger_id';
        const { error } = await supabase
          .from(table)
          .upsert({
            [idKey]: location.userId,
            lat,
            lng,
            accuracy: acc,
            heading: location.heading,
            speed: location.speed,
            updated_at: new Date().toISOString(),
          } as any, {
            onConflict: idKey
          });

        if (error) {
        }
      }
    } catch (error) {
    }
  }

  /**
   * Get user's last known location
   */
  async getLastKnownLocation(userId: string, target: TrackingTarget = 'driver'): Promise<{ lat: number; lng: number } | null> {
    try {
      const isLocal = localStorage.getItem('demo_mode') === 'true';

      if (isLocal) {
        const data = browserDatabase['getData']();
        
        if (!data.locations) return null;

        const userLocations = data.locations
          .filter((l: any) => l.userId === userId)
          .sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

        if (userLocations.length > 0) {
          const location = userLocations[0];
          return {
            lat: location.latitude,
            lng: location.longitude,
          };
        }
      } else {
        // Get from Supabase table based on target
        const table = target === 'driver' ? 'driver_locations' : 'passenger_locations';
        const idKey = target === 'driver' ? 'driver_id' : 'passenger_id';
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq(idKey, userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          return { 
            lat: data.lat, 
            lng: data.lng 
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update user location (one-time update)
   */
  async updateLocation(
    userId: string, 
    location: { lat: number; lng: number },
    target: TrackingTarget = 'driver'
  ): Promise<boolean> {
    try {
      const isLocal = localStorage.getItem('demo_mode') === 'true';

      if (isLocal) {
        const data = browserDatabase['getData']();
        
        if (!data.locations) {
          data.locations = [];
        }

        data.locations.push({
          id: Date.now().toString(),
          userId: userId,
          latitude: location.lat,
          longitude: location.lng,
          timestamp: new Date().toISOString(),
        });

        browserDatabase['saveData'](data);
      } else {
        // Save to Supabase table based on target
        const table = target === 'driver' ? 'driver_locations' : 'passenger_locations';
        const idKey = target === 'driver' ? 'driver_id' : 'passenger_id';
        const { error } = await supabase
          .from(table)
          .upsert({
            [idKey]: userId,
            lat: location.lat,
            lng: location.lng,
            updated_at: new Date().toISOString(),
          } as any, {
            onConflict: idKey
          });

        if (error) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if tracking is active
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

export const locationTrackingService = new LocationTrackingService();

