import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  User, 
  Users,
  Banknote,
  Filter,
  RefreshCcw
} from "lucide-react";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingModal from "@/components/booking/BookingModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Trip {
  id: string;
  driverId: string;
  vehicleId: string;
  fromWilayaId: number;
  toWilayaId: number;
  fromWilayaName?: string;
  toWilayaName?: string;
  departureDate: string;
  departureTime: string;
  pricePerSeat: number;
  totalSeats: number;
  availableSeats: number;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'fully_booked' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  driver?: {
    fullName: string;
    phone: string;
    avatarUrl?: string;
  };
  vehicle?: {
    make: string;
    model: string;
    licensePlate: string;
  };
}

const CurrentTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const navigate = useNavigate();
  
  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  // Monitor for booking success to refresh trips immediately
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
    const bookingCheckInterval = setInterval(checkBookingSuccess, 1000); // every 1 second

    return () => clearInterval(bookingCheckInterval);
  }, []);

  useEffect(() => {
    filterAndSortTrips();
  }, [trips, statusFilter, sortBy]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      
      // إزالة cache لضمان الحصول على أحدث البيانات دائماً
      // لأن المقاعد المتاحة يجب أن تُحدّث فوراً بعد كل حجز
      localStorage.removeItem('current_trips_cache');
      localStorage.removeItem('current_trips_cache_time');
      const data = await BrowserDatabaseService.getTripsWithDetails();
      
      // Filter for scheduled trips only and limit to 50 recent trips
      const scheduledTrips = (data || [])
        .filter(trip => trip.status === 'scheduled' || trip.status === 'fully_booked')
        .sort((a, b) => {
          const dateA = new Date(`${a.departureDate}T${a.departureTime}`);
          const dateB = new Date(`${b.departureDate}T${b.departureTime}`);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 50); // حد أقصى 50 رحلة
      setTrips(scheduledTrips);
      
    } catch (error) {
      toast({
        title: "خطأ في تحميل الرحلات",
        description: "حدث خطأ أثناء تحميل الرحلات المتاحة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    localStorage.removeItem('current_trips_cache');
    localStorage.removeItem('current_trips_cache_time');
    await loadTrips();
    setRefreshing(false);
  };

  const filterAndSortTrips = () => {
    let result = [...trips];

    // Filter by status
    if (statusFilter !== "all") {
      if (statusFilter === "available") {
        result = result.filter(trip => trip.availableSeats > 0);
      } else if (statusFilter === "full") {
        result = result.filter(trip => trip.availableSeats === 0);
      }
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(`${a.departureDate}T${a.departureTime}`);
        const dateB = new Date(`${b.departureDate}T${b.departureTime}`);
        return dateA.getTime() - dateB.getTime();
      } else if (sortBy === "price-low") {
        return a.pricePerSeat - b.pricePerSeat;
      } else if (sortBy === "price-high") {
        return b.pricePerSeat - a.pricePerSeat;
      } else if (sortBy === "seats") {
        return b.availableSeats - a.availableSeats;
      }
      return 0;
    });

    setFilteredTrips(result);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { label: "مجدولة", color: "bg-blue-100 text-blue-800" },
      in_progress: { label: "قيد التنفيذ", color: "bg-yellow-100 text-yellow-800" },
      fully_booked: { label: "محجوز بالكامل", color: "bg-orange-100 text-orange-800" },
      completed: { label: "مكتملة", color: "bg-green-100 text-green-800" },
      cancelled: { label: "ملغاة", color: "bg-red-100 text-red-800" }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.scheduled;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header />
        <main className="py-12 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-8 animate-pulse">
              <div className="h-10 w-64 bg-muted rounded-lg mb-2"></div>
              <div className="h-5 w-96 bg-muted rounded-lg"></div>
            </div>
            
            {/* Skeleton Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-muted"></div>
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-muted rounded mb-2"></div>
                      <div className="h-3 w-32 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="h-4 w-full bg-muted rounded"></div>
                    <div className="h-4 w-3/4 bg-muted rounded"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 flex-1 bg-muted rounded"></div>
                    <div className="h-10 w-20 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Car className="h-5 w-5 text-primary" />
              <span className="text-primary font-semibold">جميع الرحلات المتاحة</span>
            </div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-primary">
                الرحلات الحالية
              </h1>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
            <p className="text-lg text-muted-foreground">
              اختر الرحلة المناسبة لك من بين {filteredTrips.length} رحلة متاحة
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border rounded-lg p-4 mb-8 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">تصفية وترتيب النتائج</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">الحالة</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الرحلات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الرحلات</SelectItem>
                    <SelectItem value="available">متاحة فقط</SelectItem>
                    <SelectItem value="full">ممتلئة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">الترتيب حسب</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="التاريخ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">التاريخ (الأقرب أولاً)</SelectItem>
                    <SelectItem value="price-low">السعر (الأقل أولاً)</SelectItem>
                    <SelectItem value="price-high">السعر (الأعلى أولاً)</SelectItem>
                    <SelectItem value="seats">المقاعد المتاحة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Trips Grid */}
          {filteredTrips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="p-12 text-center bg-gradient-to-br from-card to-secondary/5 border-2 border-dashed border-primary/20">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <MapPin className="h-16 w-16 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">لا توجد رحلات متاحة</h3>
                <p className="text-lg text-muted-foreground mb-6">جرب تغيير خيارات التصفية</p>
                <Button onClick={() => {
                  setStatusFilter("all");
                  setSortBy("date");
                }}>
                  إعادة تعيين التصفية
                </Button>
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip, index) => {
                const statusInfo = getStatusBadge(trip.status);
                const isFullyBooked = trip.status === 'fully_booked' || trip.availableSeats === 0;

                return (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`group relative overflow-hidden h-full transition-all duration-300 ${
                      isFullyBooked 
                        ? 'opacity-70 bg-muted/30 border border-dashed border-muted-foreground/20' 
                        : 'bg-card border hover:border-primary hover:shadow-lg hover:-translate-y-1'
                    }`}>
                      {/* Header with route */}
                      <div className={`p-3 ${isFullyBooked ? 'bg-muted/30' : 'bg-primary/5'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`text-sm font-bold truncate ${isFullyBooked ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {trip.fromWilayaName || `ولاية ${trip.fromWilayaId}`}
                                {trip.fromWilayaId === 47 && (trip as any).fromKsar && (
                                  <span className="text-xs text-primary font-medium"> - {(trip as any).fromKsar}</span>
                                )}
                              </span>
                              <span className="text-muted-foreground">←</span>
                              <span className={`text-sm font-bold truncate ${isFullyBooked ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {trip.toWilayaName || `ولاية ${trip.toWilayaId}`}
                                {trip.toWilayaId === 47 && (trip as any).toKsar && (
                                  <span className="text-xs text-primary font-medium"> - {(trip as any).toKsar}</span>
                                )}
                              </span>
                            </div>
                          </div>
                          {isFullyBooked && (
                            <Badge variant="secondary" className="bg-red-500 text-white text-xs">
                              ممتلئ
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardContent className="space-y-3 p-3 pt-4">
                        {/* Driver Info */}
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:bg-secondary/20 p-1 rounded-md transition-colors -mx-1"
                          onClick={() => navigate(`/profile?userId=${trip.driverId}`)}
                          title="عرض ملف السائق"
                        >
                          {trip.driver?.avatarUrl ? (
                            <img 
                              src={trip.driver.avatarUrl} 
                              alt={trip.driver.fullName || 'السائق'}
                              className="w-6 h-6 rounded-full object-cover border border-border flex-shrink-0 hover:scale-110 transition-transform"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <User className={`h-4 w-4 text-muted-foreground flex-shrink-0 ${trip.driver?.avatarUrl ? 'hidden' : ''}`} />
                          <span className="text-xs text-muted-foreground truncate hover:text-primary transition-colors">{trip.driver?.fullName || "سائق غير معروف"}</span>
                        </div>

                        {/* Vehicle */}
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">
                            {trip.vehicle?.make} {trip.vehicle?.model}
                          </span>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs truncate">{trip.departureDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs truncate">{trip.departureTime}</span>
                          </div>
                        </div>

                        {/* Price & Seats */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1.5 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-700">
                            <Banknote className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-green-700 dark:text-green-300">السعر</p>
                              <p className="text-sm font-bold text-green-600 dark:text-green-400">{trip.pricePerSeat} دج</p>
                            </div>
                          </div>
                          
                          <div className={`flex items-center gap-1.5 p-2 rounded-md border ${
                            isFullyBooked 
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' 
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                          }`}>
                            <Users className={`h-4 w-4 flex-shrink-0 ${isFullyBooked ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-[10px] ${isFullyBooked ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}`}>المقاعد</p>
                              <p className={`text-sm font-bold ${isFullyBooked ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                {isFullyBooked ? 'ممتلئ' : `${trip.availableSeats}/${trip.totalSeats}`}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button 
                          className={`w-full h-9 text-sm transition-all duration-300 ${
                            isFullyBooked 
                              ? 'bg-muted hover:bg-muted' 
                              : 'hover:bg-primary/90'
                          }`}
                          disabled={isFullyBooked}
                          onClick={() => {
                            if (!isFullyBooked) {
                              setSelectedTrip(trip);
                              setIsBookingModalOpen(true);
                            }
                          }}
                        >
                          {isFullyBooked ? 'محجوز' : 'احجز الآن'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
      
      {/* Booking Modal */}
      {selectedTrip && (
        <BookingModal 
          trip={selectedTrip}
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedTrip(null);
          }}
          onSuccess={() => {
            // Reload trips after successful booking
            loadTrips();
          }}
        />
      )}
    </div>
  );
};

export default CurrentTrips;

