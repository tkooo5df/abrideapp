import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { testDataIsolation, resetTestData } from '@/integrations/database/testAccounts';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  PlayCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Shield,
  Users,
  Database,
  TestTube,
  Loader2
} from 'lucide-react';

const DataIsolationTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const runIsolationTests = async () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      const results = await testDataIsolation();
      setTestResults(results);
      
      if (results.success) {
        toast({
          title: "جميع الاختبارات نجحت! 🎉",
          description: "تم التحقق من عزل البيانات وعدم وجود تضارب",
        });
      } else {
        toast({
          title: "فشل في الاختبار ❌",
          description: results.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      setTestResults({
        success: false,
        message: 'فشل في تنفيذ الاختبارات',
        details: null
      });
      toast({
        title: "خطأ في تنفيذ الاختبار",
        description: "حدث خطأ أثناء تنفيذ اختبارات العزل",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const resetTestDatabase = async () => {
    try {
      await resetTestData();
      setTestResults(null);
      toast({
        title: "تم إعادة تعيين البيانات",
        description: "تم مسح جميع البيانات التجريبية",
      });
    } catch (error) {
      toast({
        title: "خطأ في إعادة التعيين",
        description: "فشل في مسح البيانات التجريبية",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <TestTube className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">اختبار عزل البيانات</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            اختبار شامل للتحقق من عزل البيانات بين الحسابات المختلفة وعدم وجود تضارب في البيانات
          </p>
        </div>

        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>لوحة التحكم في الاختبارات</span>
            </CardTitle>
            <CardDescription>
              تشغيل اختبارات العزل وإدارة البيانات التجريبية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={runIsolationTests} 
                disabled={isRunning}
                className="flex-1"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    جاري تنفيذ الاختبارات...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    تشغيل اختبارات العزل
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={resetTestDatabase}
                disabled={isRunning}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                إعادة تعيين البيانات
              </Button>
            </div>
            
            {testResults && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                {getStatusIcon(testResults.success)}
                <span className="font-medium">
                  {testResults.success ? 'جميع الاختبارات نجحت' : 'فشل في بعض الاختبارات'}
                </span>
                <Badge variant={testResults.success ? 'default' : 'destructive'}>
                  {testResults.success ? 'نجح' : 'فشل'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <span>نتائج الاختبار</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {testResults.details && Object.entries(testResults.details).map(([test, passed]) => (
                  <div key={test} className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    {getStatusIcon(passed as boolean)}
                    <span className="text-sm">
                      {test === 'vehicleIsolation' && 'عزل المركبات'}
                      {test === 'tripIsolation' && 'عزل الرحلات'}
                      {test === 'bookingIsolation' && 'عزل الحجوزات'}
                      {test === 'crossContaminationPrevention' && 'منع التلوث المتبادل'}
                      {test === 'adminAccess' && 'صلاحيات المدير'}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>الرسالة:</strong> {testResults.message}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>معلومات الاختبار</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">ما يتم اختباره:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• عزل البيانات بين السائقين</li>
                  <li>• عزل البيانات بين الركاب</li>
                  <li>• صحة صلاحيات الأدوار</li>
                  <li>• منع التسرب بين الحسابات</li>
                  <li>• صحة نظام الحجوزات</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">الحسابات التجريبية:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• driver@test.com (سائق)</li>
                  <li>• passenger@test.com (راكب)</li>
                  <li>• admin@test.com (مدير)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default DataIsolationTest;