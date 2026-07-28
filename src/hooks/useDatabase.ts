import { useEffect, useState } from 'react';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { supabase } from '@/integrations/supabase/client';

export type DatabaseType = 'supabase';

export const useDatabase = () => {
  const databaseType: DatabaseType = 'supabase';
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await BrowserDatabaseService.initializeDefaultData();
      } catch (error) {
      } finally {
        setIsInitialized(true);
      }
    };

    initializeDatabase();
  }, []);

  const switchDatabase = () => {
  };

  const getDatabaseService = () => BrowserDatabaseService;

  // Get booking by ID
  const getBookingById = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  };

  // Get all drivers
  const getAllDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'driver');

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  };

  // Get driver trips
  const getDriverTrips = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('driver_id', driverId)
        .eq('status', 'active')
        .order('departure_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  };

  // Get user bookings
  const getUserBookings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, trips(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  };

  // Get active (confirmed/in_progress) bookings for map
  const getActiveBookingsForMap = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['confirmed', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  };

  return {
    databaseType,
    isInitialized,
    switchDatabase,
    getDatabaseService,
    isLocal: false,
    isSupabase: true,
    // New functions
    getBookingById,
    getAllDrivers,
    getDriverTrips,
    getUserBookings,
    getActiveBookingsForMap,
  };
};
