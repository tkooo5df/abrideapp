import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Upload, 
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
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const DriverOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    wilaya: "",
    address: "",
    
    // Vehicle Info
    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleColor: "",
    plateNumber: "",
    seats: "",
    category: "",
    
    // Documents
    hasLicense: false,
    hasInsurance: false,
    hasRegistration: false,
    
    // Experience
    experience: "",
    motivation: ""
  });

  const vehicleCategories = [
    { value: "economy", label: "???????" },
    { value: "comfort", label: "????" },
    { value: "premium", label: "????" }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "??? ?????",
      description: "???? ??? 50,000 ?? ??????"
    },
    {
      icon: Clock,
      title: "????? ?? ?????",
      description: "???? ????? ???? ?????"
    },
    {
      icon: Shield,
      title: "????? ????",
      description: "????? ????? ?? ????????"
    },
    {
      icon: Star,
      title: "????? ????",
      description: "???? ???? ????? ??????"
    }
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    handleDriverApplication();
  };

  const handleDriverApplication = async () => {
    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        alert("??? ???? ????? ?????? ?????.");
        return;
      }

      const userId = session.user.id;

      // Update user profile to driver and save personal info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'driver',
          first_name: formData.firstName || undefined,
          last_name: formData.lastName || undefined,
          phone: formData.phone || undefined,
          wilaya: formData.wilaya || undefined,
          address: formData.address || undefined
        })
        .eq('id', userId);

      if (profileError) {
        console.error("Profile update error:", profileError);
        alert("??? ??? ????? ????? ????? ??????.");
        return;
      }

      // Create vehicle
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          driver_id: userId,
          make: formData.vehicleBrand,
          model: formData.vehicleModel,
          year: formData.vehicleYear ? parseInt(formData.vehicleYear) : null,
          color: formData.vehicleColor,
          license_plate: formData.plateNumber,
          seats: formData.seats ? parseInt(formData.seats) : null,
          is_active: true
        });

      if (vehicleError) {
        console.error("Vehicle insert error:", vehicleError);
        // Continue anyway to send notification
      }

      // Get all admin users
      const { data: adminProfiles, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (!adminError && adminProfiles) {
        // Create notifications for all admins about new driver application
        const notifications = adminProfiles.map(admin => ({
          user_id: admin.id,
          type: 'system',
          title: '??? ???? ????',
          message: `??? ?????? ???? ?? ${formData.firstName} ${formData.lastName} - ${formData.vehicleBrand} ${formData.vehicleModel}`,
          is_read: false
        }));

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }

      alert("?? ????? ???? ?????? ????? ?????! ??????? ??? ??????.");
      navigate('/admin-dashboard'); // Or navigate('/')
    } catch (error) {
      console.error(error);
      alert("??? ??? ????? ????? ?????. ???? ???????? ??? ????.");
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
              ???? ??? ???? ????? ???? ?????
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              ?? ????? ?? ???? ???? ??? ?? ??????? ????? ????? ??????? ?? ????? ????? ?? ?????
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
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 4 && (
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
              {currentStep === 1 && "????????? ???????"}
              {currentStep === 2 && "??????? ???????"}
              {currentStep === 3 && "??????? ????????"}
              {currentStep === 4 && "??????? ??????"}
            </CardTitle>
            <CardDescription className="text-center">
              {currentStep === 1 && "???? ???????? ???????"}
              {currentStep === 2 && "?????? ??????"}
              {currentStep === 3 && "???? ?? ???? ???????"}
              {currentStep === 4 && "??????? ????? ?????? ???????"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">????? ?????</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="???? ???? ?????"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">??? ???????</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="???? ??? ???????"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">??? ??????</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+213 555 123 456"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">?????? ??????????</Label>
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
                    <Label htmlFor="wilaya">???????</Label>
                    <Select value={formData.wilaya} onValueChange={(value) => handleInputChange("wilaya", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="???? ???????" />
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
                  
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">???????</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="???? ?????? ??????"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Vehicle Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleBrand">????? ???????</Label>
                    <Input
                      id="vehicleBrand"
                      value={formData.vehicleBrand}
                      onChange={(e) => handleInputChange("vehicleBrand", e.target.value)}
                      placeholder="??????? ???????? ????..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">???????</Label>
                    <Input
                      id="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={(e) => handleInputChange("vehicleModel", e.target.value)}
                      placeholder="??????? ?????? ??????..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleYear">??? ?????</Label>
                    <Input
                      id="vehicleYear"
                      value={formData.vehicleYear}
                      onChange={(e) => handleInputChange("vehicleYear", e.target.value)}
                      placeholder="2020"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleColor">?????</Label>
                    <Input
                      id="vehicleColor"
                      value={formData.vehicleColor}
                      onChange={(e) => handleInputChange("vehicleColor", e.target.value)}
                      placeholder="????? ????? ?????..."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="plateNumber">??? ??????</Label>
                  <Input
                    id="plateNumber"
                    value={formData.plateNumber}
                    onChange={(e) => handleInputChange("plateNumber", e.target.value)}
                    placeholder="16-123-45"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seats">??? ???????</Label>
                    <Select value={formData.seats} onValueChange={(value) => handleInputChange("seats", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="???? ??? ???????" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 ????</SelectItem>
                        <SelectItem value="2">2 ????</SelectItem>
                        <SelectItem value="3">3 ?????</SelectItem>
                        <SelectItem value="4">4 ?????</SelectItem>
                        <SelectItem value="5">5 ?????</SelectItem>
                        <SelectItem value="6">6 ?????</SelectItem>
                        <SelectItem value="7">7 ?????</SelectItem>
                        <SelectItem value="8">8 ????? (???)</SelectItem><SelectItem value="15">15 ???? (???? ???)</SelectItem><SelectItem value="30">30 ???? ?? (????? ?????)</SelectItem><SelectItem value="35">35 ???? ?? (????? ??????)</SelectItem><SelectItem value="40">40 ???? ?? (????? ??????)</SelectItem><SelectItem value="49">49 ???? ?? (????? ?????)</SelectItem><SelectItem value="50">50 ???? ?? (????? ????? ????)</SelectItem><SelectItem value="60">60 ???? ?? (????? ??????)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">??? ???????</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="???? ?????" />
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

            {/* Step 3: Documents */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">
                    ???? ?? ???? ??????? ??????? ??? ????????
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Checkbox
                      id="hasLicense"
                      checked={formData.hasLicense}
                      onCheckedChange={(checked) => handleInputChange("hasLicense", checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="hasLicense" className="font-medium">???? ???????</Label>
                      <p className="text-sm text-muted-foreground">???? ????? ????? ???????</p>
                    </div>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Checkbox
                      id="hasInsurance"
                      checked={formData.hasInsurance}
                      onCheckedChange={(checked) => handleInputChange("hasInsurance", checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="hasInsurance" className="font-medium">????? ???????</Label>
                      <p className="text-sm text-muted-foreground">????? ???? ?? ?? ?????</p>
                    </div>
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Checkbox
                      id="hasRegistration"
                      checked={formData.hasRegistration}
                      onCheckedChange={(checked) => handleInputChange("hasRegistration", checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="hasRegistration" className="font-medium">???? ???????</Label>
                      <p className="text-sm text-muted-foreground">????? ????? ???????</p>
                    </div>
                    <Car className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    <Upload className="h-4 w-4 inline mr-2" />
                    ?????? ???? ??? ??????? ??? ???? ????
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Additional Information */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">?????? ?? ???????</Label>
                  <Select value={formData.experience} onValueChange={(value) => handleInputChange("experience", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="???? ????? ?????" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">??? ?? ???</SelectItem>
                      <SelectItem value="intermediate">1-3 ?????</SelectItem>
                      <SelectItem value="experienced">3-5 ?????</SelectItem>
                      <SelectItem value="expert">???? ?? 5 ?????</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="motivation">????? ???? ???????? ??? ???? ??????</Label>
                  <Textarea
                    id="motivation"
                    value={formData.motivation}
                    onChange={(e) => handleInputChange("motivation", e.target.value)}
                    placeholder="?????? ?? ?????? ???????? ??? ??????..."
                    rows={4}
                  />
                </div>
                
                <div className="bg-primary/5 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">??????? ???????:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• ?????? ???? ???? 24-48 ????</li>
                    <li>• ??????? ??? ?????? ???? ????????</li>
                    <li>• ??? ??????? ????????</li>
                    <li>• ??????? ?????? ?? ?????</li>
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
                ??????
              </Button>
              
              {currentStep < 4 ? (
                <Button onClick={nextStep}>
                  ??????
                  <ArrowRight className="h-4 w-4 mr-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="bg-gradient-primary">
                  ????? ?????
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

export default DriverOnboarding;

