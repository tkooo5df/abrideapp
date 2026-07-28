import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { NotificationService, NotificationType, NotificationCategory, NotificationPriority } from '@/integrations/database/notificationService';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Users, MessageSquare, Bell, CheckCircle, XCircle } from 'lucide-react';

const NotificationTestPage = () => {
  const { user: supabaseUser } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal } = useDatabase();
  
  const user = isLocal ? localUser : supabaseUser;
  
  const [testForm, setTestForm] = useState({
    recipientId: '',
    title: 'إشعار تجريبي',
    message: 'هذا إشعار تجريبي لاختبار النظام',
    type: NotificationType.SYSTEM_ALERT,
    category: NotificationCategory.SYSTEM,
    priority: NotificationPriority.MEDIUM
  });
  
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  useEffect(() => {
    loadAvailableUsers();
    loadUserNotifications();
  }, [user]);
  
  const loadAvailableUsers = async () => {
    try {
      const profiles = await BrowserDatabaseService.getAllProfiles();
      setAvailableUsers(profiles);
    } catch (error) {
    }
  };
  
  const loadUserNotifications = async () => {
    if (!user) return;
    try {
      const userNotifications = await NotificationService.getUserNotifications(user.id);
      setNotifications(userNotifications);
    } catch (error) {
    }
  };
  
  const sendTestNotification = async () => {
    if (!testForm.recipientId || !testForm.title || !testForm.message) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const result = await NotificationService.sendSmartNotification({
        userId: testForm.recipientId,
        title: testForm.title,
        message: testForm.message,
        type: testForm.type,
        category: testForm.category,
        priority: testForm.priority,
        metadata: {
          sentBy: user?.id,
          sentFrom: 'test_page',
          timestamp: new Date().toISOString()
        }
      });
      
      if (result) {
        const recipient = availableUsers.find(u => u.id === testForm.recipientId);
        const successMessage = `تم إرسال إشعار إلى ${recipient?.fullName || 'المستخدم'} بنجاح`;
        setTestResults(prev => [...prev, `✅ ${successMessage}`]);
        
        toast({
          title: "تم إرسال الإشعار",
          description: successMessage
        });
        
        // Refresh notifications if sent to current user
        if (testForm.recipientId === user?.id) {
          await loadUserNotifications();
        }
      } else {
        setTestResults(prev => [...prev, `❌ فشل في إرسال الإشعار`]);
      }
    } catch (error: any) {
      setTestResults(prev => [...prev, `❌ خطأ: ${error.message}`]);
      toast({
        title: "خطأ في الإرسال",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const testBookingNotification = async () => {
    if (!testForm.recipientId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مستقبل الإشعار",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // Create a test booking notification
      await NotificationService.notifyBookingCreated({
        bookingId: 999,
        passengerId: user?.id || 'test-passenger',
        driverId: testForm.recipientId,
        tripId: 'test-trip-1',
        pickupLocation: 'الجزائر الوسطى - اختبار',
        destinationLocation: 'وهران الوسطى - اختبار',
        seatsBooked: 2,
        totalAmount: 3000,
        paymentMethod: 'cod'
      });
      
      setTestResults(prev => [...prev, `✅ تم إرسال إشعار حجز تجريبي`]);
      toast({
        title: "تم إرسال إشعار الحجز",
        description: "تم إرسال إشعار حجز تجريبي بنجاح"
      });
    } catch (error: any) {
      setTestResults(prev => [...prev, `❌ خطأ في إشعار الحجز: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };
  
  const clearTestResults = () => {
    setTestResults([]);
  };
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">يجب تسجيل الدخول</h3>
              <p className="text-gray-600">يرجى تسجيل الدخول لاختبار الإشعارات</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">اختبار نظام الإشعارات</h1>
        <p className="text-gray-600">اختبر إرسال الإشعارات بين الحسابات المختلفة</p>
      </div>
      
      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            المستخدم الحالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>الاسم</Label>
              <p className="font-medium">{(user as any).fullName || (user as any).firstName + ' ' + (user as any).lastName || user.email}</p>
            </div>
            <div>
              <Label>الدور</Label>
              <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'driver' ? 'default' : 'secondary'}>
                {user.role === 'admin' ? 'مدير' : user.role === 'driver' ? 'سائق' : 'راكب'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Send Test Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            إرسال إشعار تجريبي
          </CardTitle>
          <CardDescription>
            اختر مستخدم وأرسل إليه إشعار تجريبي
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipient">المستقبل</Label>
              <Select value={testForm.recipientId} onValueChange={(value) => setTestForm(prev => ({ ...prev, recipientId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المستقبل" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {(user as any).fullName || (user as any).firstName + ' ' + (user as any).lastName || user.email} - {user.role === 'admin' ? 'مدير' : user.role === 'driver' ? 'سائق' : 'راكب'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">الأولوية</Label>
              <Select value={testForm.priority} onValueChange={(value: NotificationPriority) => setTestForm(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NotificationPriority.LOW}>منخفضة</SelectItem>
                  <SelectItem value={NotificationPriority.MEDIUM}>متوسطة</SelectItem>
                  <SelectItem value={NotificationPriority.HIGH}>عالية</SelectItem>
                  <SelectItem value={NotificationPriority.URGENT}>عاجلة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="title">العنوان</Label>
            <Input
              id="title"
              value={testForm.title}
              onChange={(e) => setTestForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="عنوان الإشعار"
            />
          </div>
          
          <div>
            <Label htmlFor="message">الرسالة</Label>
            <Textarea
              id="message"
              value={testForm.message}
              onChange={(e) => setTestForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="محتوى الإشعار"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={sendTestNotification} disabled={loading}>
              <MessageSquare className="h-4 w-4 mr-2" />
              إرسال إشعار عادي
            </Button>
            <Button onClick={testBookingNotification} disabled={loading} variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              إرسال إشعار حجز
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              نتائج الاختبار
            </CardTitle>
            <Button onClick={clearTestResults} variant="outline" size="sm">
              مسح النتائج
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <p key={index} className="font-mono text-sm p-2 bg-gray-50 rounded">
                  {result}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* User Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            إشعاراتي ({notifications.length})
          </CardTitle>
          <Button onClick={loadUserNotifications} variant="outline" size="sm">
            تحديث
          </Button>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لا توجد إشعارات</p>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 10).map((notification, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString('ar')}
                        </span>
                      </div>
                    </div>
                    <div>
                      {notification.isRead ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationTestPage;