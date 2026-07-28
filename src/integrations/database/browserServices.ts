import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { wilayas } from '@/data/wilayas';
import type { Profile as BrowserProfile } from './browserDatabase';

// Helper function to check authentication and permissions
async function checkAuthAndPermissions(bookingId: number) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  // Check if booking exists and user has permission
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('passenger_id, driver_id, status')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  if (booking.passenger_id !== user.id && booking.driver_id !== user.id) {
    throw new Error('User does not have permission to update this booking');
  }

  return { user, booking };
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

const getWilayaNameById = (id: number) => {
  // Validate that id is a number
  if (isNaN(id) || id <= 0) {
    return 'غير محدد';
  }
  
  const code = String(id).padStart(2, '0');
  const wilaya = wilayas.find((w) => w.code === code);
  return wilaya ? wilaya.name : 'غير محدد';
};

// Helper functions for notification table missing errors
const isNotificationsTableMissing = (error: any) => {
  if (!error) return false;
  const code = typeof error.code === 'string' ? error.code : undefined;
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  const details = typeof error.details === 'string' ? error.details.toLowerCase() : '';
  const combined = `${message} ${details}`;
  return code === '42P01' || combined.includes('relation "notifications" does not exist');
};

const logMissingNotificationsTable = (error: any) => {
};

type ProfileRow = Tables<'profiles'>;
type VehicleRow = Tables<'vehicles'>;
type TripRow = Tables<'trips'>;
type BookingRow = Tables<'bookings'>;
type NotificationRow = Tables<'notifications'>;
type SystemSettingRow = Tables<'system_settings'>;

// Create concrete interfaces for the update operations to avoid deep instantiation
interface ProfileUpdateData {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  phone?: string | null;
  role?: string | null;
  avatar_url?: string | null;
  wilaya?: string | null;
  commune?: string | null;
  address?: string | null;
  age?: number | null;
  ksar?: string | null;
  is_verified?: boolean | null;
  language?: string | null;
  updated_at?: string;
}

interface VehicleUpdateData {
  driver_id?: string | null;
  make?: string;
  model?: string;
  year?: number | null;
  color?: string | null;
  license_plate?: string | null;
  seats?: number | null;
  is_active?: boolean | null;
  updated_at?: string;
}

interface TripUpdateData {
  driver_id?: string | null;
  vehicle_id?: string | null;
  from_wilaya_id?: number;
  to_wilaya_id?: number;
  from_wilaya_name?: string | null;
  to_wilaya_name?: string | null;
  departure_date?: string;
  departure_time?: string;
  price_per_seat?: number;
  total_seats?: number;
  available_seats?: number;
  description?: string | null;
  status?: string;
  is_demo?: boolean | null;
  updated_at?: string;
}

interface BookingUpdateData {
  pickup_location?: string;
  destination_location?: string;
  passenger_id?: string | null;
  driver_id?: string | null;
  trip_id?: string | null;
  seats_booked?: number | null;
  total_amount?: number | null;
  payment_method?: string | null;
  notes?: string | null;
  pickup_time?: string | null;
  special_requests?: string | null;
  status?: string;
  cancellation_reason?: string | null;
  updated_at?: string;
}

const mapProfile = (row: ProfileRow | null): BrowserProfile | null => {
  if (!row) return null;

  const firstName = row.first_name ?? '';
  const lastName = row.last_name ?? '';
  const fullName = row.full_name ?? `${firstName} ${lastName}`.trim();

  // Handle age: ensure it's a number or null
  const ageValue = row.age !== null && row.age !== undefined 
    ? (typeof row.age === 'number' ? row.age : parseInt(String(row.age), 10))
    : null;
  
  // Handle ksar: ensure it's a string or null
  const ksarValue = row.ksar && String(row.ksar).trim() !== '' 
    ? String(row.ksar).trim() 
    : null;

  const mappedProfile = {
    id: row.id,
    email: row.email ?? '',
    firstName,
    lastName,
    // Also include snake_case versions for compatibility
    first_name: firstName,
    last_name: lastName,
    fullName: fullName || row.email || '',
    phone: row.phone ?? null,
    role: (row.role ?? 'passenger') as 'driver' | 'passenger' | 'admin' | 'developer',
    wilaya: row.wilaya ?? 'الجزائر',
    commune: row.commune ?? 'غير محدد',
    address: row.address ?? 'غير محدد',
    age: ageValue,
    ksar: ksarValue,
    isVerified: row.is_verified ?? false,
    avatarUrl: row.avatar_url ?? undefined,
    rating: 0,
    averageRating: 0,
    totalRatings: 0,
    ratingsCount: 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
    isDemo: false,
  };

  return mappedProfile;
};

const toProfileInsert = (data: any): TablesInsert<'profiles'> => ({
  id: data.id,
  email: data.email ?? null,
  first_name: data.firstName ?? null,
  last_name: data.lastName ?? null,
  full_name: data.fullName ?? null,
  phone: data.phone ?? null,
  role: data.role ?? 'passenger',
  avatar_url: data.avatarUrl ?? null,
  wilaya: data.wilaya ?? null,
  commune: data.commune ?? null,
  address: data.address ?? null,
  is_verified: data.isVerified ?? false,
  language: data.language ?? 'ar',
  created_at: data.createdAt ?? new Date().toISOString(),
  updated_at: data.updatedAt ?? new Date().toISOString(),
});

const mapVehicle = (row: VehicleRow | null) => {
  if (!row) return null;
  return {
    id: row.id,
    driverId: row.driver_id ?? '',
    make: row.make,
    model: row.model,
    year: row.year ?? new Date().getFullYear(),
    color: row.color ?? 'غير محدد',
    licensePlate: row.license_plate ?? 'غير محدد',
    seats: row.seats ?? 0,
    isActive: row.is_active ?? true,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
};

interface DriverRatingSummary {
  averageRating: number;
  totalRatings: number;
}

const DEFAULT_DRIVER_RATING_SUMMARY: DriverRatingSummary = {
  averageRating: 0,
  totalRatings: 0,
};

const formatRatingValue = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
};

const isFunctionMissingError = (error: any) => {
  if (!error) return false;
  const code = typeof error.code === 'string' ? error.code : undefined;
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  const details = typeof error.details === 'string' ? error.details.toLowerCase() : '';
  return (
    code === '42883' ||
    code === 'PGRST116' ||
    code === '42P01' ||
    message.includes('does not exist') ||
    details.includes('does not exist')
  );
};

const ensureProfileRatingFields = (profile: BrowserProfile) => {
  const averageRating = profile.averageRating ?? profile.rating ?? 0;
  const totalRatings = profile.totalRatings ?? profile.ratingsCount ?? 0;
  return {
    ...profile,
    averageRating,
    rating: averageRating,
    totalRatings,
    ratingsCount: totalRatings,
  };
};

const applyRatingToProfile = (profile: BrowserProfile, summary: DriverRatingSummary) => {
  const averageRating = formatRatingValue(summary.averageRating);
  const totalRatings = summary.totalRatings ?? 0;
  return {
    ...profile,
    rating: averageRating,
    averageRating,
    totalRatings,
    ratingsCount: totalRatings,
  };
};

const fetchDriverRatingSummary = async (driverId: string): Promise<DriverRatingSummary> => {
  if (!driverId) return DEFAULT_DRIVER_RATING_SUMMARY;

  try {
    const { data, error } = await (supabase as any).rpc('get_driver_stats', { driver_id: driverId });
    if (!error && Array.isArray(data) && data.length > 0) {
      const stats = data[0] ?? {};
      const averageRating = Number(stats.average_rating ?? 0);
      const totalRatings = Number(stats.total_ratings ?? 0);
      return {
        averageRating: formatRatingValue(averageRating),
        totalRatings: Number.isFinite(totalRatings) ? totalRatings : 0,
      };
    }

    if (error && !isFunctionMissingError(error)) {
    }
  } catch (err) {
  }

  let averageRating = 0;
  let totalRatings = 0;

  try {
    const { data: avgData, error: avgError } = await (supabase as any).rpc('get_driver_average_rating', { driver_id: driverId });
    if (!avgError && typeof avgData === 'number') {
      averageRating = avgData;
    } else if (avgError && !isFunctionMissingError(avgError)) {
    }
  } catch (err) {
  }

  try {
    const { data: countData, error: countError } = await (supabase as any).rpc('get_driver_ratings_count', { driver_id: driverId });
    if (!countError && typeof countData === 'number') {
      totalRatings = countData;
    } else if (countError && !isFunctionMissingError(countError)) {
    }
  } catch (err) {
  }

  if (totalRatings === 0 || averageRating === 0) {
    try {
      const { data: ratingRows, error: ratingsError } = await supabase
        .from('ratings' as any)
        .select('rating')
        .eq('driver_id', driverId);

      if (!ratingsError && Array.isArray(ratingRows) && ratingRows.length > 0) {
        const ratings = ratingRows
          .map((row: any) => Number(row.rating ?? 0))
          .filter((value) => Number.isFinite(value) && value > 0);

        if (ratings.length > 0) {
          const sum = ratings.reduce((acc, value) => acc + value, 0);
          averageRating = sum / ratings.length;
          totalRatings = ratings.length;
        }
      } else if (ratingsError && !isFunctionMissingError(ratingsError)) {
      }
    } catch (err) {
    }
  }

  return {
    averageRating: formatRatingValue(averageRating),
    totalRatings,
  };
};

const attachDriverRating = async (profile: BrowserProfile | null): Promise<BrowserProfile | null> => {
  if (!profile) return null;
  const normalized = ensureProfileRatingFields(profile);
  if (normalized.role !== 'driver') {
    return normalized;
  }

  const summary = await fetchDriverRatingSummary(normalized.id);
  return applyRatingToProfile(normalized, summary);
};

const buildProfileMapWithRatings = async (rows: ProfileRow[] | null) => {
  const uniqueProfiles = new Map<string, BrowserProfile>();
  (rows ?? []).forEach((row) => {
    const profile = mapProfile(row);
    if (profile) {
      uniqueProfiles.set(profile.id, profile);
    } else {
    }
  });
  const enrichedProfiles = await Promise.all(
    Array.from(uniqueProfiles.values()).map((profile) => attachDriverRating(profile))
  );

  const profileMap = new Map<string, BrowserProfile>();
  enrichedProfiles.forEach((profile) => {
    if (profile) {
      profileMap.set(profile.id, profile);
    }
  });
  return profileMap;
};

const toVehicleInsert = (data: any): TablesInsert<'vehicles'> => ({
  driver_id: data.driverId ?? null,
  make: data.make,
  model: data.model,
  year: data.year ?? null,
  color: data.color ?? null,
  license_plate: data.licensePlate ?? null,
  seats: data.seats ?? null,
  is_active: data.isActive ?? true,
  created_at: data.createdAt ?? new Date().toISOString(),
  updated_at: data.updatedAt ?? new Date().toISOString(),
});

const mapTrip = (row: TripRow | null) => {
  if (!row) return null;
  const fromName = row.from_wilaya_name ?? getWilayaNameById(row.from_wilaya_id);
  const toName = row.to_wilaya_name ?? getWilayaNameById(row.to_wilaya_id);
  // Access coordinates with type assertion to handle potential missing types
  const rowWithCoords = row as any;
  // Handle fromKsar - convert null to undefined and ensure it's a string if it exists
  const fromKsarValue = (row as any).from_ksar;
  const fromKsar = fromKsarValue && String(fromKsarValue).trim() !== '' 
    ? String(fromKsarValue).trim() 
    : undefined;
  
  // Handle toKsar - convert null to undefined and ensure it's a string if it exists
  const toKsarValue = (row as any).to_ksar;
  const toKsar = toKsarValue && String(toKsarValue).trim() !== '' 
    ? String(toKsarValue).trim() 
    : undefined;
  
  const driverId = row.driver_id ?? '';
  
  // Debug: Log if driver_id is missing
  if (!driverId || driverId === '') {
  }
  
  return {
    id: row.id,
    driverId: driverId,
    vehicleId: row.vehicle_id ?? '',
    fromWilayaId: row.from_wilaya_id,
    toWilayaId: row.to_wilaya_id,
    fromWilayaName: fromName,
    toWilayaName: toName,
    fromKsar: fromKsar,
    toKsar: toKsar,
    fromLat: rowWithCoords.from_lat ?? undefined,
    fromLng: rowWithCoords.from_lng ?? undefined,
    toLat: rowWithCoords.to_lat ?? undefined,
    toLng: rowWithCoords.to_lng ?? undefined,
    departureDate: row.departure_date,
    departureTime: row.departure_time,
    pricePerSeat: typeof row.price_per_seat === 'number'
      ? row.price_per_seat
      : Number(row.price_per_seat ?? 0),
    totalSeats: row.total_seats,
    availableSeats: row.available_seats,
    description: row.description ?? undefined,
    status: (row.status ?? 'scheduled') as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    isDemo: row.is_demo ?? false,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
};

const toTripInsert = (data: any): TablesInsert<'trips'> => {
  // Log the incoming data for debugging
  // Validate required fields
  if (data.fromWilayaId == null || data.fromWilayaId === '') {
    throw new Error('من فضلك حدد الولاية المبدئية');
  }
  
  if (data.toWilayaId == null || data.toWilayaId === '') {
    throw new Error('من فضلك حدد الولاية الوجهة');
  }
  
  if (data.departureDate == null || data.departureDate === '') {
    throw new Error('من فضلك حدد تاريخ الانطلاق');
  }
  
  if (data.departureTime == null || data.departureTime === '') {
    throw new Error('من فضلك حدد وقت الانطلاق');
  }
  
  if (data.pricePerSeat == null || data.pricePerSeat === '') {
    throw new Error('من فضلك حدد السعر');
  }
  
  if (data.totalSeats == null || data.totalSeats === '') {
    throw new Error('من فضلك حدد عدد المقاعد');
  }
  
  if (data.driverId == null || data.driverId === '') {
    throw new Error('معرف السائق مطلوب');
  }
  
  // Validate numeric values
  const fromWilayaId = parseInt(data.fromWilayaId);
  const toWilayaId = parseInt(data.toWilayaId);
  const pricePerSeat = parseFloat(data.pricePerSeat);
  const totalSeats = parseInt(data.totalSeats);
  
  if (isNaN(fromWilayaId)) {
    throw new Error('رقم الولاية المبدئية غير صحيح');
  }
  
  if (isNaN(toWilayaId)) {
    throw new Error('رقم الولاية الوجهة غير صحيح');
  }
  
  if (isNaN(pricePerSeat) || pricePerSeat <= 0) {
    throw new Error('السعر يجب أن يكون رقماً موجباً');
  }
  
  if (isNaN(totalSeats) || totalSeats <= 0) {
    throw new Error('عدد المقاعد يجب أن يكون رقماً موجباً');
  }
  
  // Validate that from and to wilayas are different
  if (fromWilayaId === toWilayaId) {
    throw new Error('ولاية الانطلاق وولاية الوصول يجب أن تكونا مختلفتين');
  }
  
  // Validate vehicle ID if provided
  if (data.vehicleId && typeof data.vehicleId !== 'string') {
    throw new Error('معرف المركبة غير صحيح');
  }
  
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.departureDate)) {
    throw new Error('تنسيق تاريخ الانطلاق غير صحيح');
  }
  
  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(data.departureTime)) {
    throw new Error('تنسيق وقت الانطلاق غير صحيح');
  }
  
  // Set available seats to total seats if not provided
  const availableSeats = data.availableSeats != null ? parseInt(data.availableSeats) : totalSeats;
  
  if (isNaN(availableSeats) || availableSeats <= 0) {
    throw new Error('عدد المقاعد المتاحة يجب أن يكون رقماً موجباً');
  }
  
  // Ensure available seats don't exceed total seats
  if (availableSeats > totalSeats) {
    throw new Error('عدد المقاعد المتاحة لا يمكن أن يتجاوز العدد الإجمالي للمقاعد');
  }
  
  // Validate ksar only if fromWilayaId is 47 (غرداية)
  const fromKsar = fromWilayaId === 47 ? (data.fromKsar ?? null) : null;
  // Validate toKsar only if toWilayaId is 47 (غرداية)
  const toKsar = toWilayaId === 47 ? (data.toKsar ?? null) : null;
  
  const result = {
    driver_id: data.driverId,
    vehicle_id: data.vehicleId ?? null,
    from_wilaya_id: fromWilayaId,
    to_wilaya_id: toWilayaId,
    from_wilaya_name: data.fromWilayaName ?? getWilayaNameById(fromWilayaId),
    to_wilaya_name: data.toWilayaName ?? getWilayaNameById(toWilayaId),
    from_ksar: fromKsar,
    to_ksar: toKsar,
    from_lat: data.fromLat ?? null,
    from_lng: data.fromLng ?? null,
    to_lat: data.toLat ?? null,
    to_lng: data.toLng ?? null,
    departure_date: data.departureDate,
    departure_time: data.departureTime,
    price_per_seat: pricePerSeat,
    total_seats: totalSeats,
    available_seats: availableSeats,
    description: data.description ?? null,
    status: data.status ?? 'scheduled',
    is_demo: data.isDemo ?? false,
    created_at: data.createdAt ?? new Date().toISOString(),
    updated_at: data.updatedAt ?? new Date().toISOString(),
  };
  return result;
};

const mapBooking = (row: BookingRow | null) => {
  if (!row) return null;
  const totalAmount = typeof row.total_amount === 'number'
    ? row.total_amount
    : Number(row.total_amount ?? 0);
  return {
    id: row.id.toString(),
    passengerId: row.passenger_id ?? '',
    driverId: row.driver_id ?? '',
    tripId: row.trip_id ?? '',
    pickupLocation: row.pickup_location,
    destinationLocation: row.destination_location,
    fromKsar: (row as any).from_ksar ?? undefined,
    pickupPoint: (row as any).pickup_point ?? undefined,
    destinationPoint: (row as any).destination_point ?? undefined,
    seatsBooked: row.seats_booked ?? 1,
    totalAmount,
    paymentMethod: (row.payment_method ?? 'cod') as 'cod' | 'bpm',
    notes: row.notes ?? undefined,
    pickupTime: row.pickup_time ?? '',
    specialRequests: row.special_requests ?? undefined,
    status: (row.status ?? 'pending') as 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected',
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    cancellationReason: (row as any).cancellation_reason ?? undefined,
  };
};

const toBookingInsert = (data: any): TablesInsert<'bookings'> => {
  // Convert pickup_time from ISO string to time format (HH:MM:SS)
  let formattedPickupTime = data.pickupTime;
  if (formattedPickupTime && typeof formattedPickupTime === 'string') {
    // If it's an ISO string, extract just the time part
    if (formattedPickupTime.includes('T')) {
      const date = new Date(formattedPickupTime);
      formattedPickupTime = date.toTimeString().split(' ')[0]; // Gets "HH:MM:SS"
    }
  }

  const basePayload: any = {
    pickup_location: data.pickupLocation,
    destination_location: data.destinationLocation,
    from_ksar: data.fromKsar ?? null,
    passenger_id: data.passengerId ?? null,
    driver_id: data.driverId ?? null,
    trip_id: data.tripId ?? null,
    seats_booked: data.seatsBooked ?? 1,
    total_amount: data.totalAmount ?? null,
    payment_method: data.paymentMethod ?? 'cod',
    notes: data.notes ?? null,
    pickup_time: formattedPickupTime ?? null,
    special_requests: data.specialRequests ?? null,
    status: data.status ?? 'pending',
    created_at: data.createdAt ?? new Date().toISOString(),
    updated_at: data.updatedAt ?? new Date().toISOString(),
  };

  // Add pickup_point and destination_point if provided
  // NOTE: Requires migration: supabase/migrations/20260211000000_add_detailed_locations_to_bookings.sql
  if (data.pickupPoint && typeof data.pickupPoint === 'string' && data.pickupPoint.trim() !== '') {
    basePayload.pickup_point = data.pickupPoint;
  }
  if (data.destinationPoint && typeof data.destinationPoint === 'string' && data.destinationPoint.trim() !== '') {
    basePayload.destination_point = data.destinationPoint;
  }
  return basePayload;
};

const mapNotification = (row: NotificationRow | null) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: (row.type ?? 'system') as 'booking' | 'trip' | 'system' | 'payment',
    isRead: row.is_read ?? false,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
};

