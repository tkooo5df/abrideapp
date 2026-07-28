import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Car, Users, MapPin, Phone, CheckCircle, User, Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { wilayas } from '@/data/wilayas';
import { useAuth } from '@/hooks/useAuth';
import { resizeImage, uploadAvatar } from '@/utils/avatarUpload';

interface FormData {
  // Common fields
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  age: string;
  ksar: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  // Driver specific fields
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  plateNumber: string;
  seats: string;
  category: string;
}

const GoogleSignUpSlides = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [role, setRole] = useState<'driver' | 'passenger' | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    firstName: '',
    lastName: '',
    phone: '',
    wilaya: '',
    commune: '',
    address: '',
    age: '',
    ksar: '',
    avatarFile: null,
    avatarPreview: null,
    // Driver specific
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    plateNumber: '',
    seats: '',
    category: '',
  });

  // القصور الـ7 لواد مزاب
  const ksour = [
    { value: "قصر بريان", label: "قصر بريان" },
    { value: "قصر القرارة", label: "قصر القرارة" },
    { value: "قصر بني يزقن", label: "قصر بني يزقن" },
    { value: "قصر العطف", label: "قصر العطف" },
    { value: "قصر غرداية", label: "قصر غرداية" },
    { value: "قصر بنورة", label: "قصر بنورة" },
    { value: "قصر مليكة", label: "قصر مليكة" },
  ];
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const totalSteps = role === 'driver' ? 4 : 3;

  // Load existing profile data if available
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) {
        navigate('/auth/signin');
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          return;
        }

        if (profile) {
          setFormData({
            fullName: '', // Not used anymore, but kept for compatibility
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            phone: profile.phone || '',
            wilaya: profile.wilaya || '',
            commune: profile.commune || '',
            address: profile.address || '',
            age: profile.age ? String(profile.age) : '',
            ksar: profile.ksar || '',
            avatarFile: null,
            avatarPreview: profile.avatar_url || null,
            // Driver specific
            vehicleBrand: profile.vehicle_brand || '',
            vehicleModel: profile.vehicle_model || '',
            vehicleYear: profile.vehicle_year || '',
            vehicleColor: profile.vehicle_color || '',
            plateNumber: profile.vehicle_plate || '',
            seats: profile.vehicle_seats || '',
            category: profile.vehicle_category || '',
          });

          // If role is already set, use it
          if (profile.role) {
            setRole(profile.role as 'driver' | 'passenger');
          }
        }
      } catch (error) {
      }
    };

    loadProfileData();
  }, [user, navigate]);

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
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 2) {
      // Go back to role selection
      setCurrentStep(1);
      setRole(null);
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
      // Upload avatar if selected
      let avatarUrl = formData.avatarPreview;
      if (formData.avatarFile) {
        try {
          avatarUrl = await uploadAvatar(formData.avatarFile, user.id);
          toast({
            title: 'تم رفع الصورة',
            description: 'تم رفع صورة الملف الشخصي بنجاح',
          });
        } catch (avatarError) {
          toast({
            title: 'تحذير',
            description: 'حدث خطأ أثناء رفع الصورة، سيتم المتابعة بدونها',
            variant: 'default'
          });
        }
      }

      // Update profile with onboarding data
      const updates: any = {
        full_name: formData.fullName,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        wilaya: formData.wilaya,
        commune: formData.commune,
        address: formData.address,
        age: formData.age ? parseInt(formData.age, 10) : null,
        ksar: formData.ksar || null,
        role: role,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      // Add avatar URL if available
      if (avatarUrl) {
        updates.avatar_url = avatarUrl;
      }

      if (role === 'driver') {
        updates.vehicle_brand = formData.vehicleBrand;
        updates.vehicle_model = formData.vehicleModel;
        updates.vehicle_year = formData.vehicleYear;
        updates.vehicle_color = formData.vehicleColor;
        updates.vehicle_plate = formData.plateNumber;
        updates.vehicle_seats = formData.seats;
        updates.vehicle_category = formData.category;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'تم حفظ البيانات بنجاح',
        description: 'مرحباً بك في منصة abride!',
      });

      // Clean up the flag
      localStorage.removeItem('googleSignUpInProgress');
      
      navigate('/');
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ البيانات',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset ksar if wilaya is not Ghardaïa (47)
    if (field === 'wilaya' && value !== '47') {
      setFormData(prev => ({ ...prev, ksar: '' }));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار ملف صورة',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطأ',
        description: 'حجم الصورة يجب أن يكون أقل من 5MB',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Resize image
      const resizedBlob = await resizeImage(file, 400, 400, 200);
      const resizedFile = new File([resizedBlob], file.name, { type: file.type });

      // Create preview URL
      const previewUrl = URL.createObjectURL(resizedFile);

        setFormData(prev => ({
          ...prev,
        avatarFile: resizedFile,
        avatarPreview: previewUrl
        }));
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء معالجة الصورة',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveAvatar = () => {
        setFormData(prev => ({
          ...prev,
      avatarFile: null,
      avatarPreview: null
        }));
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
              <h2 className="text-2xl font-bold mb-2">
                {role === 'driver' ? 'معلومات السائق' : 'معلومات الراكب'}
              </h2>
              <p className="text-muted-foreground">أدخل معلوماتك الأساسية</p>
            </div>

            <div className="space-y-4">
              {/* الاسم الأول */}
              <div>
                  <Label htmlFor="firstName">الاسم الأول *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="الاسم الأول"
                    required
                  />
                </div>

              {/* اسم العائلة */}
                <div>
                  <Label htmlFor="lastName">اسم العائلة *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="اسم العائلة"
                    required
                  />
                </div>

              {/* صورة الملف الشخصي (اختياري) */}
              <div className="flex flex-col items-center mb-4">
                <Label htmlFor="avatar" className="mb-2">صورة الملف الشخصي (اختياري)</Label>
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={formData.avatarPreview || undefined} />
                    <AvatarFallback>
                      <User className="w-12 h-12" />
                    </AvatarFallback>
                  </Avatar>
                  {formData.avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar')?.click()}
                  className="mt-2"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {formData.avatarPreview ? 'تغيير الصورة' : 'اختر صورة'}
                </Button>
              </div>

              {/* رقم الهاتف */}
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="0555 12 34 56"
                />
              </div>

              {/* الولاية */}
                <div>
                <Label htmlFor="wilaya">الولاية *</Label>
                  <Select value={formData.wilaya} onValueChange={(value) => handleInputChange('wilaya', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الولاية" />
                    </SelectTrigger>
                    <SelectContent>
                      {wilayas.map((w) => (
                        <SelectItem key={w.code} value={w.code}>
                          {w.code} - {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              {/* السن */}
              <div>
                <Label htmlFor="age">السن *</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="أدخل سنك"
                  required
                />
              </div>

              {/* القصر (يظهر فقط إذا كانت الولاية 47) */}
              {formData.wilaya === '47' && (
                <div>
                  <Label htmlFor="ksar">القصر *</Label>
                  <Select value={formData.ksar} onValueChange={(value) => handleInputChange('ksar', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القصر" />
                    </SelectTrigger>
                    <SelectContent>
                      {ksour.map((ksar) => (
                        <SelectItem key={ksar.value} value={ksar.value}>
                          {ksar.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* البلدية */}
                <div>
                  <Label htmlFor="commune">البلدية</Label>
                  <Input
                    id="commune"
                    value={formData.commune}
                    onChange={(e) => handleInputChange('commune', e.target.value)}
                    placeholder="أدخل البلدية"
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicleBrand">ماركة المركبة *</Label>
                    <Input
                      id="vehicleBrand"
                      value={formData.vehicleBrand}
                      onChange={(e) => handleInputChange('vehicleBrand', e.target.value)}
                      placeholder="تويوتا، هيونداي..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleModel">الموديل *</Label>
                    <Input
                      id="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                      placeholder="كورولا، أكسنت..."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicleYear">سنة الصنع *</Label>
                    <Input
                      id="vehicleYear"
                      value={formData.vehicleYear}
                      onChange={(e) => handleInputChange('vehicleYear', e.target.value)}
                      placeholder="2020"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleColor">اللون *</Label>
                    <Input
                      id="vehicleColor"
                      value={formData.vehicleColor}
                      onChange={(e) => handleInputChange('vehicleColor', e.target.value)}
                      placeholder="أبيض، أسود..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="plateNumber">رقم اللوحة *</Label>
                  <Input
                    id="plateNumber"
                    value={formData.plateNumber}
                    onChange={(e) => handleInputChange('plateNumber', e.target.value)}
                    placeholder="16-123-45"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seats">عدد المقاعد *</Label>
                    <Select value={formData.seats} onValueChange={(value) => handleInputChange('seats', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر عدد المقاعد" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 مقعد</SelectItem>
                        <SelectItem value="2">2 مقعد</SelectItem>
                        <SelectItem value="3">3 مقاعد</SelectItem>
                        <SelectItem value="4">4 مقاعد</SelectItem>
                        <SelectItem value="5">5 مقاعد</SelectItem>
                        <SelectItem value="6">6 مقاعد</SelectItem>
                        <SelectItem value="7">7 مقاعد</SelectItem>
                        <SelectItem value="8">8 مقاعد (نقل)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">فئة المركبة</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economy">اقتصادي</SelectItem>
                        <SelectItem value="comfort">مريح</SelectItem>
                        <SelectItem value="premium">فاخر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">مراجعة المعلومات</h2>
                <p className="text-muted-foreground">تأكد من صحة جميع البيانات</p>
              </div>

              <Card className="text-right">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الاسم الأول:</span>
                    <span className="font-semibold">{formData.firstName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">اسم العائلة:</span>
                    <span className="font-semibold">{formData.lastName}</span>
                  </div>
                  {formData.avatarPreview && (
                    <div className="flex justify-center my-2">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={formData.avatarPreview} />
                        <AvatarFallback>
                          <User className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم الهاتف:</span>
                    <span className="font-semibold">{formData.phone || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الولاية:</span>
                    <span className="font-semibold">
                      {formData.wilaya ? wilayas.find(w => w.code === formData.wilaya)?.name : 'غير محددة'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">السن:</span>
                    <span className="font-semibold">{formData.age || 'غير محدد'}</span>
                  </div>
                  {formData.wilaya === '47' && formData.ksar && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">القصر:</span>
                      <span className="font-semibold">{formData.ksar}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">البلدية:</span>
                    <span className="font-semibold">{formData.commune || 'غير محدد'}</span>
                  </div>
                </CardContent>
              </Card>
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
                  <span className="text-muted-foreground">الاسم الأول:</span>
                  <span className="font-semibold">{formData.firstName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">اسم العائلة:</span>
                  <span className="font-semibold">{formData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الهاتف:</span>
                  <span className="font-semibold">{formData.phone || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الولاية:</span>
                  <span className="font-semibold">
                    {formData.wilaya ? wilayas.find(w => w.code === formData.wilaya)?.name : 'غير محددة'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">السن:</span>
                  <span className="font-semibold">{formData.age || 'غير محدد'}</span>
                </div>
                {formData.wilaya === '47' && formData.ksar && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">القصر:</span>
                    <span className="font-semibold">{formData.ksar}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">البلدية:</span>
                  <span className="font-semibold">{formData.commune || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العنوان:</span>
                  <span className="font-semibold">{formData.address || 'غير محدد'}</span>
                </div>
                {role === 'driver' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ماركة المركبة:</span>
                      <span className="font-semibold">{formData.vehicleBrand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الموديل:</span>
                      <span className="font-semibold">{formData.vehicleModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">رقم اللوحة:</span>
                      <span className="font-semibold">{formData.plateNumber}</span>
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
      case 1:
        return true;
      case 2:
        // Required fields: firstName, lastName, wilaya, age
        // ksar is required only if wilaya is 47 (Ghardaïa)
        const basicFieldsValid = formData.firstName && 
                                 formData.lastName && 
                                 formData.wilaya && 
                                 formData.age;
        const ksarValid = formData.wilaya !== '47' || (formData.ksar && formData.ksar.trim() !== '');
        return basicFieldsValid && ksarValid;
      case 3:
        if (role === 'driver') {
          return formData.vehicleBrand && formData.vehicleModel && formData.vehicleYear && 
                 formData.vehicleColor && formData.plateNumber && formData.seats;
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
                الخطوة {currentStep - 1} من {totalSteps}
              </span>
              <span className="text-sm text-muted-foreground">
                {totalSteps > 0 ? Math.round(((currentStep - 1) / totalSteps) * 100) : 0}%
              </span>
            </div>
            <Progress value={totalSteps > 0 ? ((currentStep - 1) / totalSteps) * 100 : 0} />
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
                إنهاء التسجيل
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleSignUpSlides;