import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Car, 
  Route, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  DollarSign,
  User,
  Star,
  Bell,
  RefreshCw
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useDatabase } from '@/hooks/useDatabase';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';

const DemoData = () => {
  const { getDatabaseService, isInitialized } = useDatabase();
  const [data, setData] = useState({
    profiles: [],
    vehicles: [],
    trips: [],
    bookings: [],
    notifications: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const targetDate = '2025-09-20';

  const loadData = async () => {
    try {
      // Read directly from browser database service in local mode
      const [profiles, vehicles, trips, bookings, notifications] = await Promise.all([
        BrowserDatabaseService.getAllProfiles(),
        BrowserDatabaseService.getAllVehicles(),
        BrowserDatabaseService.getTrips({ includeInactive: true }),
        BrowserDatabaseService.getAllBookings(),
        BrowserDatabaseService.getNotifications('admin-1'),
      ]);

      setData({
        profiles: profiles || [],
        vehicles: vehicles || [],
        trips: trips || [],
        bookings: bookings || [],
        notifications: notifications || [],
      });
    } catch (error) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isInitialized) {
      loadData();
    }
  }, [isInitialized]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleAddFiveTripsForDate = async () => {
    try {
      const db = getDatabaseService();
      // Find a driver
      let profiles = await BrowserDatabaseService.getAllProfiles();
      let driver = profiles.find((p: any) => p.role === 'driver');
      if (!driver) {
        // Create a driver profile if none exists
        driver = await BrowserDatabaseService.createProfile({
          email: 'driver@test.com',
          firstName: 'أحمد',
          lastName: 'السائق',
          fullName: 'أحمد السائق',
          phone: '+213 555 123 456',
          role: 'driver',
          wilaya: 'الجزائر',
          commune: 'الجزائر الوسطى',
          address: 'شارع ديدوش مراد، الجزائر',
          isVerified: true,
        } as any);
        // Refresh profiles list
        profiles = await BrowserDatabaseService.getAllProfiles();
      }

      // Ensure a vehicle exists for the driver
      let vehicles = await BrowserDatabaseService.getVehiclesByDriver(driver.id);
      if (!vehicles || vehicles.length === 0) {
        await BrowserDatabaseService.createVehicle({
          driverId: driver.id,
          make: 'Renault',
          model: 'Symbol',
          year: 2021,
          color: 'أبيض',
          licensePlate: 'AA-123-16',
          seats: 4,
        });
        vehicles = await BrowserDatabaseService.getVehiclesByDriver(driver.id);
      }
      const vehicleId = vehicles[0].id;

      const tripsPayload = [
        { fromWilayaId: 16, toWilayaId: 31, departureTime: '08:00', pricePerSeat: 1500, totalSeats: 4, description: 'الجزائر → وهران' },
        { fromWilayaId: 31, toWilayaId: 16, departureTime: '10:30', pricePerSeat: 1600, totalSeats: 4, description: 'وهران → الجزائر' },
        { fromWilayaId: 16, toWilayaId: 35, departureTime: '13:00', pricePerSeat: 900, totalSeats: 4, description: 'الجزائر → تيزي وزو' },
        { fromWilayaId: 6, toWilayaId: 9, departureTime: '15:30', pricePerSeat: 1200, totalSeats: 4, description: 'بجاية → البويرة' },
        { fromWilayaId: 9, toWilayaId: 6, departureTime: '18:00', pricePerSeat: 1200, totalSeats: 4, description: 'البويرة → بجاية' },
      ];

      for (const t of tripsPayload) {
        await BrowserDatabaseService.createTrip({
          driverId: driver.id,
          vehicleId,
          fromWilayaId: t.fromWilayaId,
          toWilayaId: t.toWilayaId,
          departureDate: targetDate,
          departureTime: t.departureTime,
          pricePerSeat: t.pricePerSeat,
          totalSeats: t.totalSeats,
          description: t.description,
        });
      }

      await loadData();
    } catch (e) {
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: { label: 'مدير', variant: 'destructive' as const },
      driver: { label: 'سائق', variant: 'default' as const },
      passenger: { label: 'راكب', variant: 'secondary' as const },
    };
    return variants[role as keyof typeof variants] || variants.passenger;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { label: 'نشط', variant: 'default' as const },
      inactive: { label: 'غير نشط', variant: 'secondary' as const },
      pending: { label: 'في الانتظار', variant: 'secondary' as const },
      confirmed: { label: 'مؤكد', variant: 'default' as const },
      completed: { label: 'مكتمل', variant: 'outline' as const },
      cancelled: { label: 'ملغي', variant: 'destructive' as const },
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل البيانات التجريبية...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">البيانات التجريبية</h1>
            <p className="text-muted-foreground">
              عرض البيانات الحقيقية المستخدمة لتجريب الموقع
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            تحديث البيانات
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>إضافة رحلات يدوية</CardTitle>
            <CardDescription>
              إنشاء 5 رحلات بتاريخ {targetDate} كأنها مضافة من حساب السائق
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAddFiveTripsForDate}>
              إضافة 5 رحلات ليوم {targetDate}
            </Button>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{data.profiles.length}</div>
              <div className="text-sm text-muted-foreground">المستخدمين</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Car className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold">{data.vehicles.length}</div>
              <div className="text-sm text-muted-foreground">المركبات</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Route className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold">{data.trips.length}</div>
              <div className="text-sm text-muted-foreground">الرحلات</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{data.bookings.length}</div>
              <div className="text-sm text-muted-foreground">الحجوزات</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Bell className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{data.notifications.length}</div>
              <div className="text-sm text-muted-foreground">الإشعارات</div>
            </CardContent>
          </Card>
        </div>

        {/* Data Tabs */}
        <Tabs defaultValue="profiles" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profiles">المستخدمين</TabsTrigger>
            <TabsTrigger value="vehicles">المركبات</TabsTrigger>
            <TabsTrigger value="trips">الرحلات</TabsTrigger>
            <TabsTrigger value="bookings">الحجوزات</TabsTrigger>
            <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          </TabsList>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>المستخدمين</CardTitle>
                <CardDescription>جميع المستخدمين المسجلين في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {data.profiles.map((profile: any) => (
                    <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{profile.fullName || `${profile.firstName} ${profile.lastName}`}</h3>
                          <p className="text-sm text-muted-foreground">{profile.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">{profile.phone}</span>
                            <MapPin className="h-3 w-3 ml-2" />
                            <span className="text-xs">{profile.wilaya}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={getRoleBadge(profile.role).variant}>
                        {getRoleBadge(profile.role).label}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>المركبات</CardTitle>
                <CardDescription>جميع المركبات المسجلة في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {data.vehicles.map((vehicle: any) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                          <Car className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{vehicle.make} {vehicle.model}</h3>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.year} • {vehicle.color} • {vehicle.licensePlate}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="h-3 w-3" />
                            <span className="text-xs">{vehicle.seats} مقاعد</span>
                            <Badge variant={vehicle.isActive ? "default" : "secondary"} className="text-xs">
                              {vehicle.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trips Tab */}
          <TabsContent value="trips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الرحلات</CardTitle>
                <CardDescription>جميع الرحلات المتاحة في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {data.trips.map((trip: any) => (
                    <div key={trip.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium">ولاية {trip.fromWilayaId}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">ولاية {trip.toWilayaId}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">{trip.pricePerSeat} دج</div>
                          <div className="text-sm text-muted-foreground">
                            {trip.availableSeats}/{trip.totalSeats} مقاعد
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{trip.departureDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{trip.departureTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span>{trip.vehicle?.make} {trip.vehicle?.model}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{trip.driver?.fullName}</span>
                        </div>
                      </div>
                      {trip.description && (
                        <p className="text-sm text-muted-foreground mt-2">{trip.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الحجوزات</CardTitle>
                <CardDescription>جميع الحجوزات في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {data.bookings.map((booking: any) => (
                    <div key={booking.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{booking.passenger?.fullName}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{booking.passenger?.phone}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">{booking.totalAmount} دج</div>
                          <div className="text-sm text-muted-foreground">
                            {booking.seatsBooked} مقعد
                          </div>
                          <Badge variant={getStatusBadge(booking.status).variant} className="mt-1">
                            {getStatusBadge(booking.status).label}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.pickupLocation} → {booking.destinationLocation}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.paymentMethod === 'cod' ? 'نقداً' : 'بريدي موب'}</span>
                        </div>
                        {booking.notes && (
                          <p className="text-muted-foreground">{booking.notes}</p>
                        )}
                        {booking.specialRequests && (
                          <p className="text-muted-foreground">
                            <strong>طلبات خاصة:</strong> {booking.specialRequests}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الإشعارات</CardTitle>
                <CardDescription>جميع الإشعارات في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {data.notifications.map((notification: any) => (
                    <div key={notification.id} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Bell className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleDateString('ar-DZ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default DemoData;
