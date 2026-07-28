import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Car, Users, MapPin, Phone, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [role, setRole] = useState<'driver' | 'passenger' | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    wilaya: '',
    // Driver specific
    vehicleType: '',
    vehicleNumber: '',
    // Common
    notes: ''
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const totalSteps = role === 'driver' ? 4 : 3;

  const handleRoleSelect = (selectedRole: 'driver' | 'passenger') => {
    setRole(selectedRole);
    setCurrentStep(2);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'خطأ',
        description: 'يرجى تسجيل الدخول أولاً',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Update profile with onboarding data
      const updates: any = {
        full_name: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        wilaya: formData.wilaya,
        role: role,
        onboarding_completed: true
      };

      if (role === 'driver') {
        updates.vehicle_type = formData.vehicleType;
        updates.vehicle_number = formData.vehicleNumber;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'تم حفظ البيانات بنجاح',
        description: 'مرحباً بك في منصة أبري!',
      });

      navigate('/');
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ البيانات',
        variant: 'destructive'
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">اختر نوع الحساب</h2>
              <p className="text-muted-foreground">ما نوع المستخدم الذي تريده؟</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
                onClick={() => handleRoleSelect('driver')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Car className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">سائق</h3>
                  <p className="text-sm text-muted-foreground">
                    سجل كسائق لإضافة رحلات وكسب المال
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
                onClick={() => handleRoleSelect('passenger')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">راكب</h3>
                  <p className="text-sm text-muted-foreground">
                    سجل كراكب لطلب رحلات مريحة وآمنة
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">المعلومات الشخصية</h2>
              <p className="text-muted-foreground">أدخل معلوماتك الأساسية</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">الاسم الكامل *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="أدخل اسمك الكامل"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">رقم الهاتف *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0555 12 34 56"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">العنوان *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="أدخل عنوانك"
                  required
                />
              </div>

              <div>
                <Label htmlFor="wilaya">الولاية *</Label>
                <Input
                  id="wilaya"
                  value={formData.wilaya}
                  onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                  placeholder="أدخل الولاية"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        if (role === 'driver') {
          return (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">معلومات المركبة</h2>
                <p className="text-muted-foreground">أدخل بيانات مركبتك</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="vehicleType">نوع المركبة *</Label>
                  <Input
                    id="vehicleType"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    placeholder="مثال: سيارة، دفع رباعي"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="vehicleNumber">رقم المركبة *</Label>
                  <Input
                    id="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    placeholder="مثال: 123456-78"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات إضافية</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="أي معلومات إضافية (اختياري)"
                  />
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">ملاحظات إضافية</h2>
                <p className="text-muted-foreground">أي معلومات ترغب في إضافتها</p>
              </div>

              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أي معلومات إضافية (اختياري)"
                />
              </div>
            </div>
          );
        }

      case 4:
        return (
          <div className="space-y-4 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">مراجعة المعلومات</h2>
            <p className="text-muted-foreground mb-6">تأكد من صحة جميع البيانات</p>

            <Card className="text-right">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الاسم الكامل:</span>
                  <span className="font-semibold">{formData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الهاتف:</span>
                  <span className="font-semibold">{formData.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العنوان:</span>
                  <span className="font-semibold">{formData.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الولاية:</span>
                  <span className="font-semibold">{formData.wilaya}</span>
                </div>
                {role === 'driver' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">نوع المركبة:</span>
                      <span className="font-semibold">{formData.vehicleType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">رقم المركبة:</span>
                      <span className="font-semibold">{formData.vehicleNumber}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 2:
        return formData.fullName && formData.phone && formData.address && formData.wilaya;
      case 3:
        if (role === 'driver') {
          return formData.vehicleType && formData.vehicleNumber;
        }
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                الخطوة {currentStep} من {totalSteps}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} />
          </div>

          {/* Step Content */}
          <div className="mb-8 min-h-[400px]">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                السابق
              </Button>
            )}
            
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1"
              >
                التالي
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="flex-1"
              >
                إنهاء التزويد
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;


