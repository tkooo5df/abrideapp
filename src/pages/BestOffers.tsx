import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Star,
  Car,
  Filter,
  ArrowUpDown,
  Heart,
  Phone,
  MessageCircle,
  Navigation,
  Zap,
  Shield,
  Award,
  TrendingUp,
  Search
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { wilayas, getWilayaByCode } from "@/data/wilayas";
import { useDatabase } from "@/hooks/useDatabase";
import { useAuth } from "@/hooks/useAuth";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import LoginPromptModal from "@/components/auth/LoginPromptModal";

interface TripOffer {
  id: string;
  driver: {
    name: string;
    rating: number;
    reviews: number;
    avatar: string;
    verified: boolean;
    experience: string;
  };
  vehicle: {
    brand: string;
    model: string;
    year: string;
    color: string;
    category: "economy" | "comfort" | "premium";
    seats: number;
    features: string[];
  };
  route: {
    from: string;
    to: string;
    distance: string;
    duration: string;
  };
  schedule: {
    date: string;
    time: string;
    flexibility: string;
  };
  pricing: {
    price: number;
    originalPrice?: number;
    discount?: number;
    pricePerSeat: number;
  };
  availability: {
    totalSeats: number;
    availableSeats: number;
    bookedSeats: number;
  };
  features: string[];
  tags: string[];
  isPromoted: boolean;
  isFavorite: boolean;
}

const BestOffers = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<TripOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<TripOffer[]>([]);
  const [sortBy, setSortBy] = useState("price");
  const [filterBy, setFilterBy] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const pickup = searchParams.get("pickup") || "";
  const destination = searchParams.get("destination") || "";
  const date = searchParams.get("date") || "";
  const passengers = searchParams.get("passengers") || "1";

  // Get database service
  const { getDatabaseService } = useDatabase();

  // Check authentication
  const { user: supabaseUser } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal } = useDatabase();
  const user = isLocal ? localUser : supabaseUser;
  const isAuthenticated = user && user.id;

  // Immediately redirect legacy /best-offers route to the real results page
  useEffect(() => {
    navigate(`/ride-search?${searchParams.toString()}` , { replace: true });
  }, [navigate, searchParams]);

  return null;

  // Mock data for demonstration
  const mockOffers: TripOffer[] = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      driver: {
        name: "أحمد محمد",
        rating: 4.9,
        reviews: 156,
        avatar: "/placeholder.svg",
        verified: true,
        experience: "5 سنوات"
      },
      vehicle: {
        brand: "Toyota",
        model: "Corolla",
        year: "2022",
        color: "أبيض",
        category: "comfort",
        seats: 4,
        features: ["مكيف", "موسيقى", "شاحن USB"]
      },
      route: {
        from: pickup,
        to: destination,
        distance: "320 كم",
        duration: "4 ساعات"
      },
      schedule: {
        date: date,
        time: "08:00",
        flexibility: "مرن ±30 دقيقة"
      },
      pricing: {
        price: 2200,
        originalPrice: 2500,
        discount: 12,
        pricePerSeat: 550
      },
      availability: {
        totalSeats: 4,
        availableSeats: 2,
        bookedSeats: 2
      },
      features: ["واي فاي مجاني", "مقاعد مريحة", "رحلة مباشرة"],
      tags: ["الأكثر حجزاً", "سائق محترف"],
      isPromoted: true,
      isFavorite: false
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      driver: {
        name: "فاطمة بن علي",
        rating: 4.8,
        reviews: 203,
        avatar: "/placeholder.svg",
        verified: true,
        experience: "3 سنوات"
      },
      vehicle: {
        brand: "Hyundai",
        model: "Accent",
        year: "2021",
        color: "أزرق",
        category: "economy",
        seats: 4,
        features: ["مكيف", "راديو"]
      },
      route: {
        from: pickup,
        to: destination,
        distance: "320 كم",
        duration: "4.5 ساعات"
      },
      schedule: {
        date: date,
        time: "09:30",
        flexibility: "وقت محدد"
      },
      pricing: {
        price: 1800,
        pricePerSeat: 450
      },
      availability: {
        totalSeats: 4,
        availableSeats: 3,
        bookedSeats: 1
      },
      features: ["اقتصادي", "موثوق"],
      tags: ["أفضل سعر"],
      isPromoted: false,
      isFavorite: true
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      driver: {
        name: "يوسف كريم",
        rating: 4.7,
        reviews: 89,
        avatar: "/placeholder.svg",
        verified: false,
        experience: "2 سنة"
      },
      vehicle: {
        brand: "Renault",
        model: "Symbol",
        year: "2020",
        color: "رمادي",
        category: "premium",
        seats: 4,
        features: ["مكيف", "مقاعد جلدية", "نظام ملاحة"]
      },
      route: {
        from: pickup,
        to: destination,
        distance: "320 كم",
        duration: "3.5 ساعات"
      },
      schedule: {
        date: date,
        time: "14:00",
        flexibility: "مرن ±15 دقيقة"
      },
      pricing: {
        price: 2800,
        pricePerSeat: 700
      },
      availability: {
        totalSeats: 4,
        availableSeats: 1,
        bookedSeats: 3
      },
      features: ["رحلة سريعة", "راحة فائقة", "خدمة VIP"],
      tags: ["الأسرع"],
      isPromoted: false,
      isFavorite: false
    }
  ];

  useEffect(() => {
    // Fetch real trips from database
    const fetchRealTrips = async () => {
      try {
        const dbService = getDatabaseService();
        
        // Use the database service to get trips
        // Since the Supabase schema doesn't have trips table, we'll need to work with what we have
        // For now, we'll just use mock data as a fallback
        const tripsData = []; // We can't fetch real trips because the Supabase schema is incomplete
        const error = null;
        
        if (error) {
          // Fallback to mock data
          setOffers(mockOffers);
          setFilteredOffers(mockOffers);
        } else {
          // Since we can't fetch real trips, we'll just use mock data
          setOffers(mockOffers);
          setFilteredOffers(mockOffers);
        }
      } catch (error) {
        // Fallback to mock data
        setOffers(mockOffers);
        setFilteredOffers(mockOffers);
      } finally {
        setLoading(false);
      }
    };

    fetchRealTrips();
  }, []);

  useEffect(() => {
    let filtered = [...offers];

    // Apply filters
    if (filterBy !== "all") {
      filtered = filtered.filter(offer => offer.vehicle.category === filterBy);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.pricing.price - b.pricing.price;
        case "rating":
          return b.driver.rating - a.driver.rating;
        case "time":
          return a.schedule.time.localeCompare(b.schedule.time);
        default:
          return 0;
      }
    });

    setFilteredOffers(filtered);
  }, [offers, sortBy, filterBy]);

  const getCategoryBadge = (category: string) => {
    const categories = {
      economy: { label: "اقتصادي", color: "bg-green-100 text-green-800" },
      comfort: { label: "مريح", color: "bg-blue-100 text-blue-800" },
      premium: { label: "فاخر", color: "bg-purple-100 text-purple-800" }
    };
    return categories[category as keyof typeof categories] || categories.economy;
  };

  const handleBooking = (offerId: string) => {
    // Check if user is authenticated first
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      navigate(`/booking-form?pickup=${pickup}&destination=${destination}&driverName=${offer.driver.name}&driverCar=${offer.vehicle.brand} ${offer.vehicle.model}&driverId=${offerId}&price=${offer.pricing.price}&date=${date}&passengers=${passengers}`);
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
              <p className="text-muted-foreground">جاري البحث عن أفضل العروض...</p>
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
      
      <main className="container mx-auto px-4 py-8">
        {/* Search Summary */}
        <div className="bg-gradient-primary rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">أفضل العروض المتاحة</h1>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{getWilayaByCode(pickup)?.name || pickup}</span>
                  <span>→</span>
                  <span>{getWilayaByCode(destination)?.name || destination}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{passengers} راكب</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/80">وجدنا</div>
              <div className="text-2xl font-bold">{filteredOffers.length} عرض</div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">السعر (الأقل أولاً)</SelectItem>
                <SelectItem value="rating">التقييم (الأعلى أولاً)</SelectItem>
                <SelectItem value="time">الوقت</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="تصفية حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                <SelectItem value="economy">اقتصادي</SelectItem>
                <SelectItem value="comfort">مريح</SelectItem>
                <SelectItem value="premium">فاخر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {filteredOffers.length} من {offers.length} عرض
            </span>
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid gap-6">
          {filteredOffers.map((offer) => {
            const categoryInfo = getCategoryBadge(offer.vehicle.category);
            
            return (
              <Card key={offer.id} className={`hover:shadow-xl transition-all duration-300 ${offer.isPromoted ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
                <CardContent className="p-6">
                  {/* Promoted Badge */}
                  {offer.isPromoted && (
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-gradient-primary text-white">
                        <Zap className="h-3 w-3 mr-1" />
                        عرض مميز
                      </Badge>
                      {offer.pricing.discount && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          خصم {offer.pricing.discount}%
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="grid lg:grid-cols-4 gap-6">
                    {/* Driver Info */}
                    <div className="lg:col-span-1">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={offer.driver.avatar} />
                          <AvatarFallback>{offer.driver.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{offer.driver.name}</h3>
                            {offer.driver.verified && (
                              <Shield className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{offer.driver.rating}</span>
                            <span className="text-xs text-muted-foreground">({offer.driver.reviews})</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{offer.driver.experience} خبرة</p>
                        </div>
                      </div>

                      {/* Vehicle Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{offer.vehicle.brand} {offer.vehicle.model}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
                          <span className="text-xs text-muted-foreground">{offer.vehicle.year} • {offer.vehicle.color}</span>
                        </div>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="lg:col-span-2">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">تفاصيل الرحلة</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{offer.schedule.time}</span>
                              <span className="text-muted-foreground">({offer.schedule.flexibility})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Navigation className="h-4 w-4 text-muted-foreground" />
                              <span>{offer.route.distance} • {offer.route.duration}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{offer.availability.availableSeats} مقاعد متاحة من {offer.availability.totalSeats}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">المميزات</h4>
                          <div className="flex flex-wrap gap-1">
                            {offer.features.slice(0, 3).map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {offer.features.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{offer.features.length - 3} المزيد
                              </Badge>
                            )}
                          </div>
                          
                          {offer.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {offer.tags.map((tag, index) => (
                                <Badge key={index} className="text-xs bg-secondary/20 text-secondary-foreground">
                                  <Award className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pricing and Actions */}
                    <div className="lg:col-span-1 relative">
                      <div className="text-right mb-4">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          {offer.pricing.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              {offer.pricing.originalPrice} دج
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {offer.pricing.pricePerSeat} دج للمقعد الواحد
                        </p>
                      </div>

                      {/* Available seats in frame */}
                      <div className="absolute -top-2 left-0 bg-white border-2 border-primary rounded-lg w-8 h-8 flex items-center justify-center shadow-md">
                        <span className="text-sm font-bold text-primary">{offer.availability.availableSeats}</span>
                      </div>

                      <div className="space-y-2 pt-8">
                        <Button 
                          className="w-full"
                          onClick={() => handleBooking(offer.id)}
                        >
                          احجز الآن
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-1" />
                            اتصال
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            رسالة
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {filteredOffers.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد عروض متاحة</h3>
            <p className="text-muted-foreground mb-4">
              جرب تغيير معايير البحث أو التاريخ
            </p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              العودة للبحث
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

      <Footer />
    </div>
  );
};

export default BestOffers;