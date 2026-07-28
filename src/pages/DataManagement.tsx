import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DataManagementSystem from '@/components/data/DataManagementSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Car, Calendar } from 'lucide-react';
import { useLocalAuth } from '@/hooks/useLocalAuth';

const DataManagement = () => {
  const { user } = useLocalAuth();
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  // Role-based access control
  const canAccessData = user?.role === 'admin' || user?.role === 'driver';

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">نظام إدارة البيانات</h1>
          <p className="text-muted-foreground">
            عرض وتحليل البيانات للرحلات والحجوزات بين جميع المستخدمين
          </p>
        </div>

        {!canAccessData ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                الوصول محدود
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">
                يجب أن تكون مسؤولاً أو سائقاً للوصول إلى نظام إدارة البيانات
              </p>
              <Button onClick={() => window.location.href = '/dashboard'}>
                العودة للوحة التحكم
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Role Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">المسافرون</h3>
                  <p className="text-2xl font-bold text-primary">1,248</p>
                  <p className="text-sm text-muted-foreground">مستخدم نشط</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">السائقون</h3>
                  <p className="text-2xl font-bold text-green-600">342</p>
                  <p className="text-sm text-muted-foreground">سائق موثوق</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">الرحلات</h3>
                  <p className="text-2xl font-bold text-blue-600">1,847</p>
                  <p className="text-sm text-muted-foreground">رحلة هذا الشهر</p>
                </CardContent>
              </Card>
            </div>

            {/* Data Management System */}
            <DataManagementSystem />
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default DataManagement;