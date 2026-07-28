import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Car, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Bell, 
  Check, 
  X, 
  Play, 
  Pause, 
  RotateCcw,
  ArrowRight,
  Users,
  Phone,
  Mail
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { toast } from '@/hooks/use-toast';
import { NotificationService } from '@/integrations/database/notificationService';
import { createTestAccounts, testCredentials } from '@/integrations/database/testAccounts';

const BookingFlowDemo = () => {
  const { user: supabaseUser, signIn: supabaseSignIn, signOut: supabaseSignOut } = useAuth();
  const { user: localUser, signIn: localSignIn, signOut: localSignOut } = useLocalAuth();
  const { getDatabaseService, isInitialized, isLocal } = useDatabase();
  
  // Use local auth if using local database, otherwise use Supabase
  const user = isLocal ? localUser : supabaseUser;
  const signIn = isLocal ? localSignIn : supabaseSignIn;
  const signOut = isLocal ? localSignOut : supabaseSignOut;
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [testData, setTestData] = useState({
    driver: null,
    passenger: null,
    vehicle: null,
    trip: null,
    booking: null
  });
  const [notifications, setNotifications] = useState([]);

  // Demo steps
  const demoSteps = [
    {
      title: 'إنشاء الحسابات التجريبية',
      description: 'إنشاء حساب سائق وحساب راكب للاختبار',
      action: async () => {
        const accounts = await createTestAccounts();
        setTestData(prev => ({ ...prev, ...accounts }));
        toast({
          title: "تم إنشاء الحسابات",
          description: "تم إنشاء حساب السائق والراكب بنجاح",
        });
      }
    },
    {
      title: 'تسجيل دخول السائق',
      description: 'تسجيل دخول بحساب السائق لإنشاء رحلة',
      action: async () => {
        await signIn(testCredentials.driver.email, testCredentials.driver.password);
        toast({
          title: "تم تسجيل الدخول",
          description: "مرحباً أحمد السائق!",
        });
      }
    },
    {
      title: 'إنشاء رحلة جديدة',
      description: 'السائق ينشئ رحلة من الجزائر إلى وهران',
      action: async () => {
        const db = getDatabaseService();
        const trip = await db.createTrip({
          driverId: testData.driver.id,
          vehicleId: testData.vehicle.id,
          fromWilayaId: 16, // الجزائر
          toWilayaId: 31, // وهران
          departureDate: '2024-12-20',
          departureTime: '08:00',
          pricePerSeat: 1500,
          totalSeats: 4,
          description: 'رحلة مريحة من الجزائر إلى وهران - مكيف هواء',
        });

        // Send notification to admins
        await NotificationService.notifyTripCreated(trip.id.toString(), testData.driver.id);

        setTestData(prev => ({ ...prev, trip }));
        toast({
          title: "تم إنشاء الرحلة",
          description: "تم إنشاء رحلة جديدة وإرسال إشعار للإدارة",
        });
      }
    },
    {
      title: 'تسجيل دخول الراكب',
      description: 'تسجيل دخول بحساب الراكب للبحث عن رحلات',
      action: async () => {
        await signIn(testCredentials.passenger.email, testCredentials.passenger.password);
        toast({
          title: "تم تسجيل الدخول",
          description: "مرحباً فاطمة الراكبة!",
        });
      }
    },
    {
      title: 'حجز مقعد في الرحلة',
      description: 'الراكب يحجز مقعدين في رحلة السائق',
      action: async () => {
        const db = getDatabaseService();
        const booking = await db.createBooking({
          pickupLocation: 'الجزائر الوسطى - شارع ديدوش مراد',
          destinationLocation: 'وهران الوسطى - شارع الأمير عبد القادر',
          passengerId: testData.passenger.id,
          driverId: testData.driver.id,
          tripId: testData.trip.id,
          seatsBooked: 2,
          totalAmount: 3000,
          paymentMethod: 'cod',
          notes: 'مقعدين بجانب بعض',
          pickupTime: '08:00',
          specialRequests: 'مقعدين في الخلف',
          status: 'pending'
        });

        // Send notifications to all parties
        await NotificationService.notifyBookingCreated({
          bookingId: booking.id,
          passengerId: testData.passenger.id,
          driverId: testData.driver.id,
          tripId: testData.trip.id,
          pickupLocation: 'الجزائر الوسطى - شارع ديدوش مراد',
          destinationLocation: 'وهران الوسطى - شارع الأمير عبد القادر',
          seatsBooked: 2,
          totalAmount: 3000,
          paymentMethod: 'cod'
        });

        setTestData(prev => ({ ...prev, booking }));
        toast({
          title: "تم إنشاء الحجز",
          description: "تم إرسال إشعارات للسائق والإدارة",
        });
      }
    },
    {
      title: 'تأكيد الحجز من السائق',
      description: 'السائق يؤكد الحجز ويقبله',
      action: async () => {
        const db = getDatabaseService();
        await db.updateBooking(testData.booking.id, { status: 'confirmed' });
        
        await NotificationService.notifyBookingConfirmed(testData.booking.id, testData.driver.id);
        
        toast({
          title: "تم تأكيد الحجز",
          description: "تم إرسال إشعار للراكب",
        });
      }
    }
  ];

  const runDemo = async () => {
    setIsRunning(true);
    setCurrentStep(0);

    for (let i = 0; i < demoSteps.length; i++) {
      setCurrentStep(i);
      
      try {
        await demoSteps[i].action();
        
        // Wait 2 seconds before next step
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        toast({
          title: "خطأ في التنفيذ",
          description: "حدث خطأ أثناء تنفيذ الخطوة",
          variant: "destructive"
        });
      }
    }

    setIsRunning(false);
    toast({
      title: "انتهى العرض التوضيحي",
      description: "تم تنفيذ جميع الخطوات بنجاح",
    });
  };

  const resetDemo = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setTestData({
      driver: null,
      passenger: null,
      vehicle: null,
      trip: null,
      booking: null
    });
  };

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const db = getDatabaseService();
      const notifications = await db.getNotifications(user.id);
      setNotifications(notifications);
    } catch (error) {
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">عرض توضيحي لتدفق الحجز الكامل</h1>
          <p className="text-muted-foreground">
            شاهد كيف يعمل النظام من إنشاء الحسابات إلى تأكيد الحجز
          </p>
        </div>

        {/* Current User Status */}
        {user && (
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              <strong>المستخدم الحالي:</strong> {user.email} 
              {user.role && ` (${user.role === 'driver' ? 'سائق' : 'راكب'})`}
            </AlertDescription>
          </Alert>
        )}

        {/* Demo Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              تحكم في العرض التوضيحي
            </CardTitle>
            <CardDescription>
              شغل العرض التوضيحي لمشاهدة تدفق الحجز الكامل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={runDemo}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4" />
                    جاري التشغيل...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    تشغيل العرض التوضيحي
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={resetDemo}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                إعادة تعيين
              </Button>

              {user && (
                <Button
                  variant="outline"
                  onClick={signOut}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  تسجيل الخروج
                </Button>
              )}
            </div>

            {isRunning && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {currentStep + 1} / {demoSteps.length}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  الخطوة الحالية: {demoSteps[currentStep]?.title}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demo Steps */}
        <div className="grid gap-4">
          {demoSteps.map((step, index) => (
            <Card 
              key={index} 
              className={`transition-all ${
                index === currentStep && isRunning 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : index < currentStep 
                    ? 'opacity-75' 
                    : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index < currentStep 
                      ? 'bg-green-100 text-green-600' 
                      : index === currentStep && isRunning
                        ? 'bg-primary text-primary-foreground animate-pulse'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {index < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Test Data Display */}
        {testData.driver && (
          <Card>
            <CardHeader>
              <CardTitle>البيانات التجريبية المنشأة</CardTitle>
              <CardDescription>الحسابات والبيانات التي تم إنشاؤها للاختبار</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="accounts" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="accounts">الحسابات</TabsTrigger>
                  <TabsTrigger value="trip">الرحلة</TabsTrigger>
                  <TabsTrigger value="booking">الحجز</TabsTrigger>
                  <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
                </TabsList>

                <TabsContent value="accounts" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Driver Account */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Car className="h-5 w-5 text-green-600" />
                          حساب السائق
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{testData.driver.fullName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{testData.driver.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{testData.driver.phone}</span>
                          </div>
                          <Badge variant="outline">سائق</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Passenger Account */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          حساب الراكب
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{testData.passenger.fullName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{testData.passenger.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{testData.passenger.phone}</span>
                          </div>
                          <Badge variant="outline">راكب</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Vehicle */}
                  {testData.vehicle && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Car className="h-5 w-5 text-accent" />
                          المركبة
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <strong>الماركة:</strong> {testData.vehicle.make} {testData.vehicle.model}
                          </div>
                          <div>
                            <strong>السنة:</strong> {testData.vehicle.year}
                          </div>
                          <div>
                            <strong>اللون:</strong> {testData.vehicle.color}
                          </div>
                          <div>
                            <strong>رقم التسجيل:</strong> {testData.vehicle.licensePlate}
                          </div>
                          <div>
                            <strong>المقاعد:</strong> {testData.vehicle.seats}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="trip" className="space-y-4">
                  {testData.trip ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>تفاصيل الرحلة</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>ولاية {testData.trip.fromWilayaId} → ولاية {testData.trip.toWilayaId}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{testData.trip.departureDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{testData.trip.departureTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>{testData.trip.pricePerSeat} دج للمقعد</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{testData.trip.availableSeats}/{testData.trip.totalSeats} مقاعد متاحة</span>
                          </div>
                          {testData.trip.description && (
                            <p className="text-muted-foreground">{testData.trip.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="text-muted-foreground">لم يتم إنشاء رحلة بعد</p>
                  )}
                </TabsContent>

                <TabsContent value="booking" className="space-y-4">
                  {testData.booking ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>تفاصيل الحجز</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{testData.booking.pickupLocation} → {testData.booking.destinationLocation}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{testData.booking.seatsBooked} مقعد</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>{testData.booking.totalAmount} دج</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>وقت الاستلام: {testData.booking.pickupTime}</span>
                          </div>
                          <div>
                            <strong>طريقة الدفع:</strong> {testData.booking.paymentMethod === 'cod' ? 'نقداً' : 'بريدي موب'}
                          </div>
                          <div>
                            <strong>الحالة:</strong> 
                            <Badge variant="outline" className="mr-2">
                              {testData.booking.status === 'pending' ? 'في الانتظار' : 
                               testData.booking.status === 'confirmed' ? 'مؤكد' : 
                               testData.booking.status}
                            </Badge>
                          </div>
                          {testData.booking.notes && (
                            <div>
                              <strong>ملاحظات:</strong> {testData.booking.notes}
                            </div>
                          )}
                          {testData.booking.specialRequests && (
                            <div>
                              <strong>طلبات خاصة:</strong> {testData.booking.specialRequests}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="text-muted-foreground">لم يتم إنشاء حجز بعد</p>
                  )}
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                  <div className="space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-muted-foreground">لا توجد إشعارات</p>
                    ) : (
                      notifications.map((notification, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Bell className="h-4 w-4 text-primary mt-1" />
                              <div className="flex-1">
                                <h4 className="font-medium">{notification.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {notification.type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(notification.createdAt).toLocaleString('ar-DZ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Manual Login Section */}
        <Card>
          <CardHeader>
            <CardTitle>تسجيل الدخول اليدوي</CardTitle>
            <CardDescription>يمكنك تسجيل الدخول يدوياً باستخدام الحسابات التجريبية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">حساب السائق</h4>
                <p className="text-sm text-muted-foreground">
                  البريد الإلكتروني: driver@test.com<br/>
                  كلمة المرور: driver123
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => signIn(testCredentials.driver.email, testCredentials.driver.password)}
                  className="w-full"
                >
                  تسجيل دخول كسائق
                </Button>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">حساب الراكب</h4>
                <p className="text-sm text-muted-foreground">
                  البريد الإلكتروني: passenger@test.com<br/>
                  كلمة المرور: passenger123
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => signIn(testCredentials.passenger.email, testCredentials.passenger.password)}
                  className="w-full"
                >
                  تسجيل دخول كراكب
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default BookingFlowDemo;
