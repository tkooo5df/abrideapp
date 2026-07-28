import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Globe, 
  Bell, 
  Shield, 
  CreditCard, 
  Mail,
  Database,
  Zap,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Upload,
  Download,
  DollarSign
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";
import { useAuth } from "@/hooks/useAuth";

interface SystemConfig {
  siteName: string;
  siteDescription: string;
  supportPhone: string;
  supportEmail: string;
  defaultLanguage: string;
  enableNotifications: boolean;
  enableSMS: boolean;
  enableEmail: boolean;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  driverApprovalRequired: boolean;
  autoApproveDrivers: boolean;
  minBookingPrice: number;
  maxBookingPrice: number;
  cancellationFee: number;
  paymentMethods: {
    cash: boolean;
    baridimob: boolean;
    creditCard: boolean;
  };
}

const SystemSettings = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<SystemConfig>({
    siteName: "منصة أبريد",
    siteDescription: "أفضل خدمة نقل في الجزائر",
    supportPhone: "213559509817",
    supportEmail: "support@abride.online",
    defaultLanguage: "ar",
    enableNotifications: true,
    enableSMS: true,
    enableEmail: true,
    maintenanceMode: false,
    registrationEnabled: true,
    driverApprovalRequired: true,
    autoApproveDrivers: false,
    minBookingPrice: 500,
    maxBookingPrice: 10000,
    cancellationFee: 200,
    paymentMethods: {
      cash: true,
      baridimob: true,
      creditCard: false
    }
  });

  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoadingSettings(true);
        const settings = await BrowserDatabaseService.getSystemSettings();
        
        // Map settings to config
        const settingsMap: Record<string, any> = {};
        settings.forEach((setting: any) => {
          const key = setting.key;
          let value = setting.value;
          
          // Parse JSON values
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch {
              // Keep as string if not JSON
            }
          }
          
          settingsMap[key] = value;
        });

        // Update config with loaded settings
        setConfig(prev => ({
          ...prev,
          siteName: settingsMap.site_name || prev.siteName,
          siteDescription: settingsMap.site_description || prev.siteDescription,
          supportPhone: settingsMap.support_phone || prev.supportPhone,
          supportEmail: settingsMap.support_email || prev.supportEmail,
          defaultLanguage: settingsMap.default_language || prev.defaultLanguage,
          enableNotifications: settingsMap.enable_notifications !== undefined ? settingsMap.enable_notifications : prev.enableNotifications,
          enableSMS: settingsMap.enable_sms !== undefined ? settingsMap.enable_sms : prev.enableSMS,
          enableEmail: settingsMap.enable_email !== undefined ? settingsMap.enable_email : prev.enableEmail,
          maintenanceMode: settingsMap.maintenance_mode !== undefined ? settingsMap.maintenance_mode : prev.maintenanceMode,
          registrationEnabled: settingsMap.registration_enabled !== undefined ? settingsMap.registration_enabled : prev.registrationEnabled,
          driverApprovalRequired: settingsMap.driver_approval_required !== undefined ? settingsMap.driver_approval_required : prev.driverApprovalRequired,
          autoApproveDrivers: settingsMap.auto_approve_drivers !== undefined ? settingsMap.auto_approve_drivers : prev.autoApproveDrivers,
          minBookingPrice: settingsMap.min_booking_price || prev.minBookingPrice,
          maxBookingPrice: settingsMap.max_booking_price || prev.maxBookingPrice,
          cancellationFee: settingsMap.cancellation_fee || prev.cancellationFee,
        }));
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "خطأ في تحميل الإعدادات",
          description: "تم استخدام الإعدادات الافتراضية",
          variant: "destructive"
        });
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePaymentMethodChange = (method: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: enabled
      }
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save all settings to database
      const settingsToSave = [
        { key: 'site_name', value: JSON.stringify(config.siteName), description: 'اسم الموقع' },
        { key: 'site_description', value: JSON.stringify(config.siteDescription), description: 'وصف الموقع' },
        { key: 'support_phone', value: JSON.stringify(config.supportPhone), description: 'رقم الدعم الرئيسي' },
        { key: 'support_email', value: JSON.stringify(config.supportEmail), description: 'بريد الدعم الرسمي' },
        { key: 'default_language', value: JSON.stringify(config.defaultLanguage), description: 'اللغة الافتراضية' },
        { key: 'enable_notifications', value: JSON.stringify(config.enableNotifications), description: 'تفعيل الإشعارات' },
        { key: 'enable_sms', value: JSON.stringify(config.enableSMS), description: 'إشعارات SMS' },
        { key: 'enable_email', value: JSON.stringify(config.enableEmail), description: 'إشعارات البريد' },
        { key: 'maintenance_mode', value: JSON.stringify(config.maintenanceMode), description: 'وضع الصيانة' },
        { key: 'registration_enabled', value: JSON.stringify(config.registrationEnabled), description: 'تفعيل التسجيل' },
        { key: 'driver_approval_required', value: JSON.stringify(config.driverApprovalRequired), description: 'مراجعة طلبات السائقين' },
        { key: 'auto_approve_drivers', value: JSON.stringify(config.autoApproveDrivers), description: 'قبول السائقين الجدد تلقائياً (true) أو مراجعتهم بواسطة الأدمن (false)' },
        { key: 'min_booking_price', value: JSON.stringify(config.minBookingPrice), description: 'الحد الأدنى للسعر' },
        { key: 'max_booking_price', value: JSON.stringify(config.maxBookingPrice), description: 'الحد الأقصى للسعر' },
        { key: 'cancellation_fee', value: JSON.stringify(config.cancellationFee), description: 'رسوم الإلغاء' },
      ];

      // Save each setting
      for (const setting of settingsToSave) {
        await BrowserDatabaseService.updateSystemSetting(
          setting.key,
          setting.value,
          setting.description
        );
      }
      
      setLastSaved(new Date());
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات النظام بنجاح",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    // Reset to default values
    setConfig({
      siteName: "منصة أبريد",
      siteDescription: "أفضل خدمة نقل في الجزائر",
      supportPhone: "213559509817",
      supportEmail: "support@abride.online",
      defaultLanguage: "ar",
      enableNotifications: true,
      enableSMS: true,
      enableEmail: true,
      maintenanceMode: false,
      registrationEnabled: true,
      driverApprovalRequired: true,
      autoApproveDrivers: false,
      minBookingPrice: 500,
      maxBookingPrice: 10000,
      cancellationFee: 200,
      paymentMethods: {
        cash: true,
        baridimob: true,
        creditCard: false
      }
    });
    
    toast({
      title: "تم إعادة التعيين",
      description: "تم إعادة تعيين الإعدادات للقيم الافتراضية",
    });
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إعدادات النظام</h2>
          <p className="text-muted-foreground">تكوين وإدارة إعدادات الموقع</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetSettings} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            إعادة تعيين
          </Button>
          <Button onClick={handleSaveSettings} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>
      </div>

      {/* Last Saved Indicator */}
      {lastSaved && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            آخر حفظ: {lastSaved.toLocaleString('ar-DZ')}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              الإعدادات العامة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">اسم الموقع</Label>
              <Input
                id="siteName"
                value={config.siteName}
                onChange={(e) => handleConfigChange("siteName", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="siteDescription">وصف الموقع</Label>
              <Textarea
                id="siteDescription"
                value={config.siteDescription}
                onChange={(e) => handleConfigChange("siteDescription", e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supportPhone">رقم الدعم</Label>
              <Input
                id="supportPhone"
                value={config.supportPhone}
                onChange={(e) => handleConfigChange("supportPhone", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supportEmail">بريد الدعم</Label>
              <Input
                id="supportEmail"
                type="email"
                value={config.supportEmail}
                onChange={(e) => handleConfigChange("supportEmail", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultLanguage">اللغة الافتراضية</Label>
              <Select value={config.defaultLanguage} onValueChange={(value) => handleConfigChange("defaultLanguage", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-secondary" />
              إعدادات الإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableNotifications">تفعيل الإشعارات</Label>
                <p className="text-sm text-muted-foreground">إشعارات عامة للنظام</p>
              </div>
              <Switch
                id="enableNotifications"
                checked={config.enableNotifications}
                onCheckedChange={(checked) => handleConfigChange("enableNotifications", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableSMS">إشعارات SMS</Label>
                <p className="text-sm text-muted-foreground">رسائل نصية للمستخدمين</p>
              </div>
              <Switch
                id="enableSMS"
                checked={config.enableSMS}
                onCheckedChange={(checked) => handleConfigChange("enableSMS", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableEmail">إشعارات البريد</Label>
                <p className="text-sm text-muted-foreground">رسائل بريد إلكتروني</p>
              </div>
              <Switch
                id="enableEmail"
                checked={config.enableEmail}
                onCheckedChange={(checked) => handleConfigChange("enableEmail", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              إعدادات الأمان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenanceMode">وضع الصيانة</Label>
                <p className="text-sm text-muted-foreground">إيقاف الموقع مؤقتاً</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={config.maintenanceMode}
                onCheckedChange={(checked) => handleConfigChange("maintenanceMode", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="registrationEnabled">تفعيل التسجيل</Label>
                <p className="text-sm text-muted-foreground">السماح بتسجيل مستخدمين جدد</p>
              </div>
              <Switch
                id="registrationEnabled"
                checked={config.registrationEnabled}
                onCheckedChange={(checked) => handleConfigChange("registrationEnabled", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="driverApprovalRequired">موافقة السائقين</Label>
                <p className="text-sm text-muted-foreground">مراجعة طلبات السائقين</p>
              </div>
              <Switch
                id="driverApprovalRequired"
                checked={config.driverApprovalRequired}
                onCheckedChange={(checked) => handleConfigChange("driverApprovalRequired", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoApproveDrivers">قبول السائقين تلقائياً</Label>
                <p className="text-sm text-muted-foreground">
                  {config.autoApproveDrivers 
                    ? "السائقون الجدد سيتم قبولهم تلقائياً" 
                    : "السائقون الجدد يحتاجون مراجعة من الأدمن"}
                </p>
              </div>
              <Switch
                id="autoApproveDrivers"
                checked={config.autoApproveDrivers}
                onCheckedChange={(checked) => {
                  handleConfigChange("autoApproveDrivers", checked);
                  // إذا تم تفعيل القبول التلقائي، يجب تعطيل موافقة السائقين
                  if (checked) {
                    handleConfigChange("driverApprovalRequired", false);
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              إعدادات التسعير
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPrice">الحد الأدنى للسعر (دج)</Label>
                <Input
                  id="minPrice"
                  type="number"
                  value={config.minBookingPrice}
                  onChange={(e) => handleConfigChange("minBookingPrice", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPrice">الحد الأقصى للسعر (دج)</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  value={config.maxBookingPrice}
                  onChange={(e) => handleConfigChange("maxBookingPrice", parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cancellationFee">رسوم الإلغاء (دج)</Label>
                <Input
                  id="cancellationFee"
                  type="number"
                  value={config.cancellationFee}
                  onChange={(e) => handleConfigChange("cancellationFee", parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            طرق الدفع المتاحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-green-600" />
                <div>
                  <div className="font-medium">الدفع نقداً</div>
                  <div className="text-sm text-muted-foreground">دفع مباشر للسائق</div>
                </div>
              </div>
              <Switch
                checked={config.paymentMethods.cash}
                onCheckedChange={(checked) => handlePaymentMethodChange("cash", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="font-medium">بريدي موب</div>
                  <div className="text-sm text-muted-foreground">دفع إلكتروني</div>
                </div>
              </div>
              <Switch
                checked={config.paymentMethods.baridimob}
                onCheckedChange={(checked) => handlePaymentMethodChange("baridimob", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-purple-600" />
                <div>
                  <div className="font-medium">بطاقة ائتمان</div>
                  <div className="text-sm text-muted-foreground">قريباً</div>
                </div>
              </div>
              <Switch
                checked={config.paymentMethods.creditCard}
                onCheckedChange={(checked) => handlePaymentMethodChange("creditCard", checked)}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600" />
            حالة النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium">قاعدة البيانات</div>
              <div className="text-sm text-green-600">متصلة</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium">الخادم</div>
              <div className="text-sm text-green-600">يعمل بشكل طبيعي</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium">البريد الإلكتروني</div>
              <div className="text-sm text-green-600">متصل</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="font-medium">النسخ الاحتياطي</div>
              <div className="text-sm text-yellow-600">قيد التشغيل</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup and Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle>النسخ الاحتياطي والصيانة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">النسخ الاحتياطي</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  تحميل نسخة احتياطية
                </Button>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  استعادة من نسخة احتياطية
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">صيانة النظام</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  تحديث النظام
                </Button>
                <Button variant="outline" className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  تنظيف قاعدة البيانات
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;