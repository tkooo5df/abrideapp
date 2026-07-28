import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RatingSection } from '@/components/booking/RatingSection';
import { RatingPassengerSection } from '@/components/booking/RatingPassengerSection';
import { DriverRatingsDisplay } from '@/components/driver/DriverRatingsDisplay';
import TripRouteModal from '@/components/map/TripRouteModal';
import { 
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Car,
  DollarSign,
  Bell,
  Search,
  Plus,
  Eye,
  Check,
  X,
  Trash,
  Star,
  TrendingUp,
  Users,
  Route,
  Settings,
  Shield,
  Activity,
  Edit,
  Power,
  PowerOff,
  Play,
  AlertTriangle,
  Pause,
  Trash2,
  Database,
  SaveIcon,
  Filter,
  Loader2
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import UserManagement from '@/components/admin/UserManagement';
import SystemSettings from '@/components/admin/SystemSettings';
import BookingModal from '@/components/booking/BookingModal';
import CancellationWarning from '@/components/CancellationWarning';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { supabase } from '@/integrations/supabase/client';
import { BookingTrackingService, BookingStatus } from '@/integrations/database/bookingTrackingService';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { toast } from '@/hooks/use-toast';
import { wilayas } from '@/data/wilayas';

// List of ksour (قصور) in Ghardaia - القصور الـ7
const ksour = [
  { value: "قصر بريان", label: "قصر بريان" },
  { value: "قصر القرارة", label: "قصر القرارة" },
  { value: "قصر بني يزقن", label: "قصر بني يزقن" },
  { value: "قصر العطف", label: "قصر العطف" },
  { value: "قصر غرداية", label: "قصر غرداية" },
  { value: "قصر بنورة", label: "قصر بنورة" },
  { value: "قصر مليكة", label: "قصر مليكة" },
];
import { geocodingService } from '@/services/geocoding';
import NotificationCenter from '@/components/NotificationCenter';
import { NotificationService, NotificationType, NotificationCategory, NotificationPriority } from '@/integrations/database/notificationService';
import { getDisplayName } from '@/utils/displayName';
import EditProfile from '@/components/profile/EditProfile';

// Import the new components
import TripManagement from '@/components/admin/TripManagement';
import BookingManagement from '@/components/admin/BookingManagement';
import RecentBookingsTable from '@/components/admin/RecentBookingsTable';
import DatabaseManagement from '@/components/admin/DatabaseManagement';
import { ReviewsService } from '@/integrations/database/reviewsService';
import RatingPopup from '@/components/RatingPopup';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: supabaseUser, profile: authProfile } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { getDatabaseService, isInitialized, isLocal } = useDatabase();
  // Use local user if using local database, otherwise use Supabase user
  const user = isLocal ? localUser : supabaseUser;
  // Data states
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [users, setUsers] = useState([]); // Add this line for users data
  const [loadingUsers, setLoadingUsers] = useState(false); // Loading state for users
  const [adminStats, setAdminStats] = useState({ totalUsers: 0, totalDrivers: 0, totalPassengers: 0 });
  
  // Separate state variables for statistics (not filtered by day tab)
  const [allTrips, setAllTrips] = useState([]); // All trips for driver statistics
  const [allBookings, setAllBookings] = useState([]); // All bookings for driver statistics

  // Only count bookings after driver acceptance for passenger-facing counts
  const acceptedBookings = bookings.filter((b: any) => ['confirmed', 'in_progress', 'completed'].includes(b.status));

  const [currentLang] = useState("ar");
  const [loading, setLoading] = useState(true);
  const [notificationStats, setNotificationStats] = useState({ total: 0, unread: 0, recent: 0 });
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | number | null>(null); // Track which booking is being confirmed
  const [rejectingBookingId, setRejectingBookingId] = useState<string | number | null>(null); // Track which booking is being rejected
  const [creatingTrip, setCreatingTrip] = useState(false); // Track if trip is being created
  const [processingUserAction, setProcessingUserAction] = useState<{ userId: string; action: string } | null>(null); // Track admin user actions
  // State for active tab
  const [activeTab, setActiveTab] = useState('overview');

  // Set active tab based on URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab && isValidTab(tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab('overview');
    }
  }, [location.search]);

  // Validate if tab is valid
  const isValidTab = (tab: string) => {
    const validTabs = [
      'overview', 
      'vehicles', 
      'trips', 
      'bookings', 
      'profile-edit', 
      'notifications',
      'users',
      'admin-trips',
      //'admin-bookings',  // Hidden tab
      'recent-bookings',
      'database',
      'settings'
    ];
    return validTabs.includes(tab);
  };

  // Prioritize authProfile (from useAuth) over userProfile (local state) to ensure fresh data
  const displayName = getDisplayName([
    authProfile, // Prioritize authProfile - it's always fresh from useAuth
    userProfile, // Fallback to local userProfile
    user,
  ], {
    fallback: 'عضو',
    email: user?.email ?? null,
  });
  
  // Trip creation form
  const [showTripForm, setShowTripForm] = useState(false);
  const [showTripRouteModal, setShowTripRouteModal] = useState(false);
  const [selectedTripForRoute, setSelectedTripForRoute] = useState<any>(null);
  const [tripForm, setTripForm] = useState({
    fromWilayaId: '',
    toWilayaId: '',
    fromKsar: '',
    toKsar: '',
    vehicleId: '',
    departureDate: '',
    departureTime: '',
    pricePerSeat: '',
    totalSeats: '4',
    description: ''
  });

  // Vehicle management form
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    make: "",
    model: "",
    year: "",
    color: "",
    licensePlate: "",
    seats: "4"
  });
  const [showVehicleEditForm, setShowVehicleEditForm] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vehicleEditForm, setVehicleEditForm] = useState({
    make: "",
    model: "",
    year: "",
    color: "",
    licensePlate: "",
    seats: "4",
    is_active: true,
  });
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  // Booking modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Rating popup
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<any>(null);
  const [ratingTarget, setRatingTarget] = useState<{userId: string, type: 'driver' | 'passenger'} | null>(null);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  
  // Cancel trip dialog
  const [showCancelTripDialog, setShowCancelTripDialog] = useState(false);
  const [tripToCancel, setTripToCancel] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showRejectBookingDialog, setShowRejectBookingDialog] = useState(false);
  const [bookingToReject, setBookingToReject] = useState<string | number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCancelBookingDialog, setShowCancelBookingDialog] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | number | null>(null);
  const [cancelBookingReason, setCancelBookingReason] = useState('');
  const [tripFilters, setTripFilters] = useState({
    fromWilaya: '',
    toWilaya: '',
    fromKsar: 'all',
    toKsar: 'all',
    date: '',
    minPrice: '',
    maxPrice: '',
    rating: 'all',
    priceSort: 'none',
    ratingSort: 'none'
  });
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
  const [selectedDayTab, setSelectedDayTab] = useState<'today' | 'tomorrow' | 'all'>('today');

  // Apply trip filters
  const applyTripFilters = () => {
    if (!trips || trips.length === 0) {
      setFilteredTrips([]);
      return;
    }
    
    let result = [...trips];
    
    // Apply each filter independently - each filter works on its own
    
    // From wilaya filter - works independently
    if (tripFilters.fromWilaya) {
      result = result.filter(trip => trip.fromWilayaId.toString() === tripFilters.fromWilaya);
    }
    
    // To wilaya filter - works independently
    if (tripFilters.toWilaya) {
      result = result.filter(trip => trip.toWilayaId.toString() === tripFilters.toWilaya);
    }
    
    // From Ksar filter - only applies if fromWilaya is Ghardaia (47)
    if (tripFilters.fromKsar !== 'all' && tripFilters.fromWilaya === '47') {
      result = result.filter(trip => {
        if (trip.fromWilayaId !== 47) return true; // Show all non-Ghardaia trips
        const tripKsar = trip.fromKsar || (trip as any).fromKsar;
        return tripKsar === tripFilters.fromKsar;
      });
    }
    
    // To Ksar filter - only applies if toWilaya is Ghardaia (47)
    if (tripFilters.toKsar !== 'all' && tripFilters.toWilaya === '47') {
      result = result.filter(trip => {
        if (trip.toWilayaId !== 47) return true; // Show all non-Ghardaia trips
        const tripToKsar = trip.toKsar || (trip as any).toKsar;
        return tripToKsar === tripFilters.toKsar;
      });
    }
    
    // Date filter - works independently
    if (tripFilters.date) {
      result = result.filter(trip => trip.departureDate === tripFilters.date);
    }
    
    // Min price filter - works independently
    if (tripFilters.minPrice) {
      const minPrice = parseFloat(tripFilters.minPrice);
      if (!isNaN(minPrice)) {
        result = result.filter(trip => trip.pricePerSeat >= minPrice);
      }
    }
    
    // Max price filter - works independently
    if (tripFilters.maxPrice) {
      const maxPrice = parseFloat(tripFilters.maxPrice);
      if (!isNaN(maxPrice)) {
        result = result.filter(trip => trip.pricePerSeat <= maxPrice);
      }
    }
    
    // Rating filter - works independently
    if (tripFilters.rating !== 'all') {
      const minRating = parseFloat(tripFilters.rating);
      result = result.filter(trip => {
        const driverRating = trip.driver?.rating || 4.5;
        return driverRating >= minRating;
      });
    }
    
    // Apply sorting (this is separate from filtering)
    if (tripFilters.priceSort !== 'none') {
      result.sort((a, b) => {
        if (tripFilters.priceSort === 'low_to_high') {
          return a.pricePerSeat - b.pricePerSeat;
        } else if (tripFilters.priceSort === 'high_to_low') {
          return b.pricePerSeat - a.pricePerSeat;
        }
        return 0;
      });
    }
    
    if (tripFilters.ratingSort !== 'none') {
      result.sort((a, b) => {
        const ratingA = a.driver?.rating || 4.5;
        const ratingB = b.driver?.rating || 4.5;
        if (tripFilters.ratingSort === 'high_to_low') {
          return ratingB - ratingA;
        } else if (tripFilters.ratingSort === 'low_to_high') {
          return ratingA - ratingB;
        }
        return 0;
      });
    }
    setFilteredTrips(result);
  };

  // Reset trip filters
  const resetTripFilters = () => {
    setTripFilters({
      fromWilaya: '',
      toWilaya: '',
      fromKsar: 'all',
      toKsar: 'all',
      date: '',
      minPrice: '',
      maxPrice: '',
      rating: 'all',
      priceSort: 'none',
      ratingSort: 'none'
    });
    // Apply filters after reset (this will show all trips)
    setTimeout(() => {
      applyTripFilters();
    }, 100);
  };

  // Helper function to get wilaya name by ID
  const getWilayaName = (wilayaId: number) => {
    const wilaya = wilayas.find(w => w.code === wilayaId.toString().padStart(2, '0'));
    return wilaya ? wilaya.name : `ولاية ${wilayaId}`;
  };

  // Helper function to get wilaya coordinates
  const getWilayaCoordinates = async (wilayaId: number, wilayaName?: string): Promise<{ lat: number; lng: number } | null> => {
    // Wilaya coordinates (approximate center points) - same as TripRouteModal
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

    // Try to get from coordinates map first
    const wilayaKey = wilayaId.toString().padStart(2, '0');
    let coords = WILAYA_COORDINATES[wilayaKey];

    // If not found in map, try geocoding
    if (!coords && wilayaName) {
      try {
        const geoResult = await geocodingService.forward(wilayaName, { country: 'DZ' });
        if (geoResult) {
          coords = { lat: geoResult.coordinates.lat, lng: geoResult.coordinates.lng };
        }
      } catch (e) {
      }
    }

    // Fallback to Algiers if still not found
    return coords || { lat: 36.7538, lng: 3.0588 };
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const db = getDatabaseService();
      const profile = await db.getProfile(user.id);
      setUserProfile(profile || (authProfile as any) || null);
      
      // Check if profile is complete
      if (profile) {
        const isProfileComplete = profile.fullName && 
                                 profile.phone && 
                                 profile.wilaya && 
                                 profile.commune;
        
        if (!isProfileComplete) {
          // Show a toast notification
          toast({
            title: 'معلومات الملف الشخصي مطلوبة',
            description: 'يرجى ملء معلومات الملف الشخصي الخاصة بك للمتابعة',
            variant: 'default'
          });
          
          // Optionally redirect to profile page
          // navigate('/profile?edit=true');
        }
      }
    } catch (error) {
    }
  };
  useEffect(() => {
    fetchUserProfile();
  }, []);


  // Keep local userProfile in sync with authProfile (includes role corrections)
  useEffect(() => {
    if (authProfile && user && authProfile.id === user.id) {
      setUserProfile((prev: any) => {
        if (!prev) return authProfile as any;
        if (prev.role !== (authProfile as any).role) return authProfile as any;
        return prev;
      });
    }
  }, [authProfile, user?.id]);

  // Fetch driver's vehicles (if user is driver)
  const fetchVehicles = async () => {
    if (!user || userProfile?.role !== 'driver') return;
    
    try {
      const data = await BrowserDatabaseService.getVehiclesByDriver(user.id);
      // Fix any vehicles that don't have is_active set
      if (data && data.length > 0) {
        for (const vehicle of data) {
          if (vehicle.isActive === undefined || vehicle.isActive === null) {
            try {
              await BrowserDatabaseService.updateVehicle(vehicle.id, { is_active: true });
            } catch (err) {
            }
          }
        }
        
        // Re-fetch vehicles after fixing
        const updatedData = await BrowserDatabaseService.getVehiclesByDriver(user.id);
        setVehicles(updatedData || []);
      } else {
        setVehicles(data || []);
      }
    } catch (error) {
    }
  };

  // Helper function to get today's date in Algeria timezone
  const getTodayInAlgeria = () => {
    const now = new Date();
    // Algeria is UTC+1 (CET - Central European Time)
    // Create a date object in Algeria timezone
    const algeriaTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Algiers"}));
    return algeriaTime.toISOString().split('T')[0];
  };

  // Helper function to get tomorrow's date in Algeria timezone
  const getTomorrowInAlgeria = () => {
    const now = new Date();
    const algeriaTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Algiers"}));
    // Add one day
    algeriaTime.setDate(algeriaTime.getDate() + 1);
    return algeriaTime.toISOString().split('T')[0];
  };

  // Helper function to format date/time in Algeria timezone
  const formatAlgeriaDateTime = (date: string, time?: string) => {
    if (!date) return '';
    
    try {
      // Create a date object from the date string
      const dateObj = new Date(date + (time ? `T${time}` : ''));
      
      // Format using Algeria timezone
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        timeZone: 'Africa/Algiers'
      };
      
      const dateStr = dateObj.toLocaleDateString('ar-DZ', options);
      
      if (time) {
        const timeOptions: Intl.DateTimeFormatOptions = {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Africa/Algiers'
        };
        const timeStr = dateObj.toLocaleTimeString('ar-DZ', timeOptions);
        return `${dateStr} - ${timeStr}`;
      }
      
      return dateStr;
    } catch (error) {
      // Fallback to original format
      return time ? `${date} - ${time}` : date;
    }
  };

  // Fetch trips based on user role and selected day
  const fetchTrips = async () => {
    try {
      if (selectedDayTab === 'all') {
        // Show all trips regardless of date
        if (userProfile?.role === 'driver') {
          // Drivers see only their own trips
          const data = await BrowserDatabaseService.getTripsWithDetails(user?.id);
          setTrips(data || []);
        } else if (userProfile?.role === 'passenger') {
          // Passengers see all trips including fully booked ones
          const data = await BrowserDatabaseService.getTripsWithDetails();
          // Filter to show all trips for passengers (including fully booked)
          const availableTrips = data.filter((trip: any) => 
            (trip.status === 'scheduled' || trip.status === 'fully_booked') &&
            trip.driverId !== user?.id // Don't show their own trips if they're also a driver
          );
          setTrips(availableTrips || []);
        } else {
          // Admins see all trips (including cancelled)
          const data = await BrowserDatabaseService.getTripsWithDetails(undefined, { includeInactive: true });
          setTrips(data || []);
        }
      } else {
        // Show trips for specific day (today or tomorrow)
        const targetDate = selectedDayTab === 'today' ? getTodayInAlgeria() : getTomorrowInAlgeria();
        
        if (userProfile?.role === 'driver') {
          // Drivers see only their own trips for selected day
          const data = await BrowserDatabaseService.getTripsWithDetails(user?.id);
          const dayTrips = data.filter((trip: any) => trip.departureDate === targetDate);
          setTrips(dayTrips || []);
        } else if (userProfile?.role === 'passenger') {
          // Passengers see all trips for selected day including fully booked ones
          const data = await BrowserDatabaseService.getTripsWithDetails();
          // Filter to show selected day trips for passengers (including fully booked)
          const dayTrips = data.filter((trip: any) => 
            trip.departureDate === targetDate &&
            (trip.status === 'scheduled' || trip.status === 'fully_booked') &&
            trip.driverId !== user?.id // Don't show their own trips if they're also a driver
          );
          setTrips(dayTrips || []);
        } else {
          // Admins see all trips for selected day (including cancelled)
          const data = await BrowserDatabaseService.getTripsWithDetails(undefined, { includeInactive: true });
          const dayTrips = data.filter((trip: any) => trip.departureDate === targetDate);
          setTrips(dayTrips || []);
        }
      }
    } catch (error) {
    }
  };

  // Fetch bookings with full details
  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      let data;
      
      if (userProfile?.role === 'driver') {
        // Get bookings for driver's trips with full details
        data = await BrowserDatabaseService.getBookingsWithDetails(undefined, user.id);
      } else if (userProfile?.role === 'passenger') {
        // Get bookings for passenger with full details
        data = await BrowserDatabaseService.getBookingsWithDetails(user.id);
      } else {
        // Admins see all bookings
        data = await BrowserDatabaseService.getBookingsWithDetails();
      }
      
      setBookings(data || []);
    } catch (error) {
    }
  };

  // Fetch all trips for driver statistics (not filtered by day tab)
  const fetchAllTripsForStats = async () => {
    if (!user || userProfile?.role !== 'driver') return;
    
    try {
      const data = await BrowserDatabaseService.getTripsWithDetails(user.id);
      setAllTrips(data || []);
    } catch (error) {
    }
  };

  // Fetch all bookings for driver statistics (not filtered by day tab)
  const fetchAllBookingsForStats = async () => {
    if (!user || userProfile?.role !== 'driver') return;
    
    try {
      // Use the same function as Profile.tsx to ensure consistency
      const data = await BrowserDatabaseService.getBookingsByDriver(user.id);
      setAllBookings(data || []);
    } catch (error) {
    }
  };

  // Fetch user's notifications and stats
  const fetchNotificationStats = async () => {
    if (!user) return;
    
    try {
      const [stats, notifications] = await Promise.all([
        NotificationService.getNotificationStats(user.id),
        NotificationService.getUserNotifications(user.id)
      ]);
      setNotificationStats({
        total: stats?.total || notifications?.length || 0,
        unread: stats?.unread || notifications?.filter((n: any) => !n.isRead)?.length || 0,
        recent: stats?.recent || notifications?.filter((n: any) => {
          const notificationDate = new Date(n.createdAt);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return notificationDate > oneDayAgo;
        })?.length || 0
      });
      
      // Refresh the NotificationCenter if notifications changed
      if (notifications?.length > 0) {
      }
    } catch (error) {
      // Set default values if there's an error
      setNotificationStats({ total: 0, unread: 0, recent: 0 });
    }
  };

  // Load admin stats
  const loadAdminStats = async () => {
    if (!user || userProfile?.role !== 'admin') return;
    try {
      const db = getDatabaseService();
      const allProfiles = await BrowserDatabaseService.getAllProfiles();
      setAdminStats({
        totalUsers: allProfiles.length,
        totalDrivers: allProfiles.filter((p: any) => p.role === 'driver').length,
        totalPassengers: allProfiles.filter((p: any) => p.role === 'passenger').length,
      });
    } catch (error) {
    }
  };

  // Load all users for admin (add this new function)
  const loadAllUsers = async () => {
    if (!user || userProfile?.role !== 'admin') {
      setLoadingUsers(false);
      setUsers([]);
      return;
    }
    
    setLoadingUsers(true);
    try {
      // Use Supabase directly instead of BrowserDatabaseService
      const { data: allProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: 'خطأ في جلب المستخدمين',
          description: error.message || 'حدث خطأ أثناء جلب بيانات المستخدمين',
          variant: 'destructive'
        });
        setUsers([]);
        setLoadingUsers(false);
        return;
      }
      if (!allProfiles || allProfiles.length === 0) {
        setUsers([]);
        setLoadingUsers(false);
        return;
      }
      
      // Transform profiles into the format expected by UserManagement component
      const usersData = (allProfiles || []).map((profile: any) => {
        // Extract first_name and last_name properly
        let firstName = profile.first_name || '';
        let lastName = profile.last_name || '';
        
        // If first_name and last_name are not available, try to split full_name
        if ((!firstName || !lastName) && profile.full_name) {
          const nameParts = profile.full_name.trim().split(/\s+/).filter((p: string) => p.length > 0);
          if (nameParts.length > 0) {
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
        }
        
        // Fallback to email or a default if no name found
        if (!firstName && !lastName) {
          if (profile.email) {
            firstName = profile.email.split('@')[0] || 'مستخدم';
          } else {
            firstName = 'مستخدم';
          }
          lastName = '';
        }
        
        return {
        id: profile.id,
        email: profile.email || 'غير محدد',
        role: profile.role || 'passenger',
        // تحديد الحالة بناءً على نوع المستخدم
        status: (profile.role === 'driver')
          ? (profile.account_suspended ? 'suspended' : (profile.is_verified ? 'active' : 'pending'))
          : (profile.account_suspended ? 'suspended' : 'active'),
          created_at: profile.created_at ? new Date(profile.created_at).toLocaleDateString('ar-DZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'غير محدد',
          last_sign_in: profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('ar-DZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'غير محدد',
        isDemo: false, // Supabase profiles are not demo
        avatar_url: profile.avatar_url,
          is_verified: profile.is_verified || false,
          account_suspended: profile.account_suspended || false,
        profile: {
            first_name: firstName,
            last_name: lastName,
          phone: profile.phone || 'غير محدد',
            wilaya: profile.wilaya || 'غير محدد',
            commune: profile.commune || '',
            age: profile.age || null,
            ksar: profile.ksar || null
          },
          full_name: profile.full_name || `${firstName} ${lastName}`.trim() || profile.email || 'مستخدم'
        };
      });
      setUsers(usersData);
    } catch (error: any) {
      toast({
        title: 'خطأ في جلب المستخدمين',
        description: error?.message || 'حدث خطأ أثناء جلب بيانات المستخدمين',
        variant: 'destructive'
      });
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Admin user actions (approve/suspend drivers)
  const handleAdminUserAction = async (targetUserId: string, action: string) => {
    if (!user || userProfile?.role !== 'admin') return;

    // Prevent double-click
    if (processingUserAction && processingUserAction.userId === targetUserId && processingUserAction.action === action) {
      return;
    }

    // Set processing state immediately
    setProcessingUserAction({ userId: targetUserId, action });

    try {
      // Handle delete action first (doesn't need to fetch user data)
      if (action === 'delete') {
        // Confirm deletion
        const confirmed = window.confirm(
          `⚠️ هل أنت متأكد من حذف هذا المستخدم؟\n\nسيتم حذف:\n- الملف الشخصي\n- جميع الحجوزات\n- جميع الرحلات\n- جميع المركبات\n- جميع الإشعارات\n\nهذا الإجراء لا يمكن التراجع عنه!`
        );
        
        if (!confirmed) {
          setProcessingUserAction(null);
          return;
        }
        try {
          await BrowserDatabaseService.deleteUser(targetUserId, user?.id);
          
          toast({ 
            title: '✅ تم الحذف', 
            description: 'تم حذف المستخدم وكل البيانات المرتبطة به بنجاح. قد تحتاج إلى حذف حساب المصادقة يدوياً من لوحة Supabase.' 
          });
          
          // Refresh data in background (non-blocking)
          setTimeout(() => {
            loadAllUsers().then(() => {
            }).catch((error) => {
            });
          }, 500);
        } catch (error: any) {
          toast({ 
            title: 'خطأ في الحذف', 
            description: error?.message || 'حدث خطأ أثناء حذف المستخدم',
            variant: 'destructive'
          });
        } finally {
          setTimeout(() => {
            setProcessingUserAction(null);
          }, 1000);
        }
        return;
      }

      // Handle refresh action (doesn't need to fetch user data)
      if (action === 'refresh') {
        await loadAllUsers();
        setProcessingUserAction(null);
        return;
      }

      // Handle edit action (handled by component, just clear processing state)
      if (action === 'edit') {
        setProcessingUserAction(null);
        return;
      }

      // Show immediate feedback for other actions
      toast({
        title: "جاري معالجة الإجراء...",
        description: "يرجى الانتظار",
      });
      
      // Get target user from Supabase for other actions
      const { data: target, error: targetError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (targetError || !target) {
        toast({ title: 'المستخدم غير موجود', variant: 'destructive' });
        setProcessingUserAction(null);
        return;
      }
      if (action === 'approve') {
        if (target.role !== 'driver') {
          toast({ title: 'الموافقة مخصصة للسائقين فقط', variant: 'destructive' });
          return;
        }
        if ((target as any).is_verified) {
          toast({ title: 'تمت الموافقة مسبقاً', description: 'هذا السائق مفعل بالفعل.' });
          return;
        }
        const { error } = await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', targetUserId);
        
        if (error) {
          throw error;
        }
        
        try {
          const { NotificationService } = await import('@/integrations/database/notificationService');
          await NotificationService.notifyDriverApproved(targetUserId);
        } catch (e) {
        }
        toast({ 
          title: '✅ تمت الموافقة', 
          description: 'تمت الموافقة على حساب السائق بنجاح.' 
        });
        
        // Refresh data in background (non-blocking)
        setTimeout(() => {
          loadAllUsers().then(() => {
          }).catch((error) => {
          });
        }, 500);
      } else if (action === 'suspend') {
        // Allow suspending both drivers and passengers for admin users
        if (target.role === 'driver') {
          const { error } = await supabase
            .from('profiles')
            .update({ is_verified: false })
            .eq('id', targetUserId);
          
          if (error) {
            throw error;
          }
          
          // Send suspension notification
          try {
            const { NotificationService } = await import('@/integrations/database/notificationService');
            await NotificationService.sendSmartNotification({
              userId: targetUserId,
              title: '⚠️ تم إيقاف حسابك',
              message: 'تم إيقاف حسابك مؤقتاً من قبل المدير. يرجى التواصل مع الدعم الفني.',
              type: NotificationType.ACCOUNT_SUSPENDED,
              category: NotificationCategory.SYSTEM,
              priority: NotificationPriority.HIGH,
              relatedId: targetUserId,
              relatedType: 'account'
            });
          } catch (e) {
          }
          
          toast({ 
            title: '✅ تم الإيقاف', 
            description: 'تم إيقاف حساب السائق مؤقتاً بنجاح.' 
          });
        } else if (target.role === 'passenger') {
          const updateData: any = { account_suspended: true };
          const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', targetUserId);
          
          if (error) {
            throw error;
          }
          
          // Send suspension notification
          try {
            const { NotificationService } = await import('@/integrations/database/notificationService');
            await NotificationService.sendSmartNotification({
              userId: targetUserId,
              title: '⚠️ تم إيقاف حسابك',
              message: 'تم إيقاف حسابك مؤقتاً من قبل المدير. يرجى التواصل مع الدعم الفني.',
              type: NotificationType.ACCOUNT_SUSPENDED,
              category: NotificationCategory.SYSTEM,
              priority: NotificationPriority.HIGH,
              relatedId: targetUserId,
              relatedType: 'account'
            });
          } catch (e) {
          }
          
          toast({ 
            title: '✅ تم الإيقاف', 
            description: 'تم إيقاف حساب الراكب مؤقتاً بنجاح.' 
          });
        } else {
          toast({ title: 'لا يمكن إيقاف هذا النوع من الحسابات', variant: 'destructive' });
          setProcessingUserAction(null);
          return;
        }
        
        // Refresh data in background (non-blocking)
        setTimeout(() => {
          loadAllUsers().then(() => {
          }).catch((error) => {
          });
        }, 500);
      } else if (action === 'activate') {
        // Use reactivateUserAccount RPC function to properly reset cancellations and trip deletions
        try {
          await BrowserDatabaseService.reactivateUserAccount(
            targetUserId,
            'تم إعادة تفعيل الحساب من قبل المدير',
            user?.id
          );
          
          // Send reactivation notification
          try {
            const { NotificationService } = await import('@/integrations/database/notificationService');
            await NotificationService.sendSmartNotification({
              userId: targetUserId,
              title: '✅ تم إعادة تفعيل حسابك',
              message: 'تم إعادة تفعيل حسابك بنجاح. تم إعادة تعيين عدد الإلغاءات إلى 0. يمكنك الآن استخدام جميع الخدمات.',
              type: NotificationType.ACCOUNT_VERIFIED,
              category: NotificationCategory.SYSTEM,
              priority: NotificationPriority.HIGH,
              relatedId: targetUserId,
              relatedType: 'account'
            });
          } catch (e) {
          }
          
          toast({ 
            title: '✅ تم التفعيل', 
            description: 'تم تفعيل الحساب وإعادة تعيين عدد الإلغاءات إلى 0 بنجاح.' 
          });
        } catch (error: any) {
          toast({ 
            title: 'خطأ في التفعيل', 
            description: error?.message || 'حدث خطأ أثناء تفعيل الحساب',
            variant: 'destructive'
          });
        }
        
        // Refresh data in background (non-blocking)
        setTimeout(() => {
          loadAllUsers().then(() => {
          }).catch((error) => {
          });
        }, 500);
      } else {
        toast({ title: 'الإجراء غير مدعوم', description: action });
        setProcessingUserAction(null);
      }
    } catch (error) {
      toast({ title: 'خطأ أثناء تنفيذ الإجراء', variant: 'destructive' });
    } finally {
      // Clear processing state after a short delay
      setTimeout(() => {
        setProcessingUserAction(null);
      }, 1000);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (user && isInitialized) {
        await Promise.all([
          fetchUserProfile(),
          loadAdminStats()
        ]);
        setLoading(false);
      }
    };

    loadData();
  }, [user, isInitialized]);

  // Apply filters when trips change
  useEffect(() => {
    if (trips.length > 0) {
      applyTripFilters();
    }
  }, [trips, tripFilters]);

  // Load role-specific data when profile is loaded
  useEffect(() => {
    if (userProfile) {
      const loadData = async () => {
        try {
          await Promise.all([
        fetchVehicles(),
        fetchTrips(),
        fetchBookings(),
        fetchAllTripsForStats(),
        fetchAllBookingsForStats(),
        fetchNotificationStats(),
            loadAdminStats()
          ]);
          
          // Only load users if user is admin
          if (userProfile.role === 'admin') {
            await loadAllUsers();
          }
        } catch (error) {
        }
      };
      
      loadData();
    }
  }, [userProfile, user]);

  // Load users when users tab is active (additional check)
  useEffect(() => {
    if (activeTab === 'users') {
      if (userProfile?.role === 'admin') {
        // Only load if not already loading and users array is empty
        if (!loadingUsers && users.length === 0) {
          loadAllUsers().catch((error) => {
            setLoadingUsers(false);
          });
        } else if (loadingUsers) {
        } else if (users.length > 0) {
        }
      } else {
        setLoadingUsers(false);
        setUsers([]);
      }
    }
  }, [activeTab, userProfile?.role]);

  // Refetch trips when day tab changes
  useEffect(() => {
    if (userProfile) {
      fetchTrips();
    }
  }, [selectedDayTab]);

  // Monitor for booking success to refresh data immediately
  useEffect(() => {
    const checkBookingSuccess = () => {
      const bookingSuccess = localStorage.getItem('booking_success');
      if (bookingSuccess) {
        // Clear the flag and reload data immediately
        localStorage.removeItem('booking_success');
        fetchTrips();
        fetchBookings();
        fetchNotificationStats();
      }
    };

    // Check immediately when component mounts
    checkBookingSuccess();

    // Check periodically for booking success
    const bookingCheckInterval = setInterval(checkBookingSuccess, 1000); // every 1 second

    return () => clearInterval(bookingCheckInterval);
  }, []);

  // Handle trip creation
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || userProfile?.role !== 'driver') return;

    // Prevent double-click
    if (creatingTrip) {
      return;
    }

    // Set creating state immediately
    setCreatingTrip(true);

    // Check if driver is verified before allowing trip creation
    if (!userProfile?.isVerified) {
      toast({
        title: "الحساب غير مفعل",
        description: "يجب أن يوافق المدير على حسابك قبل إنشاء رحلات",
        variant: "destructive"
      });
      setCreatingTrip(false);
      return;
    }

    // Validate form data
    if (!tripForm.fromWilayaId || !tripForm.toWilayaId || !tripForm.vehicleId || 
        !tripForm.departureDate || !tripForm.departureTime || 
        !tripForm.pricePerSeat || !tripForm.totalSeats) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      setCreatingTrip(false);
      return;
    }
    
    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(tripForm.departureDate);
    if (selectedDate < today) {
      toast({
        title: "تاريخ غير صحيح",
        description: "لا يمكن اختيار تاريخ في الماضي",
        variant: "destructive"
      });
      setCreatingTrip(false);
      return;
    }

    // Validate numeric values
    const fromWilayaId = parseInt(tripForm.fromWilayaId);
    const toWilayaId = parseInt(tripForm.toWilayaId);
    const pricePerSeat = parseFloat(tripForm.pricePerSeat);
    const totalSeats = parseInt(tripForm.totalSeats);

    if (isNaN(fromWilayaId) || isNaN(toWilayaId) || isNaN(pricePerSeat) || isNaN(totalSeats)) {
      toast({
        title: "بيانات غير صحيحة",
        description: "يرجى التأكد من صحة البيانات المدخلة",
        variant: "destructive"
      });
      setCreatingTrip(false);
      return;
    }

    // Validate that from and to wilayas are different
    if (fromWilayaId === toWilayaId) {
      toast({
        title: "بيانات غير صحيحة",
        description: "ولاية الانطلاق وولاية الوصول يجب أن تكونا مختلفتين",
        variant: "destructive"
      });
      setCreatingTrip(false);
      return;
    }

    // Validate fromKsar if fromWilayaId is 47
    if (fromWilayaId === 47 && (!tripForm.fromKsar || tripForm.fromKsar.trim() === '')) {
      toast({
        title: "بيانات غير مكتملة",
        description: "قصر الانطلاق مطلوب عندما تكون ولاية الانطلاق غرداية",
        variant: "destructive"
      });
      setCreatingTrip(false);
      return;
    }

    // Validate toKsar if toWilayaId is 47
    if (toWilayaId === 47 && (!tripForm.toKsar || tripForm.toKsar.trim() === '')) {
      toast({
        title: "بيانات غير مكتملة",
        description: "قصر الوصول مطلوب عندما تكون ولاية الوصول غرداية",
        variant: "destructive"
      });
      setCreatingTrip(false);
      return;
    }

    // Validate price and seats
    if (pricePerSeat <= 0 || totalSeats <= 0) {
      toast({
        title: "بيانات غير صحيحة",
        description: "السعر وعدد المقاعد يجب أن يكونا أكبر من صفر",
        variant: "destructive"
      });
      setCreatingTrip(false);
      return;
    }
    
    // Validate vehicle ID if provided
    if (tripForm.vehicleId && typeof tripForm.vehicleId !== 'string') {
      toast({
        title: "بيانات غير صحيحة",
        description: "معرف المركبة غير صحيح",
        variant: "destructive"
      });
      setCreatingTrip(false);
      return;
    }

    try {
      // Get wilaya names for coordinates lookup
      const fromWilayaName = getWilayaName(fromWilayaId);
      const toWilayaName = getWilayaName(toWilayaId);
      
      // Calculate coordinates for both wilayas
      const [fromCoords, toCoords] = await Promise.all([
        getWilayaCoordinates(fromWilayaId, fromWilayaName),
        getWilayaCoordinates(toWilayaId, toWilayaName)
      ]);
      const trip = await BrowserDatabaseService.createTrip({
        driverId: user.id.toString(),
        vehicleId: tripForm.vehicleId,
        fromWilayaId: fromWilayaId,
        toWilayaId: toWilayaId,
        fromKsar: fromWilayaId === 47 ? tripForm.fromKsar : undefined,
        toKsar: toWilayaId === 47 ? tripForm.toKsar : undefined,
        fromLat: fromCoords?.lat,
        fromLng: fromCoords?.lng,
        toLat: toCoords?.lat,
        toLng: toCoords?.lng,
        departureDate: tripForm.departureDate,
        departureTime: tripForm.departureTime,
        pricePerSeat: pricePerSeat,
        totalSeats: totalSeats,
        description: tripForm.description,
      });

      // Show immediate feedback
      toast({
        title: "جاري إنشاء الرحلة...",
        description: "يرجى الانتظار",
      });

      // الإشعارات تُرسل تلقائياً من browserServices.ts في createTrip
      // لا حاجة لإرسالها مرة أخرى هنا

      // Show success message immediately
      toast({
        title: "✅ تم إنشاء الرحلة بنجاح",
        description: "تم إنشاء رحلة جديدة وإرسال إشعار للإدارة",
      });

      setShowTripForm(false);
      setTripForm({
        fromWilayaId: "",
        toWilayaId: "",
        fromKsar: "",
        toKsar: "",
        vehicleId: "",
        departureDate: "",
        departureTime: "",
        pricePerSeat: "",
        totalSeats: "4",
        description: ""
      });

      // Refresh data in background (non-blocking)
      setTimeout(() => {
        fetchTrips().then(() => {
        }).catch((error) => {
        });
      }, 500);
    } catch (error: any) {
      // Provide more specific error messages
      let errorMessage = "حدث خطأ أثناء إنشاء الرحلة. يرجى المحاولة مرة أخرى.";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      }
      
      toast({
        title: "خطأ في إنشاء الرحلة",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      // Clear creating state after a short delay
      setTimeout(() => {
        setCreatingTrip(false);
      }, 1000);
    }
  };

  // Handle trip deletion
  const handleDeleteTrip = async (tripId: string) => {
    if (!user || userProfile?.role !== 'driver') return;

    // التحقق من عدد حذف الرحلات قبل الحذف
    let deletionCount = 0;
    try {
      deletionCount = await BrowserDatabaseService.getTripDeletionCount(user.id);
    } catch (error) {
    }

    const remainingDeletions = Math.max(0, 3 - deletionCount);
    const willSuspendAfterThis = deletionCount >= 2;

    // رسالة تحذيرية قبل الحذف
    let confirmMessage = "هل أنت متأكد من حذف هذه الرحلة؟\n\n";
    if (willSuspendAfterThis) {
      confirmMessage += "⚠️ تحذير: هذه هي الرحلة الثالثة التي تحذفها في آخر 24 ساعة.\n";
      confirmMessage += "سيتم إيقاف حسابك تلقائياً بعد هذا الحذف.\n";
      confirmMessage += "يرجى التواصل مع المدير لإعادة التفعيل.";
    } else if (deletionCount > 0) {
      confirmMessage += `لديك ${deletionCount} حذف في آخر 24 ساعة.\n`;
      confirmMessage += `باقي ${remainingDeletions - 1} حذف قبل إيقاف حسابك.`;
    } else {
      confirmMessage += "ملاحظة: حذف 3 رحلات في آخر 24 ساعة سيؤدي إلى إيقاف حسابك تلقائياً.";
    }

    if (!window.confirm(confirmMessage)) return;

    try {
      await BrowserDatabaseService.deleteTrip(tripId);
      
      // Get updated deletion count after deletion
      let newDeletionCount = 0;
      try {
        newDeletionCount = await BrowserDatabaseService.getTripDeletionCount(user.id);
      } catch (error) {
      }

      const newRemainingDeletions = Math.max(0, 3 - newDeletionCount);
      const willSuspend = newDeletionCount >= 3;

      // رسالة تحذيرية إذا كان قريباً من الحد
      if (newRemainingDeletions <= 1 && newRemainingDeletions > 0) {
        toast({
          title: "⚠️ تحذير",
          description: `تم حذف الرحلة. لديك ${newRemainingDeletions} حذف متبقي قبل إيقاف حسابك.`,
          variant: "default"
        });
      } else if (willSuspend) {
        toast({
          title: "🚫 تم إيقاف حسابك",
          description: "تم إيقاف حسابك بسبب حذف 3 رحلات في آخر 24 ساعة. يرجى التواصل مع المدير لإعادة التفعيل.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "تم حذف الرحلة بنجاح",
          description: `تم حذف الرحلة. لديك ${newRemainingDeletions} حذف متبقي قبل إيقاف حسابك.`,
        });
      }
      
      await fetchTrips();
      
      // إذا تم إيقاف الحساب، إعادة تحميل الصفحة
      if (willSuspend) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error: any) {
      const errorMessage = error?.message || "حدث خطأ أثناء حذف الرحلة. يرجى المحاولة مرة أخرى.";
      
      toast({
        title: "خطأ في حذف الرحلة",
        description: errorMessage,
        variant: "destructive"
      });
      
      // إذا كان الخطأ بسبب إيقاف الحساب، إعادة تحميل الصفحة
      if (errorMessage.includes('إيقاف حسابك')) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    }
  };

  // Handle trip cancellation - opens dialog
  const handleCancelTrip = async (tripId: string) => {
    if (!user || userProfile?.role !== 'driver') {
      return;
    }

    // Check if account is suspended before opening dialog
    try {
      const isSuspended = await BrowserDatabaseService.isUserSuspended(user.id);
      if (isSuspended) {
        toast({
          title: "حسابك موقوف",
          description: "تم إيقاف حسابك. لا يمكنك إلغاء الرحلة. يرجى التواصل مع المدير لإعادة التفعيل.",
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      // Continue anyway if check fails
    }
    
    setTripToCancel(tripId);
    setCancellationReason('');
    setShowCancelTripDialog(true);
  };

  // Confirm trip cancellation with reason
  const confirmCancelTrip = async () => {
    if (!tripToCancel || !user || userProfile?.role !== 'driver') {
      return;
    }

    // Check if account is suspended before cancelling
    try {
      const isSuspended = await BrowserDatabaseService.isUserSuspended(user.id);
      if (isSuspended) {
        toast({
          title: "حسابك موقوف",
          description: "تم إيقاف حسابك. لا يمكنك إلغاء الرحلة. يرجى التواصل مع المدير لإعادة التفعيل.",
          variant: "destructive"
        });
        // Close dialog
        setShowCancelTripDialog(false);
        setTripToCancel(null);
        setCancellationReason('');
        return;
      }
    } catch (error) {
      // Continue anyway if check fails, but show warning
      toast({
        title: "تحذير",
        description: "حدث خطأ أثناء التحقق من حالة الحساب. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
      return;
    }
    try {
      // Cancel the trip with cancellation reason
      const newStatus = 'cancelled';
      const updates: any = { 
        status: newStatus,
        cancellation_reason: cancellationReason.trim() || 'لم يتم تحديد سبب'
      };
      await BrowserDatabaseService.updateTrip(tripToCancel, updates);
      // الإشعارات تُرسل تلقائياً من browserServices.ts في updateTrip عند تغيير الحالة إلى cancelled
      // لا حاجة لإرسالها مرة أخرى هنا
      
      toast({
        title: "تم إلغاء الرحلة",
        description: "تم إلغاء الرحلة بنجاح وإرسال الإشعارات للركاب.",
      });
      
      // Close dialog and reset state
      setShowCancelTripDialog(false);
      setTripToCancel(null);
      setCancellationReason('');
      await fetchTrips();
    } catch (error: any) {
      // Check if error is due to suspension
      if (error?.message?.includes('إيقاف حسابك')) {
        toast({
          title: "حسابك موقوف",
          description: "تم إيقاف حسابك. لا يمكنك إلغاء الرحلة. يرجى التواصل مع المدير لإعادة التفعيل.",
          variant: "destructive"
        });
        // Close dialog
        setShowCancelTripDialog(false);
        setTripToCancel(null);
        setCancellationReason('');
      } else {
        toast({
          title: "خطأ في إلغاء الرحلة",
          description: error?.message || "حدث خطأ أثناء إلغاء الرحلة. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      }
    }
  };

  // Handle vehicle creation
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || userProfile?.role !== 'driver') return;

    try {
      const vehicle = await BrowserDatabaseService.createVehicle({
        driverId: user.id.toString(),
        make: vehicleForm.make,
        model: vehicleForm.model,
        year: parseInt(vehicleForm.year),
        color: vehicleForm.color,
        licensePlate: vehicleForm.licensePlate,
        seats: parseInt(vehicleForm.seats),
        isActive: true, // Explicitly set to active when creating
      });

      // الإشعارات تُرسل تلقائياً من browserServices.ts في createVehicle
      // لا حاجة لإرسالها مرة أخرى هنا

      toast({
        title: "تم إضافة المركبة بنجاح",
        description: "تم إضافة مركبتك الجديدة بنجاح",
      });

      setShowVehicleForm(false);
      setVehicleForm({
        make: "",
        model: "",
        year: "",
        color: "",
        licensePlate: "",
        seats: "4"
      });

      await fetchVehicles();
    } catch (error) {
      toast({
        title: "خطأ في إضافة المركبة",
        description: "حدث خطأ أثناء إضافة المركبة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  // Handle vehicle update
  const handleUpdateVehicle = async (vehicleId: string, data: any) => {
    try {
      const payload: any = {
        make: data.make,
        model: data.model,
        year: typeof data.year === 'string' ? parseInt(data.year) : data.year,
        color: data.color,
        license_plate: data.licensePlate ?? data.license_plate,
        seats: typeof data.seats === 'string' ? parseInt(data.seats) : data.seats,
        // Default to active if not specified
        is_active: typeof data.isActive === 'boolean' ? data.isActive : true,
      };
      await BrowserDatabaseService.updateVehicle(vehicleId, payload);
      
      toast({
        title: "تم تحديث المركبة",
        description: "تم تحديث معلومات المركبة بنجاح",
      });
      
      await fetchVehicles();
      setShowVehicleEditForm(false);
      setEditingVehicleId(null);
    } catch (error) {
      toast({
        title: "خطأ في تحديث المركبة",
        description: "حدث خطأ أثناء تحديث المركبة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  // Handle vehicle deletion
  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!user || userProfile?.role !== 'driver') return;

    try {
      await BrowserDatabaseService.deleteVehicle(vehicleId);
      
      toast({
        title: "تم حذف المركبة",
        description: "تم حذف المركبة بنجاح",
      });
      
      await Promise.all([fetchVehicles(), fetchTrips()]); // Refresh both since vehicle deletion affects trips
    } catch (error) {
      toast({
        title: "خطأ في حذف المركبة",
        description: "حدث خطأ أثناء حذف المركبة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  // Handle vehicle toggle active status
  const handleToggleVehicleStatus = async (vehicleId: string, isActive: boolean) => {
    try {
      await BrowserDatabaseService.updateVehicle(vehicleId, { is_active: !isActive });
      
      // Send notification about vehicle status change
      try {
        const { NotificationService } = await import('@/integrations/database/notificationService');
        const vehicle = vehicles.find(v => v.id === vehicleId);
        
        if (vehicle && user) {
          await NotificationService.notifyVehicleStatusUpdate({
            driverId: user.id.toString(),
            vehicleId: vehicleId,
            vehicleName: `${vehicle.make} ${vehicle.model}`,
            newStatus: !isActive ? 'active' : 'inactive',
            reason: !isActive ? 'تم تفعيل المركبة بناءً على طلبك' : 'تم إلغاء تفعيل المركبة بناءً على طلبك'
          });
        }
      } catch (notificationError) {
      }
      
      toast({
        title: isActive ? "تم إلغاء تفعيل المركبة" : "تم تفعيل المركبة",
        description: isActive ? "تم إلغاء تفعيل المركبة بنجاح" : "تم تفعيل المركبة بنجاح",
      });
      
      await fetchVehicles();
    } catch (error: any) {
      // Provide more specific error messages
      let errorMessage = "حدث خطأ أثناء تغيير حالة المركبة. يرجى المحاولة مرة أخرى.";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      }
      
      toast({
        title: "خطأ في تغيير حالة المركبة",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Handle booking confirmation (for drivers)
  const handleConfirmBooking = async (bookingId: string | number) => {
    // Prevent double-click: if already confirming this booking, ignore
    if (confirmingBookingId === bookingId) {
      return;
    }

    // Set confirming state immediately to disable button
    setConfirmingBookingId(bookingId);
    
    try {
      // Show immediate feedback to user
      toast({
        title: "جاري تأكيد الحجز...",
        description: "يرجى الانتظار",
      });
      const result = await BookingTrackingService.trackStatusChange(
        bookingId.toString(),
        BookingStatus.CONFIRMED,
        'driver',
        user!.id,
        'تم قبول الحجز من قبل السائق'
      );
      // Show success message immediately
      toast({
        title: "✅ تم تأكيد الحجز",
        description: "تم تأكيد الحجز وإرسال إشعار للراكب بنجاح",
      });
      
      // Update data in background (non-blocking) - refresh after a short delay to allow UI to update
      setTimeout(() => {
        Promise.all([
          fetchBookings(), 
          fetchTrips(), 
          fetchAllTripsForStats(), 
          fetchAllBookingsForStats(), 
          fetchNotificationStats()
        ]).then(() => {
        }).catch((error) => {
        });
      }, 500); // Small delay to let UI update first
      
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تأكيد الحجز: " + (error?.message || 'خطأ غير معروف'),
        variant: "destructive"
      });
    } finally {
      // Clear confirming state after a short delay to prevent rapid clicks
      setTimeout(() => {
        setConfirmingBookingId(null);
      }, 1000);
    }
  };

  // Handle booking rejection (for drivers) - Shows dialog to enter rejection reason
  const handleRejectBooking = async (bookingId: string | number) => {
    if (!user || userProfile?.role !== 'driver') {
      return;
    }

    // Check if account is suspended before rejecting
    try {
      const isSuspended = await BrowserDatabaseService.isUserSuspended(user.id);
      if (isSuspended) {
        toast({
          title: "حسابك موقوف",
          description: "تم إيقاف حسابك. لا يمكنك رفض الحجز. يرجى التواصل مع المدير لإعادة التفعيل.",
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      // Continue anyway if check fails
    }

    setBookingToReject(bookingId);
    setRejectionReason('');
    setShowRejectBookingDialog(true);
  };

  // Confirm booking rejection with reason
  const confirmRejectBooking = async () => {
    if (!bookingToReject || !user || userProfile?.role !== 'driver') {
      return;
    }

    // Prevent double-click
    if (rejectingBookingId === bookingToReject) {
      return;
    }

    // Set rejecting state immediately
    setRejectingBookingId(bookingToReject);

    // Check if account is suspended before rejecting
    try {
      const isSuspended = await BrowserDatabaseService.isUserSuspended(user.id);
      if (isSuspended) {
        toast({
          title: "حسابك موقوف",
          description: "تم إيقاف حسابك. لا يمكنك رفض الحجز. يرجى التواصل مع المدير لإعادة التفعيل.",
          variant: "destructive"
        });
        setShowRejectBookingDialog(false);
        setBookingToReject(null);
        setRejectionReason('');
        setRejectingBookingId(null);
        return;
      }
    } catch (error) {
      toast({
        title: "تحذير",
        description: "حدث خطأ أثناء التحقق من حالة الحساب. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
      setRejectingBookingId(null);
      return;
    }

    if (!rejectionReason.trim()) {
      toast({
        title: "سبب مطلوب",
        description: "يرجى كتابة سبب رفض الحجز",
        variant: "destructive"
      });
      setRejectingBookingId(null);
      return;
    }

    try {
      // Show immediate feedback
      toast({
        title: "جاري رفض الحجز...",
        description: "يرجى الانتظار",
      });

      // Update booking status to rejected with reason
      await BrowserDatabaseService.updateBooking(bookingToReject, {
        status: 'rejected',
        cancellation_reason: rejectionReason.trim()
      });
      // Show success message immediately
      toast({
        title: "✅ تم رفض الحجز",
        description: "تم رفض الحجز بنجاح وإرسال الإشعار للراكب.",
      });

      // Close dialog and reset state
      setShowRejectBookingDialog(false);
      const rejectedId = bookingToReject;
      setBookingToReject(null);
      setRejectionReason('');

      // Refresh data in background (non-blocking)
      setTimeout(() => {
        Promise.all([
          fetchBookings(), 
          fetchTrips(), 
          fetchAllTripsForStats(), 
          fetchAllBookingsForStats(), 
          fetchNotificationStats()
        ]).then(() => {
        }).catch((error) => {
        });
      }, 500);
    } catch (error) {
      toast({
        title: "خطأ في رفض الحجز",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء رفض الحجز",
        variant: "destructive"
      });
    } finally {
      // Clear rejecting state after a short delay
      setTimeout(() => {
        setRejectingBookingId(null);
      }, 1000);
    }
  };

  // Handle booking cancellation - Shows dialog to enter cancellation reason (for passengers)
  const handleCancelBooking = async (bookingId: string | number) => {
    if (!user || userProfile?.role !== 'passenger') {
      // For drivers, use the old method (if needed)
      try {
        const userRole = userProfile?.role === 'driver' ? 'driver' : 'passenger';
        await BookingTrackingService.trackStatusChange(
          bookingId.toString(),
          BookingStatus.CANCELLED,
          userRole as 'driver' | 'passenger',
          user!.id,
          'تم إلغاء الحجز من قبل المستخدم'
        );
        await Promise.all([fetchBookings(), fetchTrips(), fetchAllTripsForStats(), fetchAllBookingsForStats(), fetchNotificationStats()]);
        
        toast({
          title: "تم إلغاء الحجز",
          description: "تم إلغاء الحجز وإرسال إشعار للأطراف المعنية",
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء إلغاء الحجز",
          variant: "destructive"
        });
      }
      return;
    }

    // For passengers, show dialog to enter cancellation reason
    setBookingToCancel(bookingId);
    setCancelBookingReason('');
    setShowCancelBookingDialog(true);
  };

  // Confirm booking cancellation with reason (for passengers)
  const confirmCancelBooking = async () => {
    if (!bookingToCancel || !user || userProfile?.role !== 'passenger') {
      return;
    }

    if (!cancelBookingReason.trim()) {
      toast({
        title: "سبب مطلوب",
        description: "يرجى كتابة سبب إلغاء الحجز",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get booking details to find driver
      const booking = bookings.find((b: any) => b.id === bookingToCancel);
      if (!booking) {
        throw new Error('الحجز غير موجود');
      }

      // Update booking status to cancelled with reason
      await BrowserDatabaseService.updateBooking(bookingToCancel, {
        status: 'cancelled',
        cancellation_reason: cancelBookingReason.trim()
      });
      // Refresh data
      await Promise.all([fetchBookings(), fetchTrips(), fetchAllTripsForStats(), fetchAllBookingsForStats(), fetchNotificationStats()]);

      toast({
        title: "تم إلغاء الحجز",
        description: "تم إلغاء الحجز بنجاح وإرسال الإشعار للسائق.",
      });

      // Close dialog and reset state
      setShowCancelBookingDialog(false);
      setBookingToCancel(null);
      setCancelBookingReason('');
    } catch (error) {
      toast({
        title: "خطأ في إلغاء الحجز",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء إلغاء الحجز",
        variant: "destructive"
      });
    }
  };

  // Handle booking completion (for drivers) - Completes trip for all passengers
  const handleCompleteBooking = async (bookingId: string | number) => {
    try {
      // Get the booking details first
      const booking = bookings.find((b: any) => b.id === bookingId);
      if (!booking) {
        throw new Error('الحجز غير موجود');
      }
      // Get all bookings for this trip
      const tripBookings = bookings.filter((b: any) => b.tripId === booking.tripId);
      // Complete all bookings for this trip
      const completionPromises = tripBookings.map(async (tripBooking: any) => {
        return BookingTrackingService.trackStatusChange(
          tripBooking.id.toString(),
          BookingStatus.COMPLETED,
          'driver',
          user!.id,
          'تم إكمال الرحلة لجميع الركاب'
        );
      });
      
      // Wait for all bookings to be completed
      await Promise.all(completionPromises);
      // Update trip status to completed
      await BrowserDatabaseService.updateTrip(booking.tripId, { 
        status: 'completed' 
      });
      // Send rating request notifications to all passengers explicitly
      // Wait a bit to ensure all bookings are updated in the database
      try {
        // Wait a short moment to ensure all bookings are saved to database
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Call notifyAllPassengersOfTripCompletion directly
        // This will send completion and rating request notifications to all passengers
        await BookingTrackingService.notifyAllPassengersOfTripCompletion(booking.tripId, user!.id);
      } catch (notificationError) {
        // Don't fail the entire process if notifications fail
      }
      
      // Refresh all data
      await Promise.all([fetchBookings(), fetchTrips(), fetchAllTripsForStats(), fetchAllBookingsForStats(), fetchNotificationStats()]);
      
      // Show rating popup for the first passenger
      if (booking) {
        setRatingBooking(booking);
        setRatingTarget({
          userId: booking.passengerId,
          type: 'passenger'
        });
        setShowRatingPopup(true);
      }
      
      toast({
        title: "تم إكمال الرحلة",
        description: `تم إكمال الرحلة لجميع الركاب (${tripBookings.length} راكب) وإرسال إشعارات للجميع`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إكمال الرحلة",
        variant: "destructive"
      });
    }
  };

  // Handle booking completion (for passengers)
  const handlePassengerCompleteBooking = async (bookingId: string | number) => {
    try {
      await BookingTrackingService.trackStatusChange(
        bookingId.toString(),
        BookingStatus.COMPLETED,
        'passenger',
        user!.id,
        'تم إكمال الرحلة بنجاح'
      );
      await Promise.all([fetchBookings(), fetchTrips(), fetchAllTripsForStats(), fetchAllBookingsForStats(), fetchNotificationStats()]);
      
      // Show rating popup after completion
      const booking = bookings.find((b: any) => b.id === bookingId);
      if (booking) {
        setRatingBooking(booking);
        setRatingTarget({
          userId: booking.driverId,
          type: 'driver'
        });
        setShowRatingPopup(true);
      }
      
      toast({
        title: "تم إكمال الرحلة",
        description: "تم إكمال الرحلة بنجاح وإرسال إشعار للسائق",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: `حدث خطأ أثناء إكمال الرحلة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        variant: "destructive"
      });
    }
  };

  // Handle passenger rating submission
  const handlePassengerRatingSubmit = async () => {
    // This function is called when the rating popup is closed
    // The actual rating submission happens in the RatingPopup component
    // Just refresh the data to reflect any changes
    await Promise.all([fetchBookings(), fetchTrips(), fetchNotificationStats()]);
  };

  // Handle booking a trip
  const handleBookTrip = (trip: any) => {
    setSelectedTrip(trip);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = async () => {
    // Refresh bookings and trips to reflect the new booking and updated seat availability
    await Promise.all([fetchBookings(), fetchTrips(), fetchNotificationStats()]);
  };

  const getStatusBadge = (status: string) => {
    return BookingTrackingService.getStatusInfo(status);
  };

  const getRoleInfo = () => {
    switch (userProfile?.role) {
      case 'driver':
        return {
          title: 'لوحة السائق',
          description: 'إدارة رحلاتك وحجوزاتك',
          icon: Car,
          color: 'bg-green-500'
        };
      case 'passenger':
        return {
          title: 'لوحة الراكب',
          description: 'إدارة حجوزاتك والبحث عن رحلات',
          icon: User,
          color: 'bg-blue-500'
        };
      case 'admin':
        return {
          title: 'لوحة الإدارة',
          description: 'إدارة النظام والمستخدمين',
          icon: Shield,
          color: 'bg-purple-500'
        };
      default:
        return {
          title: 'لوحة المستخدم',
          description: 'مرحباً بك في منصة أبريد',
          icon: User,
          color: 'bg-gray-500'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل لوحة التحكم...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Profile Completion Banner */}
        {userProfile && !(
          (userProfile.fullName || userProfile.full_name) && 
          (userProfile.phone || userProfile.Phone) && 
          (userProfile.wilaya || userProfile.Wilaya) && 
          (userProfile.commune || userProfile.Commune)
        ) && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 text-sm sm:text-base">معلومات الملف الشخصي مطلوبة</h3>
                    <p className="text-yellow-700 text-xs sm:text-sm">
                      يرجى ملء جميع الحقول المطلوبة لإكمال ملفك الشخصي
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/profile?edit=true')}
                  className="bg-yellow-600 hover:bg-yellow-700 w-full sm:w-auto"
                >
                  <Edit className="h-4 w-4 ml-2" />
                  <span className="text-sm">إكمال الملف الشخصي</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancellation Warning */}
        <CancellationWarning />
        <div className={`${roleInfo.color} rounded-xl p-4 sm:p-6 text-white`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 flex-wrap">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-white/20 flex-shrink-0">
                <AvatarImage src={authProfile?.avatar_url || userProfile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-white/20 text-white">
                  {displayName?.charAt(0) || 'ع'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-center sm:text-right">
                <h1 className="text-lg sm:text-2xl font-bold truncate">{roleInfo.title}</h1>
                <p className="text-white/90 truncate text-sm sm:text-base">{roleInfo.description}</p>
                <p className="text-white/80 text-xs sm:text-sm truncate">
                  مرحباً، {displayName}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="secondary" 
                onClick={() => window.location.href = "/profile"}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <User className="h-4 w-4" />
                <span className="text-sm">الملف الشخصي</span>
              </Button>
              <div className="text-center sm:text-right min-w-0 bg-white/10 p-3 rounded-lg">
                <div className="text-xs sm:text-sm text-white/80 truncate">
                  {userProfile?.role === 'driver' ? 'رحلاتي' : 
                   userProfile?.role === 'passenger' ? 'حجوزاتي' : 
                   'إجمالي المستخدمين'}
                </div>
                <div className="text-lg sm:text-2xl font-bold truncate">
                  {userProfile?.role === 'driver' ? trips.length :
                   userProfile?.role === 'passenger' ? acceptedBookings.length :
                   adminStats.totalUsers}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions for Admins */}
        {userProfile?.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>الوصول السريع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Button variant="outline" onClick={() => window.location.href = "/data-management"} className="w-full">
                  <Database className="h-4 w-4 ml-2" />
                  <span className="text-sm">إدارة البيانات</span>
                </Button>
                <Button variant="outline" onClick={() => window.location.href = "/dashboard?tab=users"} className="w-full">
                  <Users className="h-4 w-4 ml-2" />
                  <span className="text-sm">المستخدمين</span>
                </Button>
                <Button variant="outline" onClick={() => window.location.href = "/dashboard?tab=admin-trips"} className="w-full">
                  <Route className="h-4 w-4 ml-2" />
                  <span className="text-sm">الرحلات</span>
                </Button>
                {/* <Button variant="outline" onClick={() => window.location.href = "/dashboard?tab=admin-bookings"}>
                  <Calendar className="h-4 w-4 ml-2" />
                  الحجوزات
                </Button> */}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-3 sm:p-4 text-center">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
              <div className="text-lg sm:text-2xl font-bold">{acceptedBookings.length}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {userProfile?.role === 'driver' ? 'حجوزاتي' : 'حجوزاتي'}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-3 sm:p-4 text-center">
              <Check className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
              <div className="text-lg sm:text-2xl font-bold">
                {bookings.filter((b: any) => b.status === 'confirmed').length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">مؤكدة</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-3 sm:p-4 text-center">
              <Route className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-lg sm:text-2xl font-bold">{trips.length}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {userProfile?.role === 'driver' ? 'رحلاتي' : 'رحلات متاحة'}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-3 sm:p-4 text-center">
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-lg sm:text-2xl font-bold">{notificationStats.unread}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">إشعارات جديدة</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} className="space-y-4 sm:space-y-6">
          <TabsList className="flex flex-wrap gap-1 sm:gap-2 p-1 sm:p-2 bg-muted rounded-lg">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-sm transition-all hover:bg-muted-foreground/10"
              onClick={() => navigate('?tab=overview')}
            >
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">نظرة عامة</span>
              <span className="sm:hidden">نظرة</span>
            </TabsTrigger>
            {userProfile?.role === 'driver' && (
              <>
                <TabsTrigger 
                  value="vehicles" 
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-sm transition-all hover:bg-muted-foreground/10"
                  onClick={() => navigate('?tab=vehicles')}
                >
                  <Car className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">المركبات</span>
                  <span className="sm:hidden">مركبات</span>
                </TabsTrigger>
              </>
            )}
            <TabsTrigger 
              value="trips"
              className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-sm transition-all hover:bg-muted-foreground/10"
              onClick={() => navigate('?tab=trips')}
            >
              <Route className="h-3 w-3 sm:h-4 sm:w-4" />
              {userProfile?.role === 'driver' ? (
                <>
                  <span className="hidden sm:inline">رحلاتي</span>
                  <span className="sm:hidden">رحلات</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">الرحلات</span>
                  <span className="sm:hidden">رحلات</span>
                </>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="bookings" 
              className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-sm transition-all hover:bg-muted-foreground/10"
              onClick={() => navigate('?tab=bookings')}
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">حجوزاتي</span>
              <span className="sm:hidden">حجوزات</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profile-edit" 
              className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-sm transition-all hover:bg-muted-foreground/10"
              onClick={() => navigate('?tab=profile-edit')}
            >
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">الملف الشخصي</span>
              <span className="sm:hidden">ملف</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-sm transition-all hover:bg-muted-foreground/10"
              onClick={() => navigate('?tab=notifications')}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">الإشعارات</span>
                <span className="sm:hidden">تنبيهات</span>
                {notificationStats.unread > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-xs">
                    {notificationStats.unread}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            {userProfile?.role === 'admin' && (
              <>
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-sm transition-all hover:bg-muted-foreground/10"
                  onClick={() => navigate('?tab=users')}
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">المستخدمين</span>
                  <span className="sm:hidden">مستخدمون</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="admin-trips" 
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-sm transition-all hover:bg-muted-foreground/10"
                  onClick={() => navigate('?tab=admin-trips')}
                >
                  <Route className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">الرحلات</span>
                  <span className="sm:hidden">رحلات</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="recent-bookings" 
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-sm transition-all hover:bg-muted-foreground/10"
                  onClick={() => navigate('?tab=recent-bookings')}
                >
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">الحجوزات الحديثة</span>
                  <span className="sm:hidden">حديثة</span>
                </TabsTrigger>
                {/* Hidden admin-bookings tab */}
                {/* <TabsTrigger 
                  value="admin-bookings" 
                  className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white px-3 py-1.5 text-sm font-medium rounded-sm transition-all hover:bg-muted-foreground/10"
                  onClick={() => navigate('?tab=admin-bookings')}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">الحجوزات</span>
                  <span className="sm:hidden">حجوزات</span>
                </TabsTrigger> */}
                <TabsTrigger 
                  value="database" 
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-sm transition-all hover:bg-muted-foreground/10"
                  onClick={() => navigate('?tab=database')}
                >
                  <Database className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">قاعدة البيانات</span>
                  <span className="sm:hidden">بيانات</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-sm transition-all hover:bg-muted-foreground/10"
                  onClick={() => navigate('?tab=settings')}
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">الإعدادات</span>
                  <span className="sm:hidden">إعدادات</span>
                </TabsTrigger>
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-green-600 hover:bg-green-700"
                  onClick={() => navigate('/drivers-map')}
                >
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">🗺️ الخريطة</span>
                  <span className="sm:hidden">🗺️</span>
                </Button>
              </>
            )}
            {/* Database settings tab removed for passengers */}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4">
              {userProfile?.role === 'driver' && (
                <Card>
                  <CardHeader>
                    <CardTitle>إحصائيات السائق</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">

                      <div className="text-center p-2 sm:p-3 bg-primary/5 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-primary">{vehicles.length}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">إجمالي المركبات</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-green-500/5 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">
                          {vehicles.filter((v: any) => v.isActive).length}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">مركبات نشطة</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-green-500/5 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">
                          {allTrips.filter((t: any) => t.status === 'completed').length}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">رحلات مكتملة</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-blue-500/5 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">
                          {(() => {
                            const totalBookedSeats = allBookings.reduce((total: number, booking: any) => {
                              return total + (booking.seatsBooked || 0);
                            }, 0);
                            
                            // Log calculation for debugging (same as Profile.tsx)
                            return totalBookedSeats;
                          })()}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">مقاعد محجوزة</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-orange-500/5 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-orange-600">
                          {allBookings.filter((b: any) => b.status === 'completed').length}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">حجوزات مكتملة</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-yellow-500/5 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                          {allBookings.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0)} دج
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">الأرباح</div>
                      </div>
                    </div>
                    </CardContent>
                  </Card>
              )}

              {/* Driver Ratings Section */}
              {userProfile?.role === 'driver' && user && (
                <DriverRatingsDisplay driverId={user.id} showTitle={true} />
              )}

              {userProfile?.role === 'passenger' && (
                <Card>
                  <CardHeader>
                    <CardTitle>إحصائيات الراكب</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="text-center p-2 sm:p-3 bg-primary/5 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-primary">{acceptedBookings.length}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">حجوزات مقبولة</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-green-500/5 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">
                          {bookings.filter((b: any) => b.status === 'confirmed').length}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">حجوزات مؤكدة</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-blue-500/5 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">{trips.length}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">رحلات متاحة</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {userProfile?.role === 'admin' && (
                <Card>
                  <CardHeader>
                    <CardTitle>إحصائيات الإدارة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center p-2 sm:p-3 bg-primary/5 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-primary">{adminStats.totalUsers}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">المستخدمين</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-green-500/5 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">{trips.length}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">الرحلات</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-blue-500/5 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">{bookings.length}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">الحجوزات</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-orange-500/5 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-orange-600">
                          {bookings.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0)} دج
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">إجمالي الأرباح</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Vehicles Tab (Driver only) */}
          {userProfile?.role === 'driver' && (
            <TabsContent value="vehicles" className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">مركباتي</h2>
                {/* Hidden button - removed as requested */}
              </div>

              {showVehicleForm && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg sm:text-xl">إضافة مركبة جديدة</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <form onSubmit={handleCreateVehicle} className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">الماركة</label>
                          <input
                            type="text"
                            value={vehicleForm.make}
                            onChange={(e) => setVehicleForm(prev => ({ ...prev, make: e.target.value }))}
                            className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base"
                            placeholder="مثال: Renault"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">الموديل</label>
                          <input
                            type="text"
                            value={vehicleForm.model}
                            onChange={(e) => setVehicleForm(prev => ({ ...prev, model: e.target.value }))}
                            className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base"
                            placeholder="مثال: Symbol"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">سنة الصنع</label>
                          <input
                            type="number"
                            value={vehicleForm.year}
                            onChange={(e) => setVehicleForm(prev => ({ ...prev, year: e.target.value }))}
                            className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base"
                            placeholder="2020"
                            min="1990"
                            max="2024"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">اللون</label>
                          <input
                            type="text"
                            value={vehicleForm.color}
                            onChange={(e) => setVehicleForm(prev => ({ ...prev, color: e.target.value }))}
                            className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base"
                            placeholder="أبيض"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">رقم اللوحة</label>
                          <input
                            type="text"
                            value={vehicleForm.licensePlate}
                            onChange={(e) => setVehicleForm(prev => ({ ...prev, licensePlate: e.target.value }))}
                            className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base"
                            placeholder="123-456-16"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">عدد المقاعد</label>
                          <input
                            type="number"
                            value={vehicleForm.seats}
                            onChange={(e) => setVehicleForm(prev => ({ ...prev, seats: e.target.value }))}
                            className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base"
                            min="2"
                            max="8"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button type="submit" className="flex-1 w-full sm:w-auto">
                          إضافة المركبة
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowVehicleForm(false)} className="w-full sm:w-auto">
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-3 sm:gap-4">
                {vehicles.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 sm:p-8 text-center">
                      <Car className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                      <h3 className="text-base sm:text-lg font-semibold mb-2">لا توجد مركبات</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        لم تقم بإضافة أي مركبة بعد. أضف مركبتك الأولى للبدء.
                      </p>
                      <Button onClick={() => setShowVehicleForm(true)} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        إضافة مركبة
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {vehicles.map((vehicle: any) => (
                    <Card key={vehicle.id} className="hover:shadow-elegant transition-all">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Car className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-base sm:text-lg truncate">{vehicle.make} {vehicle.model}</h3>
                              <p className="text-sm sm:text-base text-muted-foreground truncate">
                                {vehicle.year} • {vehicle.color} • {vehicle.licensePlate}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                <span className="text-xs sm:text-sm">{vehicle.seats} مقاعد</span>
                                <Badge variant={vehicle.isActive ? "default" : "secondary"} className="text-xs">
                                  {vehicle.isActive ? "نشط" : "غير نشط"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleToggleVehicleStatus(vehicle.id, vehicle.isActive)}
                              className="flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                              {vehicle.isActive ? (
                                <PowerOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              ) : (
                                <Power className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              )}
                              <span className="hidden sm:inline">{vehicle.isActive ? "إلغاء التفعيل" : "تفعيل"}</span>
                              <span className="sm:hidden">{vehicle.isActive ? "إيقاف" : "تشغيل"}</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEditingVehicleId(vehicle.id);
                                setVehicleEditForm({
                                  make: vehicle.make || '',
                                  model: vehicle.model || '',
                                  year: String(vehicle.year || ''),
                                  color: vehicle.color || '',
                                  licensePlate: vehicle.licensePlate || '',
                                  seats: String(vehicle.seats || '4'),
                                  is_active: !!vehicle.isActive,
                                });
                                setShowVehicleEditForm(true);
                              }}
                              className="flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              تعديل
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setExpandedVehicleId(prev => prev === vehicle.id ? null : vehicle.id)}
                              className="flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              عرض
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (confirm('هل أنت متأكد من حذف هذه المركبة؟ سيتم حذف جميع الرحلات المرتبطة بها.')) {
                                  handleDeleteVehicle(vehicle.id);
                                }
                              }}
                              className="flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                              <Trash className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ))}
                    {!showVehicleForm && (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <Button onClick={() => setShowVehicleForm(true)} className="w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            إضافة مركبة
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          )}

          {/* Trips Tab */}
          <TabsContent value="trips" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {userProfile?.role === 'driver' ? 'رحلاتي' : 'الرحلات المتاحة'}
              </h2>
              {userProfile?.role === 'driver' && (
                <Button 
                  onClick={() => setShowTripForm(true)}
                  disabled={!userProfile?.isVerified}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إنشاء رحلة
                </Button>
              )}
            </div>

            {/* Show verification message for unverified drivers */}
            {userProfile?.role === 'driver' && !userProfile?.isVerified && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold text-yellow-800">الحساب بانتظار الموافقة</h3>
                      <p className="text-yellow-700">
                        يجب أن يوافق المدير على حسابك قبل أن تتمكن من إنشاء رحلات. 
                        يرجى الانتظار حتى تتم الموافقة على حسابك.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {showTripForm && userProfile?.role === 'driver' && userProfile?.isVerified && (
              <Card>
                <CardHeader>
                  <CardTitle>إنشاء رحلة جديدة</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTrip} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">من</label>
                        <select
                          value={tripForm.fromWilayaId}
                          onChange={(e) => {
                            const selectedCode = e.target.value;
                            setTripForm(prev => ({ 
                              ...prev, 
                              fromWilayaId: selectedCode, 
                              fromKsar: selectedCode === '47' ? prev.fromKsar : '' 
                            }));
                          }}
                          className="w-full p-2 border rounded-md"
                          required
                        >
                          <option value="">اختر الولاية</option>
                          {wilayas.map((wilaya) => (
                            <option key={wilaya.code} value={wilaya.code}>{wilaya.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">إلى</label>
                        <select
                          value={tripForm.toWilayaId}
                          onChange={(e) => {
                            const selectedCode = e.target.value;
                            setTripForm(prev => ({ 
                              ...prev, 
                              toWilayaId: selectedCode, 
                              toKsar: selectedCode === '47' ? prev.toKsar : '' 
                            }));
                          }}
                          className="w-full p-2 border rounded-md"
                          required
                        >
                          <option value="">اختر الولاية</option>
                          {wilayas.map((wilaya) => (
                            <option key={wilaya.code} value={wilaya.code}>{wilaya.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* القصر للانطلاق - يظهر فقط عندما تكون الولاية غرداية (47) */}
                    {tripForm.fromWilayaId === '47' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">قصر الانطلاق <span className="text-red-500">*</span></label>
                        <select
                          value={tripForm.fromKsar}
                          onChange={(e) => setTripForm(prev => ({ ...prev, fromKsar: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                          required={tripForm.fromWilayaId === '47'}
                        >
                          <option value="">اختر القصر</option>
                          <option value="قصر بريان">قصر بريان</option>
                          <option value="قصر القرارة">قصر القرارة</option>
                          <option value="قصر بني يزقن">قصر بني يزقن</option>
                          <option value="قصر العطف">قصر العطف</option>
                          <option value="قصر غرداية">قصر غرداية</option>
                          <option value="قصر بنورة">قصر بنورة</option>
                          <option value="قصر مليكة">قصر مليكة</option>
                        </select>
                      </div>
                    )}
                    
                    {/* القصر للوصول - يظهر فقط عندما تكون الولاية غرداية (47) */}
                    {tripForm.toWilayaId === '47' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">قصر الوصول <span className="text-red-500">*</span></label>
                        <select
                          value={tripForm.toKsar}
                          onChange={(e) => setTripForm(prev => ({ ...prev, toKsar: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                          required={tripForm.toWilayaId === '47'}
                        >
                          <option value="">اختر القصر</option>
                          <option value="قصر بريان">قصر بريان</option>
                          <option value="قصر القرارة">قصر القرارة</option>
                          <option value="قصر بني يزقن">قصر بني يزقن</option>
                          <option value="قصر العطف">قصر العطف</option>
                          <option value="قصر غرداية">قصر غرداية</option>
                          <option value="قصر بنورة">قصر بنورة</option>
                          <option value="قصر مليكة">قصر مليكة</option>
                        </select>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">المركبة</label>
                      {(() => {
                        const activeVehicles = vehicles.filter((v: any) => v.isActive);
                        if (activeVehicles.length === 0) {
                          return (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <p className="text-sm text-yellow-800">
                                لا توجد مركبات نشطة. يرجى إضافة مركبة أولاً أو تفعيل إحدى المركبات الموجودة.
                              </p>
                              {vehicles.length > 0 && (
                                <div className="mt-2 text-xs text-yellow-700">
                                  <p>المركبات الموجودة:</p>
                                  <ul className="list-disc list-inside">
                                    {vehicles.map((v: any) => (
                                      <li key={v.id}>
                                        {v.make} {v.model} - {v.isActive ? 'نشط' : 'غير نشط'}
                                      </li>
                                    ))}
                                  </ul>
                                  <button 
                                    type="button"
                                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                                    onClick={() => {
                                      // Activate all vehicles
                                      vehicles.forEach((v: any) => {
                                        if (!v.isActive) {
                                          handleToggleVehicleStatus(v.id, v.isActive);
                                        }
                                      });
                                    }}
                                  >
                                    تفعيل جميع المركبات
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <select
                              value={tripForm.vehicleId}
                              onChange={(e) => setTripForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                              className="w-full p-2 border rounded-md"
                              required
                            >
                              <option value="">اختر المركبة</option>
                              {activeVehicles.map((vehicle: any) => (
                                <option key={vehicle.id} value={vehicle.id}>
                                  {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.licensePlate}
                                </option>
                              ))}
                            </select>
                          );
                        }
                      })()}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">التاريخ</label>
                        <input
                          type="date"
                          value={tripForm.departureDate}
                          onChange={(e) => setTripForm(prev => ({ ...prev, departureDate: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">الوقت</label>
                        <input
                          type="time"
                          value={tripForm.departureTime}
                          onChange={(e) => setTripForm(prev => ({ ...prev, departureTime: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">سعر المقعد (دج)</label>
                        <input
                          type="number"
                          value={tripForm.pricePerSeat}
                          onChange={(e) => setTripForm(prev => ({ ...prev, pricePerSeat: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                          required
                          min="1"
                          step="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">عدد المقاعد</label>
                        <Select value={tripForm.totalSeats} onValueChange={(value) => setTripForm(prev => ({ ...prev, totalSeats: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر عدد المقاعد" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 مقعد</SelectItem>
                            <SelectItem value="2">2 مقعد</SelectItem>
                            <SelectItem value="3">3 مقاعد</SelectItem>
                            <SelectItem value="4">4 مقاعد</SelectItem>
                            <SelectItem value="5">5 مقاعد</SelectItem>
                            <SelectItem value="6">6 مقاعد</SelectItem>
                            <SelectItem value="7">7 مقاعد</SelectItem>
                            <SelectItem value="8">8 مقاعد (نقل)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">الوصف (اختياري)</label>
                      <textarea
                        value={tripForm.description}
                        onChange={(e) => setTripForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-2 border rounded-md"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" disabled={creatingTrip}>
                        {creatingTrip ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            جاري الإنشاء...
                          </>
                        ) : (
                          'إنشاء الرحلة'
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowTripForm(false)} disabled={creatingTrip}>
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Search and Filter Section for Passengers and Admins */}
            {(userProfile?.role === 'passenger' || userProfile?.role === 'admin') && (
              <>
                {/* Filter Toggle Button */}
                <div className="flex justify-end mb-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                    className="flex items-center gap-2 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                  >
                    <Filter className="h-4 w-4" />
                    تصفية رحلات {selectedDayTab === 'today' ? 'اليوم' : selectedDayTab === 'tomorrow' ? 'الغد' : 'الكلية'} ({filteredTrips.length > 0 ? filteredTrips.length : trips.length})
                  </Button>
                </div>

                {/* Filter Sidebar Overlay */}
                {showFilterSidebar && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black/50 z-40"
                      onClick={() => setShowFilterSidebar(false)}
                    />
                    
                    {/* Sidebar */}
                    <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
                      showFilterSidebar ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                      <Card className="h-full rounded-none">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            تصفية رحلات {selectedDayTab === 'today' ? 'اليوم' : selectedDayTab === 'tomorrow' ? 'الغد' : 'الكلية'} 
                            <span className="text-sm font-normal text-muted-foreground">
                              ({filteredTrips.length} من {trips.length} رحلة)
                            </span>
                          </CardTitle>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowFilterSidebar(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-800">
                                💡 <strong>نصيحة:</strong> يمكنك استخدام أي فلتر بشكل منفصل. مثلاً، اختر ولاية الانطلاق فقط لرؤية جميع الرحلات من تلك الولاية.
                              </p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">من الولاية</label>
                              <select
                                className="w-full p-2 border rounded-md"
                                value={tripFilters.fromWilaya}
                                onChange={(e) => {
                                  setTripFilters({...tripFilters, fromWilaya: e.target.value, fromKsar: 'all'});
                                }}
                              >
                                <option value="">الكل</option>
                                {wilayas.map((wilaya, index) => (
                                  <option key={index} value={wilaya.code}>{wilaya.name}</option>
                                ))}
                              </select>
                            </div>
                            {/* From Ksar filter - only shown when fromWilaya is Ghardaia (47) */}
                            {tripFilters.fromWilaya === '47' && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">قصر الانطلاق</label>
                                <select
                                  className="w-full p-2 border rounded-md"
                                  value={tripFilters.fromKsar}
                                  onChange={(e) => {
                                    setTripFilters({...tripFilters, fromKsar: e.target.value});
                                  }}
                                >
                                  <option value="all">الكل</option>
                                  {ksour.map((ksar) => (
                                    <option key={ksar.value} value={ksar.value}>{ksar.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">إلى الولاية</label>
                              <select
                                className="w-full p-2 border rounded-md"
                                value={tripFilters.toWilaya}
                                onChange={(e) => {
                                  setTripFilters({...tripFilters, toWilaya: e.target.value, toKsar: 'all'});
                                }}
                              >
                                <option value="">الكل</option>
                                {wilayas.map((wilaya, index) => (
                                  <option key={index} value={wilaya.code}>{wilaya.name}</option>
                                ))}
                              </select>
                            </div>
                            {/* To Ksar filter - only shown when toWilaya is Ghardaia (47) */}
                            {tripFilters.toWilaya === '47' && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">قصر الوجهة</label>
                                <select
                                  className="w-full p-2 border rounded-md"
                                  value={tripFilters.toKsar}
                                  onChange={(e) => {
                                    setTripFilters({...tripFilters, toKsar: e.target.value});
                                  }}
                                >
                                  <option value="all">الكل</option>
                                  {ksour.map((ksar) => (
                                    <option key={ksar.value} value={ksar.value}>{ksar.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">التاريخ</label>
                              <input
                                type="date"
                                className="w-full p-2 border rounded-md"
                                value={tripFilters.date}
                                onChange={(e) => {
                                  setTripFilters({...tripFilters, date: e.target.value});
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">السعر الأدنى</label>
                              <input
                                type="number"
                                placeholder="السعر بالدينار"
                                className="w-full p-2 border rounded-md"
                                value={tripFilters.minPrice}
                                onChange={(e) => {
                                  setTripFilters({...tripFilters, minPrice: e.target.value});
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">السعر الأقصى</label>
                              <input
                                type="number"
                                placeholder="السعر بالدينار"
                                className="w-full p-2 border rounded-md"
                                value={tripFilters.maxPrice}
                                onChange={(e) => {
                                  setTripFilters({...tripFilters, maxPrice: e.target.value});
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">التقييم الأدنى</label>
                              <select
                                className="w-full p-2 border rounded-md"
                                value={tripFilters.rating}
                                onChange={(e) => {
                                  setTripFilters({...tripFilters, rating: e.target.value});
                                }}
                              >
                                <option value="all">الكل</option>
                                <option value="4.5">4.5 نجوم فأكثر</option>
                                <option value="4.0">4.0 نجوم فأكثر</option>
                                <option value="3.5">3.5 نجوم فأكثر</option>
                                <option value="3.0">3.0 نجوم فأكثر</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">ترتيب السعر</label>
                              <select
                                className="w-full p-2 border rounded-md"
                                value={tripFilters.priceSort}
                                onChange={(e) => {
                                  setTripFilters({...tripFilters, priceSort: e.target.value});
                                }}
                              >
                                <option value="none">بدون ترتيب</option>
                                <option value="low_to_high">من الأقل للأعلى</option>
                                <option value="high_to_low">من الأعلى للأقل</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">ترتيب التقييم</label>
                              <select
                                className="w-full p-2 border rounded-md"
                                value={tripFilters.ratingSort}
                                onChange={(e) => {
                                  setTripFilters({...tripFilters, ratingSort: e.target.value});
                                }}
                              >
                                <option value="none">بدون ترتيب</option>
                                <option value="high_to_low">الأعلى تقييماً</option>
                                <option value="low_to_high">الأقل تقييماً</option>
                              </select>
                            </div>
                            
                            {/* Active Filters Display */}
                            {(() => {
                              const activeFilters = [];
                              if (tripFilters.fromWilaya) {
                                const wilaya = wilayas.find(w => w.code === tripFilters.fromWilaya);
                                activeFilters.push(`من: ${wilaya?.name || tripFilters.fromWilaya}`);
                              }
                              if (tripFilters.toWilaya) {
                                const wilaya = wilayas.find(w => w.code === tripFilters.toWilaya);
                                activeFilters.push(`إلى: ${wilaya?.name || tripFilters.toWilaya}`);
                              }
                              if (tripFilters.date) {
                                activeFilters.push(`التاريخ: ${tripFilters.date}`);
                              }
                              if (tripFilters.minPrice) {
                                activeFilters.push(`السعر الأدنى: ${tripFilters.minPrice} دج`);
                              }
                              if (tripFilters.maxPrice) {
                                activeFilters.push(`السعر الأقصى: ${tripFilters.maxPrice} دج`);
                              }
                              if (tripFilters.rating !== 'all') {
                                activeFilters.push(`التقييم: ${tripFilters.rating}+ نجوم`);
                              }
                              
                              return activeFilters.length > 0 ? (
                                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <p className="text-sm text-green-800 font-medium mb-2">الفلاتر المطبقة حالياً:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {activeFilters.map((filter, index) => (
                                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                        {filter}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null;
                            })()}
                            
                            <div className="flex gap-2">
                              <Button 
                                className="flex-1 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                                onClick={() => {
                                  applyTripFilters();
                                  setShowFilterSidebar(false);
                                }}
                              >
                                تطبيق الفلتر
                              </Button>
                              <Button 
                                variant="outline"
                                className="flex-1 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                                onClick={resetTripFilters}
                              >
                                إعادة تعيين
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Day selection tabs */}
            <Card className="mb-4">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    <h3 className="font-semibold text-blue-800 text-sm sm:text-base">رحلات اليوم والغد والكلية</h3>
                  </div>
                </div>
                
                {/* Day tabs */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant={selectedDayTab === 'today' ? 'default' : 'outline'}
                    onClick={() => setSelectedDayTab('today')}
                    className="flex-1 flex items-center gap-2 h-10 sm:h-auto"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">اليوم </span>
                      <span className="sm:hidden">اليوم</span>
                      <span className="hidden sm:inline">({formatAlgeriaDateTime(getTodayInAlgeria())})</span>
                    </span>
                  </Button>
                  <Button
                    variant={selectedDayTab === 'tomorrow' ? 'default' : 'outline'}
                    onClick={() => setSelectedDayTab('tomorrow')}
                    className="flex-1 flex items-center gap-2 h-10 sm:h-auto"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">الغد </span>
                      <span className="sm:hidden">الغد</span>
                      <span className="hidden sm:inline">({formatAlgeriaDateTime(getTomorrowInAlgeria())})</span>
                    </span>
                  </Button>
                  <Button
                    variant={selectedDayTab === 'all' ? 'default' : 'outline'}
                    onClick={() => setSelectedDayTab('all')}
                    className="flex-1 flex items-center gap-2 h-10 sm:h-auto"
                  >
                    <Route className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">الرحلات الكلية</span>
                      <span className="sm:hidden">الكلية</span>
                    </span>
                  </Button>
                </div>
                
                {/* Current selection info */}
                <div className="mt-3 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs sm:text-sm text-blue-700">
                    {selectedDayTab === 'all' ? (
                      <>عرض <strong>جميع الرحلات</strong> المتاحة</>
                    ) : (
                      <>عرض الرحلات الخاصة بـ <strong>{formatAlgeriaDateTime(selectedDayTab === 'today' ? getTodayInAlgeria() : getTomorrowInAlgeria())}</strong></>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {filteredTrips.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Route className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      {trips.length === 0 ? `لا توجد رحلات ${selectedDayTab === 'today' ? 'ليوم' : selectedDayTab === 'tomorrow' ? 'لغد' : 'متاحة'}` : 'لا توجد رحلات تطابق الفلتر'}
                    </h3>
                    <p className="text-muted-foreground">
                      {trips.length === 0 
                        ? (userProfile?.role === 'driver' 
                          ? `لم تقم بإنشاء أي رحلة ${selectedDayTab === 'today' ? 'ليوم' : selectedDayTab === 'tomorrow' ? 'لغد' : 'بعد'}. أنشئ رحلتك الأولى للبدء.`
                          : `لا توجد رحلات متاحة ${selectedDayTab === 'today' ? 'ليوم' : selectedDayTab === 'tomorrow' ? 'لغد' : 'حالياً'}. تحقق لاحقاً أو اختر تاريخ آخر.`)
                        : 'جرب تغيير معايير الفلتر للعثور على رحلات أخرى.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredTrips.map((trip: any) => {
                  const isFullyBooked = trip.status === 'fully_booked' || trip.availableSeats === 0;
                  
                  return (
        <Card 
          key={trip.id} 
          className={`hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 ${
            isFullyBooked 
              ? 'opacity-60 bg-muted/30 border-dashed shadow-sm' 
              : 'shadow-lg shadow-gray-200/50'
          }`}
        >
                      <CardContent className="p-6 relative">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-lg font-medium mb-2">
                              <MapPin className={`h-4 w-4 ${isFullyBooked ? 'text-muted-foreground' : 'text-primary'}`} />
                              <span className={isFullyBooked ? 'text-muted-foreground' : ''}>
                                {trip.fromWilayaName || getWilayaName(trip.fromWilayaId)}
                                {trip.fromWilayaId === 47 && trip.fromKsar && (
                                  <span className="text-xs text-primary font-medium ml-1"> - {trip.fromKsar}</span>
                                )}
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className={isFullyBooked ? 'text-muted-foreground' : ''}>
                                {trip.toWilayaName || getWilayaName(trip.toWilayaId)}
                                {trip.toWilayaId === 47 && trip.toKsar && (
                                  <span className="text-xs text-primary font-medium ml-1"> - {trip.toKsar}</span>
                                )}
                              </span>
                              {isFullyBooked && (
                                <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800 border-red-200">
                                  محجوز بالكامل
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                {trip.driver?.avatarUrl ? (
                                  <div 
                                    className="cursor-pointer"
                                    onClick={() => {
                                      if (trip.driver?.id) {
                                        // Navigate to driver's profile
                                        navigate(`/profile?userId=${trip.driver.id}`);
                                      }
                                    }}
                                  >
                                    <img 
                                      src={trip.driver.avatarUrl} 
                                      alt={trip.driver.fullName || 'السائق'}
                                      className="w-6 h-6 rounded-full object-cover border border-gray-200"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  </div>
                                ) : null}
                                <User 
                                  className={`h-4 w-4 ${trip.driver?.avatarUrl ? 'hidden' : ''} cursor-pointer`} 
                                  onClick={() => {
                                    if (trip.driver?.id) {
                                      // Navigate to driver's profile
                                      navigate(`/profile?userId=${trip.driver.id}`);
                                    }
                                  }}
                                />
                                <span 
                                  className="cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => {
                                    if (trip.driver?.id) {
                                      // Navigate to driver's profile
                                      navigate(`/profile?userId=${trip.driver.id}`);
                                    }
                                  }}
                                >
                                  السائق: {trip.driver?.fullName}
                                </span>
                              </div>
                              <Phone className="h-4 w-4" />
                              <span>{trip.driver?.phone}</span>
                            </div>
                          </div>
                          {/* Available seats in box */}
                          <div className="absolute top-4 right-4 bg-white border-2 border-blue-500 rounded-lg w-12 h-12 flex items-center justify-center shadow-lg">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">{trip.availableSeats}</div>
                              <div className="text-xs text-blue-500">مقاعد</div>
                            </div>
                          </div>
                        </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatAlgeriaDateTime(trip.departureDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{trip.departureTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span>{trip.vehicle?.make} {trip.vehicle?.model}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center">
                            {(() => {
                              const avg = typeof trip.driverAverageRating === 'number' ? trip.driverAverageRating : 0;
                              const fullStars = Math.floor(avg);
                              const hasHalf = avg - fullStars >= 0.5;
                              const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
                              return (
                                <>
                                  {Array.from({ length: fullStars }).map((_, i) => (
                                    <Star key={`f-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  ))}
                                  {hasHalf && (
                                    <div className="relative h-4 w-4">
                                      <Star className="absolute inset-0 h-4 w-4 text-yellow-400" />
                                      <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      </div>
                                    </div>
                                  )}
                                  {Array.from({ length: emptyStars }).map((_, i) => (
                                    <Star key={`e-${i}`} className="h-4 w-4 text-yellow-400" />
                                  ))}
                                </>
                              );
                            })()}
                          </div>
                          <span className="text-yellow-600 font-medium">
                            {typeof trip.driverAverageRating === 'number' ? trip.driverAverageRating.toFixed(1) : '0.0'}
                          </span>
                        </div>
                      </div>

                      {trip.description && (
                        <p className="text-sm text-muted-foreground mb-4">{trip.description}</p>
                      )}

                      <div className="flex gap-2">
                        {userProfile?.role === 'passenger' ? (
                          <>
                            <Button 
                              className="flex-1 flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-all duration-300 ease-in-out hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-lg hover:shadow-xl h-10 px-4 py-2" 
                              onClick={() => handleBookTrip(trip)}
                              disabled={isFullyBooked}
                              variant={isFullyBooked ? "secondary" : "default"}
                            >
                              <Plus className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                {isFullyBooked ? 'محجوز بالكامل' : 'حجز مقعد'}
                              </span>
                              <span className="sm:hidden">
                                {isFullyBooked ? 'محجوز' : 'حجز'}
                              </span>
                            </Button>
                            
                            {/* Price display as a button-like element */}
                            <div className="flex-1 bg-primary text-white rounded-lg py-2 px-4 text-center shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:scale-105 h-10 flex items-center justify-center">
                              <div className="flex items-center">
                                <span className="text-lg font-bold">{trip.pricePerSeat}</span>
                                <span className="text-sm mr-1">دج</span>
                              </div>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              className="flex-1 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                              onClick={() => navigate(`/trip/${trip.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">تفاصيل</span>
                              <span className="sm:hidden">تفاصيل</span>
                            </Button>
                            <Button 
                              type="button"
                              variant="outline" 
                              className="flex-1 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-green-500 text-green-600 hover:bg-green-50"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedTripForRoute(trip);
                                setShowTripRouteModal(true);
                              }}
                            >
                              <Route className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">مسار الرحلة</span>
                              <span className="sm:hidden">مسار</span>
                            </Button>
                          </>
                        ) : userProfile?.role === 'driver' && trip.driverId === user?.id ? (
                          <div className="flex flex-wrap gap-2 w-full">
                            {/* Cancel Button - Only for scheduled trips */}
                            {trip.status === 'scheduled' && (
                              <Button 
                                variant="outline"
                                className="flex-1 border-red-500 text-red-600 hover:bg-red-50 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                                disabled={!userProfile?.isVerified}
                                onClick={() => handleCancelTrip(trip.id)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">إلغاء</span>
                              </Button>
                            )}
                            
                            {/* Delete Button */}
                            <Button 
                              variant="destructive" 
                              className="flex-1 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                              disabled={!userProfile?.isVerified}
                              onClick={() => handleDeleteTrip(trip.id)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">حذف</span>
                            </Button>
                            <Button 
                              type="button"
                              variant="outline" 
                              className="flex-1 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-green-500 text-green-600 hover:bg-green-50"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedTripForRoute(trip);
                                setShowTripRouteModal(true);
                              }}
                            >
                              <Route className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">مسار الرحلة</span>
                              <span className="sm:hidden">مسار</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 w-full">
                            <Button 
                              className="flex-1 flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-all duration-300 ease-in-out hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg hover:shadow-xl h-10 px-4 py-2"
                            >
                              <Plus className="h-4 w-4" />
                              <span className="hidden sm:inline">حجز مقعد</span>
                              <span className="sm:hidden">حجز</span>
                            </Button>
                            
                            {/* Price display as a button-like element */}
                            <div className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg py-2 px-4 text-center shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:scale-105 h-10 flex items-center justify-center">
                              <div className="flex items-center">
                                <span className="text-lg font-bold">{trip.pricePerSeat}</span>
                                <span className="text-sm mr-1">دج</span>
                              </div>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              className="flex-1 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                              onClick={() => navigate(`/trip/${trip.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">تفاصيل</span>
                              <span className="sm:hidden">تفاصيل</span>
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Price in rectangle */}
                      {/* Removed as requested: <div class="absolute bottom-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg py-2 px-4 text-center shadow-lg"><div class="flex items-center"><span class="text-xl font-bold">2500</span><span class="text-sm mr-1">دج</span></div></div> */}
                    </CardContent>
                  </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
          
          {/* Profile Edit Tab */}
          <TabsContent value="profile-edit" className="space-y-4">
            <EditProfile onBack={() => {}} />
          </TabsContent>

          {/* Vehicle Edit Drawer */}
          {showVehicleEditForm && editingVehicleId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl">تعديل المركبة</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateVehicle(editingVehicleId, vehicleEditForm);
                  }}
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">الماركة</label>
                      <input
                        type="text"
                        value={vehicleEditForm.make}
                        onChange={(e) => setVehicleEditForm(prev => ({ ...prev, make: e.target.value }))}
                        className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">الموديل</label>
                      <input
                        type="text"
                        value={vehicleEditForm.model}
                        onChange={(e) => setVehicleEditForm(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">سنة الصنع</label>
                      <input
                        type="number"
                        value={vehicleEditForm.year}
                        onChange={(e) => setVehicleEditForm(prev => ({ ...prev, year: e.target.value }))}
                        className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base"
                        min="1990"
                        max="2100"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">اللون</label>
                      <input
                        type="text"
                        value={vehicleEditForm.color}
                        onChange={(e) => setVehicleEditForm(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">رقم اللوحة</label>
                      <input
                        type="text"
                        value={vehicleEditForm.licensePlate}
                        onChange={(e) => setVehicleEditForm(prev => ({ ...prev, licensePlate: e.target.value }))}
                        className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">عدد المقاعد</label>
                      <input
                        type="number"
                        value={vehicleEditForm.seats}
                        onChange={(e) => setVehicleEditForm(prev => ({ ...prev, seats: e.target.value }))}
                        className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base"
                        min="2"
                        max="8"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="edit_is_active"
                      type="checkbox"
                      checked={vehicleEditForm.is_active}
                      onChange={(e) => setVehicleEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <label htmlFor="edit_is_active" className="text-sm">مركبة نشطة</label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button type="submit" className="flex-1 w-full sm:w-auto">حفظ التعديلات</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowVehicleEditForm(false); setEditingVehicleId(null); }} className="w-full sm:w-auto">إلغاء</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}



          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">حجوزاتي</h2>
            </div>

            <div className="grid gap-4">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد حجوزات</h3>
                    <p className="text-muted-foreground mb-4">
                      لم تقم بحجز أي رحلة بعد. ابدأ بالبحث عن رحلة مناسبة لك.
                    </p>
                    <Button>
                      <Search className="h-4 w-4 mr-2" />
                      البحث عن رحلة
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                bookings.map((booking: any) => (
                  <Card key={booking.id} className="hover:shadow-elegant transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getStatusBadge(booking.status).variant}>
                              {getStatusBadge(booking.status).label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">#{booking.id}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-lg font-medium mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <div className="flex flex-col gap-0.5">
                              <span>
                                {booking.pickupLocation}
                                {/* Show ksar if trip is from Ghardaia (47) and ksar exists */}
                                {(() => {
                                  // Get fromWilayaId from trip or booking
                                  const fromWilayaId = booking.trip?.fromWilayaId;
                                  // Get fromKsar from booking (stored in booking) or trip (fallback)
                                  const fromKsar = booking.fromKsar || (booking.trip as any)?.fromKsar;
                                  // Display ksar if from Ghardaia and ksar exists
                                  if (fromWilayaId === 47 && fromKsar) {
                                    return (
                                      <span className="text-xs text-primary font-medium mr-1"> - {fromKsar}</span>
                                    );
                                  }
                                  return null;
                                })()}
                                {booking.pickupPoint && (
                                  <span className="text-sm text-muted-foreground"> - {booking.pickupPoint}</span>
                                )}
                              </span>
                            </div>
                            <span className="text-muted-foreground">←</span>
                            <div className="flex flex-col gap-0.5">
                              <span>
                                {booking.destinationLocation}
                                {booking.destinationPoint && (
                                  <span className="text-sm text-muted-foreground"> - {booking.destinationPoint}</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            {userProfile?.role === 'driver' && booking.passenger?.id ? (
                              <Link 
                                to={`/profile?userId=${booking.passenger.id}`}
                                className="text-primary hover:underline cursor-pointer"
                              >
                                الراكب: {booking.passenger?.fullName}
                              </Link>
                            ) : userProfile?.role === 'passenger' && booking.driver?.id ? (
                              <Link 
                                to={`/profile?userId=${booking.driver.id}`}
                                className="text-primary hover:underline cursor-pointer"
                              >
                                السائق: {booking.driver?.fullName}
                              </Link>
                            ) : (
                              <span>
                                {userProfile?.role === 'driver' 
                                  ? `الراكب: ${booking.passenger?.fullName}` 
                                  : `السائق: ${booking.driver?.fullName}`}
                              </span>
                            )}
                            <Phone className="h-4 w-4" />
                            <span>
                              {userProfile?.role === 'driver' 
                                ? booking.passenger?.phone 
                                : booking.driver?.phone}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">{booking.totalAmount} دج</div>
                          <div className="text-sm text-muted-foreground">
                            {booking.seatsBooked} مقعد
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {booking.paymentMethod === 'cod' ? 'نقداً' : 'بريدي موب'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.trip?.departureDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.pickupTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.trip?.vehicle?.make} {booking.trip?.vehicle?.model}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.trip?.availableSeats}/{booking.trip?.totalSeats} مقاعد</span>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mb-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm"><strong>ملاحظات:</strong> {booking.notes}</p>
                        </div>
                      )}

                      {booking.specialRequests && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm"><strong>طلبات خاصة:</strong> {booking.specialRequests}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {userProfile?.role === 'driver' && booking.status === "pending" && (
                          <div className="flex flex-wrap gap-2 w-full">
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleConfirmBooking(booking.id)}
                              disabled={confirmingBookingId !== null}
                            >
                              {confirmingBookingId === booking.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  <span className="hidden sm:inline">جاري التأكيد...</span>
                                  <span className="sm:hidden">جاري...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  <span className="hidden sm:inline">قبول</span>
                                </>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleRejectBooking(booking.id)}
                              disabled={rejectingBookingId !== null || confirmingBookingId !== null}
                            >
                              {rejectingBookingId === booking.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  <span className="hidden sm:inline">جاري الرفض...</span>
                                  <span className="sm:hidden">جاري...</span>
                                </>
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-2" />
                                  <span className="hidden sm:inline">رفض</span>
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        {userProfile?.role === 'driver' && booking.status === "confirmed" && (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleCompleteBooking(booking.id)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">إكمال الرحلة</span>
                            <span className="sm:hidden">إكمال</span>
                          </Button>
                        )}
                        {userProfile?.role === 'passenger' && (booking.status === "pending" || booking.status === "confirmed") && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">إلغاء الحجز</span>
                            <span className="sm:hidden">إلغاء</span>
                          </Button>
                        )}
                        {userProfile?.role === 'passenger' && booking.status === "confirmed" && (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handlePassengerCompleteBooking(booking.id)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">إكمال الرحلة</span>
                            <span className="sm:hidden">إكمال</span>
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled
                          title="قريباً: صفحة تفاصيل الحجز"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">تفاصيل</span>
                          <span className="sm:hidden">تفاصيل</span>
                        </Button>
                      </div>

                      {/* Rating section - shown only for completed trips */}
                      {userProfile?.role === 'passenger' && booking.status === "completed" && (
                        <div className="mt-4 pt-4 border-t">
                          <RatingSection 
                            bookingId={booking.id}
                            driverId={booking.driverId}
                            driverName={booking.driver?.fullName}
                            existingRating={booking.passengerRating}
                            existingComment={booking.passengerComment}
                            onRatingSubmit={() => fetchBookings()}
                          />
                        </div>
                      )}

                      {/* Passenger Rating section - shown for drivers after trip completion */}
                      {userProfile?.role === 'driver' && booking.status === "completed" && (
                        <div className="mt-4 pt-4 border-t">
                          <RatingPassengerSection 
                            bookingId={booking.id}
                            passengerId={booking.passengerId}
                            passengerName={booking.passenger?.fullName}
                            onRatingSubmit={() => fetchBookings()}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>



          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <NotificationCenter />
          </TabsContent>

          {/* Users Tab (Admin only) */}
          {userProfile?.role === 'admin' && (
            <TabsContent value="users" className="space-y-4">
              {loadingUsers && users.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">جاري تحميل المستخدمين...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      يرجى الانتظار...
                    </p>
                  </CardContent>
                </Card>
              ) : (
              <UserManagement 
                users={users}
                processingAction={processingUserAction} 
                onUserAction={(userId: string, action: string) => {
                  void handleAdminUserAction(userId, action);
                }}
              />
              )}
            </TabsContent>
          )}

          {/* Trips Tab (Admin only) */}
          {userProfile?.role === 'admin' && (
            <TabsContent value="admin-trips" className="space-y-4">
              <TripManagement />
            </TabsContent>
          )}

          {/* Bookings Tab (Admin only) */}
          {userProfile?.role === 'admin' && (
            <TabsContent value="admin-bookings" className="space-y-4">
              <BookingManagement />
            </TabsContent>
          )}

          {/* Recent Bookings Tab (Admin only) */}
          {userProfile?.role === 'admin' && (
            <TabsContent value="recent-bookings" className="space-y-4">
              <RecentBookingsTable />
            </TabsContent>
          )}

          {/* Hidden Admin Bookings Tab (Admin only) */}
          {/* {userProfile?.role === 'admin' && (
            <TabsContent value="admin-bookings" className="space-y-4">
              <BookingManagement />
            </TabsContent>
          )} */}

          {/* Database Tab (Admin only) */}
          {userProfile?.role === 'admin' && (
            <TabsContent value="database" className="space-y-4">
              <DatabaseManagement />
            </TabsContent>
          )}

          {/* Settings Tab (Admin only) */}
          {userProfile?.role === 'admin' && (
            <TabsContent value="settings" className="space-y-4">
              <SystemSettings />
            </TabsContent>
          )}

          {/* Database settings content removed */}

        </Tabs>
      </main>

      <Footer />
      
      {/* Rating Popup */}
      {showRatingPopup && ratingBooking && ratingTarget && (
        <RatingPopup
          bookingId={ratingBooking.id}
          userId={user!.id}
          targetUserId={ratingTarget.userId}
          targetType={ratingTarget.type}
          onRatingSubmit={handlePassengerRatingSubmit}
          onClose={() => setShowRatingPopup(false)}
        />
      )}
      
      {/* Booking Modal */}
      {showBookingModal && selectedTrip && (
        <BookingModal
          trip={selectedTrip}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedTrip(null);
          }}
          onSuccess={handleBookingSuccess}
        />
      )}
      
      {/* Trip Route Modal */}
      {showTripRouteModal && selectedTripForRoute && (
        <TripRouteModal
          open={showTripRouteModal}
          onOpenChange={(open) => {
            setShowTripRouteModal(open);
            if (!open) {
              setSelectedTripForRoute(null);
            }
          }}
          fromWilaya={selectedTripForRoute.fromWilayaName || getWilayaName(selectedTripForRoute.fromWilayaId)}
          toWilaya={selectedTripForRoute.toWilayaName || getWilayaName(selectedTripForRoute.toWilayaId)}
          fromWilayaId={selectedTripForRoute.fromWilayaId}
          toWilayaId={selectedTripForRoute.toWilayaId}
          fromLat={selectedTripForRoute.fromLat}
          fromLng={selectedTripForRoute.fromLng}
          toLat={selectedTripForRoute.toLat}
          toLng={selectedTripForRoute.toLng}
        />
      )}

      {/* Cancel Booking Dialog (for passengers) */}
      <Dialog open={showCancelBookingDialog} onOpenChange={setShowCancelBookingDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              إلغاء الحجز
            </DialogTitle>
            <DialogDescription className="sr-only">
              يرجى كتابة سبب إلغاء الحجز. سيتم إرسال هذا السبب للسائق في إشعار الإلغاء.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="cancel-booking-reason" className="text-sm font-medium">
                سبب الإلغاء <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="cancel-booking-reason"
                placeholder="مثال: تغيير في المواعيد، ظروف طارئة، عدم الحاجة للرحلة..."
                value={cancelBookingReason}
                onChange={(e) => setCancelBookingReason(e.target.value)}
                className="min-h-[100px] resize-none"
                required
              />
              <p className="text-xs text-muted-foreground">
                سيتم إرسال هذا السبب تلقائياً للسائق في إشعار الإلغاء
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelBookingDialog(false);
                setBookingToCancel(null);
                setCancelBookingReason('');
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelBooking}
              disabled={!cancelBookingReason.trim()}
            >
              تأكيد الإلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Booking Dialog */}
      <Dialog open={showRejectBookingDialog} onOpenChange={setShowRejectBookingDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              رفض الحجز
            </DialogTitle>
            <DialogDescription className="sr-only">
              يرجى كتابة سبب رفض الحجز. سيتم إرسال هذا السبب للراكب في إشعار الرفض.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="rejection-reason" className="text-sm font-medium">
                سبب الرفض <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="rejection-reason"
                placeholder="مثال: لا يوجد أماكن متاحة، تغيير في الخطة..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px] resize-none"
                required
              />
              <p className="text-xs text-muted-foreground">
                سيتم إرسال هذا السبب تلقائياً للراكب في إشعار الرفض
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectBookingDialog(false);
                setBookingToReject(null);
                setRejectionReason('');
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRejectBooking}
              disabled={!rejectionReason.trim()}
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Trip Dialog */}
      <Dialog open={showCancelTripDialog} onOpenChange={setShowCancelTripDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              إلغاء الرحلة
            </DialogTitle>
            <DialogDescription>
              يرجى كتابة سبب إلغاء الرحلة. سيتم إرسال هذا السبب للركاب الذين حجزوا في هذه الرحلة.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="cancellation-reason" className="text-sm font-medium">
                سبب الإلغاء <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="cancellation-reason"
                placeholder="مثال: تغيير في المواعيد، مشكلة في المركبة، ظروف طارئة..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="min-h-[100px] resize-none"
                required
              />
              <p className="text-xs text-muted-foreground">
                سيتم إرسال هذا السبب تلقائياً للركاب الذين حجزوا في هذه الرحلة (pending أو confirmed)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelTripDialog(false);
                setTripToCancel(null);
                setCancellationReason('');
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelTrip}
              disabled={!cancellationReason.trim()}
            >
              تأكيد الإلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboard;