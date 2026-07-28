import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, 
  Check, 
  X, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw,
  Settings,
  Filter,
  BarChart3,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { NotificationService, NotificationType, NotificationCategory, NotificationPriority } from '@/integrations/database/notificationService';
import { NotificationScheduler } from '@/integrations/database/notificationScheduler';
import { NotificationPreferencesManager } from '@/integrations/database/notificationPreferences';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  actionUrl?: string;
  metadata?: any;
}

const NotificationCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0, recent: 0, weekly: 0 });
  const [preferences, setPreferences] = useState<any>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [queueStats, setQueueStats] = useState<any>(null);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const filters: any = {};
      if (selectedCategory !== 'all') {
        filters.category = selectedCategory;
      }
      if (selectedPriority !== 'all') {
        filters.priority = selectedPriority;
      }

      const [notificationsData, statsData, prefsData, queueData] = await Promise.all([
        NotificationService.getUserNotifications(user.id, filters),
        NotificationService.getNotificationStats(user.id),
        NotificationPreferencesManager.getUserPreferences(user.id),
        NotificationScheduler.getQueueStats()
      ]);

      setNotifications(notificationsData);
      setStats(statsData);
      setPreferences(prefsData);
      setQueueStats(queueData);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الإشعارات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user, selectedCategory, selectedPriority]);

  // Update preferences
  const updatePreferences = async (updates: any) => {
    if (!user) return;

    try {
      const updatedPrefs = await NotificationPreferencesManager.updateUserPreferences(user.id, updates);
      setPreferences(updatedPrefs);
      toast({
        title: "تم التحديث",
        description: "تم حفظ إعدادات الإشعارات"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setStats(prev => ({ ...prev, unread: prev.unread - 1 }));
      
      toast({
        title: "تم التحديث",
        description: "تم تمييز الإشعار كمقروء",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الإشعار",
        variant: "destructive"
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(unreadNotifications.map(n => NotificationService.markAsRead(n.id)));
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setStats(prev => ({ ...prev, unread: 0 }));
      
      toast({
        title: "تم التحديث",
        description: "تم تمييز جميع الإشعارات كمقروءة",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الإشعارات",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  // Handle notification click - redirect to relevant dashboard section
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if not already read
      if (!notification.isRead) {
        await handleMarkAsRead(notification.id);
      }

      // Navigate based on notification type and user role
      if (user?.role === 'driver' && notification.type === 'booking_created') {
        // Navigate to driver dashboard bookings tab
        navigate('/user-dashboard?tab=bookings');
        toast({
          title: "تم التوجيه",
          description: "تم توجيهك إلى صفحة الحجوزات لمراجعة الطلب الجديد",
        });
      } else if (user?.role === 'passenger' && notification.type === 'booking_confirmed') {
        // Navigate to passenger dashboard bookings tab
        navigate('/user-dashboard?tab=bookings');
        toast({
          title: "تم التوجيه",
          description: "تم توجيهك إلى صفحة حجوزاتك",
        });
      } else if (notification.type === 'trip_cancelled' && notification.relatedId) {
        // Navigate to trip details page for cancellation notifications
        navigate(`/trip/${notification.relatedId}`);
        toast({
          title: "تم التوجيه",
          description: "تم توجيهك إلى تفاصيل الرحلة الملغاة",
        });
      } else if (notification.relatedType === 'trip' && notification.relatedId) {
        // Navigate to trip details page if tripId is available
        navigate(`/trip/${notification.relatedId}`);
      } else if (notification.relatedType === 'trip') {
        // Fallback to trips tab if no tripId
        navigate('/user-dashboard?tab=trips');
      } else if (user?.role === 'admin') {
        // Navigate to admin dashboard
        navigate('/user-dashboard');
        toast({
          title: "تم التوجيه",
          description: "تم توجيهك إلى لوحة الإدارة",
        });
      } else {
        // Default navigation to user dashboard
        navigate('/user-dashboard');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء فتح الإشعار",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_created':
      case 'booking_confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'booking_cancelled':
        return <X className="h-4 w-4 text-red-600" />;
      case 'trip_created':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'system_alert':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'welcome':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationPriority = (type: string) => {
    switch (type) {
      case 'booking_created':
      case 'booking_confirmed':
        return 'high';
      case 'booking_cancelled':
        return 'medium';
      case 'trip_created':
        return 'low';
      default:
        return 'low';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'الآن';
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    if (diffInHours < 48) return 'أمس';
    return date.toLocaleDateString('ar-DZ');
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const recentNotifications = notifications.filter(n => {
    const notificationDate = new Date(n.createdAt);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return notificationDate > oneDayAgo;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="mr-2">جاري تحميل الإشعارات...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              مركز الإشعارات
            </CardTitle>
            <CardDescription>
              إدارة وإشعارات النظام
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            
            <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>📊 إحصائيات الإشعارات</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {queueStats && (
                    <div>
                      <h4 className="font-medium mb-2">حالة الطابور</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="text-xl font-bold">{queueStats.pending}</div>
                          <div className="text-sm">في الانتظار</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="text-xl font-bold">{queueStats.sent}</div>
                          <div className="text-sm">مرسل</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="text-xl font-bold">{queueStats.failed}</div>
                          <div className="text-sm">فاشل</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>⚙️ إعدادات الإشعارات</DialogTitle>
                </DialogHeader>
                {preferences && (
                  <div className="space-y-6">
                    {/* Global Settings */}
                    <div>
                      <h4 className="font-medium mb-3">إعدادات عامة</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>تفعيل الإشعارات</Label>
                          <Switch
                            checked={preferences.enableNotifications}
                            onCheckedChange={(checked) => updatePreferences({ enableNotifications: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>إشعارات فورية</Label>
                          <Switch
                            checked={preferences.enablePushNotifications}
                            onCheckedChange={(checked) => updatePreferences({ enablePushNotifications: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>إشعارات البريد الإلكتروني</Label>
                          <Switch
                            checked={preferences.enableEmailNotifications}
                            onCheckedChange={(checked) => updatePreferences({ enableEmailNotifications: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>رسائل نصية</Label>
                          <Switch
                            checked={preferences.enableSMSNotifications}
                            onCheckedChange={(checked) => updatePreferences({ enableSMSNotifications: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quiet Hours */}
                    <div>
                      <h4 className="font-medium mb-3">ساعات الهدوء</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>تفعيل ساعات الهدوء</Label>
                          <Switch
                            checked={preferences.quietHoursEnabled}
                            onCheckedChange={(checked) => updatePreferences({ quietHoursEnabled: checked })}
                          />
                        </div>
                        {preferences.quietHoursEnabled && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>بداية</Label>
                              <input
                                type="time"
                                value={preferences.quietHoursStart}
                                onChange={(e) => updatePreferences({ quietHoursStart: e.target.value })}
                                className="w-full p-2 border rounded"
                              />
                            </div>
                            <div>
                              <Label>نهاية</Label>
                              <input
                                type="time"
                                value={preferences.quietHoursEnd}
                                onChange={(e) => updatePreferences({ quietHoursEnd: e.target.value })}
                                className="w-full p-2 border rounded"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rate Limits */}
                    <div>
                      <h4 className="font-medium mb-3">حدود التردد</h4>
                      <div className="space-y-4">
                        <div>
                          <Label>أقصى عدد في الساعة: {preferences.maxNotificationsPerHour}</Label>
                          <Slider
                            value={[preferences.maxNotificationsPerHour]}
                            onValueChange={([value]) => updatePreferences({ maxNotificationsPerHour: value })}
                            max={50}
                            min={1}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>أقصى عدد في اليوم: {preferences.maxNotificationsPerDay}</Label>
                          <Slider
                            value={[preferences.maxNotificationsPerDay]}
                            onValueChange={([value]) => updatePreferences({ maxNotificationsPerDay: value })}
                            max={200}
                            min={5}
                            step={5}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sound Settings */}
                    <div>
                      <h4 className="font-medium mb-3">إعدادات الصوت</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>تفعيل الصوت</Label>
                          <Switch
                            checked={preferences.soundEnabled}
                            onCheckedChange={(checked) => updatePreferences({ soundEnabled: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>تفعيل الاهتزاز</Label>
                          <Switch
                            checked={preferences.vibrationEnabled}
                            onCheckedChange={(checked) => updatePreferences({ vibrationEnabled: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            
            {unreadNotifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                تمييز الكل كمقروء
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">إجمالي</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
            <div className="text-sm text-muted-foreground">غير مقروء</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.recent}</div>
            <div className="text-sm text-muted-foreground">حديث</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.weekly || 0}</div>
            <div className="text-sm text-muted-foreground">هذا الأسبوع</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Label className="text-sm font-medium">تصفية حسب الفئة</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                <SelectItem value="booking">الحجوزات</SelectItem>
                <SelectItem value="trip">الرحلات</SelectItem>
                <SelectItem value="payment">المدفوعات</SelectItem>
                <SelectItem value="account">الحساب</SelectItem>
                <SelectItem value="system">النظام</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium">تصفية حسب الأولوية</Label>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستويات</SelectItem>
                <SelectItem value="critical">حرجة</SelectItem>
                <SelectItem value="urgent">عاجلة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              الكل ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              غير مقروء ({unreadNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="recent">
              حديث ({recentNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد إشعارات</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-all hover:shadow-md cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-background hover:bg-muted/50'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`font-medium ${!notification.isRead ? 'text-blue-900' : 'text-foreground'}`}>
                                {notification.title}
                              </h4>
                              <p className={`text-sm mt-1 ${!notification.isRead ? 'text-blue-700' : 'text-muted-foreground'}`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(notification.createdAt)}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    getNotificationPriority(notification.type) === 'high' 
                                      ? 'border-red-200 text-red-700' 
                                      : 'border-gray-200 text-gray-700'
                                  }`}
                                >
                                  {notification.type}
                                </Badge>
                                {(notification.type === 'booking_created' || notification.type === 'booking_confirmed') && (
                                  <Badge variant="secondary" className="text-xs">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    انقر للعرض
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="space-y-2">
            <ScrollArea className="h-96">
              {unreadNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>جميع الإشعارات مقروءة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border rounded-lg bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-all"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-blue-900">
                                {notification.title}
                              </h4>
                              <p className="text-sm mt-1 text-blue-700">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(notification.createdAt)}
                                </span>
                                {(notification.type === 'booking_created' || notification.type === 'booking_confirmed') && (
                                  <Badge variant="secondary" className="text-xs">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    انقر للعرض
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recent" className="space-y-2">
            <ScrollArea className="h-96">
              {recentNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد إشعارات حديثة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-all hover:shadow-md cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-background hover:bg-muted/50'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`font-medium ${!notification.isRead ? 'text-blue-900' : 'text-foreground'}`}>
                                {notification.title}
                              </h4>
                              <p className={`text-sm mt-1 ${!notification.isRead ? 'text-blue-700' : 'text-muted-foreground'}`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(notification.createdAt)}
                                </span>
                                {(notification.type === 'booking_created' || notification.type === 'booking_confirmed') && (
                                  <Badge variant="secondary" className="text-xs">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    انقر للعرض
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
