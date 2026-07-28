import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useDatabase } from '@/hooks/useDatabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { 
  CheckCircle,
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Car,
  DollarSign,
  MessageSquare,
  Home,
  Calendar,
  Users
} from 'lucide-react';

const BookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  const { user: supabaseUser } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal } = useDatabase();
  
  const user = isLocal ? localUser : supabaseUser;
  
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [tripDetails, setTripDetails] = useState<any>(null);
  const [driverDetails, setDriverDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const bookingId = queryParams.get('bookingId');

  useEffect(() => {
    if (!bookingId) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على معرف الحجز",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      // Get booking details
      const booking = await BrowserDatabaseService.getBookingById(bookingId!);
      if (!booking) {
        // Log all available bookings for debugging
        const allBookings = await BrowserDatabaseService.getAllBookings();
        throw new Error('لم يتم العثور على الحجز');
      }
      setBookingDetails(booking);

      // Get trip details
      const trip = await BrowserDatabaseService.getTripById(booking.tripId);
      if (trip) {
        setTripDetails(trip);
      }

      // Get driver details
      const driver = await BrowserDatabaseService.getProfile(booking.driverId);
      if (driver) {
        setDriverDetails(driver);
      }

    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في تحميل تفاصيل الحجز",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <p>يجب تسجيل الدخول لعرض تفاصيل الحجز</p>
              <Link to="/auth/signin">
                <Button className="mt-4">تسجيل الدخول</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Success Header */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-green-800 mb-2">
                    تم تأكيد حجزك بنجاح! 🎉
                  </h1>
                  <p className="text-green-700">
                    رقم الحجز: #{bookingDetails?.id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>تفاصيل الرحلة</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">من</p>
                      <p className="font-medium">{bookingDetails?.pickupLocation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">إلى</p>
                      <p className="font-medium">{bookingDetails?.destinationLocation}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">عدد المقاعد</p>
                      <p className="font-medium">{bookingDetails?.seatsBooked} مقعد</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">التكلفة الإجمالية</p>
                      <p className="font-medium text-lg text-primary">{bookingDetails?.totalAmount} دج</p>
                    </div>
                  </div>
                </div>
              </div>

              {tripDetails && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">تاريخ الرحلة</p>
                        <p className="font-medium">{tripDetails.departureDate}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">وقت الانطلاق</p>
                        <p className="font-medium">{tripDetails.departureTime}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Driver Information */}
          {driverDetails && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <User className="h-5 w-5" />
                  <span>معلومات السائق</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">{driverDetails.fullName}</h3>
                    <p className="text-blue-700 text-sm">سائق معتمد</p>
                  </div>
                </div>
                
                <Separator className="bg-blue-200" />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-700">رقم الهاتف للتواصل</p>
                      <p className="font-medium text-blue-900 text-lg">{driverDetails.phone}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => window.open(`tel:${driverDetails.phone}`)}
                    >
                      اتصال
                    </Button>
                  </div>
                  
                  {tripDetails?.vehicle && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                      <Car className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-700">السيارة</p>
                        <p className="font-medium text-blue-900">
                          {tripDetails.vehicle.make} {tripDetails.vehicle.model} - {tripDetails.vehicle.color}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span>حالة الحجز</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    في الانتظار
                  </Badge>
                  <span className="text-sm">في انتظار موافقة السائق</span>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">الخطوات التالية:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• سيتم إشعارك عند موافقة السائق على الحجز</li>
                    <li>• يمكنك التواصل مع السائق مباشرة عبر الرقم المذكور أعلاه</li>
                    <li>• تأكد من الوصول إلى نقطة الانطلاق في الوقت المحدد</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link to="/dashboard" className="flex-1">
              <Button className="w-full">
                <User className="h-4 w-4 mr-2" />
                لوحة التحكم
              </Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                الصفحة الرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingSuccess;