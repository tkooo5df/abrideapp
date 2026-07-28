import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Users, 
  Car, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { NotificationService, NotificationType } from '@/integrations/database/notificationService';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const NotificationDemo = () => {
  const { user } = useAuth();
  const { getDatabaseService } = useDatabase();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [demoData, setDemoData] = useState({
    passenger: { id: 'passenger-1', name: 'فاطمة الزهراء', phone: '+213 555 567 890' },
    driver: { id: 'driver-1', name: 'أحمد بن علي', phone: '+213 555 789 012' },
    admin: { id: 'admin-1', name: 'محمد بوعلي', email: 'admin@dztaxi.dz' }
  });

  const demoSteps = [
    {
      title: 'الراكب ينشئ حجز جديد',
      description: 'فاطمة الزهراء تحجز مقعدين في رحلة من الجزائر إلى وهران',
      action: async () => {
        await NotificationService.notifyBookingCreated({
          bookingId: 999,
          passengerId: demoData.passenger.id,
          driverId: demoData.driver.id,
          tripId: 'trip-123',
          pickupLocation: 'الجزائر الوسطى - شارع ديدوش مراد',
          destinationLocation: 'وهران الوسطى - شارع الأمير عبد القادر',
          seatsBooked: 2,
          totalAmount: 3000,
          paymentMethod: 'cod'
        });
      },
      notifications: [
        { to: 'السائق', message: 'حجز جديد! تم حجز 2 مقعد في رحلتك' },
        { to: 'الراكب', message: 'تم تأكيد حجزك بنجاح. سنتواصل معك قريباً' },
        { to: 'الإدارة', message: 'حجز جديد في النظام: فاطمة الزهراء حجز 2 مقعد' }
      ]
    },
    {
      title: 'السائق يؤكد الحجز',
      description: 'أحمد بن علي يقبل الحجز ويؤكده',
      action: async () => {
        await NotificationService.notifyBookingConfirmed(999, demoData.driver.id);
      },
      notifications: [
        { to: 'الراكب', message: 'تم قبول حجزك! السائق أحمد بن علي قبل حجزك' },
        { to: 'الإدارة', message: 'تم تأكيد حجز #999 من قبل أحمد بن علي' }
      ]
    },
    {
      title: 'الراكب يلغي الحجز',
      description: 'فاطمة الزهراء تلغي الحجز لأسباب شخصية',
      action: async () => {
        await NotificationService.notifyBookingCancelled(999, demoData.passenger.id, 'تم الإلغاء من قبل الراكب');
      },
      notifications: [
        { to: 'السائق', message: 'تم إلغاء حجز #999 بسبب: تم الإلغاء من قبل الراكب' },
        { to: 'الإدارة', message: 'تم إلغاء حجز #999 من قبل فاطمة الزهراء' }
      ]
    },
    {
      title: 'السائق ينشئ رحلة جديدة',
      description: 'أحمد بن علي ينشئ رحلة جديدة من وهران إلى قسنطينة',
      action: async () => {
        await NotificationService.notifyTripCreated('trip-456', demoData.driver.id);
      },
      notifications: [
        { to: 'الإدارة', message: 'رحلة جديدة منشورة: أحمد بن علي أنشأ رحلة جديدة' }
      ]
    }
  ];

  const runDemo = async () => {
    setIsRunning(true);
    setCurrentStep(0);

    for (let i = 0; i < demoSteps.length; i++) {
      setCurrentStep(i);
      
      try {
        await demoSteps[i].action();
        toast({
          title: "تم تنفيذ الخطوة",
          description: demoSteps[i].title,
        });
      } catch (error) {
        toast({
          title: "خطأ في التنفيذ",
          description: "حدث خطأ أثناء تنفيذ الخطوة",
          variant: "destructive"
        });
      }

      // Wait 2 seconds before next step
      await new Promise(resolve => setTimeout(resolve, 2000));
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
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">عرض توضيحي لنظام الإشعارات</h1>
          <p className="text-muted-foreground">
            شاهد كيف يعمل نظام الإشعارات الذكي في منصة أبريد
          </p>
        </div>

        {/* Demo Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              تحكم في العرض التوضيحي
            </CardTitle>
            <CardDescription>
              شغل العرض التوضيحي لمشاهدة نظام الإشعارات في العمل
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
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">الإشعارات المرسلة:</h4>
                      <div className="grid gap-2">
                        {step.notifications.map((notification, notifIndex) => (
                          <div key={notifIndex} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <Bell className="h-4 w-4 text-primary" />
                            <Badge variant="outline" className="text-xs">
                              {notification.to}
                            </Badge>
                            <span className="text-sm">{notification.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              تدفق النظام
            </CardTitle>
            <CardDescription>
              كيف يعمل نظام الإشعارات في منصة أبريد
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold">الراكب</h3>
                <p className="text-sm text-muted-foreground">
                  ينشئ حجز جديد ويستقبل تأكيدات وتحديثات
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Car className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold">السائق</h3>
                <p className="text-sm text-muted-foreground">
                  يستقبل طلبات الحجز ويرسل تأكيدات
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <Bell className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-semibold">الإدارة</h3>
                <p className="text-sm text-muted-foreground">
                  تراقب جميع الأنشطة وتستقبل تقارير
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>ميزات نظام الإشعارات</CardTitle>
            <CardDescription>
              الميزات المتوفرة في نظام الإشعارات الذكي
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold">إشعارات تلقائية</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    إشعارات فورية عند إنشاء الحجوزات
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    تأكيدات تلقائية للعمليات
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    تنبيهات للإدارة عن الأنشطة المهمة
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">إدارة ذكية</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    تصنيف الإشعارات حسب الأولوية
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    إحصائيات مفصلة للإشعارات
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    واجهة سهلة لإدارة الإشعارات
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert */}
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            <strong>ملاحظة:</strong> هذا العرض التوضيحي يستخدم البيانات التجريبية. 
            في التطبيق الحقيقي، ستصل الإشعارات إلى المستخدمين الفعليين في الوقت الفعلي.
          </AlertDescription>
        </Alert>
      </main>

      <Footer />
    </div>
  );
};

export default NotificationDemo;
