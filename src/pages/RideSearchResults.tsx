import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDatabase } from "@/hooks/useDatabase";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useAuth } from "@/hooks/useAuth";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";
import { MapPin, Calendar, Clock, Banknote, Users, Car, User, Filter, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { wilayas } from "@/data/wilayas";
import RatingStars from "@/components/RatingStars";
import LoginPromptModal from "@/components/auth/LoginPromptModal";
import ProfileCompletionModal from "@/components/booking/ProfileCompletionModal";
import { validateProfileForBooking } from "@/utils/profileValidation";

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

const getDriverRatingValue = (trip: any) => {
  const rating =
    trip?.driver?.averageRating ??
    trip?.driver?.rating ??
    trip?.driver_rating ??
    trip?.driver_average_rating ??
    trip?.averageRating ??
    trip?.rating ??
    0;

  const numericRating = Number(rating);
  return Number.isFinite(numericRating) ? numericRating : 0;
};

const getDriverRatingsCount = (trip: any) => {
  const count =
    trip?.driver?.totalRatings ??
    trip?.driver?.ratingsCount ??
    trip?.driver_ratings_count ??
    trip?.driver_rating_count ??
    trip?.totalRatings ??
    trip?.ratingsCount ??
    0;

  const numericCount = Number(count);
  return Number.isFinite(numericCount) ? numericCount : 0;
};

const RideSearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: supabaseUser, profile: authProfile } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal, getDatabaseService } = useDatabase();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const pickup = searchParams.get("pickup");
  const destination = searchParams.get("destination");
  const searchDate = searchParams.get("date");
  const fromKsarParam = searchParams.get("fromKsar"); // Get fromKsar from query params
  const toKsarParam = searchParams.get("toKsar"); // Get toKsar from query params
  const [trips, setTrips] = useState([]);

  // Use local user if using local database, otherwise use Supabase user
  const user = isLocal ? localUser : supabaseUser;

  // Check if user is authenticated
  const isAuthenticated = user && user.id;
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Handle booking click - check authentication and profile completion
  const handleBookingClick = async (e: React.MouseEvent, tripId: string, trip: any) => {
    e.preventDefault();
    
    // Check authentication first
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    // Check profile completion
    try {
      let userProfile = null;
      
      if (isLocal) {
        // For local database
        const db = getDatabaseService();
        userProfile = await db.getProfile(user.id);
      } else {
        // For Supabase, use authProfile or fetch it
        if (authProfile) {
          userProfile = authProfile;
        } else {
          userProfile = await BrowserDatabaseService.getProfile(user.id);
        }
      }

      // Validate profile
      if (userProfile) {
        const validation = validateProfileForBooking(userProfile);
        if (!validation.isValid) {
          setMissingProfileFields(validation.missingFields);
          setSelectedTripId(tripId);
          setShowProfileCompletionModal(true);
          toast({
            title: "معلومات الملف الشخصي ناقصة",
            description: validation.message,
            variant: "destructive"
          });
          return;
        }
      } else {
        // Profile not found
        toast({
          title: "خطأ",
          description: "لم يتم العثور على الملف الشخصي. يرجى إكمال بياناتك أولاً.",
          variant: "destructive"
        });
        return;
      }

      // Profile is complete, proceed with booking
      // Navigate to booking confirmation page
      const bookingUrl = `/booking-confirmation?tripId=${tripId}&pickup=${pickup || ''}&destination=${destination || ''}&driverName=${trip.driver?.fullName || ''}&driverCar=${trip.vehicle ? `${trip.vehicle.make} ${trip.vehicle.model}` : 'غير محدد'}&driverId=${trip.driverId}&price=${trip.pricePerSeat}`;
      navigate(bookingUrl);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التحقق من الملف الشخصي.",
        variant: "destructive"
      });
    }
  };

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [timeRange, setTimeRange] = useState<[string, string]>(["00:00", "23:59"]);
  const [selectedVehicleType, setSelectedVehicleType] = useState("all");
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [priceSort, setPriceSort] = useState("none");
  const [ratingSort, setRatingSort] = useState("none");
  const [fromKsarFilter, setFromKsarFilter] = useState("all"); // Filter by from ksar
  const [toKsarFilter, setToKsarFilter] = useState("all"); // Filter by to ksar

  // Helper function to get wilaya ID by name
  const getWilayaIdByName = (wilayaName: string) => {
    const wilaya = wilayas.find(w => w.name === wilayaName);
    return wilaya ? parseInt(wilaya.code) : null;
  };

  // Helper function to check if trip matches search criteria
  const matchesSearchCriteria = (trip: any, fromWilayaId: number | null, toWilayaId: number | null, fromKsar?: string | null, toKsar?: string | null) => {
    if (!fromWilayaId || !toWilayaId) return true; // Show all if no search criteria
    
    // Check if wilaya IDs match
    if (trip.fromWilayaId !== fromWilayaId || trip.toWilayaId !== toWilayaId) {
      return false;
    }
    
    // If fromWilayaId is Ghardaia (47) and fromKsar is specified, filter by ksar
    if (fromWilayaId === 47 && fromKsar) {
      const tripKsar = trip.fromKsar || (trip as any).fromKsar;
      if (tripKsar !== fromKsar) {
        return false;
      }
    }
    
    // If toWilayaId is Ghardaia (47) and toKsar is specified, filter by ksar
    if (toWilayaId === 47 && toKsar) {
      const tripToKsar = trip.toKsar || (trip as any).toKsar;
      if (tripToKsar !== toKsar) {
        return false;
      }
    }
    
    return true;
  };

  // Apply filters to trips
  const applyFilters = () => {
    if (!trips || trips.length === 0) {
      setFilteredTrips([]);
      return;
    }
    
    let result = [...trips];
    
    // Price filter
    if (priceRange[0] > 0 || priceRange[1] < 10000) {
      result = result.filter(trip => 
        trip.pricePerSeat >= priceRange[0] && trip.pricePerSeat <= priceRange[1]
      );
    }
    
    // Time filter
    if (timeRange[0] !== "00:00" || timeRange[1] !== "23:59") {
      result = result.filter(trip => {
        const tripTime = trip.departureTime;
        return tripTime >= timeRange[0] && tripTime <= timeRange[1];
      });
    }
    
    // Vehicle type filter
    if (selectedVehicleType && selectedVehicleType !== "all") {
      result = result.filter(trip => {
        if (!trip.vehicle) return false;
        
        const vehicleMake = trip.vehicle.make?.toLowerCase() || '';
        const vehicleModel = trip.vehicle.model?.toLowerCase() || '';
        
        switch (selectedVehicleType) {
          case 'car':
            return vehicleMake.includes('renault') || 
                   vehicleMake.includes('peugeot') || 
                   vehicleMake.includes('citroen') ||
                   vehicleMake.includes('ford') ||
                   vehicleMake.includes('volkswagen') ||
                   vehicleMake.includes('toyota') ||
                   vehicleMake.includes('hyundai') ||
                   vehicleMake.includes('kia');
          case 'van':
            return vehicleMake.includes('van') || 
                   vehicleMake.includes('minibus') ||
                   vehicleModel.includes('van') ||
                   vehicleModel.includes('minibus');
          case 'bus':
            return vehicleMake.includes('bus') || 
                   vehicleMake.includes('coach') ||
                   vehicleModel.includes('bus') ||
                   vehicleModel.includes('coach');
          default:
            return true;
        }
      });
    }
    
    // Status filter - only show scheduled trips
    result = result.filter(trip => trip.status === 'scheduled');
    
    // Available seats filter - only show trips with available seats
    result = result.filter(trip => trip.availableSeats > 0);
    
    // From Ksar filter - only show trips from the selected ksar if fromWilayaId is Ghardaia (47)
    if (fromKsarFilter !== "all" && pickup) {
      const fromWilayaId = getWilayaIdByName(pickup);
      if (fromWilayaId === 47) {
        result = result.filter(trip => {
          if (trip.fromWilayaId !== 47) return true; // Show all non-Ghardaia trips
          const tripKsar = trip.fromKsar || (trip as any).fromKsar;
          return tripKsar === fromKsarFilter;
        });
      }
    }
    
    // To Ksar filter - only show trips to the selected ksar if toWilayaId is Ghardaia (47)
    if (toKsarFilter !== "all" && destination) {
      const toWilayaId = getWilayaIdByName(destination);
      if (toWilayaId === 47) {
        result = result.filter(trip => {
          if (trip.toWilayaId !== 47) return true; // Show all non-Ghardaia trips
          const tripToKsar = trip.toKsar || (trip as any).toKsar;
          return tripToKsar === toKsarFilter;
        });
      }
    }
    
    // Rating filter
    if (ratingFilter !== "all") {
      const minRating = parseFloat(ratingFilter);
      result = result.filter(trip => {
        const driverRating = trip.driverAverageRating ?? 0;
        return driverRating >= minRating;
      });
    }
    
    // Apply sorting
    if (priceSort !== "none") {
      result.sort((a, b) => {
        if (priceSort === "low_to_high") {
          return a.pricePerSeat - b.pricePerSeat;
        } else if (priceSort === "high_to_low") {
          return b.pricePerSeat - a.pricePerSeat;
        }
        return 0;
      });
    }
    
    if (ratingSort !== "none") {
      result.sort((a, b) => {
        const ratingA = getDriverRatingValue(a);
        const ratingB = getDriverRatingValue(b);
        if (ratingSort === "high_to_low") {
          return ratingB - ratingA;
        } else if (ratingSort === "low_to_high") {
          return ratingA - ratingB;
        }
        return 0;
      });
    }
    
    setFilteredTrips(result);
  };

  // Reset filters
  const resetFilters = () => {
    setPriceRange([0, 10000]);
    setTimeRange(["00:00", "23:59"]);
    setSelectedVehicleType("all");
    setRatingFilter("all");
    setPriceSort("none");
    setRatingSort("none");
    setFromKsarFilter("all");
    setToKsarFilter("all");
    // Apply filters after reset
    setTimeout(() => applyFilters(), 100);
  };

  // Load trips from database
  const loadTrips = useCallback(async (showLoading = true) => {
      try {
        if (showLoading) {
        setLoading(true);
        }
        // Use getTripsWithDetails to get trips with driver and vehicle info already included
        const allTrips = await BrowserDatabaseService.getTripsWithDetails();
        
        // Filter trips based on search criteria if provided
        // Exclude demo trips
        let filteredTrips = allTrips.filter((t: any) => !t.isDemo);
        if (pickup && destination) {
          const fromWilayaId = getWilayaIdByName(pickup);
          const toWilayaId = getWilayaIdByName(destination);
          
          // Filter trips that match the search criteria (including fromKsar and toKsar if specified)
          filteredTrips = allTrips.filter(trip => 
            matchesSearchCriteria(trip, fromWilayaId, toWilayaId, fromKsarParam || null, toKsarParam || null)
          );
        }
        
        // Filter out past trips and only show future trips
        const today = new Date().toISOString().split('T')[0];
        filteredTrips = filteredTrips.filter(trip => 
          trip.departureDate >= today && trip.status === 'scheduled'
        );
        
        // Filter by search date if provided: include ONLY trips on the exact date
        if (searchDate) {
          filteredTrips = filteredTrips.filter(trip => 
            trip.departureDate === searchDate
          );
        }
        
        // Sort trips by departure date and time
        filteredTrips.sort((a, b) => {
          const dateA = new Date(`${a.departureDate}T${a.departureTime}`);
          const dateB = new Date(`${b.departureDate}T${b.departureTime}`);
          return dateA.getTime() - dateB.getTime();
        });
        
        // Trips already have driver and vehicle info from getTripsWithDetails
        // Just ensure fromKsar and toKsar are preserved
        const tripsWithDetails = filteredTrips.map((trip) => {
            return {
              ...trip,
            fromKsar: trip.fromKsar || (trip as any).fromKsar, // Preserve fromKsar
            toKsar: trip.toKsar || (trip as any).toKsar, // Preserve toKsar
            };
        });
        
        setTrips(tripsWithDetails);
        setFilteredTrips(tripsWithDetails);
      } catch (error) {
        toast({
          title: "خطأ في تحميل الرحلات",
          description: "حدث خطأ أثناء تحميل الرحلات المتاحة",
          variant: "destructive"
        });
      } finally {
        if (showLoading) {
        setLoading(false);
      }
      }
    }, [pickup, destination, searchDate, fromKsarParam, toKsarParam]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // Polling fallback: refresh trips periodically to reflect seat changes even without realtime
  // Use showLoading=false to avoid showing loading spinner on background refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadTrips(false); // Don't show loading spinner on background refresh
    }, 30000); // every 30 seconds (increased from 5 to reduce flickering)
    return () => clearInterval(intervalId);
  }, [loadTrips]);

  // Monitor for booking success to refresh data immediately
  useEffect(() => {
    const checkBookingSuccess = () => {
      const bookingSuccess = localStorage.getItem('booking_success');
      if (bookingSuccess) {
        // Clear the flag and reload trips immediately
        localStorage.removeItem('booking_success');
        loadTrips();
      }
    };

    // Check immediately when component mounts
    checkBookingSuccess();

    // Check periodically for booking success
    const bookingCheckInterval = setInterval(checkBookingSuccess, 2000); // every 2 seconds

    return () => clearInterval(bookingCheckInterval);
  }, [loadTrips]);

  // Apply filters when filter values change
  useEffect(() => {
    if (trips.length > 0) {
      applyFilters();
    }
  }, [trips, priceRange, timeRange, selectedVehicleType, fromKsarFilter, toKsarFilter, ratingFilter, priceSort, ratingSort]);

  // Realtime: update cards when trips availability changes in Supabase
  useEffect(() => {
    const channel = supabase
      .channel('trips-availability')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips' },
        async (payload: any) => {
          const updated = payload.new;
          if (!updated || !updated.id) return;

          // إعادة حساب المقاعد من الحجوزات الفعلية بدلاً من الاعتماد على available_seats
          // هذا يضمن أن جميع المستخدمين يرون نفس المقاعد المتاحة
          try {
            const trip = await BrowserDatabaseService.getTripById(updated.id);
            if (!trip) return;

            // Update trips state in place
            setTrips((prev: any[]) => {
              const idx = prev.findIndex((t: any) => t.id === updated.id);
              if (idx === -1) return prev;
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                availableSeats: trip.availableSeats, // استخدام المقاعد المحسوبة من الحجوزات
                status: trip.status,
                updatedAt: trip.updatedAt,
              };
              return next;
            });

            // Update filteredTrips as well so UI reflects immediately
            setFilteredTrips((prev: any[]) => {
              const idx = prev.findIndex((t: any) => t.id === updated.id);
              if (idx === -1) return prev;
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                availableSeats: trip.availableSeats, // استخدام المقاعد المحسوبة من الحجوزات
                status: trip.status,
                updatedAt: trip.updatedAt,
              };
              return next;
            });
          } catch (error) {
            // في حالة الخطأ، نعيد تحميل جميع الرحلات (بدون loading spinner)
            loadTrips(false);
          }
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        async (payload: any) => {
          // عند إنشاء حجز جديد، يجب إعادة حساب المقاعد للرحلة
          const booking = payload.new;
          if (!booking || !booking.trip_id) return;

          try {
            const trip = await BrowserDatabaseService.getTripById(booking.trip_id);
            if (!trip) return;

            // Update trips state
            setTrips((prev: any[]) => {
              const idx = prev.findIndex((t: any) => t.id === booking.trip_id);
              if (idx === -1) return prev;
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                availableSeats: trip.availableSeats,
                status: trip.status,
                updatedAt: trip.updatedAt,
              };
              return next;
            });

            // Update filteredTrips
            setFilteredTrips((prev: any[]) => {
              const idx = prev.findIndex((t: any) => t.id === booking.trip_id);
              if (idx === -1) return prev;
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                availableSeats: trip.availableSeats,
                status: trip.status,
                updatedAt: trip.updatedAt,
              };
              return next;
            });
          } catch (error) {
            loadTrips(false); // Don't show loading spinner on background update
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        async (payload: any) => {
          // عند تحديث حجز (مثل تغيير الحالة من pending إلى confirmed أو cancelled)
          const booking = payload.new;
          if (!booking || !booking.trip_id) return;

          try {
            const trip = await BrowserDatabaseService.getTripById(booking.trip_id);
            if (!trip) return;

            // Update trips state
            setTrips((prev: any[]) => {
              const idx = prev.findIndex((t: any) => t.id === booking.trip_id);
              if (idx === -1) return prev;
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                availableSeats: trip.availableSeats,
                status: trip.status,
                updatedAt: trip.updatedAt,
              };
              return next;
            });

            // Update filteredTrips
            setFilteredTrips((prev: any[]) => {
              const idx = prev.findIndex((t: any) => t.id === booking.trip_id);
              if (idx === -1) return prev;
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                availableSeats: trip.availableSeats,
                status: trip.status,
                updatedAt: trip.updatedAt,
              };
              return next;
            });
          } catch (error) {
            loadTrips(false); // Don't show loading spinner on background update
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTrips]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">أفضل العروض المتاحة</h1>
          {pickup && destination && (
            <p className="text-muted-foreground">
              من {pickup} إلى {destination}
              {searchDate && ` - ${searchDate}`}
              <span className="font-semibold"> - {filteredTrips.length} رحلة متاحة</span>
            </p>
          )}
          {!pickup && !destination && (
            <p className="text-muted-foreground">
              جميع الرحلات المتاحة
              {searchDate && ` - ${searchDate}`}
              <span className="font-semibold"> - {filteredTrips.length} رحلة</span>
            </p>
          )}
        </div>

        {/* Filter Toggle Button */}
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            onClick={() => setShowFilterSidebar(!showFilterSidebar)}
            className="flex items-center gap-2 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
          >
            <Filter className="h-4 w-4" />
            تصفية النتائج
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 relative">
          {/* Filter Sidebar Overlay */}
          {showFilterSidebar && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setShowFilterSidebar(false)}
              />
              
              {/* Sidebar */}
              <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
                showFilterSidebar ? 'translate-x-0' : 'translate-x-full'
              } lg:relative lg:translate-x-0 lg:w-1/4 lg:shadow-none`}>
                <Card className="h-full rounded-none lg:rounded-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      تصفية النتائج
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowFilterSidebar(false)}
                      className="lg:hidden"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label>السعر (دج)</Label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              placeholder="من" 
                              value={priceRange[0]} 
                              onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                              className="h-9"
                            />
                            <span>-</span>
                            <Input 
                              type="number" 
                              placeholder="إلى" 
                              value={priceRange[1]} 
                              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>الوقت</Label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input 
                              type="time" 
                              value={timeRange[0]} 
                              onChange={(e) => setTimeRange([e.target.value, timeRange[1]])}
                              className="h-9"
                            />
                            <span>-</span>
                            <Input 
                              type="time" 
                              value={timeRange[1]} 
                              onChange={(e) => setTimeRange([timeRange[0], e.target.value])}
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>نوع المركبة</Label>
                        <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="اختر النوع" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            <SelectItem value="car">سيارة</SelectItem>
                            <SelectItem value="van"> VAN</SelectItem>
                            <SelectItem value="bus">حافلة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Ksar filter - only shown when pickup is Ghardaia (47) */}
                      {pickup && getWilayaIdByName(pickup) === 47 && (
                        <div className="space-y-2">
                          <Label>قصر الانطلاق</Label>
                          <Select value={fromKsarFilter} onValueChange={setFromKsarFilter}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="اختر القصر" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">الكل</SelectItem>
                              {ksour.map((ksar) => (
                                <SelectItem key={ksar.value} value={ksar.value}>
                                  {ksar.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {/* To Ksar filter - only shown when destination is Ghardaia (47) */}
                      {destination && getWilayaIdByName(destination) === 47 && (
                        <div className="space-y-2">
                          <Label>قصر الوجهة</Label>
                          <Select value={toKsarFilter} onValueChange={setToKsarFilter}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="اختر القصر" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">الكل</SelectItem>
                              {ksour.map((ksar) => (
                                <SelectItem key={ksar.value} value={ksar.value}>
                                  {ksar.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label>التقييم الأدنى</Label>
                        <Select value={ratingFilter} onValueChange={setRatingFilter}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="اختر التقييم" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            <SelectItem value="4.5">4.5 نجوم فأكثر</SelectItem>
                            <SelectItem value="4.0">4.0 نجوم فأكثر</SelectItem>
                            <SelectItem value="3.5">3.5 نجوم فأكثر</SelectItem>
                            <SelectItem value="3.0">3.0 نجوم فأكثر</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>ترتيب السعر</Label>
                        <Select value={priceSort} onValueChange={setPriceSort}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="اختر الترتيب" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون ترتيب</SelectItem>
                            <SelectItem value="low_to_high">من الأقل للأعلى</SelectItem>
                            <SelectItem value="high_to_low">من الأعلى للأقل</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>ترتيب التقييم</Label>
                        <Select value={ratingSort} onValueChange={setRatingSort}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="اختر الترتيب" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون ترتيب</SelectItem>
                            <SelectItem value="high_to_low">الأعلى تقييماً</SelectItem>
                            <SelectItem value="low_to_high">الأقل تقييماً</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="pt-4">
                        <Button 
                          variant="outline" 
                          onClick={resetFilters} 
                          className="w-full h-9 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                        >
                          <X className="h-4 w-4 ml-2" />
                          إعادة تعيين
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Filters Sidebar */}
          <div className="lg:w-1/4 hidden lg:block">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  تصفية النتائج
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>السعر (دج)</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          placeholder="من" 
                          value={priceRange[0]} 
                          onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                          className="h-9"
                        />
                        <span>-</span>
                        <Input 
                          type="number" 
                          placeholder="إلى" 
                          value={priceRange[1]} 
                          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>الوقت</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input 
                          type="time" 
                          value={timeRange[0]} 
                          onChange={(e) => setTimeRange([e.target.value, timeRange[1]])}
                          className="h-9"
                        />
                        <span>-</span>
                        <Input 
                          type="time" 
                          value={timeRange[1]} 
                          onChange={(e) => setTimeRange([timeRange[0], e.target.value])}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>نوع المركبة</Label>
                    <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="car">سيارة</SelectItem>
                        <SelectItem value="van"> VAN</SelectItem>
                        <SelectItem value="bus">حافلة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Ksar filter - only shown when pickup is Ghardaia (47) */}
                  {pickup && getWilayaIdByName(pickup) === 47 && (
                    <div className="space-y-2">
                      <Label>قصر الانطلاق</Label>
                      <Select value={fromKsarFilter} onValueChange={setFromKsarFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="اختر القصر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">الكل</SelectItem>
                          {ksour.map((ksar) => (
                            <SelectItem key={ksar.value} value={ksar.value}>
                              {ksar.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* To Ksar filter - only shown when destination is Ghardaia (47) */}
                  {destination && getWilayaIdByName(destination) === 47 && (
                    <div className="space-y-2">
                      <Label>قصر الوجهة</Label>
                      <Select value={toKsarFilter} onValueChange={setToKsarFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="اختر القصر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">الكل</SelectItem>
                          {ksour.map((ksar) => (
                            <SelectItem key={ksar.value} value={ksar.value}>
                              {ksar.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>التقييم الأدنى</Label>
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="اختر التقييم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="4.5">4.5 نجوم فأكثر</SelectItem>
                        <SelectItem value="4.0">4.0 نجوم فأكثر</SelectItem>
                        <SelectItem value="3.5">3.5 نجوم فأكثر</SelectItem>
                        <SelectItem value="3.0">3.0 نجوم فأكثر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>ترتيب السعر</Label>
                    <Select value={priceSort} onValueChange={setPriceSort}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="اختر الترتيب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون ترتيب</SelectItem>
                        <SelectItem value="low_to_high">من الأقل للأعلى</SelectItem>
                        <SelectItem value="high_to_low">من الأعلى للأقل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>ترتيب التقييم</Label>
                    <Select value={ratingSort} onValueChange={setRatingSort}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="اختر الترتيب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون ترتيب</SelectItem>
                        <SelectItem value="high_to_low">الأعلى تقييماً</SelectItem>
                        <SelectItem value="low_to_high">الأقل تقييماً</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="outline" onClick={resetFilters} className="w-full h-9">
                      <X className="h-4 w-4 ml-2" />
                      إعادة تعيين
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:w-3/4">
            {loading ? (
              <div className="text-center py-8">
                <p>جاري تحميل الرحلات...</p>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    {pickup && destination ? 'لا توجد رحلات متطابقة' : 'لا توجد رحلات متاحة'}
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    {pickup && destination 
                      ? `لم نجد رحلات من ${pickup} إلى ${destination} في التواريخ القادمة`
                      : 'لا توجد رحلات مجدولة حالياً'
                    }
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-600">
                      💡 نصائح للبحث:
                    </p>
                    <ul className="text-sm text-yellow-600 text-right">
                      <li>• جرب البحث عن رحلات من وإلى ولايات مختلفة</li>
                      <li>• تحقق من التواريخ المتاحة</li>
                      <li>• تأكد من أن السائقين قد نشروا رحلاتهم</li>
                    </ul>
                  </div>
                </div>
                <div className="space-x-4">
                  <Button asChild>
                    <Link to="/">البحث مرة أخرى</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/dashboard">لوحة التحكم</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTrips.map((trip) => {
                  const driverRating = getDriverRatingValue(trip);
                  const driverRatingsCount = getDriverRatingsCount(trip);

                  return (
                    <Card key={trip.id} className="hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg shadow-gray-200/50">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {trip.driver?.avatarUrl ? (
                          <img
                            src={trip.driver.avatarUrl}
                            alt={trip.driver.fullName || 'السائق'}
                            className="w-6 h-6 rounded-full object-cover border border-gray-200 flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <User className={`h-5 w-5 text-primary flex-shrink-0 ${trip.driver?.avatarUrl ? 'hidden' : ''}`} />
                        <CardTitle className="text-lg">
                          {trip.driver?.fullName || 'سائق غير معروف'}
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="w-fit">
                        {trip.status === 'scheduled' ? 'مجدولة' : trip.status}
                      </Badge>
                      {driverRating > 0 && (
                        <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                          <RatingStars rating={driverRating} iconClassName="h-3 w-3" />
                          <span className="text-sm font-medium text-foreground">{driverRating.toFixed(1)}</span>
                          {driverRatingsCount > 0 && (
                            <span className="text-[11px] text-muted-foreground">({driverRatingsCount})</span>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Route */}
                      <div className="flex items-center gap-3 py-2">
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-lg font-bold text-foreground">
                            {trip.fromWilayaName}
                            {trip.fromWilayaId === 47 && trip.fromKsar && (
                              <span className="text-base text-primary font-semibold mr-1"> - {trip.fromKsar}</span>
                            )}
                          </span>
                          <span className="text-xl font-bold text-primary mx-2">←</span>
                          <span className="text-lg font-bold text-foreground">
                            {trip.toWilayaName}
                            {trip.toWilayaId === 47 && trip.toKsar && (
                              <span className="text-base text-primary font-semibold mr-1"> - {trip.toKsar}</span>
                            )}
                        </span>
                        </div>
                      </div>

                      {/* Date and Time */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{trip.departureDate}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{trip.departureTime}</span>
                      </div>

                      {/* Vehicle Info */}
                      {trip.vehicle && (
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {trip.vehicle.make} {trip.vehicle.model} ({trip.vehicle.year})
                          </span>
                        </div>
                      )}

              {/* Rating and Available Seats */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                  {/* Driver rating */}
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                    ★ {typeof trip.driverAverageRating === 'number' ? trip.driverAverageRating.toFixed(1) : '0.0'}
                    {typeof trip.driverRatingsCount === 'number' ? ` (${trip.driverRatingsCount})` : ''}
                  </span>
                          <span className="text-sm text-muted-foreground">للمقعد</span>
                        </div>
                        <span className="text-muted-foreground">•</span>
                        {/* Available seats */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">المقاعد المتاحة:</span>
                          <div className="bg-white border-2 border-primary rounded-lg px-3 py-1 flex items-center justify-center shadow-sm">
                            <span className="text-base font-bold text-primary">{trip.availableSeats}</span>
                        </div>
                        </div>
                      </div>
                      
                      {/* Total Price (equals price per seat unless كمية مقاعد محددة) */}
                      <div className="bg-gray-50 p-3 rounded-lg mt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">السعر الإجمالي:</span>
                          <span className="font-bold text-lg text-primary">
                            {trip.pricePerSeat * 1} دج
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {trip.description && (
                        <p className="text-sm text-muted-foreground">{trip.description}</p>
                      )}

                      {/* Book Button */}
                      {trip.availableSeats === 0 ? (
                        <Button 
                          className="w-full mt-4 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg" 
                          variant="secondary" 
                          disabled
                        >
                          <Users className="h-4 w-4 mr-2" />
                          مكتمل - لا توجد مقاعد متاحة
                        </Button>
                      ) : trip.status !== 'scheduled' ? (
                        <Button 
                          className="w-full mt-4 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg" 
                          variant="secondary" 
                          disabled
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          غير متاح حالياً
                        </Button>
                      ) : (
                        <Button 
                          className="w-full mt-4 bg-primary hover:bg-primary/90 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                          onClick={(e) => handleBookingClick(e, trip.id, trip)}
                            >
                              <Banknote className="h-4 w-4 mr-2" />
                              احجز الآن - {trip.pricePerSeat} دج
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Create Trip Button for Drivers */}
        {user && user.role === 'driver' && (
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/dashboard">أنشئ رحلة جديدة</Link>
            </Button>
          </div>
        )}
      </main>

      {/* Login Prompt Modal for unauthenticated users */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="تسجيل الدخول مطلوب للحجز"
        description="لإكمال عملية الحجز، يرجى تسجيل الدخول أو إنشاء حساب جديد"
      />

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileCompletionModal}
        onClose={() => {
          setShowProfileCompletionModal(false);
          setSelectedTripId(null);
        }}
        missingFields={missingProfileFields}
      />

      <Footer />
    </div>
  );
};

export default RideSearchResults;