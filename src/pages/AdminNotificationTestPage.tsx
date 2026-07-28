import { useState, useEffect } from 'react';
import AdminNotificationTest from '@/components/admin/AdminNotificationTest';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AdminNotificationTestPage = () => {
  const { user: supabaseUser, loading: supabaseLoading } = useAuth();
  const { user: localUser, loading: localLoading } = useLocalAuth();
  const { isLocal } = useDatabase();
  const navigate = useNavigate();
  const user = isLocal ? localUser : supabaseUser;
  const loading = isLocal ? localLoading : supabaseLoading;

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      setIsAdmin(user.role === 'admin' || user.role === 'developer');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">الوصول مرفوض</h1>
          <p className="mb-6">يجب تسجيل الدخول للوصول إلى هذه الصفحة</p>
          <Button onClick={() => navigate('/login')}>
            الذهاب إلى صفحة تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">الوصول مرفوض</h1>
          <p className="mb-6">لا تملك الصلاحيات اللازمة للوصول إلى هذه الصفحة</p>
          <Button onClick={() => navigate('/')}>
            العودة إلى الصفحة الرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">اختبار نظام الإشعارات الإدارية</h1>
        <Button onClick={() => navigate(-1)} variant="outline">
          العودة
        </Button>
      </div>
      
      <AdminNotificationTest />
    </div>
  );
};

export default AdminNotificationTestPage;