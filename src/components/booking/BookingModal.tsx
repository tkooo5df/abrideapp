import { useState, useMemo, useEffect } from 'react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { Clock, MapPin, Users, Banknote, Car, User, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import ProfileCompletionModal from '@/components/booking/ProfileCompletionModal';
import { validateProfileForBooking, type ProfileValidationResult } from '@/utils/profileValidation';

interface BookingModalProps {
  trip: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BookingModal = ({ trip, isOpen, onClose, onSuccess }: BookingModalProps) => {
  const { user: supabaseUser, profile: authProfile } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal } = useDatabase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);

  // Use local user if using local database, otherwise use Supabase user
  const user = isLocal ? localUser : supabaseUser;

  // Check if user is authenticated
  const isAuthenticated = user && user.id;
  const [bookingForm, setBookingForm] = useState({
    pickupLocation: trip.fromWilayaName || '',  // Auto-fill from trip (الولاية)
    destinationLocation: trip.toWilayaName || '',  // Auto-fill from trip (الولاية)
    fromKsar: (trip as any).fromKsar || '',  // القصر للانطلاق
    pickupPoint: '',  // النقطة المحددة للانطلاق
    destinationPoint: '',  // النقطة المحددة للوصول
    seatsBooked: '1',
    paymentMethod: 'cod',
    notes: '',
    pickupTime: trip.departureTime,
    specialRequests: ''
  });
  const navigate = useNavigate();

  // Get database service
  const { getDatabaseService } = useDatabase();

  // Fetch user profile when modal opens and user is authenticated
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isOpen || !isAuthenticated) return;

      try {
        if (isLocal) {
          // For local database, get profile from local service
          const db = getDatabaseService();
          const localProfile = await db.getProfile(user.id);
          setProfile(localProfile);
        } else {
          // For Supabase, use authProfile or fetch it
          if (authProfile) {
            setProfile(authProfile);
          } else {
            const userProfile = await BrowserDatabaseService.getProfile(user.id);
            setProfile(userProfile);
          }
        }
      } catch (error) {
        // Error fetching profile - silently fail
      }
    };

    fetchProfile();
  }, [isOpen, isAuthenticated, user, isLocal, authProfile, getDatabaseService]);

  // Check authentication and profile completion when modal opens
  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      setShowLoginPrompt(true);
    } else if (isOpen && isAuthenticated && profile) {
      // Validate profile for booking
      const validation = validateProfileForBooking(profile);
      if (!validation.isValid) {
        setMissingProfileFields(validation.missingFields);
        setShowProfileCompletionModal(true);
      }
    }
  }, [isOpen, isAuthenticated, profile]);

  const handleClose = () => {
    setShowLoginPrompt(false);
    onClose();
  };

  const handleLoginPromptClose = () => {
    setShowLoginPrompt(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    // Validate profile before allowing booking
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
    } else {
      // Profile not loaded yet, try to fetch it
      try {
        const userProfile = isLocal 
          ? await getDatabaseService().getProfile(user.id)
          : await BrowserDatabaseService.getProfile(user.id);
        
        if (userProfile) {
          setProfile(userProfile);
          const validation = validateProfileForBooking(userProfile);
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
        } else {
          toast({
            title: "خطأ",
            description: "لم يتم العثور على الملف الشخصي. يرجى إكمال بياناتك أولاً.",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء التحقق من الملف الشخصي.",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);

    try {
      const seatsCount = parseInt(bookingForm.seatsBooked);
      const totalAmount = seatsCount * trip.pricePerSeat;

      // Check if enough seats are available
      if (seatsCount > trip.availableSeats) {
        throw new Error(`المقاعد المتاحة فقط ${trip.availableSeats}`);
      }

      // Create the booking
      const booking = await BrowserDatabaseService.createBooking({
        passengerId: user.id,
        driverId: trip.driverId,
        tripId: trip.id,
        pickupLocation: bookingForm.pickupLocation,  // الولاية
        destinationLocation: bookingForm.destinationLocation,  // الولاية
        fromKsar: trip.fromWilayaId === 47 ? (bookingForm.fromKsar || (trip as any).fromKsar || null) : null,  // القصر
        pickupPoint: bookingForm.pickupPoint,  // النقطة المحددة
        destinationPoint: bookingForm.destinationPoint,  // النقطة المحددة
        seatsBooked: seatsCount,
        totalAmount,
        paymentMethod: bookingForm.paymentMethod as 'cod' | 'bpm',
        notes: bookingForm.notes,
        pickupTime: bookingForm.pickupTime,
        specialRequests: bookingForm.specialRequests,
        status: 'pending'
      });

      // Update trip availability immediately to reserve seats upon booking
      await BrowserDatabaseService.updateTripAvailability(trip.id);

      // الإشعارات تُرسل تلقائياً من browserServices.ts في createBooking
      // لا حاجة لإرسالها مرة أخرى هنا

      toast({
        title: "تم إرسال طلب الحجز بنجاح",
        description: "سيتم إشعارك عند موافقة السائق على الحجز",
      });

      // Store booking success flag to trigger data refresh in other components
      localStorage.setItem('booking_success', Date.now().toString());

      onSuccess();
      onClose();
      
      // Navigate to success page
      navigate(`/booking-success?bookingId=${booking.id}`);
    } catch (error: any) {
      toast({
        title: "خطأ في إرسال الحجز",
        description: error.message || "حدث خطأ أثناء إرسال طلب الحجز",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // If user is not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <>
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={handleLoginPromptClose}
        title="تسجيل الدخول مطلوب للحجز"
        description="لإكمال عملية حجز المقعد، يرجى تسجيل الدخول أو إنشاء حساب جديد"
      />
      </>
    );
  }

  // Show profile completion modal if profile is incomplete
  if (showProfileCompletionModal) {
    return (
      <>
        <ProfileCompletionModal
          isOpen={showProfileCompletionModal}
          onClose={() => {
            setShowProfileCompletionModal(false);
            onClose();
          }}
          missingFields={missingProfileFields}
        />
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-center text-xl">حجز مقعد في الرحلة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trip Details */}
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-lg font-medium">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="truncate">
                {trip.fromWilayaName}
                {trip.fromWilayaId === 47 && trip.fromKsar && (
                  <span className="text-xs text-primary font-medium mr-1"> - {trip.fromKsar}</span>
                )}
              </span>
              <span className="text-muted-foreground">←</span>
              <span className="truncate">{trip.toWilayaName}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{trip.departureDate} في {trip.departureTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span>{trip.pricePerSeat} دج للمقعد</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{trip.availableSeats} مقعد متاح</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span>{trip.vehicle?.make} {trip.vehicle?.model}</span>
              </div>
            </div>
            {trip.driver && (
              <div className="mt-3 pt-3 border-t border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>السائق: {trip.driver.fullName}</span>
                  <Phone className="h-4 w-4 text-muted-foreground ml-2" />
                  <span>{trip.driver.phone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hidden fields for wilaya names */}
            <input type="hidden" name="pickupLocation" value={bookingForm.pickupLocation} />
            <input type="hidden" name="destinationLocation" value={bookingForm.destinationLocation} />
            
            {/* Show wilaya info */}
            <div className="bg-secondary/20 p-3 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">
                الولاية: <span className="font-semibold text-foreground">{bookingForm.pickupLocation}</span>
                {trip.fromWilayaId === 47 && trip.fromKsar && (
                  <span className="text-xs text-primary font-medium mr-1"> - {trip.fromKsar}</span>
                )}
                {' ← '}
                <span className="font-semibold text-foreground">{bookingForm.destinationLocation}</span>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupPoint">النقطة المحددة للانطلاق *</Label>
                <Input
                  id="pickupPoint"
                  value={bookingForm.pickupPoint}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, pickupPoint: e.target.value }))}
                  placeholder="مثال: محطة الحافلات، ساحة الاستقلال"
                  required
                />
                <p className="text-xs text-muted-foreground">أدخل المكان المحدد داخل {bookingForm.pickupLocation}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destinationPoint">النقطة المحددة للوصول *</Label>
                <Input
                  id="destinationPoint"
                  value={bookingForm.destinationPoint}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, destinationPoint: e.target.value }))}
                  placeholder="مثال: محطة الحافلات، ساحة الاستقلال"
                  required
                />
                <p className="text-xs text-muted-foreground">أدخل المكان المحدد داخل {bookingForm.destinationLocation}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seats">عدد المقاعد *</Label>
                <Select 
                  value={bookingForm.seatsBooked} 
                  onValueChange={(value) => setBookingForm(prev => ({ ...prev, seatsBooked: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر عدد المقاعد" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: Math.min(trip.availableSeats, 4) }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1} {i === 0 ? 'مقعد' : 'مقاعد'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment">طريقة الدفع *</Label>
                <Select 
                  value={bookingForm.paymentMethod} 
                  onValueChange={(value) => setBookingForm(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طريقة الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cod">نقداً عند الوصول</SelectItem>
                    <SelectItem value="bpm">بريدي موب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup-time">وقت الانطلاق المفضل</Label>
              <Input
                id="pickup-time"
                type="time"
                value={bookingForm.pickupTime}
                onChange={(e) => setBookingForm(prev => ({ ...prev, pickupTime: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="special-requests">طلبات خاصة</Label>
              <Textarea
                id="special-requests"
                value={bookingForm.specialRequests}
                onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                placeholder="أي طلبات خاصة للرحلة (اختياري)"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات إضافية</Label>
              <Textarea
                id="notes"
                value={bookingForm.notes}
                onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أي ملاحظات أخرى (اختياري)"
                rows={2}
              />
            </div>

            {/* Total Cost */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex justify-between items-center">
                <span className="font-medium">إجمالي التكلفة:</span>
                <span className="text-lg font-bold text-green-600">
                  {parseInt(bookingForm.seatsBooked) * trip.pricePerSeat} دج
                </span>
              </div>
              <div className="text-sm text-green-600 mt-1">
                {bookingForm.seatsBooked} مقعد × {trip.pricePerSeat} دج
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "جاري الإرسال..." : "تأكيد الحجز"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const BookingModalWithAuth = memo(BookingModal);

// Also export LoginPromptModal as a standalone component for other uses
export { LoginPromptModal };
export default BookingModalWithAuth;