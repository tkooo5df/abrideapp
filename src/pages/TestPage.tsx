import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TestTube, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Mail,
  MessageSquare,
  UserPlus,
  Database,
  Bell
} from 'lucide-react';
import { NotificationService } from '@/integrations/database/notificationService';
import { TelegramService } from '@/integrations/telegram/telegramService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface TestResult {
  id: string;
  test: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  timestamp: Date;
  duration?: number;
}

const TestPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  
  // Telegram test form
  const [telegramMessage, setTelegramMessage] = useState('رسالة اختبار من صفحة الاختبار');
  
  // Notification test form
  const [notificationTitle, setNotificationTitle] = useState('إشعار اختبار');
  const [notificationMessage, setNotificationMessage] = useState('هذه رسالة اختبار للإشعار');
  
  // New user registration test form
  const [testUserName, setTestUserName] = useState('مستخدم اختبار');
  const [testUserEmail, setTestUserEmail] = useState('test@example.com');
  const [testUserRole, setTestUserRole] = useState<'driver' | 'passenger'>('passenger');

  const addResult = (test: string, status: 'success' | 'error', message: string, duration?: number) => {
    const result: TestResult = {
      id: Date.now().toString(),
      test,
      status,
      message,
      timestamp: new Date(),
      duration
    };
    setResults(prev => [result, ...prev].slice(0, 20)); // Keep last 20 results
  };

  // Test Telegram notification
  const testTelegram = async () => {
    if (!telegramMessage.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال رسالة',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    
    try {
      const success = await TelegramService.sendMessage(telegramMessage);
      const duration = Date.now() - startTime;
      
      if (success) {
        addResult('Telegram', 'success', `تم إرسال الرسالة بنجاح في ${duration}ms`, duration);
        toast({
          title: 'نجاح',
          description: 'تم إرسال الرسالة عبر Telegram بنجاح'
        });
      } else {
        addResult('Telegram', 'error', 'فشل إرسال الرسالة', duration);
        toast({
          title: 'خطأ',
          description: 'فشل إرسال الرسالة عبر Telegram',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      addResult('Telegram', 'error', `خطأ: ${error.message || error}`, duration);
      toast({
        title: 'خطأ',
        description: `فشل إرسال الرسالة: ${error.message || error}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Test new user registration notification
  const testNewUserRegistration = async () => {
    if (!testUserName.trim() || !testUserEmail.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم المستخدم والبريد الإلكتروني',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    
    try {
      await NotificationService.notifyNewUserRegistration({
        userId: user?.id || 'test-user-id',
        userRole: testUserRole,
        userName: testUserName,
        userEmail: testUserEmail
      });
      
      const duration = Date.now() - startTime;
      addResult('New User Registration', 'success', `تم إرسال إشعار تسجيل مستخدم جديد بنجاح (Telegram فقط، بدون بريد إلكتروني) في ${duration}ms`, duration);
      toast({
        title: 'نجاح',
        description: 'تم إرسال إشعار تسجيل مستخدم جديد بنجاح'
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      addResult('New User Registration', 'error', `خطأ: ${error.message || error}`, duration);
      toast({
        title: 'خطأ',
        description: `فشل إرسال الإشعار: ${error.message || error}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Test in-app notification
  const testInAppNotification = async () => {
    if (!user) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول أولاً',
        variant: 'destructive'
      });
      return;
    }

    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال عنوان ورسالة الإشعار',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    
    try {
      await NotificationService.createNotification({
        userId: user.id,
        title: notificationTitle,
        message: notificationMessage,
        type: 'system' as any,
        category: 'system' as any,
        priority: 'medium' as any
      });
      
      const duration = Date.now() - startTime;
      addResult('In-App Notification', 'success', `تم إنشاء الإشعار بنجاح في ${duration}ms`, duration);
      toast({
        title: 'نجاح',
        description: 'تم إنشاء الإشعار بنجاح'
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      addResult('In-App Notification', 'error', `خطأ: ${error.message || error}`, duration);
      toast({
        title: 'خطأ',
        description: `فشل إنشاء الإشعار: ${error.message || error}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Test Telegram new user notification
  const testTelegramNewUser = async () => {
    if (!testUserName.trim() || !testUserEmail.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم المستخدم والبريد الإلكتروني',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    
    try {
      const success = await TelegramService.notifyNewUser({
        userName: testUserName,
        userRole: testUserRole,
        userEmail: testUserEmail,
        userId: user?.id || 'test-user-id'
      });
      
      const duration = Date.now() - startTime;
      
      if (success) {
        addResult('Telegram New User', 'success', `تم إرسال إشعار مستخدم جديد عبر Telegram بنجاح في ${duration}ms`, duration);
        toast({
          title: 'نجاح',
          description: 'تم إرسال إشعار مستخدم جديد عبر Telegram بنجاح'
        });
      } else {
        addResult('Telegram New User', 'error', 'فشل إرسال الإشعار', duration);
        toast({
          title: 'خطأ',
          description: 'فشل إرسال الإشعار عبر Telegram',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      addResult('Telegram New User', 'error', `خطأ: ${error.message || error}`, duration);
      toast({
        title: 'خطأ',
        description: `فشل إرسال الإشعار: ${error.message || error}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    toast({
      title: 'تم',
      description: 'تم مسح النتائج'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <TestTube className="h-8 w-8" />
              صفحة الاختبار
            </h1>
            <p className="text-muted-foreground mt-2">
              صفحة شاملة لاختبار جميع الوظائف
            </p>
          </div>

          <Tabs defaultValue="telegram" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="telegram">Telegram</TabsTrigger>
              <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
              <TabsTrigger value="registration">تسجيل مستخدم</TabsTrigger>
              <TabsTrigger value="results">النتائج</TabsTrigger>
            </TabsList>

            {/* Telegram Test */}
            <TabsContent value="telegram" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    اختبار Telegram
                  </CardTitle>
                  <CardDescription>
                    اختبار إرسال رسائل عبر Telegram
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="telegram-message">الرسالة</Label>
                    <Textarea
                      id="telegram-message"
                      value={telegramMessage}
                      onChange={(e) => setTelegramMessage(e.target.value)}
                      placeholder="أدخل الرسالة المراد إرسالها عبر Telegram"
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button 
                    onClick={testTelegram} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        إرسال عبر Telegram
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Test */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    اختبار الإشعارات
                  </CardTitle>
                  <CardDescription>
                    اختبار إنشاء إشعارات داخل التطبيق
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notification-title">عنوان الإشعار</Label>
                    <Input
                      id="notification-title"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      placeholder="أدخل عنوان الإشعار"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-message">رسالة الإشعار</Label>
                    <Textarea
                      id="notification-message"
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      placeholder="أدخل رسالة الإشعار"
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button 
                    onClick={testInAppNotification} 
                    disabled={loading || !user}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        إنشاء إشعار
                      </>
                    )}
                  </Button>
                  {!user && (
                    <p className="text-sm text-muted-foreground text-center">
                      يجب تسجيل الدخول لإنشاء إشعار
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* New User Registration Test */}
            <TabsContent value="registration" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    اختبار تسجيل مستخدم جديد
                  </CardTitle>
                  <CardDescription>
                    اختبار إرسال إشعارات تسجيل مستخدم جديد للمدير (Telegram فقط، بدون بريد إلكتروني)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-user-name">اسم المستخدم</Label>
                    <Input
                      id="test-user-name"
                      value={testUserName}
                      onChange={(e) => setTestUserName(e.target.value)}
                      placeholder="أدخل اسم المستخدم"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-user-email">البريد الإلكتروني</Label>
                    <Input
                      id="test-user-email"
                      type="email"
                      value={testUserEmail}
                      onChange={(e) => setTestUserEmail(e.target.value)}
                      placeholder="أدخل البريد الإلكتروني"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-user-role">الدور</Label>
                    <Select value={testUserRole} onValueChange={(value: 'driver' | 'passenger') => setTestUserRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passenger">راكب</SelectItem>
                        <SelectItem value="driver">سائق</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      onClick={testNewUserRegistration} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          اختبار إشعار تسجيل مستخدم جديد
                        </>
                      )}
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Button 
                      onClick={testTelegramNewUser} 
                      disabled={loading}
                      variant="outline"
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          اختبار Telegram مباشرة
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results */}
            <TabsContent value="results" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      نتائج الاختبارات
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearResults}
                      disabled={results.length === 0}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      مسح النتائج
                    </Button>
                  </div>
                  <CardDescription>
                    آخر {results.length} نتيجة اختبار
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد نتائج اختبار بعد</p>
                      <p className="text-sm mt-2">قم بتشغيل اختبارات لرؤية النتائج هنا</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {results.map((result) => (
                        <div
                          key={result.id}
                          className="p-4 border rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {result.status === 'success' ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-500" />
                              )}
                              <span className="font-semibold">{result.test}</span>
                              <Badge 
                                variant={result.status === 'success' ? 'default' : 'destructive'}
                              >
                                {result.status === 'success' ? 'نجح' : 'فشل'}
                              </Badge>
                            </div>
                            {result.duration && (
                              <span className="text-sm text-muted-foreground">
                                {result.duration}ms
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {result.timestamp.toLocaleString('ar-DZ', { 
                              timeZone: 'Africa/Algiers',
                              dateStyle: 'short',
                              timeStyle: 'medium'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TestPage;

