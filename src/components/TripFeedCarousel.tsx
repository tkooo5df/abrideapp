import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  type CarouselApi
} from "@/components/ui/carousel";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import BlurText from "@/components/BlurText";
import { useNavigate } from "react-router-dom";
import BookingModal from "@/components/booking/BookingModal";

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

const TripFeedCarousel = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [isAutoplayActive, setIsAutoplayActive] = useState(true);
  const navigate = useNavigate();
  
  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Load trips from database
  useEffect(() => {
    loadTrips();
  }, []);

  // Autoplay functionality
  useEffect(() => {
    if (!api || trips.length === 0) return;

    let autoplay: NodeJS.Timeout | null = null;

    const startAutoplay = () => {
      if (isAutoplayActive && !autoplay) {
        autoplay = setInterval(() => {
          api.scrollNext();
        }, 4000);
      }
    };

    const stopAutoplay = () => {
      if (autoplay) {
        clearInterval(autoplay);
        autoplay = null;
      }
      setIsAutoplayActive(false);
    };

    startAutoplay();

    api.on('pointerDown', stopAutoplay);

    return () => {
      if (autoplay) {
        clearInterval(autoplay);
      }
      api.off('pointerDown', stopAutoplay);
    };
  }, [api, isAutoplayActive, trips.length]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await BrowserDatabaseService.getTripsWithDetails();
      
      // Filter for scheduled trips only
      const scheduledTrips = (data || []).filter(trip => trip.status === 'scheduled');
      
      // Sort by departure date and time (closest first)
      scheduledTrips.sort((a, b) => {
        const dateA = new Date(`${a.departureDate}T${a.departureTime}`);
        const dateB = new Date(`${b.departureDate}T${b.departureTime}`);
        return dateA.getTime() - dateB.getTime();
      });
      
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
      <section className="py-16 px-4 bg-gradient-to-b from-background to-secondary/10" dir="rtl">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <BlurText 
              text="الرحلات الحالية" 
              delay={100}
              animateBy="words"
              direction="top"
              className="text-3xl md:text-4xl font-bold text-primary mb-4"
            />
          </motion.div>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (trips.length === 0) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-background to-secondary/10" dir="rtl">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <BlurText 
              text="الرحلات الحالية" 
              delay={100}
              animateBy="words"
              direction="top"
              className="text-3xl md:text-4xl font-bold text-primary mb-4"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-12 text-center bg-gradient-to-br from-card to-secondary/5 border-2 border-dashed border-primary/20">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-primary/10 rounded-full">
                  <MapPin className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">لا توجد رحلات مجدولة حالياً</h3>
              <p className="text-lg text-muted-foreground">سيتم عرض الرحلات الجديدة هنا عند توفرها</p>
            </Card>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-2 md:py-16 md:px-4 bg-gradient-to-b from-background to-secondary/10" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Car className="h-5 w-5 text-primary" />
            <span className="text-primary font-semibold">رحلات متاحة الآن</span>
          </div>
          <BlurText 
            text="الرحلات الحالية" 
            delay={100}
            animateBy="words"
            direction="top"
            className="text-3xl md:text-4xl font-bold text-primary"
          />
          <Button 
            onClick={() => navigate('/current-trips')}
            variant="outline"
            className="mt-4"
          >
            عرض جميع الرحلات
          </Button>
        </motion.div>

        <Carousel
          setApi={setApi}
          opts={{
            align: "center",
            loop: true,
            dragFree: false,
            direction: "rtl",
          }}
          className="w-full max-w-7xl mx-auto"
        >
        <CarouselContent className="-ml-2 md:-ml-4 py-2">
          {trips.map((trip, index) => {
            const statusInfo = getStatusBadge(trip.status);
            const isFullyBooked = trip.status === 'fully_booked' || trip.availableSeats === 0;
            
            return (
              <CarouselItem key={trip.id} className="pl-2 md:pl-4 basis-[95%] md:basis-[48%] lg:basis-[32%]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ 
                    duration: 0.4,
                    delay: index * 0.08
                  }}
                  className="h-full"
                >
                  <Card className={`group relative overflow-hidden h-full transition-all duration-300 ${
                    isFullyBooked 
                      ? 'opacity-70 bg-muted/30 border border-dashed border-muted-foreground/20' 
                      : 'bg-card border hover:border-primary hover:shadow-lg hover:-translate-y-1'
                  }`}>
                    {/* Header with route - شريط ملون خفيف */}
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
                            <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
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
                      {/* Driver & Vehicle Info - بسيط بدون ألوان */}
                      <div className="space-y-2">
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
                        
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">
                            {trip.vehicle?.make} {trip.vehicle?.model}
                          </span>
                        </div>
                      </div>
                      
                      {/* Date & Time - بسيط بدون ألوان */}
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
                      
                      {/* Price & Seats - مع ألوان */}
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
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
      </div>
      
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
    </section>
  );
};

export default TripFeedCarousel;