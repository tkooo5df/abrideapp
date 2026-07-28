import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { NotificationService } from '@/integrations/database/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';

const AdminNotificationTest = () => {
  const { user: supabaseUser } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal } = useDatabase();
  const { toast } = useToast();
  const user = isLocal ? localUser : supabaseUser;
  
  const [testData, setTestData] = useState({
    title: 'اختبار إشعار إداري',
    message: 'هذا إشعار تجريبي للتحقق من نظام الإشعارات',
    type: 'system_alert'
  });
  const [loading, setLoading] = useState(false);

  const handleTestNotification = async () => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Test getting admin users
      const adminUsers = await NotificationService.getAdminUsers();
      // Test sending notification to admins
      const result = await NotificationService.notifyAdminSystemAlert({
        alertType: 'system_error',
        severity: 'medium',
        message: testData.message,
        details: {
          testBy: user.email,
          timestamp: new Date().toISOString()
        }
      });
      toast({
        title: "نجاح",
        description: "تم إرسال الإشعار التجريبي بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إرسال الإشعار التجريبي",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdminUser = async () => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create a test admin user
      const adminUser = await BrowserDatabaseService.createAdminUser({
        id: `admin-${Date.now()}`,
        email: 'test-admin@dztaxi.dz',
        firstName: 'مدير',
        lastName: 'اختبار',
        fullName: 'مدير اختبار',
        phone: '+213 555 000 000',
        wilaya: 'الجزائر',
        commune: 'الجزائر الوسطى',
        address: 'شارع تجريبي'
      });
      toast({
        title: "نجاح",
        description: "تم إنشاء مستخدم إداري تجريبي",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء مستخدم إداري",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">اختبار نظام الإشعارات الإدارية</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-primary/10 p-4 rounded-lg">
          <h3 className="font-medium mb-2">معلومات المستخدم الحالي</h3>
          <p>البريد الإلكتروني: {user?.email || 'غير مسجل'}</p>
          <p>الدور: {user?.role || 'غير محدد'}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان الإشعار</Label>
            <Input
              id="title"
              value={testData.title}
              onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="أدخل عنوان الإشعار"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">رسالة الإشعار</Label>
            <Textarea
              id="message"
              value={testData.message}
              onChange={(e) => setTestData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="أدخل رسالة الإشعار"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleTestNotification} disabled={loading} className="flex-1">
              {loading ? "جاري الإرسال..." : "إرسال إشعار تجريبي"}
            </Button>
            <Button onClick={handleCreateAdminUser} disabled={loading} variant="secondary">
              {loading ? "جاري الإنشاء..." : "إنشاء مدير تجريبي"}
            </Button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">ملاحظات</h3>
          <ul className="text-sm text-yellow-700 list-disc pr-5 space-y-1">
            <li>استخدم هذا الاختبار للتحقق من عمل نظام الإشعارات الإدارية</li>
            <li>إذا لم تتلقَ إشعارات، فحاول إنشاء مستخدم إداري تجريبي</li>
            <li>تحقق من وحدة التحكم (Console) لمزيد من التفاصيل</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminNotificationTest;