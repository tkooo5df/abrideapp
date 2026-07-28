import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Phone, User, Car, Route, Calendar, Edit, Upload, FileText, CheckCircle, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import RatingStars from '@/components/RatingStars';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { toast } from '@/hooks/use-toast';
// ProfileApi removed - using direct Supabase queries instead
import { supabase } from '@/integrations/supabase/client';
import PassengerRatingsDisplay from '@/components/passenger/PassengerRatingsDisplay';
import PassengerStatsCard from '@/components/passenger/PassengerStatsCard';

interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatarUrl?: string | null;
  rating: number;
  comment: string;
  date: string;
}

interface DriverDocument {
  id: string;
  type: 'license' | 'id' | 'vehicle_card';
  name: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  url: string;
}

interface DriverProfileData {
  id: string;
  fullName: string;
  phoneNumber: string;
  profilePhoto?: string;
  age: number | null;
  ksar: string | null;
  address?: string;
  vehicleType: string;
  vehicleNumber: string;
  licenseNumber: string;
  totalTrips: number; // إجمالي الرحلات (جميع الحالات)
  completedTrips: number; // Completed trips only
  totalBookedSeats: number; // Total seats booked across all bookings
  completedBookingsCount: number; // Completed bookings count
  totalVehicles: number; // Total number of vehicles (matching dashboard)
  activeVehicles: number; // Number of active vehicles (matching dashboard)
  totalEarnings: number; // Total earnings from all bookings
  averageRating: number;
  reviews: Review[];
  status: 'active' | 'pending' | 'suspended';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  documents: DriverDocument[];
}

interface PassengerProfileData {
  id: string;
  fullName: string;
  phoneNumber: string;
  profilePhoto?: string;
  age: number | null;
  ksar: string | null;
  address?: string;
  completedTrips: number;
  totalCancellations: number;
  totalBookings: number;
  averageRating: number;
  ratingsCount: number;
  reviews: Review[];
  createdAt: string;
  updatedAt: string;
}

interface ProfileProps {
  userProfile?: any; // Optional prop to display a specific user's profile
}

const Profile = ({ userProfile }: ProfileProps) => {
  const { user: supabaseUser, profile: authProfile } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { getDatabaseService, isLocal } = useDatabase();
  
  // Use the provided userProfile or fall back to the current user
  const user = userProfile || (isLocal ? localUser : supabaseUser);
  const [profileData, setProfileData] = useState<DriverProfileData | PassengerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Add auto-refresh to show new data immediately
  useEffect(() => {
    const loadProfileData = async (showLoading = true) => {
      if (!user) return;
      
      try {
        // Only show loading spinner on initial load, not on refresh
        if (showLoading && isInitialLoad) {
          setLoading(true);
        }
        const db = getDatabaseService();
        
        // Get user profile directly from Supabase
        const { data: supabaseProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !supabaseProfile) {
          // Fallback to database service
          const dbProfile = await db.getProfile(user.id);
          if (!dbProfile) {
            setLoading(false);
            return;
          }
          
          // Use dbProfile as fallback
          const normalizedRole = dbProfile.role === 'developer' ? 'admin' : dbProfile.role;
          var profile = {
            id: dbProfile.id,
            fullName: dbProfile.fullName,
            phoneNumber: dbProfile.phone || '',
            profilePhoto: dbProfile.avatarUrl,
            email: dbProfile.email || '',
            role: normalizedRole as 'driver' | 'passenger' | 'admin',
            age: (dbProfile as any).age || null,
            ksar: (dbProfile as any).ksar || null,
            address: dbProfile.address || '',
            createdAt: dbProfile.createdAt,
            updatedAt: dbProfile.updatedAt,
            isVerified: dbProfile.isVerified || false
          };
        } else {
          // Normalize the role to match expected types
          const normalizedRole = supabaseProfile.role === 'developer' ? 'admin' : supabaseProfile.role;
          
          var profile = {
            id: supabaseProfile.id,
            fullName: supabaseProfile.full_name || '',
            phoneNumber: supabaseProfile.phone || '',
            profilePhoto: supabaseProfile.avatar_url,
            email: supabaseProfile.email || '',
            role: normalizedRole as 'driver' | 'passenger' | 'admin',
            age: supabaseProfile.age || null,
            ksar: supabaseProfile.ksar || null,
            address: supabaseProfile.address || '',
            createdAt: supabaseProfile.created_at,
            updatedAt: supabaseProfile.updated_at,
            isVerified: supabaseProfile.is_verified || false
          };
        }
        
        // Get vehicles for drivers
        let vehiclesData: any[] = [];
        if (profile.role === 'driver') {
          vehiclesData = await BrowserDatabaseService.getVehiclesByDriver(user.id);
        }
        
        // Get trips or bookings based on role
        let tripsData: any[] = [];
        let bookingsData: any[] = [];
        
        if (profile.role === 'driver') {
          // Get driver's trips with details (same as Dashboard - last 5 for display)
          const allTripsData = await BrowserDatabaseService.getTripsWithDetails(user.id);
          tripsData = allTripsData.slice(0, 5);
          // Get driver's bookings
          bookingsData = await BrowserDatabaseService.getBookingsByDriver(user.id);
        } else {
          // Get passenger's bookings
          bookingsData = await BrowserDatabaseService.getBookingsByPassenger(user.id);
        }
        
        // Calculate real stats from actual data (will be calculated below based on role)
        
        const buildAvatarUrl = (avatarPath?: string | null) => {
          if (!avatarPath) {
            return null;
          }

          if (avatarPath.startsWith('http')) {
            return avatarPath;
          }

          const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(avatarPath);

          return data?.publicUrl ?? null;
        };

        const fetchDriverRatings = async (driverId: string) => {
          try {
            // @ts-ignore
            const { data, error } = await supabase.rpc('get_driver_ratings', { driver_id: driverId });

            if (error) {
              const { data: directData, error: directError } = await supabase
                .from('ratings' as any)
                .select(`
                  id,
                  booking_id,
                  passenger_id,
                  rating,
                  comment,
                  created_at,
                  passenger:profiles!ratings_passenger_id_fkey (
                    full_name,
                    avatar_url,
                    email
                  )
                `)
                .eq('driver_id', driverId)
                .order('created_at', { ascending: false });

              if (directError) {
                return { ratings: [] as Review[], averageRating: 0 };
              }

              const ratings = (directData || []).map((rating: any) => ({
                id: `${rating.id}`,
                reviewerId: rating.passenger_id,
                reviewerName: rating.passenger?.full_name || 'الراكب',
                reviewerAvatarUrl: buildAvatarUrl(rating.passenger?.avatar_url),
                rating: rating.rating,
                comment: rating.comment || '',
                date: rating.created_at
              }));

              const averageRating = ratings.length > 0
                ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
                : 0;

              return { ratings, averageRating };
            }

            const ratings = (data || []).map((rating: any) => ({
              id: `${rating.id}`,
              reviewerId: rating.passenger_id,
              reviewerName: rating.passenger_name || 'الراكب',
              reviewerAvatarUrl: buildAvatarUrl(rating.passenger_avatar_url),
              rating: rating.rating,
              comment: rating.comment || '',
              date: rating.created_at
            }));

            const averageRating = ratings.length > 0
              ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
              : 0;

            return { ratings, averageRating };
          } catch (err) {
            return { ratings: [] as Review[], averageRating: 0 };
          }
        };

        // Fetch passenger ratings from database
        const fetchPassengerRatings = async (passengerId: string) => {
          try {
            const { data, error } = await supabase
              .from('passenger_ratings' as any)
              .select(`
                id,
                driver_id,
                rating,
                comment,
                created_at,
                driver:profiles!passenger_ratings_driver_id_fkey(
                  full_name,
                  avatar_url,
                  email
                )
              `)
              .eq('passenger_id', passengerId)
              .order('created_at', { ascending: false });

            if (error) {
              return { ratings: [] as Review[], averageRating: 0 };
            }

            const ratings = (data || []).map((rating: any) => ({
              id: `${rating.id}`,
              reviewerId: rating.driver_id,
              reviewerName: rating.driver?.full_name || 'السائق',
              reviewerAvatarUrl: buildAvatarUrl(rating.driver?.avatar_url),
              rating: rating.rating,
              comment: rating.comment || '',
              date: rating.created_at
            }));

            const averageRating = ratings.length > 0
              ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
              : 0;

            return { ratings, averageRating };
          } catch (err) {
            return { ratings: [] as Review[], averageRating: 0 };
          }
        };

        const reviewsResult: { ratings: Review[]; averageRating: number } = profile.role === 'driver'
          ? await fetchDriverRatings(user.id)
          : await fetchPassengerRatings(user.id);

        // Get additional data for drivers (optimized for faster loading)
        let totalTrips = 0; // إجمالي الرحلات (جميع الحالات)
        let completedTrips = 0; // الرحلات المكتملة
        let totalBookedSeats = 0;
        let completedBookingsCount = 0;
        let totalVehicles = 0; // Total vehicles count (matching dashboard)
        let activeVehicles = 0;
        let totalEarnings = 0;
        
        if (profile.role === 'driver') {
          try {
            // Get trips with details (same as Dashboard to ensure consistency)
            const tripsData = await BrowserDatabaseService.getTripsWithDetails(user.id);
            setAllTrips(tripsData || []);
            
            // ✅ Read trip counts directly from Supabase (updated by triggers)
            // This is much faster and always accurate
            totalTrips = (supabaseProfile as any)?.total_trips_as_driver || 0;
            completedTrips = (supabaseProfile as any)?.completed_trips_as_driver || 0;
            
            // Get bookings data to calculate real total booked seats
            const bookingsData = await BrowserDatabaseService.getBookingsByDriver(user.id);
            setAllBookings(bookingsData || []);
            
            // Calculate total booked seats from actual bookings (all bookings, not just completed)
            totalBookedSeats = bookingsData?.reduce((total, booking) => {
              return total + (booking.seatsBooked || 0);
            }, 0) || 0;
            
            // Calculate completed bookings count (for display card)
            completedBookingsCount = bookingsData?.filter((b: any) => b.status === 'completed').length || 0;
            
            // Calculate total earnings from all bookings
            totalEarnings = bookingsData?.reduce((sum, b) => sum + (b.totalAmount || 0), 0) || 0;
            
            // Count total vehicles and active vehicles (use isActive, not is_active - it's converted in the service)
            totalVehicles = vehiclesData?.length || 0;
            activeVehicles = vehiclesData?.filter((v: any) => v.isActive).length || 0;
          } catch (error) {
          }
        }

        // Create profile data based on role
        if (profile.role === 'driver') {
          // Get first vehicle info if available
          const firstVehicle = vehiclesData[0] || null;
          
          // Get driver rating from Supabase profile or from reviews
          let driverAverageRating = reviewsResult.averageRating || 0;
          
          // Also check the profile table for average_rating
          try {
            const { data: driverStats, error: driverStatsError } = await supabase
              .from('profiles')
              .select('average_rating, ratings_count')
              .eq('id', user.id)
              .single();
            
            if (!driverStatsError && driverStats) {
              // Use profile average_rating if it exists and is valid
              if ((driverStats as any).average_rating > 0) {
                driverAverageRating = (driverStats as any).average_rating;
              }
            }
          } catch (error) {
          }
          
          const driverReviews = reviewsResult.ratings.length > 0
            ? reviewsResult.ratings
            : [];

          const driverData: DriverProfileData = {
            id: profile.id,
            fullName: profile.fullName,
            phoneNumber: profile.phoneNumber,
            profilePhoto: profile.profilePhoto,
            age: profile.age || null,
            ksar: profile.ksar || null,
            address: profile.address || '',
            vehicleType: firstVehicle ? `${firstVehicle.make} ${firstVehicle.model}` : 'غير محدد',
            vehicleNumber: firstVehicle ? firstVehicle.licensePlate : 'غير محدد',
            licenseNumber: 'DL-123456789', // This would come from documents
            totalTrips: totalTrips, // إجمالي الرحلات (جميع الحالات)
            completedTrips: completedTrips, // Only completed trips
            totalBookedSeats: totalBookedSeats, // All seats from all bookings
            completedBookingsCount: completedBookingsCount, // Completed bookings
            totalVehicles: totalVehicles, // Total vehicles count (matching dashboard)
            activeVehicles: activeVehicles, // Active vehicles count (matching dashboard)
            totalEarnings: totalEarnings, // Total earnings
            averageRating: driverAverageRating,
            reviews: driverReviews,
            status: profile.isVerified ? 'active' : 'pending',
            isVerified: profile.isVerified,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
            documents: []
          };
          setProfileData(driverData);
          setVehicles(vehiclesData);
        } else {
          // Get passenger stats from database
          let passengerTrips = 0;
          let passengerCancellations = 0;
          let passengerBookings = 0;
          let passengerRating = 0;
          let passengerRatingsCount = 0;

          try {
            // Get passenger stats from profile
            const { data: profileStats, error: profileError } = await supabase
              .from('profiles')
              .select('passenger_average_rating, passenger_ratings_count, total_trips_as_passenger, total_cancellations_as_passenger')
              .eq('id', user.id)
              .single();

            if (!profileError && profileStats) {
              passengerRating = (profileStats as any).passenger_average_rating || 0;
              passengerRatingsCount = (profileStats as any).passenger_ratings_count || 0;
              passengerTrips = (profileStats as any).total_trips_as_passenger || 0;
              passengerCancellations = (profileStats as any).total_cancellations_as_passenger || 0;
            }

            // Get total bookings count
            const bookingsData = await BrowserDatabaseService.getBookingsByPassenger(user.id);
            passengerBookings = bookingsData?.length || 0;

            // If stats not in profile, calculate from bookings
            if (passengerTrips === 0) {
              passengerTrips = bookingsData?.filter((b: any) => b.status === 'completed').length || 0;
            }
            if (passengerCancellations === 0) {
              passengerCancellations = bookingsData?.filter((b: any) => b.status === 'cancelled').length || 0;
            }
          } catch (error) {
          }

          const passengerData: PassengerProfileData = {
            id: profile.id,
            fullName: profile.fullName,
            phoneNumber: profile.phoneNumber,
            profilePhoto: profile.profilePhoto,
            age: profile.age || null,
            ksar: profile.ksar || null,
            address: profile.address || '',
            completedTrips: passengerTrips,
            totalCancellations: passengerCancellations,
            totalBookings: passengerBookings,
            averageRating: passengerRating || reviewsResult.averageRating,
            ratingsCount: passengerRatingsCount,
            reviews: reviewsResult.ratings,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt
          };
          setProfileData(passengerData);
        }
        
        // Set recent trips/bookings
        if (profile.role === 'driver') {
          setRecentTrips(tripsData.slice(0, 5));
        } else {
          setRecentBookings(bookingsData.slice(0, 5));
        }
        
        setLoading(false);
        setIsInitialLoad(false); // Mark initial load as complete
      } catch (error) {
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء تحميل بيانات الملف الشخصي',
          variant: 'destructive'
        });
        setLoading(false);
        setIsInitialLoad(false); // Mark initial load as complete even on error
      }
    };
    
    // Load data immediately
    loadProfileData(true);
    
    // Set up auto-refresh every 5 seconds to show new trips/bookings
    const refreshInterval = setInterval(() => {
      loadProfileData(false); // Don't show loading spinner on refresh
    }, 5000); // Refresh every 5 seconds
    
    // Cleanup on unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, [user, isLocal]);
  
  // Pagination functions for reviews
  const totalPages = profileData ? Math.ceil(profileData.reviews.length / 5) : 0;
  const currentPageReviews = profileData ? profileData.reviews.slice((reviewsPage - 1) * 5, reviewsPage * 5) : [];
  
  const goToPreviousPage = () => {
    if (reviewsPage > 1) {
      setReviewsPage(reviewsPage - 1);
    }
  };
  
  const goToNextPage = () => {
    if (reviewsPage < totalPages) {
      setReviewsPage(reviewsPage + 1);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">الملف الشخصي غير متوفر</h3>
          <p className="text-muted-foreground">حدث خطأ في تحميل بيانات الملف الشخصي</p>
        </CardContent>
      </Card>
    );
  }
  
  const isDriver = 'vehicleType' in profileData;
  
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={profileData.profilePhoto || '/placeholder.svg'} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {profileData.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{profileData.fullName}</h1>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{profileData.phoneNumber || 'غير متوفر'}</span>
                    </div>
                    {profileData.age && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">العمر: {profileData.age} سنة</span>
                      </div>
                    )}
                    {profileData.ksar && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">القصر: {profileData.ksar}</span>
                      </div>
                    )}
                  </div>
                  
                  {isDriver && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant={profileData.status === 'active' ? 'default' : 'secondary'}>
                        {profileData.status === 'active' ? 'نشط' : profileData.status === 'pending' ? 'قيد المراجعة' : 'معلق'}
                      </Badge>
                      {profileData.isVerified && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          موثق
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Edit button removed - only profile owner should see it */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Cards - Matching Dashboard Layout Exactly */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {isDriver && (
          <>
            {/* إجمالي المركبات */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center p-2 sm:p-3 bg-primary/5 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-primary">
                    {(profileData as DriverProfileData).totalVehicles}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">إجمالي المركبات</div>
                </div>
              </CardContent>
            </Card>
            
            {/* مركبات نشطة */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center p-2 sm:p-3 bg-green-500/5 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {(profileData as DriverProfileData).activeVehicles}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">مركبات نشطة</div>
                </div>
              </CardContent>
            </Card>
            
            {/* الرحلات المكتملة */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center p-2 sm:p-3 bg-green-500/5 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {(profileData as DriverProfileData).completedTrips}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">رحلات مكتملة</div>
                </div>
              </CardContent>
            </Card>

            {/* مقاعد محجوزة */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center p-2 sm:p-3 bg-blue-500/5 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {(profileData as DriverProfileData).totalBookedSeats}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">مقاعد محجوزة</div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        
        {/* التقييم - للجميع */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center p-2 sm:p-3 bg-yellow-500/5 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {profileData.averageRating.toFixed(1)}
                </span>
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">التقييم</div>
            </div>
          </CardContent>
        </Card>
        
        {/* تاريخ الانضمام - للجميع */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center p-2 sm:p-3 bg-purple-500/5 rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-purple-600">
                {profileData.createdAt && profileData.createdAt !== 'غير منضم' 
                  ? new Date(profileData.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit'
                    })
                  : 'غير محدد'}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">تاريخ الانضمام</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Passenger Stats Card - Only for passengers */}
      {!isDriver && (
        <PassengerStatsCard
          totalTrips={(profileData as PassengerProfileData).completedTrips}
          totalCancellations={(profileData as PassengerProfileData).totalCancellations}
          totalBookings={(profileData as PassengerProfileData).totalBookings}
          averageRating={profileData.averageRating}
          ratingsCount={(profileData as PassengerProfileData).ratingsCount}
        />
      )}
      
      {/* Passenger Ratings Display - Only for passengers */}
      {!isDriver && (
        <PassengerRatingsDisplay passengerId={profileData.id} showTitle={true} />
      )}
      
      {/* Personal Information Card - For All Users */}
      {(profileData.age || profileData.ksar || profileData.address) && (
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الشخصية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileData.age && (
                <div>
                  <p className="text-sm text-muted-foreground">السن</p>
                  <p className="font-medium">{profileData.age} سنة</p>
                </div>
              )}
              {profileData.ksar && (
                <div>
                  <p className="text-sm text-muted-foreground">القصر</p>
                  <p className="font-medium">{profileData.ksar}</p>
                </div>
              )}
              {profileData.address && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">العنوان</p>
                  <p className="font-medium">{profileData.address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver Specific Sections */}
      {isDriver && (
        <>
          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات المركبة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">نوع المركبة</p>
                  <p className="font-medium">{profileData.vehicleType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رقم المركبة</p>
                  <p className="font-medium">{profileData.vehicleNumber}</p>
                </div>
                {/* Hidden license number field - removed as per user request */}
              </div>
              
              {vehicles.filter(vehicle => vehicle.is_active).length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">المركبات النشطة ({vehicles.filter(vehicle => vehicle.is_active).length})</h4>
                  <div className="space-y-2">
                    {vehicles.filter(vehicle => vehicle.is_active).map((vehicle) => (
                      <div key={vehicle.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                          <p className="text-sm text-muted-foreground">{vehicle.licensePlate}</p>
                        </div>
                        <Badge variant="default">
                          نشط
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isDriver ? 'الرحلات الأخيرة' : 'الحجوزات الأخيرة'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isDriver ? (
            recentTrips.length > 0 ? (
              <div className="space-y-4">
                {recentTrips.map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {trip.fromWilayaName}
                        {trip.fromWilayaId === 47 && (trip as any).fromKsar && (
                          <span className="text-xs text-primary font-medium"> - {(trip as any).fromKsar}</span>
                        )}
                        {' → '}
                        {trip.toWilayaName}
                        {trip.toWilayaId === 47 && (trip as any).toKsar && (
                          <span className="text-xs text-primary font-medium"> - {(trip as any).toKsar}</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trip.departureDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        })} • {trip.departureTime}
                      </p>
                    </div>
                    <Badge variant="secondary">{trip.status === 'completed' ? 'مكتملة' : trip.status === 'scheduled' ? 'مجدولة' : trip.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">لا توجد رحلات سابقة</p>
            )
          ) : recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{booking.pickupLocation} → {booking.destinationLocation}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary">{booking.status === 'completed' ? 'مكتملة' : booking.status === 'confirmed' ? 'مؤكدة' : booking.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">لا توجد حجوزات سابقة</p>
          )}
        </CardContent>
      </Card>
      
      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle>التقييمات والتعليقات</CardTitle>
          <CardDescription>آخر التقييمات من المستخدمين</CardDescription>
        </CardHeader>
        <CardContent>
          {profileData.reviews.length > 0 ? (
            <>
              <div className="space-y-4">
                {currentPageReviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {review.reviewerAvatarUrl ? (
                            <AvatarImage
                              src={review.reviewerAvatarUrl}
                              alt={review.reviewerName}
                              className="object-cover"
                            />
                          ) : null}
                          <AvatarFallback>{review.reviewerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{review.reviewerName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment ? (
                      <p className="mt-2 text-muted-foreground">{review.comment}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(review.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={reviewsPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    السابق
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">
                      صفحة {reviewsPage} من {totalPages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={reviewsPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    التالي
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {isDriver ? 'لا توجد تقييمات بعد' : 'لا توجد تقييمات سابقة'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;