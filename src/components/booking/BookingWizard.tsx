import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Car,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  CheckCircle,
  User,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { wilayas } from "@/data/wilayas";
import RatingStars from "@/components/RatingStars";
import { useAuth } from "@/hooks/useAuth";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useDatabase } from "@/hooks/useDatabase";
import LoginPromptModal from "@/components/auth/LoginPromptModal";

interface BookingStep {
  id: number;
  title: string;
  description: string;
}

interface Driver {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  vehicle: string;
  price: number;
  estimatedTime: string;
  avatar: string;
  verified: boolean;
}

const BookingWizard = () => {
  const { user: supabaseUser } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal } = useDatabase();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Use local user if using local database, otherwise use Supabase user
  const user = isLocal ? localUser : supabaseUser;
  const isAuthenticated = user && user.id;

  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
    passengers: "1",
    selectedDriver: null as Driver | null,
    paymentMethod: "",
    specialRequests: "",
    pickupPoint: "",
    destinationPoint: ""
  });

  const steps: BookingStep[] = [
    { id: 1, title: "تفاصيل الرحلة", description: "اختر وجهتك ووقت السفر" },
    { id: 2, title: "اختيار السائق", description: "اختر السائق المناسب لك" },
    { id: 3, title: "الدفع", description: "اختر طريقة الدفع" },
    { id: 4, title: "التأكيد", description: "راجع وأكد حجزك" }
  ];

  const mockDrivers: Driver[] = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "أحمد محمد",
      rating: 4.9,
      reviews: 156,
      vehicle: "Toyota Corolla 2020 - أبيض",
      price: 2500,
      estimatedTime: "5 دقائق",
      avatar: "/placeholder.svg",
      verified: true
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002", 
      name: "فاطمة بن علي",
      rating: 4.8,
      reviews: 203,
      vehicle: "Hyundai Accent 2019 - أزرق",
      price: 2300,
      estimatedTime: "8 دقائق",
      avatar: "/placeholder.svg",
      verified: true
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      name: "يوسف كريم",
      rating: 4.7,
      reviews: 89,
      vehicle: "Renault Symbol 2021 - رمادي",
      price: 2700,
      estimatedTime: "12 دقيقة",
      avatar: "/placeholder.svg",
      verified: false
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookingSubmit = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    // Here you would typically send the booking data to your backend
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from">من (الولاية)</Label>
                <Select value={bookingData.from} onValueChange={(value) => 
                  setBookingData(prev => ({ ...prev, from: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نقطة الانطلاق" />
                  </SelectTrigger>
                  <SelectContent>
                    {wilayas.map((wilaya) => (
                      <SelectItem key={wilaya.code} value={wilaya.code}>
                        {wilaya.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label htmlFor="pickupPoint" className="text-xs text-muted-foreground">النقطة المحددة (اختياري)</Label>
                <Input
                  id="pickupPoint"
                  placeholder="مثال: محطة الحافلات، ساحة الاستقلال"
                  value={bookingData.pickupPoint}
                  onChange={(e) => setBookingData(prev => ({ ...prev, pickupPoint: e.target.value }))}
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="to">إلى (الولاية)</Label>
                <Select value={bookingData.to} onValueChange={(value) => 
                  setBookingData(prev => ({ ...prev, to: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الوجهة" />
                  </SelectTrigger>
                  <SelectContent>
                    {wilayas.map((wilaya) => (
                      <SelectItem key={wilaya.code} value={wilaya.code}>
                        {wilaya.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label htmlFor="destinationPoint" className="text-xs text-muted-foreground">النقطة المحددة (اختياري)</Label>
                <Input
                  id="destinationPoint"
                  placeholder="مثال: محطة الحافلات، ساحة الاستقلال"
                  value={bookingData.destinationPoint}
                  onChange={(e) => setBookingData(prev => ({ ...prev, destinationPoint: e.target.value }))}
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">التاريخ</Label>
                <Input
                  id="date"
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">الوقت</Label>
                <Input
                  id="time"
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="passengers">عدد الركاب</Label>
                <Select value={bookingData.passengers} onValueChange={(value) => 
                  setBookingData(prev => ({ ...prev, passengers: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 راكب</SelectItem>
                    <SelectItem value="2">2 راكب</SelectItem>
                    <SelectItem value="3">3 راكب</SelectItem>
                    <SelectItem value="4">4 راكب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">السائقون المتاحون</h3>
              <p className="text-muted-foreground">اختر السائق المناسب لرحلتك</p>
            </div>
            
            <div className="grid gap-4">
              {mockDrivers.map((driver) => (
                <Card 
                  key={driver.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    bookingData.selectedDriver?.id === driver.id && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => setBookingData(prev => ({ ...prev, selectedDriver: driver }))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={driver.avatar} />
                          <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{driver.name}</h4>
                            {driver.verified && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                موثق
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <RatingStars rating={driver.rating} />
                            <span className="font-medium">{driver.rating.toFixed(1)}</span>
                            <span>({driver.reviews} تقييم)</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{driver.vehicle}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{driver.price} DA</div>
                        <div className="text-sm text-muted-foreground">{driver.estimatedTime}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">اختر طريقة الدفع</h3>
              <p className="text-muted-foreground">كيف تريد دفع ثمن الرحلة؟</p>
            </div>
            
            <div className="grid gap-4">
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  bookingData.paymentMethod === "baridimob" && "ring-2 ring-primary bg-primary/5"
                )}
                onClick={() => setBookingData(prev => ({ ...prev, paymentMethod: "baridimob" }))}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <div>
                      <h4 className="font-semibold">بريدي موب</h4>
                      <p className="text-sm text-muted-foreground">ادفع بأمان عبر بريدي موب</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  bookingData.paymentMethod === "cash" && "ring-2 ring-primary bg-primary/5"
                )}
                onClick={() => setBookingData(prev => ({ ...prev, paymentMethod: "cash" }))}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-secondary" />
                    <div>
                      <h4 className="font-semibold">الدفع نقداً</h4>
                      <p className="text-sm text-muted-foreground">ادفع للسائق عند الوصول</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requests">طلبات خاصة (اختياري)</Label>
              <Input
                id="requests"
                placeholder="أي طلبات أو ملاحظات خاصة..."
                value={bookingData.specialRequests}
                onChange={(e) => setBookingData(prev => ({ ...prev, specialRequests: e.target.value }))}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">راجع تفاصيل حجزك</h3>
              <p className="text-muted-foreground">تأكد من صحة المعلومات قبل التأكيد</p>
            </div>
            
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{bookingData.from}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span>{bookingData.to}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{bookingData.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{bookingData.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{bookingData.passengers} راكب</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>{bookingData.paymentMethod === "baridimob" ? "بريدي موب" : "نقداً"}</span>
                  </div>
                </div>
                
                {bookingData.selectedDriver && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={bookingData.selectedDriver.avatar} />
                          <AvatarFallback>{bookingData.selectedDriver.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{bookingData.selectedDriver.name}</h4>
                          <p className="text-sm text-muted-foreground">{bookingData.selectedDriver.vehicle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{bookingData.selectedDriver.price} DA</div>
                        <div className="flex items-center gap-1">
                          <RatingStars rating={bookingData.selectedDriver.rating} iconClassName="h-3 w-3" />
                          <span className="text-sm font-medium">{bookingData.selectedDriver.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  currentStep >= step.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-4 transition-all",
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-center">
            {steps[currentStep - 1]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          السابق
        </Button>
        
        {currentStep < steps.length ? (
          <Button
            onClick={nextStep}
            disabled={
              (currentStep === 1 && (!bookingData.from || !bookingData.to || !bookingData.date || !bookingData.time)) ||
              (currentStep === 2 && !bookingData.selectedDriver) ||
              (currentStep === 3 && !bookingData.paymentMethod)
            }
            className="flex items-center gap-2"
          >
            التالي
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleBookingSubmit}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            تأكيد الحجز
          </Button>
        )}
      </div>
    </div>

    {/* Login Prompt Modal for unauthenticated users */}
    <LoginPromptModal
      isOpen={showLoginPrompt}
      onClose={() => setShowLoginPrompt(false)}
      title="تسجيل الدخول مطلوب للحجز"
      description="لإكمال عملية الحجز، يرجى تسجيل الدخول أو إنشاء حساب جديد"
    />
  );
};

export default BookingWizard;