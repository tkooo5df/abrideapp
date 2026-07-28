import { useState, useEffect, useCallback } from 'react';

interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 5000,
    watch = false,
  } = options;

  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Check if geolocation is supported
  useEffect(() => {
    setIsSupported('geolocation' in navigator);
  }, []);

  const updatePosition = useCallback((pos: GeolocationPosition) => {
    setPosition(pos);
    setError(null);
    setIsLoading(false);
  }, []);

  const updateError = useCallback((err: GeolocationError) => {
    setError(err);
    setIsLoading(false);
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (!isSupported) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updatePosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading || undefined,
          speed: pos.coords.speed || undefined,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        updateError({
          code: err.code,
          message: err.message,
        });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [isSupported, enableHighAccuracy, timeout, maximumAge, updatePosition, updateError]);

  const watchPosition = useCallback(() => {
    if (!isSupported) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      });
      return () => {};
    }

    setIsLoading(true);
    setError(null);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        updatePosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading || undefined,
          speed: pos.coords.speed || undefined,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        updateError({
          code: err.code,
          message: err.message,
        });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isSupported, enableHighAccuracy, timeout, maximumAge, updatePosition, updateError]);

  // Auto-start watching if watch is enabled
  useEffect(() => {
    if (watch && isSupported) {
      const cleanup = watchPosition();
      return cleanup;
    }
  }, [watch, isSupported, watchPosition]);

  return {
    position,
    error,
    isLoading,
    isSupported,
    getCurrentPosition,
    watchPosition,
  };
}

// Utility function to calculate distance between two points
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Utility function to calculate ETA
export function calculateETA(distanceKm: number, averageSpeedKmh: number = 30): string {
  const timeHours = distanceKm / averageSpeedKmh;
  const timeMinutes = Math.round(timeHours * 60);
  
  if (timeMinutes < 60) {
    return `${timeMinutes} min`;
  } else {
    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
}

// Utility function to parse location strings
export function parseLocationString(locationStr: string): { lat: number; lng: number } | null {
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
}

// Utility function to format location as string
export function formatLocationString(lat: number, lng: number): string {
  return JSON.stringify({ lat, lng });
}
