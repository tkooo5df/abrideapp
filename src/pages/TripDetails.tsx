import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Share2,
  ArrowRight,
  Star,
  CheckCircle2,
  ShieldCheck,
  Award,
  ArrowLeftRight,
  MessageSquare
} from "lucide-react";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";
import { supabase } from "@/integrations/supabase/client";
import { ReviewsService, Review } from "@/integrations/database/reviewsService";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingModal from "@/components/booking/BookingModal";
import { Separator } from "@/components/ui/separator";

const TripDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [rating, setRating] = useState<number>(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTripType, setSelectedTripType] = useState<'outbound' | 'return' | 'round_trip'>('outbound');

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // 1. Fetch Trip
        const tripData = await BrowserDatabaseService.getTripById(id);
        if (!tripData) {
          setError("لم يتم العثور على الرحلة");
          return;
        }
        
        // 2. Fetch Driver Profile
        let driverData = null;
        if (tripData.driverId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', tripData.driverId)
            .maybeSingle();
            
          driverData = profileData;
          
          // 3. Fetch Driver Vehicle
          if (tripData.vehicleId) {
            const { data: vehicleData } = await supabase
              .from('vehicles')
              .select('*')
              .eq('id', tripData.vehicleId)
              .maybeSingle();
            setVehicle(vehicleData);
          } else {
             const { data: anyVehicle } = await supabase
              .from('vehicles')
              .select('*')
              .eq('driver_id', tripData.driverId)
              .limit(1)
              .maybeSingle();
             setVehicle(anyVehicle);
          }

          // 4. Fetch Ratings
          const avgRating = await ReviewsService.getUserAverageRating(tripData.driverId);
          const fetchedReviews = await ReviewsService.getReviewsForUser(tripData.driverId);
          
          setRating(avgRating || 0);
          setReviews(fetchedReviews);
        }

        // Attach driver to trip for the BookingModal to work seamlessly
        const fullTrip = {
            ...tripData,
            driver: driverData ? {
                fullName: driverData.full_name,
                phone: driverData.phone,
                avatarUrl: driverData.avatar_url,
            } : tripData.driver,
            vehicle: vehicle || tripData.vehicle
        };

        setDriver(driverData);
        setTrip(fullTrip);

      } catch (err) {
        console.error("Error fetching trip details:", err);
        setError("حدث خطأ أثناء جلب بيانات الرحلة");
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Header />
        <main className="flex-1">
          <div className="h-[40vh] w-full bg-muted animate-pulse"></div>
          <div className="container mx-auto px-4 -mt-16 relative z-10 max-w-4xl pb-12">
            <div className="bg-card rounded-2xl shadow-xl p-8 border min-h-[400px] animate-pulse">
                <div className="h-8 w-1/3 bg-muted rounded mb-8"></div>
                <div className="h-32 bg-muted rounded-xl mb-6"></div>
                <div className="h-32 bg-muted rounded-xl"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-primary">404 - الرحلة غير موجودة</h2>
          <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">عذراً، لم نتمكن من العثور على تفاصيل هذه الرحلة. قد تكون أُزيلت أو الرابط غير صحيح.</p>
          <Button size="lg" onClick={() => navigate("/current-trips")} className="rounded-full px-8">تصفح الرحلات المتاحة</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isRoundTrip = trip.is_round_trip;
  
  // Checking availability for each leg
  const isOutboundFull = trip.availableSeats === 0 || trip.status === 'fully_booked';
  const isReturnFull = isRoundTrip && (trip.return_available_seats === 0 || trip.status === 'fully_booked');
  
  const driverNameStr = driver?.full_name || trip.driver?.fullName || 'سائق';
  const pickupStr = trip.fromWilayaName || `ولاية ${trip.fromWilayaId}`;
  const destStr = trip.toWilayaName || `ولاية ${trip.toWilayaId}`;

  const openBooking = (type: 'outbound' | 'return' | 'round_trip') => {
    setSelectedTripType(type);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Header />
      
      <main className="flex-1 pb-20">
        {/* Hero Section */}
        <div className="relative h-[55vh] min-h-[450px] w-full bg-slate-900 overflow-hidden flex items-center justify-center">
          {/* TripAdvisor Background Image */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
            style={{ 
              backgroundImage: 'url(https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/0a/46/48/af.jpg)'
            }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-black/50" />
          
          <div className="relative z-10 container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4 bg-primary/90 text-primary-foreground border-none px-4 py-1 text-sm font-medium backdrop-blur-sm shadow-lg">
                {isRoundTrip ? 'رحلة ذهاب وإياب' : 'رحلة ذهاب فقط'}
              </Badge>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg leading-tight">
                من <span className="text-primary">{pickupStr}</span> <br className="md:hidden" /> إلى <span className="text-primary">{destStr}</span>
              </h1>
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-lg md:text-xl text-slate-200 drop-shadow-md bg-black/30 backdrop-blur-md p-4 rounded-2xl w-fit mx-auto border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-primary font-bold text-sm bg-primary/20 px-2 py-0.5 rounded">ذهاب</span>
                  <Calendar className="h-5 w-5 text-primary" /> {trip.departureDate} 
                  <Clock className="h-5 w-5 text-primary ml-1" /> {trip.departureTime}
                </div>
                
                {isRoundTrip && (
                  <>
                    <span className="text-white/50 hidden md:inline">|</span>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400 font-bold text-sm bg-blue-500/20 px-2 py-0.5 rounded">إياب</span>
                      <Calendar className="h-5 w-5 text-blue-400" /> {trip.return_date} 
                      <Clock className="h-5 w-5 text-blue-400 ml-1" /> {trip.return_time}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="absolute top-6 right-6 text-white hover:bg-black/20 hover:text-white backdrop-blur-sm gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            عودة
          </Button>
          
          <Button
            variant="outline"
            className="absolute top-6 left-6 text-white border-white/30 bg-black/20 hover:bg-black/40 hover:text-white backdrop-blur-sm rounded-full w-12 h-12 p-0"
            title="مشاركة رابط الرحلة"
            onClick={() => {
              const shareUrl = window.location.href;
              if (navigator.share) {
                navigator.share({
                  title: 'حجز رحلة على أبريد',
                  text: `احجز مع السائق ${driverNameStr} من ${pickupStr} إلى ${destStr}`,
                  url: shareUrl
                }).catch(() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast({ title: "تم النسخ", description: "تم نسخ رابط الرحلة بنجاح" });
                });
              } else {
                navigator.clipboard.writeText(shareUrl);
                toast({ title: "تم النسخ", description: "تم نسخ رابط الرحلة بنجاح" });
              }
            }}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-3 md:px-4 -mt-16 relative z-20 max-w-6xl">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
            
            {/* Main Details (Left/Center) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 space-y-4 md:space-y-6 order-1"
            >
              {/* Driver Card */}
              <Card className="border-none shadow-xl bg-card/95 backdrop-blur overflow-hidden rounded-3xl">
                <div className="h-12 md:h-16 bg-gradient-to-r from-primary/10 to-primary/5 w-full"></div>
                <CardContent className="px-4 pb-4 pt-0 sm:px-8 sm:pb-8">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start relative -mt-10">
                    <div className="relative">
                      {driver?.avatar_url ? (
                        <img 
                          src={driver.avatar_url} 
                          alt={driverNameStr}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-background shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-secondary flex items-center justify-center border-4 border-background shadow-lg">
                          <User className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1.5 border-2 border-background shadow-sm" title="سائق موثق">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-right mt-2 sm:mt-12">
                      <div className="flex flex-col sm:flex-row sm:justify-between items-center sm:items-start gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 justify-center sm:justify-start">
                            {driverNameStr}
                            {driver?.verified_status === 'approved' && (
                              <CheckCircle2 className="h-5 w-5 text-blue-500" />
                            )}
                          </h2>
                          <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start text-sm">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded-full font-medium">
                              <Star className="h-4 w-4 fill-current" />
                              {rating > 0 ? rating : 'جديد'}
                            </div>
                            <span className="text-muted-foreground transition-colors">
                              {reviews.length} تقييم
                            </span>
                            {rating >= 4.5 && reviews.length > 5 && (
                              <div className="flex items-center gap-1.5 text-primary">
                                <Award className="h-4 w-4" />
                                <span>سائق متميز</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button variant="outline" className="rounded-full" onClick={() => navigate(`/profile?userId=${trip.driverId}`)}>
                          عرض الملف الشخصي
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Vehicle Info */}
                  <div className="grid grid-cols-2 gap-3 md:gap-6">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30">
                      <div className="p-3 bg-primary/10 rounded-lg text-primary">
                        <Car className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">السيارة</p>
                        <p className="font-bold text-foreground">
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : trip.vehicle?.make ? `${trip.vehicle.make} ${trip.vehicle.model}` : "سيارة مريحة"}
                        </p>
                        {vehicle?.year && (
                          <p className="text-xs text-muted-foreground mt-1">موديل {vehicle.year}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30">
                      <div className="p-3 bg-primary/10 rounded-lg text-primary">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">التوثيق</p>
                        <p className="font-bold text-foreground text-green-600">موثق في المنصة</p>
                        <p className="text-xs text-muted-foreground mt-1">تم التحقق من هوية السائق والسيارة</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Booking Card (Right/Sidebar) */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1 order-2"
            >
              <div className="sticky top-24 space-y-4 md:space-y-6">
                
                {/* Outbound Leg Card */}
                <Card className={`border-none shadow-2xl rounded-3xl overflow-hidden ${isOutboundFull ? 'bg-muted/50' : 'bg-card'}`}>
                  <div className={`h-1.5 w-full ${isOutboundFull ? 'bg-red-500' : 'bg-primary'}`}></div>
                  <CardContent className="p-6">
                    <Badge variant="outline" className="mb-4 font-bold border-primary text-primary bg-primary/5">مسار الذهاب</Badge>
                    <div className="flex items-end justify-between mb-5">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">سعر الذهاب للمقعد</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-primary drop-shadow-sm">{trip.pricePerSeat}</span>
                          <span className="text-sm font-bold text-primary">دج</span>
                        </div>
                      </div>
                      <div className="text-left bg-primary/10 border border-primary/20 p-2.5 rounded-xl text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-primary mb-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{trip.departureDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-foreground font-bold">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span>{trip.departureTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 mb-5 rounded-xl border ${
                      isOutboundFull 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isOutboundFull ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-green-100 dark:bg-green-900/40 text-green-600'}`}>
                          <Users className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold uppercase ${isOutboundFull ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>التوفر</span>
                          <span className="font-bold text-xs md:text-sm text-foreground">المقاعد المتاحة للذهاب</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className={`text-2xl font-black ${isOutboundFull ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {isOutboundFull ? '0' : `${trip.availableSeats}`}
                        </span>
                      </div>
                    </div>

                    <Button 
                      className={`w-full h-10 md:h-12 text-sm md:text-base font-bold rounded-xl shadow-md transition-all ${
                        isOutboundFull 
                          ? 'bg-muted hover:bg-muted text-muted-foreground shadow-none' 
                          : 'hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                      disabled={isOutboundFull}
                      onClick={() => {
                        if (!isOutboundFull) openBooking('outbound');
                      }}
                    >
                      {isOutboundFull ? 'الذهاب ممتلئ' : 'حجز الذهاب فقط'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Return Leg Card */}
                {isRoundTrip && (
                  <Card className={`border-none shadow-2xl rounded-3xl overflow-hidden ${isReturnFull ? 'bg-muted/50' : 'bg-card'}`}>
                    <div className={`h-1.5 w-full ${isReturnFull ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                    <CardContent className="p-4 md:p-6">
                      <Badge variant="outline" className="mb-3 md:mb-4 font-bold border-blue-500 text-blue-500 bg-blue-500/5 text-xs md:text-sm">مسار الإياب</Badge>
                      
                      <div className="flex items-end justify-between mb-5">
                        <div>
                          <p className="text-xs md:text-sm text-muted-foreground font-medium mb-1">سعر الإياب للمقعد</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 drop-shadow-sm">{trip.return_price_per_seat || trip.pricePerSeat}</span>
                            <span className="text-xs md:text-sm font-bold text-blue-600 dark:text-blue-400">دج</span>
                          </div>
                        </div>
                        <div className="text-left bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2.5 rounded-xl text-xs font-medium">
                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{trip.return_date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-foreground font-bold">
                            <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{trip.return_time}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`flex items-center justify-between p-3 mb-5 rounded-xl border ${
                        isReturnFull 
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isReturnFull ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'}`}>
                            <Users className="h-4 w-4 md:h-5 md:w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-bold uppercase ${isReturnFull ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}`}>التوفر</span>
                            <span className="font-bold text-xs md:text-sm text-foreground">المقاعد المتاحة للإياب</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className={`text-2xl font-black ${isReturnFull ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {isReturnFull ? '0' : `${trip.return_available_seats}`}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="secondary"
                        className={`w-full h-10 md:h-12 text-sm md:text-base font-bold rounded-xl transition-all ${
                          isReturnFull 
                            ? 'bg-muted hover:bg-muted text-muted-foreground opacity-50' 
                            : 'hover:scale-[1.02] active:scale-[0.98] border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                        }`}
                        disabled={isReturnFull}
                        onClick={() => {
                          if (!isReturnFull) openBooking('return');
                        }}
                      >
                        {isReturnFull ? 'الإياب ممتلئ' : 'حجز الإياب فقط'}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Round Trip CTA */}
                {isRoundTrip && (
                  <Button 
                    size="lg"
                    className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all bg-gradient-to-r from-primary to-blue-600 hover:from-primary hover:to-blue-500 text-sm md:text-lg flex items-center justify-center gap-2"
                    disabled={isOutboundFull || isReturnFull}
                    onClick={() => openBooking('round_trip')}
                  >
                    <ArrowLeftRight className="h-4 w-4 md:h-5 md:w-5" />
                    {(isOutboundFull || isReturnFull) ? 'لا يمكن حجز الذهاب والإياب معاً' : 'حجز الذهاب والإياب معاً'}
                  </Button>
                )}
                
              </div>
            </motion.div>
            
          </div>
        </div>

        {/* Booking Modal */}
        {trip && (
          <BookingModal 
            trip={trip}
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            initialTripType={selectedTripType}
            onSuccess={() => {
              BrowserDatabaseService.getTripById(id!).then(data => {
                if(data) {
                  setTrip(prev => ({...prev, availableSeats: data.availableSeats, return_available_seats: data.return_available_seats}));
                }
              });
            }}
          />
        )}
      </main>
    </div>
  );
};

export default TripDetails;
