import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { NotificationService } from '@/integrations/database/notificationService';
import { BookingTrackingService, BookingStatus } from '@/integrations/database/bookingTrackingService';
import { toast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  Users, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Send,
  RefreshCw,
  Bug,
  Mail,
  MessageSquare
} from 'lucide-react';

const BookingConfirmationTestPage = () => {
  const { user: supabaseUser } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal } = useDatabase();
  
  const user = isLocal ? localUser : supabaseUser;
  
  const [testData, setTestData] = useState({
    bookingId: '',
    driverId: '',
    passengerId: '',
  });
  
  const [availableBookings, setAvailableBookings] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [passengerNotifications, setPassengerNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  useEffect(() => {
    if (user) {
      loadAvailableBookings();
      loadAvailableUsers();
      if (testData.passengerId) {
        loadPassengerNotifications();
      }
    }
  }, [user, testData.passengerId]);
  
  const addDebugLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('ar');
    const logMessage = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev, { message: logMessage, type }]);
  };
  
  const loadAvailableBookings = async () => {
    try {
      const bookings = await BrowserDatabaseService.getAllBookings();
      // Filter pending bookings
      const pendingBookings = bookings.filter((b: any) => b.status === 'pending');
      setAvailableBookings(pendingBookings);
      addDebugLog(`تم تحميل ${pendingBookings.length} حجز معلق`, 'success');
    } catch (error: any) {
      addDebugLog(`خطأ في تحميل الحجوزات: ${error.message}`, 'error');
    }
  };
  
  const loadAvailableUsers = async () => {
    try {
      addDebugLog('🔄 جلب قائمة المستخدمين...', 'info');
      const profiles = await BrowserDatabaseService.getAllProfiles();
      
      if (!profiles || profiles.length === 0) {
        addDebugLog('⚠️ لا توجد مستخدمين في قاعدة البيانات', 'warning');
        setAvailableUsers([]);
        return;
      }
      
      // Log user details for debugging
      const drivers = profiles.filter((p: any) => p.role === 'driver');
      const passengers = profiles.filter((p: any) => p.role === 'passenger');
      addDebugLog(`✅ تم تحميل ${profiles.length} مستخدم (${drivers.length} سائق، ${passengers.length} راكب)`, 'success');
      
      // Log sample users for debugging
      const getUserDisplayName = (user: any) => {
        return user.fullName || user.full_name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || user.id;
      };
      
      if (drivers.length > 0) {
        addDebugLog(`   مثال على السائقين: ${drivers.slice(0, 3).map((d: any) => getUserDisplayName(d)).join(', ')}`, 'info');
      } else {
        addDebugLog(`   ⚠️ لا يوجد سائقين في قاعدة البيانات`, 'warning');
      }
      if (passengers.length > 0) {
        addDebugLog(`   مثال على الركاب: ${passengers.slice(0, 3).map((p: any) => getUserDisplayName(p)).join(', ')}`, 'info');
      } else {
        addDebugLog(`   ⚠️ لا يوجد ركاب في قاعدة البيانات`, 'warning');
      }
      
      // Log raw data structure for first user (for debugging)
      if (profiles.length > 0) {
        addDebugLog(`   هيكل بيانات المستخدم الأول: ${JSON.stringify(Object.keys(profiles[0]))}`, 'info');
      }
      
      setAvailableUsers(profiles);
    } catch (error: any) {
      addDebugLog(`❌ خطأ في تحميل المستخدمين: ${error.message}`, 'error');
      setAvailableUsers([]);
    }
  };
  
  const loadPassengerNotifications = async () => {
    if (!testData.passengerId) return;
    try {
      const notifications = await NotificationService.getUserNotifications(testData.passengerId);
      // Filter booking confirmed notifications
      const confirmedNotifications = notifications.filter((n: any) => 
        n.type === 'booking' && n.title?.includes('قبول') || n.title?.includes('تأكيد')
      );
      setPassengerNotifications(confirmedNotifications);
      addDebugLog(`تم تحميل ${confirmedNotifications.length} إشعار تأكيد للراكب`, 'success');
    } catch (error: any) {
      addDebugLog(`خطأ في تحميل إشعارات الراكب: ${error.message}`, 'error');
    }
  };
  
  const testBookingConfirmation = async () => {
    if (!testData.bookingId || !testData.driverId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار الحجز والسائق",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setTestResults([]);
    addDebugLog('🚀 بدء اختبار تأكيد الحجز...', 'info');
    
    try {
      // Step 1: Get booking details
      addDebugLog(`📋 جلب تفاصيل الحجز: ${testData.bookingId}`, 'info');
      const booking = await BrowserDatabaseService.getBookingById(testData.bookingId);
      
      if (!booking) {
        throw new Error('الحجز غير موجود');
      }
      
      addDebugLog(`✅ تم العثور على الحجز: ${booking.id}`, 'success');
      addDebugLog(`   الراكب: ${booking.passengerId}`, 'info');
      addDebugLog(`   السائق: ${booking.driverId}`, 'info');
      addDebugLog(`   الحالة الحالية: ${booking.status}`, 'info');
      
      // Update passenger ID if not set
      if (!testData.passengerId && booking.passengerId) {
        setTestData(prev => ({ ...prev, passengerId: booking.passengerId }));
      }
      
      // Step 2: Get driver profile
      addDebugLog(`👤 جلب بيانات السائق: ${testData.driverId}`, 'info');
      const driver = await BrowserDatabaseService.getProfile(testData.driverId);
      
      if (!driver) {
        throw new Error('السائق غير موجود');
      }
      
      addDebugLog(`✅ تم العثور على السائق: ${driver.fullName || driver.email}`, 'success');
      
      // Step 3: Get passenger profile
      const passengerId = booking.passengerId || testData.passengerId;
      addDebugLog(`👤 جلب بيانات الراكب: ${passengerId}`, 'info');
      const passenger = await BrowserDatabaseService.getProfile(passengerId);
      
      if (!passenger) {
        throw new Error('الراكب غير موجود');
      }
      
      addDebugLog(`✅ تم العثور على الراكب: ${passenger.fullName || passenger.email}`, 'success');
      addDebugLog(`   بريد الراكب: ${passenger.email || 'غير موجود'}`, passenger.email ? 'success' : 'warning');
      
      // Step 4: Track status change (this should trigger notification)
      addDebugLog(`🔄 تحديث حالة الحجز إلى CONFIRMED...`, 'info');
      addDebugLog(`   Actor: driver`, 'info');
      addDebugLog(`   ActorId: ${testData.driverId}`, 'info');
      
      await BookingTrackingService.trackStatusChange(
        testData.bookingId,
        BookingStatus.CONFIRMED,
        'driver',
        testData.driverId,
        'تم قبول الحجز من قبل السائق - اختبار'
      );
      
      addDebugLog(`✅ تم تحديث حالة الحجز بنجاح`, 'success');
      
      // Step 5: Wait a bit and check notifications
      addDebugLog(`⏳ انتظار 2 ثانية للتحقق من الإشعارات...`, 'info');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 6: Check if notification was created
      addDebugLog(`🔍 التحقق من إشعارات الراكب...`, 'info');
      await loadPassengerNotifications();
      
      // Step 7: Test direct notification call
      addDebugLog(`📧 اختبار إرسال إشعار مباشر...`, 'info');
      try {
        const directNotification = await NotificationService.notifyBookingConfirmed(
          testData.bookingId,
          testData.driverId
        );
        
        if (directNotification && directNotification.length > 0) {
          addDebugLog(`✅ تم إرسال ${directNotification.length} إشعار مباشر`, 'success');
          setTestResults(prev => [...prev, {
            type: 'success',
            message: `تم إرسال ${directNotification.length} إشعار بنجاح`,
            details: directNotification
          }]);
        } else {
          addDebugLog(`⚠️ لم يتم إرسال أي إشعار (النتيجة فارغة)`, 'warning');
          setTestResults(prev => [...prev, {
            type: 'warning',
            message: 'لم يتم إرسال أي إشعار (النتيجة فارغة)',
            details: directNotification
          }]);
        }
      } catch (notificationError: any) {
        addDebugLog(`❌ خطأ في إرسال الإشعار المباشر: ${notificationError.message}`, 'error');
        setTestResults(prev => [...prev, {
          type: 'error',
          message: `خطأ في إرسال الإشعار: ${notificationError.message}`,
          details: notificationError
        }]);
      }
      
      // Step 8: Refresh notifications again
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadPassengerNotifications();
      
      // Final check
      const finalNotifications = await NotificationService.getUserNotifications(passengerId);
      const confirmedCount = finalNotifications.filter((n: any) => 
        n.type === 'booking' && (n.title?.includes('قبول') || n.title?.includes('تأكيد'))
      ).length;
      
      addDebugLog(`📊 عدد إشعارات التأكيد النهائية: ${confirmedCount}`, confirmedCount > 0 ? 'success' : 'warning');
      
      if (confirmedCount > 0) {
        toast({
          title: "✅ نجح الاختبار",
          description: `تم إرسال ${confirmedCount} إشعار تأكيد للراكب`
        });
      } else {
        toast({
          title: "⚠️ تحذير",
          description: "لم يتم العثور على إشعارات تأكيد للراكب",
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      addDebugLog(`❌ خطأ في الاختبار: ${error.message}`, 'error');
      toast({
        title: "❌ خطأ",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const testDirectNotification = async () => {
    if (!testData.bookingId || !testData.driverId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار الحجز والسائق",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setTestResults([]);
    addDebugLog('📧 بدء اختبار إرسال إشعار مباشر...', 'info');
    
    try {
      const result = await NotificationService.notifyBookingConfirmed(
        testData.bookingId,
        testData.driverId
      );
      
      addDebugLog(`✅ تم استدعاء notifyBookingConfirmed`, 'success');
      addDebugLog(`   النتيجة: ${result ? `${result.length} إشعار` : 'null'}`, result ? 'success' : 'warning');
      
      if (result && result.length > 0) {
        toast({
          title: "✅ نجح الاختبار",
          description: `تم إرسال ${result.length} إشعار بنجاح`
        });
      } else {
        toast({
          title: "⚠️ تحذير",
          description: "لم يتم إرسال أي إشعار (النتيجة فارغة)",
          variant: "destructive"
        });
      }
      
      // Refresh notifications
      await loadPassengerNotifications();
      
    } catch (error: any) {
      addDebugLog(`❌ خطأ: ${error.message}`, 'error');
      toast({
        title: "❌ خطأ",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const clearLogs = () => {
    setDebugLogs([]);
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
        <h1 className="text-3xl font-bold mb-2">🧪 اختبار إشعار تأكيد الحجز</h1>
        <p className="text-gray-600">اختبار إرسال إشعار تأكيد الحجز للراكب عندما يؤكد السائق الحجز</p>
      </div>
      
      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            إعدادات الاختبار
          </CardTitle>
          <CardDescription>
            اختر الحجز والسائق لإجراء الاختبار
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="booking">الحجز</Label>
              <Select 
                value={testData.bookingId} 
                onValueChange={(value) => {
                  const booking = availableBookings.find(b => b.id === value);
                  setTestData(prev => ({ 
                    ...prev, 
                    bookingId: value,
                    passengerId: booking?.passengerId || booking?.passenger_id || prev.passengerId,
                    driverId: booking?.driverId || booking?.driver_id || prev.driverId
                  }));
                  addDebugLog(`تم اختيار الحجز: ${value}`, 'info');
                  if (booking) {
                    addDebugLog(`   الراكب: ${booking.passengerId || booking.passenger_id}`, 'info');
                    addDebugLog(`   السائق: ${booking.driverId || booking.driver_id}`, 'info');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={availableBookings.length > 0 ? "اختر حجز معلق" : "لا يوجد حجوزات معلقة"} />
                </SelectTrigger>
                <SelectContent>
                  {availableBookings.length > 0 ? (
                    availableBookings.map(booking => (
                      <SelectItem key={booking.id} value={booking.id}>
                        #{booking.id} - {booking.pickupLocation || booking.pickup_location} → {booking.destinationLocation || booking.destination_location}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-bookings" disabled>
                      لا يوجد حجوزات معلقة
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {availableBookings.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">لا يوجد حجوزات معلقة. تأكد من وجود حجوزات بحالة "pending"</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="driver">السائق</Label>
              <Select 
                value={testData.driverId} 
                onValueChange={(value) => setTestData(prev => ({ ...prev, driverId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={availableUsers.filter(u => u.role === 'driver').length > 0 ? "اختر السائق" : "لا يوجد سائقين"} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.filter(u => u.role === 'driver').length > 0 ? (
                    availableUsers.filter(u => u.role === 'driver').map(user => {
                      const displayName = user.fullName || user.full_name || 
                        `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                        user.email || user.id;
                      return (
                        <SelectItem key={user.id} value={user.id}>
                          {displayName} - {user.role || 'driver'}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-drivers" disabled>
                      لا يوجد سائقين متاحين
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {availableUsers.filter(u => u.role === 'driver').length === 0 && (
                <p className="text-xs text-gray-500 mt-1">لا يوجد سائقين في قاعدة البيانات</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="passenger">الراكب</Label>
              <Select 
                value={testData.passengerId} 
                onValueChange={(value) => setTestData(prev => ({ ...prev, passengerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={availableUsers.filter(u => u.role === 'passenger').length > 0 ? "اختر الراكب" : "لا يوجد ركاب"} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.filter(u => u.role === 'passenger').length > 0 ? (
                    availableUsers.filter(u => u.role === 'passenger').map(user => {
                      const displayName = user.fullName || user.full_name || 
                        `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                        user.email || user.id;
                      return (
                        <SelectItem key={user.id} value={user.id}>
                          {displayName} - {user.role || 'passenger'}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-passengers" disabled>
                      لا يوجد ركاب متاحين
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {availableUsers.filter(u => u.role === 'passenger').length === 0 && (
                <p className="text-xs text-gray-500 mt-1">لا يوجد ركاب في قاعدة البيانات</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testBookingConfirmation} 
              disabled={loading || !testData.bookingId || !testData.driverId}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              اختبار كامل (تأكيد + إشعار)
            </Button>
            <Button 
              onClick={testDirectNotification} 
              disabled={loading || !testData.bookingId || !testData.driverId}
              variant="outline"
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              اختبار إشعار مباشر فقط
            </Button>
            <Button 
              onClick={loadAvailableBookings} 
              disabled={loading}
              variant="outline"
              title="تحديث الحجوزات"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              onClick={loadAvailableUsers} 
              disabled={loading}
              variant="outline"
              title="تحديث المستخدمين"
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Debug Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            سجل التشخيص
          </CardTitle>
          <Button onClick={clearLogs} variant="outline" size="sm">
            مسح السجل
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg font-mono text-sm">
            {debugLogs.length === 0 ? (
              <p className="text-gray-500">لا توجد سجلات حتى الآن</p>
            ) : (
              debugLogs.map((log, index) => (
                <p 
                  key={index} 
                  className={`${
                    log.type === 'error' ? 'text-red-600' :
                    log.type === 'success' ? 'text-green-600' :
                    log.type === 'warning' ? 'text-yellow-600' :
                    'text-gray-700'
                  }`}
                >
                  {log.message}
                </p>
              ))
            )}
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
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${
                    result.type === 'success' ? 'bg-green-50 border-green-200' :
                    result.type === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <p className="font-medium">{result.message}</p>
                  {result.details && (
                    <pre className="text-xs mt-2 overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Available Users Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            المستخدمين المتاحين ({availableUsers.length})
          </CardTitle>
          <Button onClick={loadAvailableUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {availableUsers.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-2">لا توجد مستخدمين محملين</p>
              <Button onClick={loadAvailableUsers} variant="outline" size="sm">
                تحميل المستخدمين
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">السائقين ({availableUsers.filter(u => u.role === 'driver').length})</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {availableUsers.filter(u => u.role === 'driver').map(user => {
                    const displayName = user.fullName || user.full_name || 
                      `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                      user.email || user.id;
                    return (
                      <div key={user.id} className="text-sm p-2 bg-gray-50 rounded">
                        {displayName}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">الركاب ({availableUsers.filter(u => u.role === 'passenger').length})</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {availableUsers.filter(u => u.role === 'passenger').map(user => {
                    const displayName = user.fullName || user.full_name || 
                      `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                      user.email || user.id;
                    return (
                      <div key={user.id} className="text-sm p-2 bg-gray-50 rounded">
                        {displayName}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Passenger Notifications */}
      {testData.passengerId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              إشعارات الراكب ({passengerNotifications.length})
            </CardTitle>
            <Button onClick={loadPassengerNotifications} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {passengerNotifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا توجد إشعارات تأكيد</p>
            ) : (
              <div className="space-y-3">
                {passengerNotifications.slice(0, 10).map((notification, index) => (
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
      )}
    </div>
  );
};

export default BookingConfirmationTestPage;

