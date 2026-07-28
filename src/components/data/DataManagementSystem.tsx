import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Car, 
  Calendar, 
  Clock,
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Filter,
  Eye,
  Search
} from 'lucide-react';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { useLocalAuth } from '@/hooks/useLocalAuth';
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

interface Trip {
  id: string;
  driverId: string;
  fromWilayaId: number;
  toWilayaId: number;
  departureDate: string;
  departureTime: string;
  pricePerSeat: number;
  totalSeats: number;
  availableSeats: number;
  status: string;
  description?: string;
  fromWilayaName?: string;
  toWilayaName?: string;
  driver?: any;
  vehicle?: any;
}

interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  driverId: string;
  seatsBooked: number;
  totalAmount: number;
  status: string;
  pickupLocation: string;
  destinationLocation: string;
  createdAt: string;
  passenger?: any;
  driver?: any;
  trip?: any;
}

const DataManagementSystem = () => {
  const { user } = useLocalAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trips' | 'bookings' | 'analytics'>('trips');
  
  // Filter states
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
  
  const [bookingFilters, setBookingFilters] = useState({
    status: '',
    date: '',
    minAmount: '',
    maxAmount: ''
  });
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load trips with details
        const allTrips = await BrowserDatabaseService.getTripsWithDetails();
        const today = new Date().toISOString().split('T')[0];
        
        // Filter out past trips and only show future trips
        const futureTrips = allTrips.filter((trip: any) => 
          trip.departureDate >= today && trip.status === 'scheduled'
        );
        
        // Add wilaya names
        const tripsWithNames = futureTrips.map((trip: any) => ({
          ...trip,
          fromWilayaName: wilayas.find(w => parseInt(w.code) === trip.fromWilayaId)?.name || `ولاية ${trip.fromWilayaId}`,
          toWilayaName: wilayas.find(w => parseInt(w.code) === trip.toWilayaId)?.name || `ولاية ${trip.toWilayaId}`
        }));
        
        setTrips(tripsWithNames);
        
        // Load bookings with details
        let allBookings = [];
        if (user?.role === 'admin') {
          allBookings = await BrowserDatabaseService.getBookingsWithDetails();
        } else if (user?.role === 'driver') {
          allBookings = await BrowserDatabaseService.getBookingsWithDetails(undefined, user.id);
        } else {
          allBookings = await BrowserDatabaseService.getBookingsWithDetails(user?.id);
        }
        
        setBookings(allBookings);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // Apply trip filters
  const getFilteredTrips = () => {
    let result = trips.filter(trip => {
      if (tripFilters.fromWilaya && trip.fromWilayaId.toString() !== tripFilters.fromWilaya) return false;
      if (tripFilters.toWilaya && trip.toWilayaId.toString() !== tripFilters.toWilaya) return false;
      
      // From Ksar filter - only applies if fromWilaya is Ghardaia (47)
      if (tripFilters.fromKsar !== 'all' && tripFilters.fromWilaya === '47') {
        if (trip.fromWilayaId !== 47) return true; // Show all non-Ghardaia trips
        const tripKsar = trip.fromKsar || (trip as any).fromKsar;
        if (tripKsar !== tripFilters.fromKsar) return false;
      }
      
      // To Ksar filter - only applies if toWilaya is Ghardaia (47)
      if (tripFilters.toKsar !== 'all' && tripFilters.toWilaya === '47') {
        if (trip.toWilayaId !== 47) return true; // Show all non-Ghardaia trips
        const tripToKsar = trip.toKsar || (trip as any).toKsar;
        if (tripToKsar !== tripFilters.toKsar) return false;
      }
      
      if (tripFilters.date && trip.departureDate !== tripFilters.date) return false;
      if (tripFilters.minPrice && trip.pricePerSeat < parseFloat(tripFilters.minPrice)) return false;
      if (tripFilters.maxPrice && trip.pricePerSeat > parseFloat(tripFilters.maxPrice)) return false;
      
      // Rating filter
      if (tripFilters.rating !== 'all') {
        const minRating = parseFloat(tripFilters.rating);
        const driverRating = trip.driver?.rating || 4.5;
        if (driverRating < minRating) return false;
      }
      
      return true;
    });
    
    // Apply sorting
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
    
    return result;
  };

  // Apply booking filters
  const getFilteredBookings = () => {
    return bookings.filter(booking => {
      if (bookingFilters.status && booking.status !== bookingFilters.status) return false;
      if (bookingFilters.date && booking.createdAt.split('T')[0] !== bookingFilters.date) return false;
      if (bookingFilters.minAmount && booking.totalAmount < parseFloat(bookingFilters.minAmount)) return false;
      if (bookingFilters.maxAmount && booking.totalAmount > parseFloat(bookingFilters.maxAmount)) return false;
      return true;
    });
  };

  // Get analytics data
  const getAnalytics = () => {
    const totalTrips = trips.length;
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const availableSeats = trips.reduce((sum, trip) => sum + trip.availableSeats, 0);
    const totalSeats = trips.reduce((sum, trip) => sum + trip.totalSeats, 0);
    const occupancyRate = totalSeats > 0 ? Math.round(((totalSeats - availableSeats) / totalSeats) * 100) : 0;
    
    return {
      totalTrips,
      totalBookings,
      totalRevenue,
      availableSeats,
      totalSeats,
      occupancyRate
    };
  };

  const filteredTrips = getFilteredTrips();
  const filteredBookings = getFilteredBookings();
  const analytics = getAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Car className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{analytics.totalTrips}</div>
            <div className="text-sm text-muted-foreground">الرحلات</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{analytics.totalBookings}</div>
            <div className="text-sm text-muted-foreground">الحجوزات</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{analytics.totalRevenue}</div>
            <div className="text-sm text-muted-foreground">الإيرادات (دج)</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{analytics.occupancyRate}%</div>
            <div className="text-sm text-muted-foreground">معدل الاشغال</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{analytics.availableSeats}</div>
            <div className="text-sm text-muted-foreground">المقاعد المتاحة</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'trips' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('trips')}
          className="flex items-center gap-2"
        >
          <Car className="h-4 w-4" />
          الرحلات
        </Button>
        <Button
          variant={activeTab === 'bookings' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('bookings')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          الحجوزات
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('analytics')}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          التحليلات
        </Button>
      </div>

      {/* Trips Tab */}
      {activeTab === 'trips' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                إدارة الرحلات
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                  onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                >
                  <Filter className="h-4 w-4" />
                  تصفية
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Trip Filters - Hidden by default, shown in sidebar */}
            {showFilterSidebar && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                <div>
                <label className="text-sm font-medium">من الولاية</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={tripFilters.fromWilaya}
                  onChange={(e) => setTripFilters({...tripFilters, fromWilaya: e.target.value, fromKsar: 'all'})}
                >
                  <option value="">الكل</option>
                  {wilayas.map((wilaya) => (
                    <option key={wilaya.code} value={wilaya.code}>{wilaya.name}</option>
                  ))}
                </select>
              </div>
              {/* From Ksar filter - only shown when fromWilaya is Ghardaia (47) */}
              {tripFilters.fromWilaya === '47' && (
                <div>
                  <label className="text-sm font-medium">قصر الانطلاق</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={tripFilters.fromKsar}
                    onChange={(e) => setTripFilters({...tripFilters, fromKsar: e.target.value})}
                  >
                    <option value="all">الكل</option>
                    {ksour.map((ksar) => (
                      <option key={ksar.value} value={ksar.value}>{ksar.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">إلى الولاية</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={tripFilters.toWilaya}
                  onChange={(e) => setTripFilters({...tripFilters, toWilaya: e.target.value, toKsar: 'all'})}
                >
                  <option value="">الكل</option>
                  {wilayas.map((wilaya) => (
                    <option key={wilaya.code} value={wilaya.code}>{wilaya.name}</option>
                  ))}
                </select>
              </div>
              {/* To Ksar filter - only shown when toWilaya is Ghardaia (47) */}
              {tripFilters.toWilaya === '47' && (
                <div>
                  <label className="text-sm font-medium">قصر الوجهة</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={tripFilters.toKsar}
                    onChange={(e) => setTripFilters({...tripFilters, toKsar: e.target.value})}
                  >
                    <option value="all">الكل</option>
                    {ksour.map((ksar) => (
                      <option key={ksar.value} value={ksar.value}>{ksar.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">التاريخ</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded-md"
                  value={tripFilters.date}
                  onChange={(e) => setTripFilters({...tripFilters, date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">السعر الأدنى</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-md"
                  placeholder="0"
                  value={tripFilters.minPrice}
                  onChange={(e) => setTripFilters({...tripFilters, minPrice: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">السعر الأقصى</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-md"
                  placeholder="10000"
                  value={tripFilters.maxPrice}
                  onChange={(e) => setTripFilters({...tripFilters, maxPrice: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">التقييم الأدنى</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={tripFilters.rating}
                  onChange={(e) => setTripFilters({...tripFilters, rating: e.target.value})}
                >
                  <option value="all">الكل</option>
                  <option value="4.5">4.5 نجوم فأكثر</option>
                  <option value="4.0">4.0 نجوم فأكثر</option>
                  <option value="3.5">3.5 نجوم فأكثر</option>
                  <option value="3.0">3.0 نجوم فأكثر</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">ترتيب السعر</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={tripFilters.priceSort}
                  onChange={(e) => setTripFilters({...tripFilters, priceSort: e.target.value})}
                >
                  <option value="none">بدون ترتيب</option>
                  <option value="low_to_high">من الأقل للأعلى</option>
                  <option value="high_to_low">من الأعلى للأقل</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">ترتيب التقييم</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={tripFilters.ratingSort}
                  onChange={(e) => setTripFilters({...tripFilters, ratingSort: e.target.value})}
                >
                  <option value="none">بدون ترتيب</option>
                  <option value="high_to_low">الأعلى تقييماً</option>
                  <option value="low_to_high">الأقل تقييماً</option>
                </select>
              </div>
            </div>
            )}

            {/* Trips List */}
            <div className="space-y-4">
              {filteredTrips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد رحلات متاحة</p>
                </div>
              ) : (
                filteredTrips.map((trip) => {
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
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`font-semibold ${isFullyBooked ? 'text-muted-foreground' : ''}`}>
                                {trip.fromWilayaName}
                                {trip.fromWilayaId === 47 && (trip as any).fromKsar && (
                                  <span className="text-xs text-primary font-medium"> - {(trip as any).fromKsar}</span>
                                )}
                                {' → '}
                                {trip.toWilayaName}
                                {trip.toWilayaId === 47 && (trip as any).toKsar && (
                                  <span className="text-xs text-primary font-medium"> - {(trip as any).toKsar}</span>
                                )}
                              </span>
                              <div className="flex items-center gap-2">
                                {isFullyBooked && (
                                  <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 text-xs">
                                    محجوز
                                  </Badge>
                                )}
                                <Badge variant="outline">{trip.status === 'scheduled' ? 'مجدولة' : trip.status}</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                              {trip.driver?.avatarUrl ? (
                                <img 
                                  src={trip.driver.avatarUrl} 
                                  alt={trip.driver.fullName || 'السائق'}
                                  className="w-5 h-5 rounded-full object-cover border border-gray-200 flex-shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <User className={`h-4 w-4 flex-shrink-0 ${trip.driver?.avatarUrl ? 'hidden' : ''}`} />
                              <span>السائق: {trip.driver?.fullName || 'غير محدد'}</span>
                            </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{trip.departureDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{trip.departureTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{trip.pricePerSeat} دج/مقعد</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span className={isFullyBooked ? 'text-red-600 font-medium' : ''}>
                                {isFullyBooked ? 'محجوز بالكامل' : `${trip.availableSeats}/${trip.totalSeats} مقاعد`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                إدارة الحجوزات
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  تصفية
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Booking Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div>
                <label className="text-sm font-medium">الحالة</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={bookingFilters.status}
                  onChange={(e) => setBookingFilters({...bookingFilters, status: e.target.value})}
                >
                  <option value="">الكل</option>
                  <option value="pending">معلقة</option>
                  <option value="confirmed">مؤكدة</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">التاريخ</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded-md"
                  value={bookingFilters.date}
                  onChange={(e) => setBookingFilters({...bookingFilters, date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">الحد الأدنى</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-md"
                  placeholder="0"
                  value={bookingFilters.minAmount}
                  onChange={(e) => setBookingFilters({...bookingFilters, minAmount: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">الحد الأقصى</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-md"
                  placeholder="10000"
                  value={bookingFilters.maxAmount}
                  onChange={(e) => setBookingFilters({...bookingFilters, maxAmount: e.target.value})}
                />
              </div>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد حجوزات</p>
                </div>
              ) : (
                filteredBookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {user?.role === 'passenger' 
                                ? `${booking.trip?.fromWilayaName || 'غير محدد'}${booking.trip?.fromWilayaId === 47 && (booking.trip as any)?.fromKsar ? ` - ${(booking.trip as any).fromKsar}` : ''} → ${booking.trip?.toWilayaName || 'غير محدد'}${booking.trip?.toWilayaId === 47 && (booking.trip as any)?.toKsar ? ` - ${(booking.trip as any).toKsar}` : ''}` 
                                : `${booking.passenger?.fullName || 'راكب غير معروف'}`}
                            </span>
                            <Badge 
                              variant={
                                booking.status === 'pending' ? 'secondary' :
                                booking.status === 'confirmed' ? 'default' :
                                booking.status === 'completed' ? 'outline' : 'destructive'
                              }
                            >
                              {booking.status === 'pending' ? 'معلقة' :
                               booking.status === 'confirmed' ? 'مؤكدة' :
                               booking.status === 'completed' ? 'مكتملة' : 'ملغاة'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(booking.createdAt).toLocaleDateString('ar-DZ')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{booking.seatsBooked} مقاعد</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{booking.totalAmount} دج</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.pickupLocation} → {booking.destinationLocation}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                إحصائيات الرحلات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <span>إجمالي الرحلات</span>
                  <span className="font-bold text-lg">{analytics.totalTrips}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-500/5 rounded-lg">
                  <span>المقاعد المتاحة</span>
                  <span className="font-bold text-lg">{analytics.availableSeats}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-500/5 rounded-lg">
                  <span>إجمالي المقاعد</span>
                  <span className="font-bold text-lg">{analytics.totalSeats}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-500/5 rounded-lg">
                  <span>معدل الاشغال</span>
                  <span className="font-bold text-lg">{analytics.occupancyRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                إحصائيات الحجوزات والإيرادات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <span>إجمالي الحجوزات</span>
                  <span className="font-bold text-lg">{analytics.totalBookings}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-500/5 rounded-lg">
                  <span>إجمالي الإيرادات</span>
                  <span className="font-bold text-lg">{analytics.totalRevenue} دج</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-500/5 rounded-lg">
                  <span>متوسط السعر للحجز</span>
                  <span className="font-bold text-lg">
                    {analytics.totalBookings > 0 ? Math.round(analytics.totalRevenue / analytics.totalBookings) : 0} دج
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-500/5 rounded-lg">
                  <span>متوسط المقاعد للحجز</span>
                  <span className="font-bold text-lg">
                    {analytics.totalBookings > 0 ? (analytics.totalSeats - analytics.availableSeats) / analytics.totalBookings : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DataManagementSystem;