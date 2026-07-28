import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle,
  ArrowRight,
  Star,
  DollarSign,
  Clock,
  Shield
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { wilayas } from "@/data/wilayas";
import { useNavigate } from "react-router-dom";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";

const DriverOnboardingTest = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useLocalAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    email: user?.email || "",
    wilaya: user?.wilaya || "",
    commune: user?.commune || "",
    address: user?.address || "",
    
    // Vehicle Info
    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleColor: "",
    plateNumber: "",
    seats: "",
    category: "",
    
    // Experience
    experience: "",
    motivation: ""
  });

  const vehicleCategories = [
    { value: "economy", label: "اقتصادي" },
    { value: "comfort", label: "مريح" },
    { value: "premium", label: "فاخر" }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "دخل إضافي",
      description: "اكسب حتى 50,000 دج شهرياً"
    },
    {
      icon: Clock,
      title: "مرونة في العمل",
      description: "اختر أوقات عملك بحرية"
    },
    {
      icon: Shield,
      title: "تأمين شامل",
      description: "حماية كاملة لك ولمركبتك"
    },
    {
      icon: Star,
      title: "تقييم عالي",
      description: "بناء سمعة مهنية ممتازة"
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    await handleDriverApplication();
  };

  const handleDriverApplication = async () => {
    try {
      // Update user profile with driver information
      if (user) {
        await updateProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          fullName: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          wilaya: formData.wilaya,
          commune: formData.commune,
          address: formData.address,
          role: 'driver'
        });
      }

      // Create vehicle for the driver
      const vehicle = await BrowserDatabaseService.createVehicle({
        driverId: user!.id,
        make: formData.vehicleBrand,
        model: formData.vehicleModel,
        year: parseInt(formData.vehicleYear),
        color: formData.vehicleColor,
        licensePlate: formData.plateNumber,
        seats: parseInt(formData.seats)
      });

      // Create a notification for the driver
      await BrowserDatabaseService.createNotification({
        userId: user!.id,
        title: "مرحبا بك كسائق",
        message: `مرحبا بك في منصة أبريد. تم إنشاء حسابك كسائق ومركبة ${formData.vehicleBrand} ${formData.vehicleModel} بنجاح.`,
        type: "system"
      });

      alert("تم إنشاء حسابك كسائق بنجاح! سيتم تحويلك إلى لوحة التحكم.");
      navigate("/dashboard");
    } catch (error) {
      alert("حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="bg-gradient-primary rounded-xl p-8 text-white mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              انضم إلى شبكة سائقي منصة أبريد
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              كن جزءاً من أكبر شبكة نقل في الجزائر واكسب دخلاً إضافياً مع مرونة كاملة في العمل
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              {currentStep === 1 && "المعلومات الشخصية"}
              {currentStep === 2 && "معلومات المركبة"}
              {currentStep === 3 && "معلومات إضافية"}
            </CardTitle>
            <CardDescription className="text-center">
              {currentStep === 1 && "أدخل معلوماتك الشخصية"}
              {currentStep === 2 && "تفاصيل مركبتك"}
              {currentStep === 3 && "معلومات أخيرة لإكمال التسجيل"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">الاسم الأول</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="أدخل اسمك الأول"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">اسم العائلة</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="أدخل اسم العائلة"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+213 555 123 456"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="example@email.com"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wilaya">الولاية</Label>
                    <Select value={formData.wilaya} onValueChange={(value) => handleInputChange("wilaya", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الولاية" />
                      </SelectTrigger>
                      <SelectContent>
                        {wilayas.map((wilaya) => (
                          <SelectItem key={wilaya.code} value={wilaya.code}>
                            {wilaya.code} - {wilaya.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commune">البلدية</Label>
                    <Input
                      id="commune"
                      value={formData.commune}
                      onChange={(e) => handleInputChange("commune", e.target.value)}
                      placeholder="أدخل البلدية"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="أدخل عنوانك الكامل"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Vehicle Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleBrand">ماركة المركبة</Label>
                    <Input
                      id="vehicleBrand"
                      value={formData.vehicleBrand}
                      onChange={(e) => handleInputChange("vehicleBrand", e.target.value)}
                      placeholder="تويوتا، هيونداي، رينو..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">الموديل</Label>
                    <Input
                      id="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={(e) => handleInputChange("vehicleModel", e.target.value)}
                      placeholder="كورولا، أكسنت، سيمبول..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleYear">سنة الصنع</Label>
                    <Input
                      id="vehicleYear"
                      value={formData.vehicleYear}
                      onChange={(e) => handleInputChange("vehicleYear", e.target.value)}
                      placeholder="2020"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleColor">اللون</Label>
                    <Input
                      id="vehicleColor"
                      value={formData.vehicleColor}
                      onChange={(e) => handleInputChange("vehicleColor", e.target.value)}
                      placeholder="أبيض، أسود، رمادي..."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="plateNumber">رقم اللوحة</Label>
                    <Input
                      id="plateNumber"
                      value={formData.plateNumber}
                      onChange={(e) => handleInputChange("plateNumber", e.target.value)}
                      placeholder="16-123-45"
                    />
                  </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seats">عدد المقاعد</Label>
                    <Select value={formData.seats} onValueChange={(value) => handleInputChange("seats", value)}>
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
                  <div className="space-y-2">
                    <Label htmlFor="category">فئة المركبة</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Additional Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">الخبرة في القيادة</Label>
                  <Select value={formData.experience} onValueChange={(value) => handleInputChange("experience", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مستوى خبرتك" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">أقل من سنة</SelectItem>
                      <SelectItem value="intermediate">1-3 سنوات</SelectItem>
                      <SelectItem value="experienced">3-5 سنوات</SelectItem>
                      <SelectItem value="expert">أكثر من 5 سنوات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="motivation">لماذا تريد الانضمام إلى منصة أبريد؟</Label>
                  <Textarea
                    id="motivation"
                    value={formData.motivation}
                    onChange={(e) => handleInputChange("motivation", e.target.value)}
                    placeholder="أخبرنا عن دوافعك للانضمام إلى شبكتنا..."
                    rows={4}
                  />
                </div>
                
                <div className="bg-primary/5 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">الخطوات التالية:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• مراجعة طلبك خلال 24-48 ساعة</li>
                    <li>• التواصل معك لتحديد موعد المقابلة</li>
                    <li>• فحص المركبة والوثائق</li>
                    <li>• التدريب والبدء في العمل</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                السابق
              </Button>
              
              {currentStep < 3 ? (
                <Button onClick={nextStep}>
                  التالي
                  <ArrowRight className="h-4 w-4 mr-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="bg-gradient-primary">
                  إنشاء الحساب
                  <CheckCircle className="h-4 w-4 mr-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default DriverOnboardingTest;