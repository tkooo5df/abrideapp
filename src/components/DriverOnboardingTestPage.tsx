import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";

const DriverOnboardingTestPage = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useLocalAuth();
  const [testStatus, setTestStatus] = useState("idle");

  const runTest = async () => {
    setTestStatus("running");
    
    try {
      // Simulate driver registration
      if (user) {
        await updateProfile({
          firstName: "أحمد",
          lastName: "السائق",
          fullName: "أحمد السائق",
          phone: "+213 555 123 456",
          wilaya: "16",
          commune: "الجزائر الوسطى",
          address: "شارع ديدوش مراد، الجزائر",
          role: 'driver'
        });

        // Create vehicle for the driver
        const vehicle = await BrowserDatabaseService.createVehicle({
          driverId: user.id,
          make: "Renault",
          model: "Symbol",
          year: 2020,
          color: "أبيض",
          licensePlate: "TEST-123-16",
          seats: 4
        });

        // Create a notification for the driver
        await BrowserDatabaseService.createNotification({
          userId: user.id,
          title: "مرحبا بك كسائق",
          message: "مرحبا بك في منصة أبريد. تم إنشاء حسابك كسائق ومركبة Renault Symbol بنجاح.",
          type: "system"
        });

        setTestStatus("success");
        // Navigate to the driver page after successful registration
        setTimeout(() => {
          navigate("/driver");
        }, 2000);
      }
    } catch (error) {
      setTestStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>اختبار تسجيل السائق</CardTitle>
          <CardDescription>
            انقر على الزر أدناه لاختبار عملية تسجيل السائق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {testStatus === "idle" && (
              <p>انقر على الزر لبدء الاختبار</p>
            )}
            {testStatus === "running" && (
              <p>جاري تنفيذ الاختبار...</p>
            )}
            {testStatus === "success" && (
              <p className="text-green-600">تم الاختبار بنجاح! جاري التحويل...</p>
            )}
            {testStatus === "error" && (
              <p className="text-red-600">حدث خطأ أثناء الاختبار</p>
            )}
          </div>
          <Button 
            onClick={runTest} 
            disabled={testStatus === "running"}
            className="w-full"
          >
            {testStatus === "running" ? "جاري التنفيذ..." : "بدء الاختبار"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverOnboardingTestPage;