import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DriverLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  updated_at?: string;
}

export function useSubscribeDriverLocation(driverId: string) {
  const [position, setPosition] = useState<DriverLocation | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Fetch initial driver location
    const fetchInitialLocation = async () => {
      try {
        const { data, error } = await supabase
          .from('driver_locations')
          .select('*')
          .eq('driver_id', driverId)
          .single();

        if (error) {
        } else if (data) {
          setPosition({
            lat: data.lat,
            lng: data.lng,
            accuracy: data.accuracy,
            heading: data.heading,
            speed: data.speed,
            updated_at: data.updated_at,
          });
          setLastUpdate(data.updated_at);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchInitialLocation();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('driver_location_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          if (payload.new) {
            const location = payload.new as any;
            setPosition({
              lat: location.lat,
              lng: location.lng,
              accuracy: location.accuracy,
              heading: location.heading,
              speed: location.speed,
              updated_at: location.updated_at,
            });
            setLastUpdate(location.updated_at);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  return { position, lastUpdate, loading };
}
