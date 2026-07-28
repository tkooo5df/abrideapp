import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";

const DriverInfoVerification = () => {
  const { user } = useLocalAuth();
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDriverInfo = async () => {
      if (user) {
        try {
          // Fetch user profile
          const profile = await BrowserDatabaseService.getProfile(user.id);
          setDriverInfo(profile);

          // Fetch vehicles
          const userVehicles = await BrowserDatabaseService.getVehiclesByDriver(user.id);
          setVehicles(userVehicles);
        } catch (error) {
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDriverInfo();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>جاري تحميل المعلومات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>التحقق من معلومات السائق</CardTitle>
          <CardDescription>
            هذه الصفحة تتحقق من أن معلومات السائق تظهر بشكل صحيح
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {driverInfo ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">معلومات السائق</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                    <p>{driverInfo.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p>{driverInfo.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                    <p>{driverInfo.phone || "غير محدد"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الولاية</p>
                    <p>{driverInfo.wilaya || "غير محدد"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">المركبات ({vehicles.length})</h3>
                {vehicles.length > 0 ? (
                  <div className="space-y-3 mt-2">
                    {vehicles.map((vehicle) => (
                      <Card key={vehicle.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                              <p className="text-sm text-muted-foreground">
                                {vehicle.year} • {vehicle.color} • {vehicle.licensePlate}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">{vehicle.seats} مقاعد</p>
                              <p className="text-xs text-muted-foreground">
                                {vehicle.isActive ? "نشط" : "غير نشط"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">لا توجد مركبات مسجلة</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">لا توجد معلومات سائق</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverInfoVerification;