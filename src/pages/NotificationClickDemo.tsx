import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Car, User, Calendar, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { NotificationService, NotificationType, NotificationCategory, NotificationPriority } from '@/integrations/database/notificationService';

const NotificationClickDemo = () => {
  const { user } = useAuth();
  const [testForm, setTestForm] = useState({
    recipientId: '',
    recipientRole: 'driver',
    notificationType: 'booking_created',
    customTitle: '🎉 حجز جديد!',
    customMessage: 'تم حجز 2 مقعد في رحلتك من الجزائر إلى وهران. الراكب: أحمد محمد - المبلغ: 3000 دج'
  });
  const [isLoading, setIsLoading] = useState(false);

  const sendTestNotification = async () => {
    if (!testForm.recipientId) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال معرف المستخدم المستلم",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Send a test notification based on type
      if (testForm.notificationType === 'booking_created') {
        await NotificationService.notifyBookingCreated({
          bookingId: 999,
          passengerId: user?.id || 'test-passenger',
          driverId: testForm.recipientId,
          tripId: 'test-trip',
          pickupLocation: 'الجزائر الوسطى',
          destinationLocation: 'وهران الوسطى',
          seatsBooked: 2,
          totalAmount: 3000,
          paymentMethod: 'cod'
        });
      } else {
        // Send custom notification
        await NotificationService.sendSmartNotification({
          userId: testForm.recipientId,
          title: testForm.customTitle,
          message: testForm.customMessage,
          type: testForm.notificationType as NotificationType,
          category: NotificationCategory.BOOKING,
          priority: NotificationPriority.HIGH,
          relatedId: '999',
          relatedType: 'booking'
        });
      }

      toast({
        title: "✅ تم إرسال الإشعار",
        description: "تم إرسال الإشعار بنجاح! يمكن للمستلم الآن النقر عليه للانتقال إلى لوحة التحكم",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الإشعار: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">🔔 تجربة الإشعارات القابلة للنقر</h1>
        <p className="text-muted-foreground text-lg">
          اختبر وظيفة الإشعارات التي تنقل المستخدمين إلى لوحة التحكم عند النقر عليها
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              إرسال إشعار تجريبي
            </CardTitle>
            <CardDescription>
              أرسل إشعاراً قابلاً للنقر لاختبار وظيفة التوجيه
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipientId">معرف المستلم</Label>
              <Input
                id="recipientId"
                placeholder="أدخل معرف المستخدم المستلم"
                value={testForm.recipientId}
                onChange={(e) => setTestForm(prev => ({ ...prev, recipientId: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="recipientRole">دور المستلم</Label>
              <Select 
                value={testForm.recipientRole} 
                onValueChange={(value) => setTestForm(prev => ({ ...prev, recipientRole: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driver">سائق</SelectItem>
                  <SelectItem value="passenger">راكب</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notificationType">نوع الإشعار</Label>
              <Select 
                value={testForm.notificationType} 
                onValueChange={(value) => setTestForm(prev => ({ ...prev, notificationType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="booking_created">حجز جديد</SelectItem>
                  <SelectItem value="booking_confirmed">تأكيد حجز</SelectItem>
                  <SelectItem value="booking_cancelled">إلغاء حجز</SelectItem>
                  <SelectItem value="trip_created">رحلة جديدة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="customTitle">عنوان الإشعار</Label>
              <Input
                id="customTitle"
                value={testForm.customTitle}
                onChange={(e) => setTestForm(prev => ({ ...prev, customTitle: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="customMessage">رسالة الإشعار</Label>
              <Input
                id="customMessage"
                value={testForm.customMessage}
                onChange={(e) => setTestForm(prev => ({ ...prev, customMessage: e.target.value }))}
              />
            </div>

            <Button 
              onClick={sendTestNotification} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "جاري الإرسال..." : "إرسال الإشعار"}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              كيفية الاستخدام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">1. تحديد المستلم</h4>
                  <p className="text-sm text-blue-700">أدخل معرف المستخدم الذي تريد إرسال الإشعار إليه</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-full">
                  <Bell className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-900">2. إرسال الإشعار</h4>
                  <p className="text-sm text-green-700">اختر نوع الإشعار واضغط على "إرسال الإشعار"</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="bg-purple-100 p-2 rounded-full">
                  <MapPin className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-purple-900">3. النقر للتوجيه</h4>
                  <p className="text-sm text-purple-700">
                    عند النقر على الإشعار، سيتم توجيه المستخدم إلى:
                    <br />• السائق → لوحة الحجوزات
                    <br />• الراكب → لوحة الحجوزات
                    <br />• المدير → لوحة الإدارة
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2">💡 نصائح</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• يمكن رؤية الإشعارات في شريط الأدوات العلوي</li>
                <li>• الإشعارات غير المقروءة تظهر بلون مميز</li>
                <li>• النقر على الإشعار يوجه فوراً إلى الصفحة المناسبة</li>
                <li>• يتم تمييز الإشعار كمقروء تلقائياً عند النقر</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationClickDemo;