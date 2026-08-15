import { useState, useMemo, useEffect, useRef } from 'react';
import { uploadReceipt } from '@/utils/receiptUpload';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { Clock, MapPin, Users, Banknote, Car, User, Phone, Upload, CheckCircle2, ArrowRight, Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import ProfileCompletionModal from '@/components/booking/ProfileCompletionModal';
import { validateProfileForBooking } from '@/utils/profileValidation';

interface BookingModalProps {
  trip: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTripType?: 'outbound' | 'return' | 'round_trip';
}

const BookingModal = ({ trip, isOpen, onClose, onSuccess, initialTripType }: BookingModalProps) => {
  const { user: supabaseUser, profile: authProfile } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal } = useDatabase();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  
  // Baridimob step state
  const [showBaridimobStep, setShowBaridimobStep] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = isLocal ? localUser : supabaseUser;
  const isAuthenticated = user && user.id;

  const isBusTrip = trip.isBusTrip || trip.totalSeats > 30 || (trip.vehicle && trip.vehicle.type === 'bus');

  const [bookingForm, setBookingForm] = useState({
    pickupLocation: trip.fromWilayaName || '',
    destinationLocation: trip.toWilayaName || '',
    fromKsar: trip.fromKsar || '',
    pickupPoint: '',
    destinationPoint: '',
    seatsBooked: '1',
    paymentMethod: 'cod',
    tripType: initialTripType || ((trip.returnDate || isBusTrip) ? 'round_trip' : 'outbound'),
    passengerType: 'family',
    specialRequests: ''
  });

  const navigate = useNavigate();
  const { getDatabaseService } = useDatabase();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isOpen || !isAuthenticated) return;
      try {
        if (isLocal) {
          const db = getDatabaseService();
          const localProfile = await db.getProfile(user.id);
          setProfile(localProfile);
        } else {
          if (authProfile) {
            setProfile(authProfile);
          } else {
            const userProfile = await BrowserDatabaseService.getProfile(user.id);
            setProfile(userProfile);
          }
        }
      } catch (error) {}
    };
    fetchProfile();
  }, [isOpen, isAuthenticated, user, isLocal, authProfile, getDatabaseService]);

  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      setShowLoginPrompt(true);
    } else if (isOpen && isAuthenticated && profile) {
      const validation = validateProfileForBooking(profile);
      if (!validation.isValid) {
        setMissingProfileFields(validation.missingFields);
        setShowProfileCompletionModal(true);
      }
    }
  }, [isOpen, isAuthenticated, profile]);

  const handleClose = () => {
    setShowLoginPrompt(false);
    setShowBaridimobStep(false);
    setReceiptImage(null);
    onClose();
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "حجم الصورة كبير جداً",
          description: "الرجاء اختيار صورة لا تتجاوز 5 ميغابايت",
          variant: "destructive"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current) return;
    
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    if (profile) {
      const validation = validateProfileForBooking(profile);
      if (!validation.isValid) {
        setMissingProfileFields(validation.missingFields);
        setShowProfileCompletionModal(true);
        toast({
          title: "معلومات الملف الشخصي ناقصة",
          description: validation.message,
          variant: "destructive"
        });
        return;
      }
    }

    // Handle Baridimob step transition
    if (bookingForm.paymentMethod === 'bpm' && !showBaridimobStep) {
      setShowBaridimobStep(true);
      return;
    }

    if (bookingForm.paymentMethod === 'bpm' && showBaridimobStep && !receiptImage) {
      toast({
        title: "وصل الدفع مطلوب",
        description: "يرجى إرفاق وصل الدفع الخاص ببريدي موب لإتمام الحجز",
        variant: "destructive"
      });
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const seatsCount = parseInt(bookingForm.seatsBooked);
      const tripType = bookingForm.tripType;
      
      let pricePerSeat = 0;
      if (tripType === 'outbound') {
        pricePerSeat = trip.pricePerSeat;
        if (seatsCount > trip.availableSeats) {
          throw new Error(`المقاعد المتاحة للذهاب فقط ${trip.availableSeats}`);
        }
      } else if (tripType === 'return') {
        pricePerSeat = trip.return_price_per_seat || trip.pricePerSeat;
        if (seatsCount > (trip.return_available_seats ?? trip.availableSeats)) {
          throw new Error(`المقاعد المتاحة للإياب فقط ${trip.return_available_seats ?? trip.availableSeats}`);
        }
      } else if (tripType === 'round_trip') {
        pricePerSeat = trip.pricePerSeat + (trip.return_price_per_seat || trip.pricePerSeat);
        if (seatsCount > trip.availableSeats || seatsCount > (trip.return_available_seats ?? trip.availableSeats)) {
          throw new Error('لا توجد مقاعد كافية لرحلة الذهاب والإياب معاً');
        }
      }
      
      const totalAmount = seatsCount * pricePerSeat;

      // If it's a bus, we don't ask the user for specific points. Just default to Wilaya names.
      const finalPickupPoint = isBusTrip ? 'محطة الحافلات' : bookingForm.pickupPoint;
      const finalDestPoint = isBusTrip ? 'محطة الحافلات' : bookingForm.destinationPoint;

      let uploadedReceiptUrl = receiptImage;
      if (receiptImage && receiptImage.startsWith('data:image')) {
        const url = await uploadReceipt(receiptImage, trip.id);
        if (url) uploadedReceiptUrl = url;
      }

      const booking = await BrowserDatabaseService.createBooking({
        passengerId: user.id,
        driverId: trip.driverId,
        tripId: trip.id,
        pickupLocation: bookingForm.pickupLocation,
        destinationLocation: bookingForm.destinationLocation,
        fromKsar: trip.fromWilayaId === 47 ? (bookingForm.fromKsar || trip.fromKsar || null) : null,
        pickupPoint: finalPickupPoint,
        destinationPoint: finalDestPoint,
        seatsBooked: seatsCount,
        passengerType: seatsCount > 1 ? bookingForm.passengerType : null,
        totalAmount,
        paymentMethod: bookingForm.paymentMethod as 'cod' | 'bpm',
        tripType: bookingForm.tripType,
        returnDate: trip.returnDate || undefined,
        returnTime: trip.returnTime || undefined,
        specialRequests: bookingForm.specialRequests,
        pickupTime: trip.departureTime, // Use default
        receiptUrl: uploadedReceiptUrl || undefined,
        status: 'pending'
      });

      toast({
        title: "تم إرسال طلب الحجز بنجاح",
        description: "سيتم إشعارك عند موافقة السائق على الحجز",
      });

      localStorage.setItem('booking_success', Date.now().toString());

      onSuccess();
      handleClose();
      
      navigate(`/booking-success?bookingId=${booking.id}`);
    } catch (error: any) {
      toast({
        title: "خطأ في إرسال الحجز",
        description: error.message || "حدث خطأ أثناء إرسال طلب الحجز",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return <LoginPromptModal isOpen={showLoginPrompt} onClose={() => { setShowLoginPrompt(false); onClose(); }} title="تسجيل الدخول مطلوب للحجز" description="لإكمال عملية حجز المقعد، يرجى تسجيل الدخول أو إنشاء حساب جديد" />;
  }

  if (showProfileCompletionModal) {
    return <ProfileCompletionModal isOpen={showProfileCompletionModal} onClose={() => { setShowProfileCompletionModal(false); onClose(); }} missingFields={missingProfileFields} />;
  }

  // Calculate costs
  const seats = parseInt(bookingForm.seatsBooked || '1');
  const isRound = bookingForm.tripType === 'round_trip';
  const totalCost = seats * trip.pricePerSeat * (isRound ? 2 : 1);

  // Baridimob system RIP placeholder (or can be fetched from DB)
  const systemRip = "00799999002135647891"; 

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-24 md:pb-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl max-h-[85dvh] md:max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-2xl">
        <CardHeader className="text-center pb-2 border-b">
          <CardTitle className="text-2xl font-bold text-foreground font-cairo">حجز مقعد في الرحلة</CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {!showBaridimobStep ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Modern Trip Details Header */}
              <div className="bg-[#eefcf4] dark:bg-emerald-950/20 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xl font-bold text-emerald-900 dark:text-emerald-300">
                      <MapPin className="h-5 w-5 flex-shrink-0" />
                      <span>{trip.fromWilayaName}</span>
                      <span className="text-emerald-600/50">←</span>
                      <span>{trip.toWilayaName}</span>
                    </div>
                    {trip.fromWilayaId === 47 && trip.fromKsar && (
                      <div className="text-sm text-emerald-700/80 font-medium px-7">
                        الانطلاق من: {trip.fromKsar}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-800 dark:text-emerald-400">
                      {trip.pricePerSeat} <span className="text-sm font-medium">دج للمقعد</span>
                    </div>
                    <div className="text-sm text-emerald-700/70 font-medium flex items-center justify-end gap-1 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>{trip.departureDate} في {trip.departureTime}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-emerald-200/50 flex flex-wrap items-center justify-between gap-4 text-sm text-emerald-800 dark:text-emerald-200">
                  <div className="flex items-center gap-1.5 font-medium bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-full">
                    <Users className="w-4 h-4" />
                    <span>{trip.availableSeats} مقعد متاح</span>
                  </div>
                  {trip.vehicle && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Car className="w-4 h-4" />
                      <span>{trip.vehicle.make} {trip.vehicle.model}</span>
                    </div>
                  )}
                  {trip.driver && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <User className="w-4 h-4" />
                      <span>السائق: {trip.driver.fullName}</span>
                      <span className="opacity-50 ml-1">|</span>
                      <Phone className="w-3 h-3 ml-1" />
                      <span dir="ltr">{trip.driver.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Show Wilaya Route Info */}
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 flex items-center gap-2">
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">الولاية:</span>
                <span className="font-bold text-amber-900 dark:text-amber-100">{bookingForm.pickupLocation}</span>
                <span className="text-amber-600/50">←</span>
                <span className="font-bold text-amber-900 dark:text-amber-100">{bookingForm.destinationLocation}</span>
              </div>

              {/* Dynamic Pick-up & Drop-off Points */}
              {!isBusTrip && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">النقطة المحددة للانطلاق *</Label>
                    <Input
                      value={bookingForm.pickupPoint}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, pickupPoint: e.target.value }))}
                      placeholder="مثال: محطة الحافلات، ساحة الاستقلال"
                      className="h-11 bg-muted/30 focus:bg-background transition-colors"
                      required
                    />
                    <p className="text-xs text-muted-foreground">أدخل المكان المحدد داخل {bookingForm.pickupLocation}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">النقطة المحددة للوصول *</Label>
                    <Input
                      value={bookingForm.destinationPoint}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, destinationPoint: e.target.value }))}
                      placeholder="مثال: محطة الحافلات، وسط المدينة"
                      className="h-11 bg-muted/30 focus:bg-background transition-colors"
                      required
                    />
                    <p className="text-xs text-muted-foreground">أدخل المكان المحدد داخل {bookingForm.destinationLocation}</p>
                  </div>
                </div>
              )}

              {/* Trip Type Selector */}
              {!initialTripType && (trip.returnDate || isBusTrip) && (
                <div className="space-y-3">
                  <Label className="font-bold text-sm">نوع الحجز المطلوب *</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingForm(prev => ({ ...prev, tripType: 'round_trip' }))}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                        bookingForm.tripType === 'round_trip'
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-md transform scale-[1.02]'
                          : 'border-muted bg-muted/20 text-foreground hover:bg-muted/50 hover:border-emerald-300'
                      }`}
                    >
                      <span className="font-bold text-sm">🔄 ذهاب وإياب</span>
                      <span className={`text-[11px] ${bookingForm.tripType === 'round_trip' ? 'text-emerald-100' : 'text-muted-foreground'}`}>الرحلتين معاً</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingForm(prev => ({ ...prev, tripType: 'outbound' }))}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                        bookingForm.tripType === 'outbound'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md transform scale-[1.02]'
                          : 'border-muted bg-muted/20 text-foreground hover:bg-muted/50 hover:border-blue-300'
                      }`}
                    >
                      <span className="font-bold text-sm">➡️ ذهاب فقط</span>
                      <span className={`text-[11px] ${bookingForm.tripType === 'outbound' ? 'text-blue-100' : 'text-muted-foreground'}`}>رحلة الذهاب</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingForm(prev => ({ ...prev, tripType: 'return' }))}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                        bookingForm.tripType === 'return'
                          ? 'border-purple-600 bg-purple-600 text-white shadow-md transform scale-[1.02]'
                          : 'border-muted bg-muted/20 text-foreground hover:bg-muted/50 hover:border-purple-300'
                      }`}
                    >
                      <span className="font-bold text-sm">⬅️ عودة فقط</span>
                      <span className={`text-[11px] ${bookingForm.tripType === 'return' ? 'text-purple-100' : 'text-muted-foreground'}`}>رحلة العودة</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="font-bold text-sm">عدد المقاعد *</Label>
                  <Select value={bookingForm.seatsBooked} onValueChange={(v) => setBookingForm(prev => ({ ...prev, seatsBooked: v }))}>
                    <SelectTrigger className="h-11 bg-muted/30">
                      <SelectValue placeholder="اختر عدد المقاعد" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: Math.min(trip.availableSeats || 50, isBusTrip ? 49 : 4) }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1} {i === 0 ? 'مقعد' : 'مقاعد'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {parseInt(bookingForm.seatsBooked) > 1 && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <Label className="font-bold text-sm">نوع المجموعة *</Label>
                    <Select value={bookingForm.passengerType} onValueChange={(v) => setBookingForm(prev => ({ ...prev, passengerType: v }))}>
                      <SelectTrigger className="h-11 bg-muted/30">
                        <SelectValue placeholder="اختر نوع المجموعة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family">عائلة</SelectItem>
                        <SelectItem value="youth">شباب</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="font-bold text-sm">طريقة الدفع *</Label>
                  <Select value={bookingForm.paymentMethod} onValueChange={(v) => setBookingForm(prev => ({ ...prev, paymentMethod: v }))}>
                    <SelectTrigger className="h-11 bg-muted/30">
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">الدفع عند محل لينداتكس 16</SelectItem>
                      <SelectItem value="bpm">بريدي موب (BaridiMob)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

                {bookingForm.paymentMethod === 'cod' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900 text-sm space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">موقع الدفع (محل لينداتكس 16)</p>
                        <p className="text-blue-700 mt-1 leading-relaxed">
                          يرجى التوجه إلى محل لينداتكس 16 لدفع مبلغ الحجز وتأكيده.
                        </p>
                      </div>
                    </div>
                    <a 
                      href="https://maps.app.goo.gl/RG5mehQkYjbbjS4W7" 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors px-3 py-2 rounded-lg font-semibold mt-2 w-full justify-center"
                    >
                      فتح الموقع على خرائط جوجل <MapPin className="w-4 h-4" />
                    </a>
                  </div>
                )}

              <div className="space-y-2">
                <Label className="font-bold text-sm">طلبات خاصة (اختياري)</Label>
                <Textarea
                  value={bookingForm.specialRequests}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="أي طلبات خاصة للرحلة"
                  className="bg-muted/30 focus:bg-background resize-none min-h-[80px]"
                />
              </div>

              {/* Total Cost Breakdown */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-emerald-900 dark:text-emerald-100 text-lg">إجمالي التكلفة</div>
                  <div className="text-sm font-medium text-emerald-700/80 dark:text-emerald-400/80">
                    {seats} مقعد × {trip.pricePerSeat} دج {isRound ? '× 2 رحلات' : ''}
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {totalCost} <span className="text-base font-bold text-emerald-600/70">دج</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="w-1/3 h-12 font-bold rounded-xl text-muted-foreground">
                  إلغاء
                </Button>
                <Button type="submit" disabled={loading} className="w-2/3 h-12 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg shadow-lg hover:shadow-emerald-600/25 transition-all">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> جاري المعالجة...
                    </span>
                  ) : bookingForm.paymentMethod === 'bpm' ? (
                    <span className="flex items-center justify-center gap-2">
                      متابعة الدفع <ArrowRight className="w-5 h-5 rotate-180" />
                    </span>
                  ) : "تأكيد الحجز"}
                </Button>
              </div>

            </form>
          ) : (
            /* Baridimob Upload Step */
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <Banknote className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-cairo">الدفع عبر بريدي موب</h3>
                <p className="text-muted-foreground text-sm">
                  يرجى تحويل مبلغ <span className="font-bold text-emerald-600">{totalCost} دج</span> إلى الحساب التالي، ثم إرفاق صورة لوصل الدفع.
                </p>
              </div>

              <div className="bg-muted/30 p-5 rounded-2xl border-2 border-dashed text-center">
                <div className="text-sm text-muted-foreground font-medium mb-2">رقم الـ RIP:</div>
                <div 
                  className="flex items-center justify-center gap-3 bg-background p-3 rounded-xl border cursor-pointer hover:bg-secondary/50 transition-colors mx-auto w-fit"
                  onClick={() => {
                    navigator.clipboard.writeText(systemRip);
                    toast({
                      title: "تم النسخ",
                      description: "تم نسخ رقم بريدي موب بنجاح",
                    });
                  }}
                  title="نسخ الرقم"
                >
                  <div className="text-xl md:text-2xl font-black tracking-[0.15em] text-foreground font-mono select-all" dir="ltr">{systemRip}</div>
                  <Copy className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium text-muted-foreground mt-3">منصة أبريد</div>
              </div>

              <div className="space-y-3">
                <Label className="font-bold text-sm">إرفاق صورة الوصل *</Label>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                    receiptImage 
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' 
                      : 'border-muted hover:border-emerald-400 hover:bg-muted/30'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleReceiptUpload}
                  />
                  
                  {receiptImage ? (
                    <>
                      <div className="absolute inset-0 p-2">
                        <div 
                          className="w-full h-full rounded-xl bg-cover bg-center opacity-40 blur-[2px]"
                          style={{ backgroundImage: `url(${receiptImage})` }}
                        />
                      </div>
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 relative z-10" />
                      <div className="font-bold text-emerald-700 dark:text-emerald-300 relative z-10">تم إرفاق الوصل بنجاح</div>
                      <Button variant="link" className="relative z-10 text-xs" onClick={(e) => { e.stopPropagation(); setReceiptImage(null); }}>
                        تغيير الصورة
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-foreground">انقر لرفع صورة الوصل</div>
                        <div className="text-xs text-muted-foreground mt-1">يدعم JPG, PNG (أقل من 5 ميغابايت)</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowBaridimobStep(false)} 
                  disabled={loading} 
                  className="w-1/3 h-12 font-bold rounded-xl text-muted-foreground"
                >
                  رجوع
                </Button>
                <Button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !receiptImage} 
                  className="w-2/3 h-12 font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-lg shadow-lg transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> جاري الإرسال...
                    </span>
                  ) : "تم الإرسال، احجز"}
                </Button>
              </div>

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const BookingModalWithAuth = memo(BookingModal);

export { LoginPromptModal };
export default BookingModalWithAuth;