const mapSystemSetting = (row: SystemSettingRow | null) => {
  if (!row) return null;
  const value = typeof row.value === 'string' ? row.value : JSON.stringify(row.value ?? '');
  return {
    id: row.id,
    key: row.key,
    value,
    description: row.description ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
};

const parseSettingValue = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

class SupabaseDatabaseService {
  // Profile operations
  static async createProfile(data: any) {
    if (!data.id) {
      throw new Error('Supabase profiles require an id from auth.users');
    }

    const payload = toProfileInsert(data);
    const { data: result, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const profile = await attachDriverRating(mapProfile(result));

    // Send notification to admin about new user registration
    try {
      if (profile) {
        const { NotificationService } = await import('./notificationService');
        await NotificationService.notifyAdminNewUser({
          userId: profile.id,
          userRole: profile.role,
          userName: profile.fullName || `${profile.firstName} ${profile.lastName}`.trim(),
          userEmail: profile.email || ''
        });
      }
    } catch (notificationError) {
      // Don't fail profile creation if notification fails
    }

    return profile;
  }

  static async getProfile(id: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,full_name,first_name,last_name,phone,role,avatar_url,is_verified,language,age,ksar,wilaya,commune,address,created_at,updated_at')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        // Log error but don't throw for 406 or other non-critical errors
        // Return null instead of throwing - let caller handle retry logic
        if (error.code === 'PGRST116' || error.message?.includes('406') || error.message?.includes('not found')) {
          return null;
        }
        // For other errors, still return null to allow retry
        return null;
      }

      if (!data) {
        return null;
      }
      const mappedProfile = attachDriverRating(mapProfile(data));
      return mappedProfile;
    } catch (error: any) {
      return null;
    }
  }

  static async getProfileByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,full_name,first_name,last_name,phone,role,avatar_url,is_verified,language,created_at,updated_at')
        .ilike('email', email)
        .maybeSingle();

      if (error) {
        // Log error but don't throw for 406 or other non-critical errors
        // Return null instead of throwing - let caller handle retry logic
        if (error.code === 'PGRST116' || error.message?.includes('406') || error.message?.includes('not found')) {
          return null;
        }
        // For other errors, still return null to allow retry
        return null;
      }

      if (!data) {
        return null;
      }

      return attachDriverRating(mapProfile(data));
    } catch (error: any) {
      return null;
    }
  }

  static async updateProfile(id: string, data: ProfileUpdateData) {
    const { data: result, error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return attachDriverRating(mapProfile(result));
  }

  static async deleteProfile(id: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }

  // Vehicle operations
  static async createVehicle(data: any) {
    try {
      const payload = toVehicleInsert(data);
      // Verify session before creating vehicle
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!session || !user) {
        throw new Error('No active session. Please ensure you are logged in.');
      }
      
      if (user.id !== data.driverId) {
        throw new Error('User ID mismatch. Cannot create vehicle for different user.');
      }
      const { data: result, error } = await supabase
        .from('vehicles')
        .insert(payload)
        .select()
        .single();

      if (error) {
        // Provide more descriptive error messages
        let errorMessage = 'حدث خطأ أثناء إنشاء المركبة';
        if (error.message) {
          errorMessage = error.message;
        }
        if (error.details) {
          errorMessage += `: ${error.details}`;
        }
        if (error.code === '42501') {
          errorMessage = 'خطأ في الصلاحيات: لا يمكن إنشاء المركبة. يرجى التحقق من أنك مسجل الدخول.';
        }
        
        throw new Error(errorMessage);
      }
      return mapVehicle(result);
    } catch (error) {
      throw error;
    }
  }

  static async getVehicles(driverId?: string) {
    let query = supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    if (driverId) {
      query = query.eq('driver_id', driverId);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const mappedVehicles = (data ?? []).map(mapVehicle).filter(Boolean);
    return mappedVehicles;
  }

  static async getVehiclesByDriver(driverId: string) {
    return this.getVehicles(driverId);
  }

  static async getVehicleById(id: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return mapVehicle(data);
  }

  static async updateVehicle(id: string, data: VehicleUpdateData) {
    try {
      const { data: result, error } = await supabase
        .from('vehicles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Provide more descriptive error messages
        let errorMessage = 'حدث خطأ أثناء تحديث المركبة';
        if (error.message) {
          errorMessage = error.message;
        }
        if (error.details) {
          errorMessage += `: ${error.details}`;
        }
        
        throw new Error(errorMessage);
      }

      return mapVehicle(result);
    } catch (error) {
      throw error;
    }
  }

  static async deleteVehicle(id: string) {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }

  // Trip operations
  static async createTrip(data: any) {
    try {
      const payload = toTripInsert(data);
      
      // Log the payload for debugging
      // Check if driver is suspended before creating trip
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // Check if user is suspended
      const isSuspended = await this.isUserSuspended(user.id);
      if (isSuspended) {
        throw new Error('تم إيقاف حسابك بسبب تجاوز حد الإلغاءات. يرجى التواصل مع الدعم لإعادة فتح الحساب.');
      }
      
      // Validate payload before sending to Supabase
      if (!payload.driver_id) {
        throw new Error('معرف السائق مطلوب');
      }
      
      if (!payload.from_wilaya_id || !payload.to_wilaya_id) {
        throw new Error('معرف الولاية مطلوب');
      }
      
      if (!payload.departure_date || !payload.departure_time) {
        throw new Error('تاريخ ووقت الانطلاق مطلوبان');
      }
      
      if (payload.price_per_seat == null || payload.total_seats == null) {
        throw new Error('السعر وعدد المقاعد مطلوبان');
      }
      
      if (payload.available_seats == null) {
        throw new Error('عدد المقاعد المتاحة مطلوب');
      }
      const { data: result, error } = await supabase
        .from('trips')
        .insert(payload)
        .select()
        .single();

      if (error) {
        // Provide more descriptive error messages
        let errorMessage = 'حدث خطأ أثناء إنشاء الرحلة';
        if (error.message) {
          errorMessage = error.message;
        }
        if (error.details) {
          errorMessage += `: ${error.details}`;
        }
        
        throw new Error(errorMessage);
      }

      const trip = mapTrip(result);

      // Send notification to admin about new trip
      try {
        const { NotificationService } = await import('./notificationService');
        // Get driver profile to get the actual driver name
        let driverName = 'سائق جديد';
        try {
          const driverProfile = await this.getProfile(trip.driverId);
          if (driverProfile) {
            driverName = driverProfile.fullName || `${driverProfile.firstName} ${driverProfile.lastName}` || 'سائق';
          }
        } catch (profileError) {
        }
        
        await NotificationService.notifyAdminTripStatusChange({
          tripId: trip.id,
          driverId: trip.driverId,
          driverName: driverName,
          fromLocation: trip.fromWilayaName || 'موقع غير محدد',
          toLocation: trip.toWilayaName || 'موقع غير محدد',
          oldStatus: 'none',
          newStatus: 'scheduled',
          reason: 'تم إنشاء رحلة جديدة'
        });
      } catch (notificationError) {
        // Don't fail trip creation if notification fails
      }

      return trip;
    } catch (error) {
      throw error;
    }
  }

  static async getTrips(driverId?: string, options?: { includeInactive?: boolean }) {
    let query = supabase
      .from('trips')
      .select('*')
      .order('departure_date', { ascending: true });

    if (driverId) {
      query = query.eq('driver_id', driverId);
    }

    const { data: tripsRows, error } = await query;

    if (error) {
      throw error;
    }
    const trips = (tripsRows ?? []).map(mapTrip).filter(Boolean) as any[];
    if (trips.length === 0) return [];

    // Compute availability from bookings including pending to avoid relying on trips.available_seats updates
    const tripIds = trips.map((t) => t.id);
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('trip_id, seats_booked, status, id, created_at')
      .in('trip_id', tripIds)
      .in('status', ['pending', 'confirmed', 'in_progress', 'completed'])
      .order('created_at', { ascending: false });
    if (bookingsError) {
      // Even on error, return trips as-is
      return trips;
    }

    const seatsByTrip: Record<string, number> = {};
    (bookings ?? []).forEach((b: any) => {
      const key = String(b.trip_id);
      seatsByTrip[key] = (seatsByTrip[key] ?? 0) + (b.seats_booked ?? 0);
    });
    // Build driver rating map (average and count)
    const driverIds = Array.from(new Set(trips.map((t) => t.driverId).filter(Boolean)));
    let ratingsByDriver: Record<string, { avg: number; count: number }> = {};
    if (driverIds.length) {
      const { data: ratingsRows, error: ratingsErr } = await supabase
        .from('ratings' as any)
        .select('driver_id, rating')
        .in('driver_id', driverIds as any);
      if (!ratingsErr && ratingsRows) {
        for (const r of ratingsRows as any[]) {
          const key = String(r.driver_id);
          const prev = ratingsByDriver[key] ?? { avg: 0, count: 0 };
          ratingsByDriver[key] = { avg: prev.avg + (r.rating ?? 0), count: prev.count + 1 };
        }
        for (const key of Object.keys(ratingsByDriver)) {
          const { avg, count } = ratingsByDriver[key];
          ratingsByDriver[key] = { avg: count ? Math.round((avg / count) * 10) / 10 : 0, count };
        }
      }
    }

    const mappedTrips = trips.map((t) => {
      const booked = seatsByTrip[String(t.id)] ?? 0;
      const availableSeats = Math.max((t.totalSeats ?? 0) - booked, 0);
      let status = t.status;
      
      // Preserve cancelled status - don't change it based on seat availability
      if (status !== 'cancelled' && status !== 'completed') {
        if (status === 'scheduled' && availableSeats === 0) status = 'fully_booked';
        if (status === 'fully_booked' && availableSeats > 0) status = 'scheduled';
      }
      
      const ratingInfo = ratingsByDriver[String(t.driverId)] ?? { avg: 0, count: 0 };
      
        // Only log non-cancelled trips, or all trips if includeInactive is true (for admin)
        // Suppress cancelled trips logs to reduce console noise
        if (options?.includeInactive || (status !== 'cancelled' && status !== 'completed')) {
          // Only log active trips to reduce console noise
        }
      
      return { ...t, availableSeats, status, driverAverageRating: ratingInfo.avg, driverRatingsCount: ratingInfo.count };
    });

    // If includeInactive is true (for admin), return all trips including cancelled ones
    if (options?.includeInactive) {
      return mappedTrips;
    }

    // Otherwise, filter out cancelled trips and trips with no available seats
    const filteredTrips = mappedTrips.filter((t) => t.status !== 'cancelled' && t.availableSeats > 0);
    
    // Log summary of filtered trips
    if (mappedTrips.length !== filteredTrips.length) {
      const cancelledCount = mappedTrips.filter((t) => t.status === 'cancelled').length;
      const noSeatsCount = mappedTrips.filter((t) => t.status !== 'cancelled' && t.availableSeats === 0).length;
    }
    
    return filteredTrips;
  }

  static async getTripsByDriver(driverId: string) {
    return this.getTrips(driverId);
  }

  static async getAvailableTrips() {
    // Fetch scheduled trips first
    const { data: tripsRows, error } = await supabase
      .from('trips')
      .select('*')
      .eq('status', 'scheduled')
      .order('departure_date', { ascending: true });

    if (error) {
      throw error;
    }

    const trips = (tripsRows ?? []).map(mapTrip).filter(Boolean) as any[];
    if (trips.length === 0) return [];

    // Compute availability from bookings including pending
    const tripIds = trips.map((t) => t.id);
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('trip_id, seats_booked, status')
      .in('trip_id', tripIds)
      .in('status', ['pending', 'confirmed', 'in_progress', 'completed']);

    if (bookingsError) {
      return trips;
    }

    const seatsByTrip: Record<string, number> = {};
    (bookings ?? []).forEach((b: any) => {
      const key = String(b.trip_id);
      seatsByTrip[key] = (seatsByTrip[key] ?? 0) + (b.seats_booked ?? 0);
    });

    // Build driver rating map (average and count)
    const driverIds = Array.from(new Set(trips.map((t) => t.driverId).filter(Boolean)));
    let ratingsByDriver: Record<string, { avg: number; count: number }> = {};
    if (driverIds.length) {
      const { data: ratingsRows, error: ratingsErr } = await supabase
        .from('ratings' as any)
        .select('driver_id, rating')
        .in('driver_id', driverIds as any);
      if (!ratingsErr && ratingsRows) {
        for (const r of ratingsRows as any[]) {
          const key = String(r.driver_id);
          const prev = ratingsByDriver[key] ?? { avg: 0, count: 0 };
          ratingsByDriver[key] = { avg: prev.avg + (r.rating ?? 0), count: prev.count + 1 };
        }
        for (const key of Object.keys(ratingsByDriver)) {
          const { avg, count } = ratingsByDriver[key];
          ratingsByDriver[key] = { avg: count ? Math.round((avg / count) * 10) / 10 : 0, count };
        }
      }
    }

    // Return only those with seats currently available
    return trips
      .map((t) => {
        const booked = seatsByTrip[String(t.id)] ?? 0;
        const availableSeats = Math.max((t.totalSeats ?? 0) - booked, 0);
        const ratingInfo = ratingsByDriver[String(t.driverId)] ?? { avg: 0, count: 0 };
        return { ...t, availableSeats, driverAverageRating: ratingInfo.avg, driverRatingsCount: ratingInfo.count };
      })
      .filter((t) => t.availableSeats > 0);
  }

  static async getTripsWithDetails(driverId?: string, options?: { includeInactive?: boolean }) {
    const trips = await this.getTrips(driverId, options);

    if (trips.length === 0) return [];

    // Filter out empty or null driverIds
    const driverIds = Array.from(new Set(
      trips
        .map((trip) => trip.driverId)
        .filter((id) => id && id !== '' && id !== null && id !== undefined)
    ));
    const vehicleIds = Array.from(new Set(
      trips
        .map((trip) => trip.vehicleId)
        .filter((id) => id && id !== '' && id !== null && id !== undefined)
    ));
    const [drivers, vehicles] = await Promise.all([
      driverIds.length
        ? supabase
            .from('profiles')
            .select('*')
            .in('id', driverIds)
        : Promise.resolve({ data: [] as ProfileRow[], error: null }),
      vehicleIds.length
        ? supabase
            .from('vehicles')
            .select('*')
            .in('id', vehicleIds)
        : Promise.resolve({ data: [] as VehicleRow[], error: null }),
    ]);

    if (drivers.error) {
      throw drivers.error;
    }

    if (vehicles.error) {
      throw vehicles.error;
    }
    const driverMap = await buildProfileMapWithRatings(drivers.data ?? []);
    const vehicleMap = new Map((vehicles.data ?? []).map((row) => [row.id, mapVehicle(row)]));
    // Use getWilayaNameById to get wilaya names from local data
    // This is more reliable than fetching from database and ensures consistency
    const enhancedTrips = trips.map((trip) => {
      // Ensure fromKsar is preserved in the enhanced trip
      const driver = trip.driverId ? driverMap.get(trip.driverId) ?? null : null;
      const vehicle = trip.vehicleId ? vehicleMap.get(trip.vehicleId) ?? null : null;
      
      // Get wilaya names using local function (more reliable)
      // Always use getWilayaNameById to ensure we get the correct name from local data
      // Only use existing names if they're not 'غير محدد'
      const fromWilayaName = (trip.fromWilayaName && trip.fromWilayaName !== 'غير محدد') 
        ? trip.fromWilayaName 
        : getWilayaNameById(trip.fromWilayaId);
      const toWilayaName = (trip.toWilayaName && trip.toWilayaName !== 'غير محدد') 
        ? trip.toWilayaName 
        : getWilayaNameById(trip.toWilayaId);
      
      // Debug: Log if driver is missing
      if (trip.driverId && !driver) {
      } else if (driver) {
      }
      
      // Debug: Log if wilaya names are missing
      if (fromWilayaName === 'غير محدد' || toWilayaName === 'غير محدد') {
      }
      
      const enhancedTrip = {
        ...trip,
        fromKsar: trip.fromKsar, // Explicitly preserve fromKsar
        toKsar: trip.toKsar, // Explicitly preserve toKsar
        driver: driver,
        vehicle: vehicle,
        fromWilayaName: fromWilayaName,
        toWilayaName: toWilayaName,
      };
      
      return enhancedTrip;
    });
    return enhancedTrips;
  }

  static async updateTrip(id: string, data: TripUpdateData) {
    const { data: result, error } = await supabase
      .from('trips')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Provide more descriptive error messages
      let errorMessage = 'حدث خطأ أثناء تحديث الرحلة';
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.details) {
        errorMessage += `: ${error.details}`;
      }
      
      throw new Error(errorMessage);
    }
    // Log cancellation if trip status changed to cancelled
    if (data.status === 'cancelled') {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (!authError && user) {
          // Get trip details to check previous status
          const { data: tripData, error: tripError } = await supabase
            .from('trips')
            .select('status, driver_id')
            .eq('id', id)
            .single();
          
          if (!tripError && tripData) {
            // Since we're updating to cancelled, we should always log the cancellation
            // The trip is now cancelled, so we log it
            await this.logCancellation(
              user.id,
              'driver',
              'trip_cancellation',
              id,
              undefined,
              (data as any).cancellation_reason || 'تم إلغاء الرحلة'
            );
            // Check if driver should be suspended due to cancellation limit
            try {
              const cancellationCount = await this.getCancellationCountLast15Days(user.id, 'driver');
              if (cancellationCount >= 3) {
                // Get driver profile for Telegram notification
                const driverProfile = await this.getProfile(user.id);
                const driverName = driverProfile?.fullName || `${driverProfile?.firstName || ''} ${driverProfile?.lastName || ''}`.trim() || 'سائق';
                const suspensionReason = `تجاوز حد الإلغاءات (${cancellationCount} إلغاءات في 15 يوم)`;
                
                // Suspend the driver account
                await this.suspendUserAccount(
                  user.id,
                  'cancellation_limit',
                  `تم إيقاف الحساب بسبب ${suspensionReason}`
                );
                
              // Create notification for the driver
              await this.createNotification({
                userId: user.id,
                title: 'تم إيقاف حسابك',
                message: `تم إيقاف حسابك بسبب ${suspensionReason}. يرجى التواصل مع الدعم لإعادة فتح الحساب.`,
                type: 'account_suspended',
                priority: 'high'
              });
              
              // Send Telegram notification for account suspension
              try {
                const { TelegramService } = await import('@/integrations/telegram/telegramService');
                await TelegramService.notifyAccountSuspended({
                  userName: driverName,
                  userRole: 'driver',
                  userEmail: driverProfile?.email || 'غير محدد',
                  userId: user.id,
                  reason: suspensionReason
                });
              } catch (telegramError) {
              }
              } else {
              }
            } catch (suspensionError) {
              // Don't throw error here to avoid breaking the trip update
            }
          } else {
          }
        } else {
        }
      } catch (cancellationError) {
        // Don't throw error here to avoid breaking the trip update
      }
    } else {
    }

    return mapTrip(result);
  }

  static async deleteTrip(id: string) {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }

  // Get trip deletion count for a driver in the last 24 hours
  static async getTripDeletionCount(driverId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('count_trip_deletions_last_24h', {
        driver_uuid: driverId
      });

      if (error) {
        throw error;
      }

      return data || 0;
    } catch (error) {
      // Fallback: query trip_deletions table directly
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count, error: queryError } = await supabase
          .from('trip_deletions')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', driverId)
          .gte('deleted_at', twentyFourHoursAgo);

        if (queryError) {
          return 0;
        }

        return count || 0;
      } catch (fallbackError) {
        return 0;
      }
    }
  }

  static async getTripById(id: string) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return mapTrip(data);
  }

  // Booking operations
  static async createBooking(data: any) {
    // Check if passenger is suspended before creating booking
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('المستخدم غير مسجل الدخول');
    }

    // Check if user is suspended
    const isSuspended = await this.isUserSuspended(user.id);
    if (isSuspended) {
      throw new Error('تم إيقاف حسابك بسبب تجاوز حد الإلغاءات. يرجى التواصل مع الدعم لإعادة فتح الحساب.');
    }

    // Validate seat availability before creating booking
    const seatsRequested = data.seatsBooked || 1;
    const tripId = data.tripId;

    if (tripId) {
      // Get current trip details and availability
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('total_seats, available_seats, status')
        .eq('id', tripId)
        .single();

      if (tripError) {
        throw new Error('حدث خطأ أثناء التحقق من الرحلة');
      }

      if (!trip) {
        throw new Error('الرحلة غير موجودة');
      }

      // Check if trip is still available for booking
      if (trip.status === 'completed' || trip.status === 'cancelled') {
        throw new Error('لا يمكن الحجز على هذه الرحلة - الرحلة مكتملة أو ملغية');
      }

      // Get current bookings to calculate real availability
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('seats_booked, status')
        .eq('trip_id', tripId)
        .in('status', ['pending', 'confirmed', 'in_progress', 'completed']);

      if (bookingsError) {
        throw new Error('حدث خطأ أثناء التحقق من المقاعد المتاحة');
      }

      // Calculate actual seats available
      const seatsBooked = (bookings ?? []).reduce((sum, booking) => sum + (booking.seats_booked ?? 0), 0);
      const seatsAvailable = Math.max(trip.total_seats - seatsBooked, 0);

      // Validate seat availability
      if (seatsRequested > seatsAvailable) {
        throw new Error(`المقاعد المتاحة فقط ${seatsAvailable} مقعد، طلبت ${seatsRequested} مقاعد`);
      }
    }

    const payload = toBookingInsert(data);
    const { data: result, error } = await supabase
      .from('bookings')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'فشل إنشاء الحجز');
    }

    // Update trip availability immediately for pending bookings as well
    // Seats should be reserved upon booking request in case the driver forgets to confirm
    if (result?.trip_id) {
      await this.updateTripAvailability(result.trip_id);
    }

    // Send booking creation notifications
    try {
      const { NotificationService } = await import('./notificationService');
      if (!result.driver_id) {
        return mapBooking(result);
      }
      
      await NotificationService.notifyBookingCreated({
        bookingId: result.id,
        passengerId: result.passenger_id || '',
        driverId: result.driver_id || '',
        tripId: result.trip_id || '',
        pickupLocation: result.pickup_location || '',
        destinationLocation: result.destination_location || '',
        seatsBooked: result.seats_booked || 1,
        totalAmount: result.total_amount || 0,
        paymentMethod: result.payment_method || 'cod'
      });
    } catch (notificationError) {
      // Don't fail the booking creation if notifications fail
    }

    return mapBooking(result);
  }

  static async getBookings(passengerId?: string, driverId?: string) {
    let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });

    if (passengerId) {
      query = query.eq('passenger_id', passengerId);
    }

    if (driverId) {
      query = query.eq('driver_id', driverId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const bookings = (data ?? []).map(mapBooking).filter(Boolean);
    return bookings;
  }

  static async getBookingsWithDetails(passengerId?: string, driverId?: string) {
    const bookings = await this.getBookings(passengerId, driverId);

    if (bookings.length === 0) return [];

    const passengerIds = Array.from(new Set(bookings.map((booking) => booking.passengerId).filter(Boolean)));
    const driverIds = Array.from(new Set(bookings.map((booking) => booking.driverId).filter(Boolean)));
    const tripIds = Array.from(new Set(bookings.map((booking) => booking.tripId).filter(Boolean)));

    const [passengers, drivers, trips] = await Promise.all([
      passengerIds.length
        ? supabase.from('profiles').select('id,email,full_name,first_name,last_name,phone,role,avatar_url,is_verified,language,created_at,updated_at').in('id', passengerIds)
        : Promise.resolve({ data: [] as ProfileRow[], error: null }),
      driverIds.length
        ? supabase.from('profiles').select('id,email,full_name,first_name,last_name,phone,role,avatar_url,is_verified,language,created_at,updated_at').in('id', driverIds)
        : Promise.resolve({ data: [] as ProfileRow[], error: null }),
      tripIds.length
        ? supabase.from('trips').select('*').in('id', tripIds)
        : Promise.resolve({ data: [] as TripRow[], error: null }),
    ]);

    if (passengers.error) {
      throw passengers.error;
    }

    if (drivers.error) {
      throw drivers.error;
    }

    if (trips.error) {
      throw trips.error;
    }

    const [passengerMap, driverMap] = await Promise.all([
      buildProfileMapWithRatings(passengers.data ?? []),
      buildProfileMapWithRatings(drivers.data ?? []),
    ]);
    const tripMap = new Map((trips.data ?? []).map((row) => [row.id, mapTrip(row)]));

    return bookings.map((booking) => ({
      ...booking,
      passenger: booking.passengerId ? passengerMap.get(booking.passengerId) ?? null : null,
      driver: booking.driverId ? driverMap.get(booking.driverId) ?? null : null,
      trip: booking.tripId ? tripMap.get(booking.tripId) ?? null : null,
    }));
  }



  static async deleteBooking(id: number) {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }

  static async getRecentBookings(days: number = 30) {
    try {
      // Fallback to regular query since view doesn't exist
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
      
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Get additional details for the bookings
      const bookings = (data ?? []).map(mapBooking).filter(Boolean);
      if (bookings.length === 0) return [];

      const passengerIds = Array.from(new Set(bookings.map((booking) => booking.passengerId).filter(Boolean)));
      const driverIds = Array.from(new Set(bookings.map((booking) => booking.driverId).filter(Boolean)));
      const tripIds = Array.from(new Set(bookings.map((booking) => booking.tripId).filter(Boolean)));

      const [passengers, drivers, trips] = await Promise.all([
        passengerIds.length
          ? supabase.from('profiles').select('id,email,full_name,first_name,last_name,phone,role,avatar_url,is_verified,language,created_at,updated_at').in('id', passengerIds)
          : Promise.resolve({ data: [] as ProfileRow[], error: null }),
        driverIds.length
          ? supabase.from('profiles').select('id,email,full_name,first_name,last_name,phone,role,avatar_url,is_verified,language,created_at,updated_at').in('id', driverIds)
          : Promise.resolve({ data: [] as ProfileRow[], error: null }),
        tripIds.length
          ? supabase.from('trips').select('*').in('id', tripIds)
          : Promise.resolve({ data: [] as TripRow[], error: null }),
      ]);

      if (passengers.error) {
        throw passengers.error;
      }

      if (drivers.error) {
        throw drivers.error;
      }

      if (trips.error) {
        throw trips.error;
      }

      const [passengerMap, driverMap] = await Promise.all([
        buildProfileMapWithRatings(passengers.data ?? []),
        buildProfileMapWithRatings(drivers.data ?? []),
      ]);
      const tripMap = new Map((trips.data ?? []).map((row) => [row.id, mapTrip(row)]));

      return bookings.map((booking) => ({
        ...booking,
        passenger: booking.passengerId ? passengerMap.get(booking.passengerId) ?? null : null,
        driver: booking.driverId ? driverMap.get(booking.driverId) ?? null : null,
        trip: booking.tripId ? tripMap.get(booking.tripId) ?? null : null,
      }));
    } catch (error) {
      throw error;
    }
  }

  static async getBookingsByPassenger(passengerId: string) {
    return this.getBookings(passengerId, undefined);
  }

  static async getBookingsByDriver(driverId: string) {
    return this.getBookings(undefined, driverId);
  }

  static async getBookingById(id: string | number) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', typeof id === 'string' ? Number(id) : id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return mapBooking(data);
  }

  static async updateBooking(id: string | number, data: BookingUpdateData) {
    try {
      // Ensure id is properly converted to number
      const bookingId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      // Validate that the booking ID is a valid number
      if (isNaN(bookingId)) {
        throw new Error(`Invalid booking ID: ${id}`);
      }
      // Check authentication and permissions
      const { user, booking } = await checkAuthAndPermissions(bookingId);
      // Try updating with explicit user permission check
      let result, error;
      
      // Method 1: Try with passenger_id filter first
      if (booking.passenger_id === user.id) {
        const updateResult = await supabase
          .from('bookings')
          .update({ 
            ...data, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', bookingId as any)
          .eq('passenger_id', user.id)
          .select()
          .maybeSingle();
        
        result = updateResult.data;
        error = updateResult.error;
      }
      
      // Method 2: Try with driver_id filter if passenger update failed
      if ((error || !result) && booking.driver_id === user.id) {
        const driverUpdateResult = await supabase
          .from('bookings')
          .update({ 
            ...data, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', bookingId as any)
          .eq('driver_id', user.id)
          .select()
          .maybeSingle();
        
        result = driverUpdateResult.data;
        error = driverUpdateResult.error;
      }

      // Method 3: Try updating only status if full update fails
      if ((error || !result) && data.status) {
        const statusUpdateResult = await supabase
          .from('bookings')
          .update({ 
            status: data.status,
            updated_at: new Date().toISOString() 
          })
          .eq('id', bookingId as any)
          .select()
          .maybeSingle();
        
        result = statusUpdateResult.data;
        error = statusUpdateResult.error;
      }

      if (error || !result) {
        throw error || new Error('Failed to update booking');
      }
      if (result?.trip_id) {
        await this.updateTripAvailability(result.trip_id);
      }

      // NOTE: Notifications are now handled by BookingTrackingService.trackStatusChange
      // We don't send notifications here to avoid duplicate notifications
      // The trackStatusChange method handles all notifications
      // Log cancellation if status changed to cancelled (before returning)
      if (data.status === 'cancelled' && booking.status !== 'cancelled') {
        try {
          // Determine user type based on who is cancelling
          const userType = booking.passenger_id === user.id ? 'passenger' : 'driver';
          await this.logCancellation(
            user.id,
            userType,
            'booking_cancellation',
            result.trip_id,
            typeof bookingId === 'string' ? parseInt(bookingId) : bookingId,
            (data as any).cancellation_reason || 'تم إلغاء الحجز'
          );
          // Check if user should be suspended due to cancellation limit
          try {
            const cancellationCount = await this.getCancellationCountLast15Days(user.id, 'driver');
            if (cancellationCount >= 3) {
              // Get user profile for Telegram notification
              const userProfile = await this.getProfile(user.id);
              const userName = userProfile?.fullName || `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'مستخدم';
              const userRole = userProfile?.role === 'driver' ? 'driver' : 'passenger';
              const suspensionReason = `تجاوز حد الإلغاءات (${cancellationCount} إلغاءات في 15 يوم)`;
              
              // Suspend the user account
              await this.suspendUserAccount(
                user.id,
                'cancellation_limit',
                `تم إيقاف الحساب بسبب ${suspensionReason}`
              );
              
              // Create notification for the user
              await this.createNotification({
                userId: user.id,
                title: 'تم إيقاف حسابك',
                message: `تم إيقاف حسابك بسبب ${suspensionReason}. يرجى التواصل مع الدعم لإعادة فتح الحساب.`,
                type: 'account_suspended',
                priority: 'high'
              });
              
              // Send Telegram notification for account suspension
              try {
                const { TelegramService } = await import('@/integrations/telegram/telegramService');
                await TelegramService.notifyAccountSuspended({
                  userName,
                  userRole: userRole as 'driver' | 'passenger',
                  userEmail: userProfile?.email || 'غير محدد',
                  userId: user.id,
                  reason: suspensionReason
                });
              } catch (telegramError) {
              }
            }
          } catch (suspensionError) {
            // Don't throw error here to avoid breaking the booking update
          }
        } catch (cancellationError) {
          // Don't throw error here to avoid breaking the booking update
        }
      }
      return mapBooking(result);
    } catch (error: any) {
      throw error;
    }
  }

  // Notification operations

  // System settings operations
  static async updateSystemSetting(key: string, value: string, description?: string) {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert(
        {
          id: generateId(),
          key,
          value: parseSettingValue(value),
          description: description ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapSystemSetting(data);
  }

  static async getSystemSettings() {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapSystemSetting).filter(Boolean);
  }

  // Initialization helpers (no-op in Supabase context)
  static async initializeDefaultData() {
    return;
  }

  static async setSeedDemoData(enabled: boolean) {
    await this.updateSystemSetting('seed_demo_data', JSON.stringify(enabled));
  }

  static async getStats() {
    const [profiles, trips, bookings] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('trips').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
    ]);

    return {
      profiles: profiles.count ?? 0,
      trips: trips.count ?? 0,
      bookings: bookings.count ?? 0,
    };
  }

  static async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const profileMap = await buildProfileMapWithRatings(data ?? []);
    return Array.from(profileMap.values());
  }

  static async getAllVehicles() {
    return this.getVehicles();
  }

  static async getAllBookings() {
    return this.getBookings();
  }

  static async getWilayas() {
    return wilayas;
  }

  static async getWilayaById(id: number) {
    const code = String(id).padStart(2, '0');
    return wilayas.find((w) => w.code === code) ?? null;
  }

  static async completeTripForAllPassengers(tripId: string) {
    try {
      // Get all bookings for this trip
      const { data: tripBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          passenger:profiles!bookings_passenger_id_fkey(*),
          driver:profiles!bookings_driver_id_fkey(*),
          trip:trips(*)
        `)
        .eq('trip_id', tripId)
        .in('status', ['pending', 'confirmed']);

      if (bookingsError) {
        throw bookingsError;
      }

      if (!tripBookings || tripBookings.length === 0) {
        // Define a simple return type to avoid deep type instantiation
        const result: { completedBookings: number; tripId: string } = {
          completedBookings: 0,
          tripId: tripId,
        };
        return result;
      }

      // Update all bookings to completed status
      const bookingIds = tripBookings.map(booking => booking.id);
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .in('id', bookingIds);

      if (updateError) {
        throw updateError;
      }

      // Update trip status to completed (set is_active to false)
      const { error: tripUpdateError } = await supabase
        .from('trips')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId);

      if (tripUpdateError) {
        throw tripUpdateError;
      }

      // Define a simple return type to avoid deep type instantiation
      const result: { completedBookings: number; tripId: string } = {
        completedBookings: tripBookings.length,
        tripId: tripId,
      };
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Updated method to get driver statistics with new trip completion logic
  static async getDriverStats(driverId: string) {
    try {
      // Count completed trips using the new logic
      const completedTripsCount = await this.getDriverCompletedTripsCount(driverId);

      // Count completed bookings
      const { count: completedBookingsCount, error: bookingsError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', driverId)
        .eq('status', 'completed');

      if (bookingsError) {
        throw bookingsError;
      }

      const ratingSummary = await fetchDriverRatingSummary(driverId);

      // Define a simple return type to avoid deep type instantiation
      const result: { completedTrips: number; averageRating: number; totalEarnings: number } = {
        completedTrips: completedTripsCount,
        averageRating: ratingSummary.averageRating,
        totalEarnings: 0 // We'll implement earnings calculation later if needed
      };
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getDriverRatingsSummary(driverId: string) {
    return fetchDriverRatingSummary(driverId);
  }

  static async getDriverCompletedTripsCount(driverId: string) {
    try {
      // Get unique trips that have been completed
      // Add ts-ignore to avoid deep type instantiation issues
      // @ts-ignore
      const { data, error } = await supabase
        .from('trips')
        .select('id')
        .eq('driver_id', driverId)
        .eq('is_active', false);

      if (error) {
        throw error;
      }

      // For each trip, check if it has completed bookings
      let count = 0;
      for (const trip of data || []) {
        // @ts-ignore
        const { count: bookingCount, error: bookingError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', trip.id)
          .eq('status', 'completed');

        if (bookingError) {
          continue;
        }

        if (bookingCount && bookingCount > 0) {
          count++;
        }
      }

      return count;
    } catch (error) {
      throw error;
    }
  }

  static async clearAllData() {
    await supabase.from('notifications').delete().neq('id', '' as any);
    await supabase.from('bookings').delete().neq('id', '' as any);
    await supabase.from('trips').delete().neq('id', '' as any);
    await supabase.from('vehicles').delete().neq('id', '' as any);
  }

  static async resetToDefaultData() {
    await this.clearAllData();
    await supabase.from('system_settings').delete().neq('key', '');
  }

  // Utility function to create an admin user manually
  static async createAdminUser(adminData: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    phone: string;
    wilaya?: string;
    commune?: string;
    address?: string;
  }) {
    try {
      const profile = await this.createProfile({
        ...adminData,
        role: 'admin',
        wilaya: adminData.wilaya || 'الجزائر',
        commune: adminData.commune || 'الجزائر الوسطى',
        address: adminData.address || 'غير محدد',
        isVerified: true,
      });
      return profile;
    } catch (error) {
      throw error;
    }
  }

  // Update trip availability based on bookings that were accepted by the driver
  static async updateTripAvailability(tripId: string) {
    try {
      // Get all bookings for this trip including pending ones to reserve seats immediately
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('seats_booked, status')
        .eq('trip_id', tripId)
        .in('status', ['pending', 'confirmed', 'in_progress', 'completed']);

      if (bookingsError) {
        throw bookingsError;
      }

      // Calculate total seats booked including pending reservations to prevent overbooking
      const seatsBooked = (bookings ?? []).reduce((sum, booking) => sum + (booking.seats_booked ?? 0), 0);

      // Get trip details
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('total_seats, available_seats, status')
        .eq('id', tripId)
        .maybeSingle();

      if (tripError || !trip) {
        if (tripError) {
          throw tripError;
        }
        return;
      }

      // Once a trip is completed we should keep it closed for new bookings
      if (trip.status === 'completed') {
        if ((trip.available_seats ?? 0) !== 0) {
          await supabase
            .from('trips')
            .update({
              available_seats: 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', tripId);
        }
        return { availableSeats: 0, status: 'completed' };
      }

      // Cancelled trips should keep their current availability without reopening seats
      if (trip.status === 'cancelled') {
        return { availableSeats: trip.available_seats ?? 0, status: 'cancelled' };
      }

      const availableSeats = Math.max(trip.total_seats - seatsBooked, 0);
      
      // Update trip status based on availability
      let newStatus = trip.status;
      if (availableSeats === 0 && trip.status === 'scheduled') {
        newStatus = 'fully_booked';
      } else if (availableSeats > 0 && trip.status === 'fully_booked') {
        newStatus = 'scheduled';
      }

      // Update trip with new availability and status
      const { error: updateError } = await supabase
        .from('trips')
        .update({ 
          available_seats: availableSeats, 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', tripId);

      if (updateError) {
        throw updateError;
      }
      return { availableSeats, status: newStatus };
    } catch (error) {
      throw error;
    }
  }

  // Cancel expired pending bookings (older than 24 hours)
  static async cancelExpiredPendingBookings() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Find pending bookings older than 24 hours
      const { data: expiredBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('id, trip_id')
        .eq('status', 'pending')
        .lt('created_at', twentyFourHoursAgo);

      if (fetchError) {
        throw fetchError;
      }
      // Cancel each expired booking
      if (expiredBookings && expiredBookings.length > 0) {
        for (const booking of expiredBookings) {
          // Update booking status to cancelled
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          if (updateError) {
            continue;
          }

          // Update trip availability after cancelling booking
          if (booking.trip_id) {
            await this.updateTripAvailability(booking.trip_id);
          }
        }
      }

      return expiredBookings?.length || 0;
    } catch (error) {
      throw error;
    }
  }

  // Cancel booking and update trip availability
  static async cancelBooking(bookingId: string, reason?: string) {
    try {
      // Get booking details
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('id, trip_id')
        .eq('id', bookingId as any)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Update booking status to cancelled
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId as any);

      if (updateError) {
        throw updateError;
      }

      // Update trip availability
      if (booking.trip_id) {
        await this.updateTripAvailability(booking.trip_id);
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Create notification
  static async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    category?: string;
    priority?: string;
    status?: string;
    relatedId?: string;
    relatedType?: string;
    actionUrl?: string;
    imageUrl?: string;
    scheduledFor?: string;
    expiresAt?: string;
    metadata?: any;
  }) {
    try {
      // Ensure type is always a valid non-empty string that matches database constraints
      const validTypes = ['booking', 'trip', 'system', 'payment', 'info', 'success', 'warning', 'error'];
      let notificationType = 'info'; // default fallback
      
      if (data.type && data.type.trim() !== '') {
        // If the type is already valid, use it
        if (validTypes.includes(data.type)) {
          notificationType = data.type;
        } else {
          // Map common types to valid ones
          const typeMap: Record<string, string> = {
            'booking_created': 'booking',
            'booking_confirmed': 'booking',
            'booking_cancelled': 'booking',
            'booking_pending': 'booking',
            'booking_rejected': 'booking',
            'booking_modified': 'booking',
            'booking_reminder': 'booking',
            'booking_completed': 'booking',
            'trip_created': 'trip',
            'trip_updated': 'trip',
            'trip_cancelled': 'trip',
            'trip_full': 'trip',
            'trip_starting': 'trip',
            'trip_completed': 'trip',
            'trip_delayed': 'trip',
            'payment_received': 'payment',
            'payment_pending': 'payment',
            'payment_failed': 'payment',
            'payment_refunded': 'payment'
          };
          
          notificationType = typeMap[data.type] || 'info';
        }
      }

      // Try using RPC function first (bypasses RLS)
      try {
        // Try the updated RPC function first (with all parameters)
        let rpcResult, rpcError;
        try {
          const rpcResponse = await supabase.rpc('create_notification', {
            p_user_id: data.userId,
            p_title: data.title,
            p_message: data.message,
            p_type: notificationType,
            p_category: data.category || 'system',
            p_priority: data.priority || 'medium',
            p_status: data.status || 'active',
            p_related_id: data.relatedId || null,
            p_related_type: data.relatedType || null,
            p_action_url: data.actionUrl || null,
            p_image_url: data.imageUrl || null,
            p_scheduled_for: data.scheduledFor || null,
            p_expires_at: data.expiresAt || null,
            p_metadata: data.metadata || {}
          });
          rpcResult = rpcResponse.data;
          rpcError = rpcResponse.error;
        } catch (rpcCallError: any) {
          // If RPC function doesn't exist or has wrong signature, try simple version
          try {
            const simpleRpcResponse = await supabase.rpc('create_notification', {
              p_user_id: data.userId,
              p_title: data.title,
              p_message: data.message,
              p_type: notificationType
            });
            rpcResult = simpleRpcResponse.data;
            rpcError = simpleRpcResponse.error;
          } catch (simpleRpcError) {
            rpcError = simpleRpcError;
            rpcResult = null;
          }
        }
        if (!rpcError && rpcResult) {
          // Fetch the full notification to return
          const { data: fullNotification, error: fetchError } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', rpcResult)
            .maybeSingle();
          
          if (!fetchError && fullNotification) {
            return fullNotification;
          }
          if (fetchError) {
          } else {
          }
          return rpcResult;
        } else if (rpcError) {
        }
      } catch (rpcException: any) {
      }
      
      // Fallback to direct insert
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          title: data.title,
          message: data.message,
          type: notificationType,
          category: data.category || 'system',
          priority: data.priority || 'medium',
          status: data.status || 'active',
          related_id: data.relatedId,
          related_type: data.relatedType,
          action_url: data.actionUrl,
          scheduled_for: data.scheduledFor,
          expires_at: data.expiresAt,
          metadata: data.metadata || {},
          is_read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        // Handle RLS policy violations specifically
        if (error.code === '42501' || (error.message && error.message.includes('row-level security'))) {
          // Try one more time with RPC function as last resort
          try {
            // Try simple RPC function as last resort
            const { data: lastResortResult, error: lastResortError } = await supabase.rpc('create_notification', {
              p_user_id: data.userId,
              p_title: data.title,
              p_message: data.message,
              p_type: notificationType
            });
            
            if (!lastResortError && lastResortResult) {
              const { data: fullNotification } = await supabase
                .from('notifications')
                .select('*')
                .eq('id', lastResortResult)
                .single();
              return fullNotification || lastResortResult;
            }
          } catch (lastResortException) {
          }
          
          // Return a special result to indicate RLS violation
          return { 
            rls_violation: true, 
            message: 'RLS policy violation - cannot create notification for other user',
            data: data
          };
        }
        
        throw error;
      }
      return notification;
    } catch (error) {
      throw error;
    }
  }

  // Get notifications for user
  static async getNotifications(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        // Handle 406 error gracefully (Not Acceptable - usually RLS or schema issue)
        if (error.code === 'PGRST116' || error.message?.includes('406')) {
          return [];
        }
        throw error;
      }

      return (notifications ?? []).map(mapNotification).filter(Boolean);
    } catch (error: any) {
      // Handle 406 error gracefully
      if (error?.code === 'PGRST116' || error?.message?.includes('406') || error?.status === 406) {
        return [];
      }
      throw error;
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Mark all notifications as read for user
  static async markAllNotificationsAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw error;
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get unread notifications count
  static async getUnreadNotificationsCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      throw error;
    }
  }

  // ===== CANCELLATION TRACKING SYSTEM =====

  // Log cancellation and check limits
  static async logCancellation(
    userId: string,
    userType: 'driver' | 'passenger',
    cancellationType: 'trip_cancellation' | 'booking_cancellation',
    tripId?: string,
    bookingId?: number,
    cancellationReason?: string
  ) {
    try {
      const { data, error } = await (supabase as any).rpc('log_cancellation', {
        p_user_id: userId,
        p_user_type: userType,
        p_cancellation_type: cancellationType,
        p_trip_id: tripId || null,
        p_booking_id: bookingId || null,
        p_cancellation_reason: cancellationReason || null
      });

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get cancellation count for user in last 15 days
  static async getCancellationCountLast15Days(userId: string, userType: 'driver' | 'passenger') {
    try {
      const { data, error } = await (supabase as any).rpc('get_cancellation_count_last_15_days', {
        p_user_id: userId,
        p_user_type: userType
      });

      if (error) {
        throw error;
      }
      return data || 0;
    } catch (error) {
      throw error;
    }
  }

  // Check if user is suspended
  static async isUserSuspended(userId: string) {
    try {
      const { data, error } = await (supabase as any).rpc('is_user_suspended', {
        p_user_id: userId
      });

      if (error) {
        throw error;
      }

      return data || false;
    } catch (error) {
      throw error;
    }
  }

  // Suspend user account
  static async suspendUserAccount(
    userId: string,
    suspensionType: 'cancellation_limit' | 'manual' | 'other',
    suspensionReason: string,
    suspendedBy?: string
  ) {
    try {
      const { data, error } = await (supabase as any).rpc('suspend_user_account', {
        p_user_id: userId,
        p_suspension_type: suspensionType,
        p_suspension_reason: suspensionReason,
        p_suspended_by: suspendedBy || null
      });

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Reactivate user account
  static async reactivateUserAccount(
    userId: string,
    reactivationReason: string,
    reactivatedBy?: string
  ) {
    try {
      const { data, error } = await (supabase as any).rpc('reactivate_user_account', {
        p_user_id: userId,
        p_reactivation_reason: reactivationReason,
        p_reactivated_by: reactivatedBy || null
      });

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Reset user cancellations
  static async resetUserCancellations(
    userId: string,
    resetReason: string = 'Account reactivated'
  ) {
    try {
      const { data, error } = await (supabase as any).rpc('reset_user_cancellations', {
        p_user_id: userId,
        p_reset_reason: resetReason
      });

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get user cancellation history
  static async getUserCancellationHistory(userId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('cancellation_tracking' as any)
        .select(`
          *,
          trips (
            departure_city,
            arrival_city,
            departure_date,
            departure_time
          ),
          bookings (
            id,
            status
          )
        `)
        .eq('user_id', userId)
        .order('cancelled_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  // Get all suspensions for admin
  static async getAllSuspensions(limit = 100) {
    try {
      const { data, error } = await supabase
        .from('account_suspensions' as any)
        .select(`
          *,
          profiles!account_suspensions_user_id_fkey (
            id,
            full_name,
            email,
            role,
            phone
          ),
          suspended_by_profile:profiles!account_suspensions_suspended_by_fkey (
            id,
            full_name,
            email
          ),
          reactivated_by_profile:profiles!account_suspensions_reactivated_by_fkey (
            id,
            full_name,
            email
          )
        `)
        .order('suspended_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  // Get cancellation statistics for admin
  static async getCancellationStatistics() {
    try {
      const { data, error } = await supabase
        .from('cancellation_tracking' as any)
        .select('user_type, cancellation_type, cancelled_at')
        .gte('cancelled_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) {
        throw error;
      }

      // Process statistics
      const stats = {
        totalCancellations: data?.length || 0,
        driverCancellations: data?.filter((c: any) => c.user_type === 'driver').length || 0,
        passengerCancellations: data?.filter((c: any) => c.user_type === 'passenger').length || 0,
        tripCancellations: data?.filter((c: any) => c.cancellation_type === 'trip_cancellation').length || 0,
        bookingCancellations: data?.filter((c: any) => c.cancellation_type === 'booking_cancellation').length || 0,
        last15Days: data?.filter((c: any) => 
          new Date(c.cancelled_at) >= new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        ).length || 0
      };

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Delete user account completely (profile, auth user, and all related data)
  static async deleteUser(userId: string, deletedBy?: string) {
    try {
      // Try using the admin_delete_user function first (more reliable with RLS)
      try {
        const { data, error } = await (supabase as any).rpc('admin_delete_user', {
          p_user_id: userId
        });
        
        if (error) {
          // Fall through to direct deletion
        } else if (data) {
          // data is a JSONB object returned from the function
          const result = typeof data === 'string' ? JSON.parse(data) : data;
          
          if (result && result.success === true) {
            return { 
              success: true, 
              message: result.message || 'User and all related data deleted successfully' 
            };
          } else if (result && result.success === false) {
            throw new Error(result.message || 'Failed to delete user via RPC function');
          } else {
            // Unexpected response format, try direct deletion
          }
        } else {
          // No data returned, try direct deletion
        }
      } catch (rpcError: any) {
        // Fall through to direct deletion
      }
      
      // Fallback: Direct deletion (may fail due to RLS)
      // Step 1: Delete all related data first (to avoid foreign key constraints)
      // Delete bookings (passenger bookings)
      const { error: bookingsPassengerError } = await supabase
        .from('bookings')
        .delete()
        .eq('passenger_id', userId);
      
      if (bookingsPassengerError) {
      }
      
      // Delete bookings (driver bookings)
      const { error: bookingsDriverError } = await supabase
        .from('bookings')
        .delete()
        .eq('driver_id', userId);
      
      if (bookingsDriverError) {
      }
      
      // Delete trips
      const { error: tripsError } = await supabase
        .from('trips')
        .delete()
        .eq('driver_id', userId);
      
      if (tripsError) {
      }
      
      // Delete vehicles
      const { error: vehiclesError } = await supabase
        .from('vehicles')
        .delete()
        .eq('driver_id', userId);
      
      if (vehiclesError) {
      }
      
      // Delete notifications
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);
      
      if (notificationsError) {
      }
      
      // Delete ratings (rated user)
      const { error: ratingsRatedError } = await supabase
        .from('ratings')
        .delete()
        .eq('rated_user_id', userId);
      
      if (ratingsRatedError) {
      }
      
      // Delete ratings (rater user)
      const { error: ratingsRaterError } = await supabase
        .from('ratings')
        .delete()
        .eq('rater_user_id', userId);
      
      if (ratingsRaterError) {
      }
      
      // Delete passenger ratings (rated user)
      const { error: passengerRatingsRatedError } = await supabase
        .from('passenger_ratings')
        .delete()
        .eq('rated_user_id', userId);
      
      if (passengerRatingsRatedError) {
      }
      
      // Delete passenger ratings (rater user)
      const { error: passengerRatingsRaterError } = await supabase
        .from('passenger_ratings')
        .delete()
        .eq('rater_user_id', userId);
      
      if (passengerRatingsRaterError) {
      }
      
      // Step 2: Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) {
        throw new Error(`Failed to delete profile: ${profileError.message}. This may be due to RLS policies. Please ensure you are logged in as an admin and that the admin_delete_user function is available.`);
      }
      // Step 3: Delete auth user (requires admin privileges)
      // Note: This might require an Edge Function or Admin API call
      // For now, we'll log it and the admin can delete manually from Supabase dashboard
      return { success: true, message: 'User profile and related data deleted successfully. Auth user deletion requires manual action.' };
    } catch (error: any) {
      throw error;
    }
  }

  // Update user profile (admin function)
  static async updateUserProfile(userId: string, updates: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    wilaya?: string;
    commune?: string;
    age?: number | null;
    ksar?: string | null;
    role?: string;
    is_verified?: boolean;
    account_suspended?: boolean;
  }) {
    try {
      // Build update payload
      const updatePayload: any = {};
      
      if (updates.first_name !== undefined) updatePayload.first_name = updates.first_name;
      if (updates.last_name !== undefined) updatePayload.last_name = updates.last_name;
      if (updates.phone !== undefined) updatePayload.phone = updates.phone;
      if (updates.wilaya !== undefined) updatePayload.wilaya = updates.wilaya;
      if (updates.commune !== undefined) updatePayload.commune = updates.commune;
      if (updates.age !== undefined) updatePayload.age = updates.age;
      if (updates.ksar !== undefined) updatePayload.ksar = updates.ksar;
      if (updates.role !== undefined) updatePayload.role = updates.role;
      if (updates.is_verified !== undefined) updatePayload.is_verified = updates.is_verified;
      if (updates.account_suspended !== undefined) updatePayload.account_suspended = updates.account_suspended;
      
      // Update full_name if first_name or last_name changed
      if (updates.first_name !== undefined || updates.last_name !== undefined) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', userId)
          .single();
        
        const firstName = updates.first_name !== undefined ? updates.first_name : currentProfile?.first_name || '';
        const lastName = updates.last_name !== undefined ? updates.last_name : currentProfile?.last_name || '';
        updatePayload.full_name = `${firstName} ${lastName}`.trim() || null;
      }
      
      // Update email in auth.users if provided (requires admin privileges)
      if (updates.email !== undefined && updates.email) {
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user) {
          } else {
            // Try to update email in auth.users using admin API (if available)
            // Note: This might require service role key or Edge Function
          }
        } catch (error) {
        }
        
        // Update email in profiles table
        updatePayload.email = updates.email;
      }
      
      // Update profile
      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }
      return mapProfile(data);
    } catch (error: any) {
      throw error;
    }
  }
}

export { SupabaseDatabaseService as BrowserDatabaseService };
