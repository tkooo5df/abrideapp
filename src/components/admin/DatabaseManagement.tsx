import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Download,
  Upload,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Car,
  Route,
  Calendar,
  Bell,
  Shield,
  Settings,
  Eye
} from "lucide-react";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";
import { browserDatabase } from "@/integrations/database/browserDatabase";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { debugLocalStorage, clearLocalStorage, resetToDefaultData } from "@/utils/debugUtils";

const DatabaseManagement = () => {
  const [stats, setStats] = useState({
    users: 0,
    vehicles: 0,
    trips: 0,
    bookings: 0,
    notifications: 0
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load database statistics
  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await browserDatabase.getData();
      
      setStats({
        users: data.profiles.length,
        vehicles: data.vehicles.length,
        trips: data.trips.length,
        bookings: data.bookings.length,
        notifications: data.notifications.length
      });
    } catch (error) {
      toast({
        title: "خطأ في تحميل الإحصائيات",
        description: "حدث خطأ أثناء تحميل إحصائيات قاعدة البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const handleExportData = async () => {
    try {
      const data = await browserDatabase.getData();
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `dz-taxi-database-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      toast({
        title: "تم تصدير البيانات",
        description: "تم تصدير بيانات قاعدة البيانات بنجاح"
      });
    } catch (error) {
      toast({
        title: "خطأ في تصدير البيانات",
        description: "حدث خطأ أثناء تصدير بيانات قاعدة البيانات",
        variant: "destructive"
      });
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          // Save to localStorage
          localStorage.setItem('dz_taxi_database', JSON.stringify(data));
          
          toast({
            title: "تم استيراد البيانات",
            description: "تم استيراد بيانات قاعدة البيانات بنجاح"
          });
          
          // Reload stats
          loadStats();
          
          // Reset file input
          event.target.value = '';
        } catch (error) {
          toast({
            title: "خطأ في استيراد البيانات",
            description: "حدث خطأ أثناء تحليل ملف البيانات المستوردة",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      toast({
        title: "خطأ في استيراد البيانات",
        description: "حدث خطأ أثناء استيراد بيانات قاعدة البيانات",
        variant: "destructive"
      });
    }
  };

  const handleClearData = async () => {
    if (!window.confirm("هل أنت متأكد من مسح جميع بيانات قاعدة البيانات؟ هذا الإجراء لا يمكن التراجع عنه.")) {
      return;
    }

    try {
      await browserDatabase.clearAllData();
      
      toast({
        title: "تم مسح البيانات",
        description: "تم مسح جميع بيانات قاعدة البيانات بنجاح"
      });
      
      // Reset stats
      setStats({
        users: 0,
        vehicles: 0,
        trips: 0,
        bookings: 0,
        notifications: 0
      });
    } catch (error) {
      toast({
        title: "خطأ في مسح البيانات",
        description: "حدث خطأ أثناء مسح بيانات قاعدة البيانات",
        variant: "destructive"
      });
    }
  };

  const handleResetToDefault = async () => {
    if (!window.confirm("هل أنت متأكد من إعادة تعيين قاعدة البيانات إلى القيم الافتراضية؟")) {
      return;
    }

    try {
      await browserDatabase.resetToDefaultData();
      
      toast({
        title: "تم إعادة التعيين",
        description: "تم إعادة تعيين قاعدة البيانات إلى القيم الافتراضية بنجاح"
      });
      
      // Reload stats
      loadStats();
    } catch (error) {
      toast({
        title: "خطأ في إعادة التعيين",
        description: "حدث خطأ أثناء إعادة تعيين قاعدة البيانات",
        variant: "destructive"
      });
    }
  };

  // Debug functions
  const handleDebugData = () => {
    debugLocalStorage();
  };

  const handleClearLocalStorage = async () => {
    if (!window.confirm("هل أنت متأكد من مسح بيانات التخزين المحلي؟")) {
      return;
    }
    
    clearLocalStorage();
    loadStats();
    toast({
      title: "تم مسح بيانات التخزين المحلي",
      description: "تم مسح جميع بيانات التخزين المحلي بنجاح"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة قاعدة البيانات</h2>
          <p className="text-muted-foreground">مراقبة وإدارة بيانات النظام</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.users}</div>
                <div className="text-sm text-muted-foreground">المستخدمين</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.vehicles}</div>
                <div className="text-sm text-muted-foreground">المركبات</div>
              </div>
              <Car className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.trips}</div>
                <div className="text-sm text-muted-foreground">الرحلات</div>
              </div>
              <Route className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.bookings}</div>
                <div className="text-sm text-muted-foreground">الحجوزات</div>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.notifications}</div>
                <div className="text-sm text-muted-foreground">الإشعارات</div>
              </div>
              <Bell className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            عمليات قاعدة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="font-semibold">النسخ الاحتياطي</h3>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">تصدير البيانات</span>
                  <span className="sm:hidden">تصدير</span>
                </Button>
                
                <label className="flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full cursor-pointer"
                    onClick={() => document.getElementById('import-input')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">استيراد البيانات</span>
                    <span className="sm:hidden">استيراد</span>
                  </Button>
                  <input
                    id="import-input"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportData}
                  />
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">صيانة قاعدة البيانات</h3>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                  onClick={handleResetToDefault}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">إعادة التعيين</span>
                  <span className="sm:hidden">إعادة</span>
                </Button>
                
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={handleClearData}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">مسح جميع البيانات</span>
                  <span className="sm:hidden">مسح</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Debug Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-4">
              <h3 className="font-semibold">أدوات التصحيح</h3>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={handleDebugData}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">عرض بيانات التخزين</span>
                  <span className="sm:hidden">عرض</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={handleClearLocalStorage}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">مسح التخزين المحلي</span>
                  <span className="sm:hidden">مسح</span>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800">تحذير مهم</h4>
                <p className="text-sm text-yellow-700">
                  عمليات مسح البيانات وإعادة التعيين لا يمكن التراجع عنها. يُنصح بتصدير البيانات قبل تنفيذ هذه العمليات.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Health */}
      <Card>
        <CardHeader>
          <CardTitle>حالة قاعدة البيانات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium">الاتصال</div>
              <div className="text-sm text-green-600">متصل</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium">الحجم</div>
              <div className="text-sm text-green-600">ضمن الحدود المسموحة</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg md:col-span-1">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium">الأمان</div>
              <div className="text-sm text-green-600">آمن</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access to Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            الوصول السريع لإعدادات قاعدة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted rounded-lg">
            <div>
              <h3 className="font-semibold">هل تواجه مشكلة في حفظ البيانات؟</h3>
              <p className="text-sm text-muted-foreground">
                تحقق من إعدادات قاعدة البيانات لحل مشكلة الحفظ
              </p>
            </div>
            <Button onClick={() => navigate('/database-settings')}>
              <Settings className="h-4 w-4 mr-2" />
              إعدادات قاعدة البيانات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseManagement;