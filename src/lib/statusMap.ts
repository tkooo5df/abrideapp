export type BookingStatus = 'pending' | 'confirmed' | 'enroute' | 'completed' | 'cancelled';

export type DriverUiState = {
  role: 'driver' | 'passenger';
  driverOnline?: boolean;            // driver toggle
  activeBookingStatus?: BookingStatus | null;
  hasAcceptedBooking?: boolean;      // driver accepted a booking
};

/**
 * Determines if the driver map should be shown based on current state
 */
export function shouldShowDriverMap(s: DriverUiState): boolean {
  if (s.role !== 'driver') return false;
  
  // Show map when online and awaiting/serving trips OR during enroute
  if (s.activeBookingStatus === 'enroute') return true;
  if (s.driverOnline) return true; // online dashboard shows live map & nearby pickups
  
  return false;
}

/**
 * Determines if the passenger map should be shown based on booking status
 */
export function shouldShowPassengerMap(status?: BookingStatus | null): boolean {
  // Passenger sees map only after confirmation until completion
  return status === 'confirmed' || status === 'enroute';
}

/**
 * Determines the current phase of the driver's journey
 */
export function driverMapPhase(s: DriverUiState): 'idle' | 'to_pickup' | 'enroute' {
  if (s.activeBookingStatus === 'enroute') return 'enroute';
  if (s.driverOnline && s.hasAcceptedBooking) return 'to_pickup';
  return 'idle';
}

/**
 * Helper to get map center coordinates based on available data
 */
export function getMapCenter(
  driverPos?: { lat: number; lng: number } | null,
  pickup?: { lat: number; lng: number } | null,
  destination?: { lat: number; lng: number } | null
): { lat: number; lng: number } {
  // Default to Algeria center if no coordinates available
  const defaultCenter = { lat: 32.49, lng: 3.67 };
  
  return driverPos || pickup || destination || defaultCenter;
}

/**
 * Helper to determine if location tracking should be active
 */
export function shouldTrackLocation(state: DriverUiState): boolean {
  return state.role === 'driver' && state.driverOnline === true;
}

/**
 * Helper to get booking status display text
 */
export function getBookingStatusText(status: BookingStatus): string {
  const statusMap: Record<BookingStatus, string> = {
    pending: 'Waiting for driver',
    confirmed: 'Driver confirmed',
    enroute: 'Trip in progress',
    completed: 'Trip completed',
    cancelled: 'Trip cancelled'
  };
  
  return statusMap[status] || 'Unknown status';
}