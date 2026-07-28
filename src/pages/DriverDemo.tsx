import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Car, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign,
  Star,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Navigation,
  TrendingUp,
  Route,
  AlertCircle,
  Fuel,
  Settings
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { wilayas, getWilayaByCode } from "@/data/wilayas";
import { useAuth } from "@/hooks/useAuth";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";

interface Trip {
  id: string;
  from_wilaya_id?: number;
  to_wilaya_id?: number;
  fromWilayaId?: number;
  toWilayaId?: number;
  fromWilayaName?: string;
  toWilayaName?: string;
  from_wilaya_name?: string;
  to_wilaya_name?: string;
  departure_date?: string;
  departureDate?: string;
  departure_time?: string;
  departureTime?: string;
  price_per_seat?: number;
  pricePerSeat?: number;
  available_seats?: number;
  availableSeats?: number;
  total_seats?: number;
  totalSeats?: number;
  description?: string;
  is_active?: boolean;
  status?: string;
  created_at?: string;
  createdAt?: string;
  driver?: any;
  vehicle?: any;
}

interface Booking {
  id: string;
  trip_id?: string;
  rider_id: string;
  seats_booked: number;
  total_amount: number;
  status: string;
  payment_method: string;
  pickup_location: string;
  destination_location: string;
  special_requests?: string;
  created_at: string;
  passenger?: {
    full_name?: string;
    phone?: string;
    email: string;
  };
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  seats: number;
  is_active: boolean;
}

const DriverDemo = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showTripBookings, setShowTripBookings] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [tripBookings, setTripBookings] = useState<Booking[]>([]);
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const [newTrip, setNewTrip] = useState({
    from_wilaya_id: "",
    to_wilaya_id: "",
    departure_date: "",
    departure_time: "",
    price_per_seat: "",
    total_seats: "4",
    description: "",
    vehicle_id: ""
  });

  const [newVehicle, setNewVehicle] = useState({
    make: "",
    model: "",
    year: "",
    color: "",
    license_plate: "",
    seats: "4"
  });

  // Fetch driver's trips with correct availability calculation
  const fetchTrips = async () => {
    if (!user?.id) return;
    
    try {
      // Use BrowserDatabaseService to get trips with accurate seat availability
      // This ensures available_seats is calculated from actual bookings, not database value
      const data = await BrowserDatabaseService.getTripsWithDetails(user.id);
      setTrips(data || []);
    } catch (error) {
    }
  };

  // Fetch bookings for driver's trips
  const fetchBookings = async () => {
    if (!user?.id) return;
    
    try {
      // First get all trip IDs for this driver
      const { data: driverTrips } = await supabase
        .from('trips')
        .select('id')
        .eq('driver_id', user.id);

      if (!driverTrips || driverTrips.length === 0) {
        setBookings([]);
        return;
      }

      const tripIds = driverTrips.map(trip => trip.id);

      // Get bookings for these trips
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .in('trip_id', tripIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch passenger details separately
      const bookingsWithPassengers = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          if (booking.rider_id) {
            const { data: passenger } = await supabase
              .from('profiles')
              .select('full_name, phone, email')
              .eq('id', booking.rider_id)
              .single();
            
            return { ...booking, passenger };
          }
          return booking;
        })
      );

      setBookings(bookingsWithPassengers);
    } catch (error) {
    }
  };

  // Fetch driver's vehicles
  const fetchVehicles = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('driver_id', user.id);

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
    }
  };

  // Create new trip
  const handleCreateTrip = async () => {
    if (!user?.id) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (!newTrip.from_wilaya_id || !newTrip.to_wilaya_id || !newTrip.departure_date || 
          !newTrip.departure_time || !newTrip.price_per_seat) {
        toast({
          title: "خطأ",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('trips')
        .insert([{
          driver_id: user.id,
          vehicle_id: newTrip.vehicle_id || vehicles[0]?.id,
          from_wilaya_id: parseInt(newTrip.from_wilaya_id),
          to_wilaya_id: parseInt(newTrip.to_wilaya_id),
          departure_date: newTrip.departure_date,
          departure_time: newTrip.departure_time,
          price_per_seat: parseFloat(newTrip.price_per_seat),
          total_seats: parseInt(newTrip.total_seats),
          available_seats: parseInt(newTrip.total_seats),
          description: newTrip.description,
          is_active: true
        }])
        .select('id')
        .single();

      if (error) throw error;

      // Create notification for admins
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (adminProfiles && data) {
        const notifications = adminProfiles.map(admin => ({
          user_id: admin.id,
          type: 'trip' as const,
          title: 'رحلة جديدة',
          message: `رحلة جديدة من ${getWilayaByCode(newTrip.from_wilaya_id)?.name} إلى ${getWilayaByCode(newTrip.to_wilaya_id)?.name} بسعر ${newTrip.price_per_seat} دج`,
          related_id: data.id,
          is_read: false
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      // Reset form and refresh data
      setNewTrip({
        from_wilaya_id: "",
        to_wilaya_id: "",
        departure_date: "",
        departure_time: "",
        price_per_seat: "",
        total_seats: "4",
        description: "",
        vehicle_id: ""
      });
      setShowAddTrip(false);
      await fetchTrips();

      toast({
        title: "تم إنشاء الرحلة",
        description: "تم إنشاء رحلة جديدة بنجاح وإرسال إشعار للإدارة",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الرحلة",
        variant: "destructive"
      });
    }
  };

  // Create new vehicle
  const handleCreateVehicle = async () => {
    if (!user?.id) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (!newVehicle.make || !newVehicle.model || !newVehicle.year || 
          !newVehicle.color || !newVehicle.license_plate) {
        toast({
          title: "خطأ",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('vehicles')
        .insert([{
          driver_id: user.id,
          make: newVehicle.make,
          model: newVehicle.model,
          year: parseInt(newVehicle.year),
          color: newVehicle.color,
          license_plate: newVehicle.license_plate,
          seats: parseInt(newVehicle.seats),
          is_active: true
        }]);

      if (error) throw error;

      // Reset form and refresh data
      setNewVehicle({
        make: "",
        model: "",
        year: "",
        color: "",
        license_plate: "",
        seats: "4"
      });
      setShowAddVehicle(false);
      await fetchVehicles();

      toast({
        title: "تم إضافة المركبة",
        description: "تم إضافة مركبة جديدة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المركبة",
        variant: "destructive"
      });
    }
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      await fetchBookings();
      toast({
        title: "تم التحديث",
        description: `تم تحديث حالة الحجز إلى ${status}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الحجز",
        variant: "destructive"
      });
    }
  };

  // Delete trip
  const deleteTrip = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ is_active: false })
        .eq('id', tripId);

      if (error) throw error;

      await fetchTrips();
      toast({
        title: "تم حذف الرحلة",
        description: "تم إلغاء الرحلة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الرحلة",
        variant: "destructive"
      });
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      await Promise.all([
        fetchTrips(),
        fetchBookings(),
        fetchVehicles()
      ]);
      setLoading(false);
    };

    loadData();

    // Set up real-time subscriptions
    if (user?.id) {
      const tripsSubscription = supabase
        .channel('driver_trips')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trips',
            filter: `driver_id=eq.${user.id}`
          },
          () => {
            fetchTrips();
          }
        )
        .subscribe();

      const bookingsSubscription = supabase
        .channel('driver_bookings')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings'
          },
          () => {
            fetchBookings();
          }
        )
        .subscribe();

      return () => {
        tripsSubscription.unsubscribe();
        bookingsSubscription.unsubscribe();
      };
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "في الانتظار", color: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "مؤكد", color: "bg-green-100 text-green-800" },
      completed: { label: "مكتمل", color: "bg-blue-100 text-blue-800" },
      cancelled: { label: "ملغي", color: "bg-red-100 text-red-800" }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل المصادقة...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">يجب تسجيل الدخول</h2>
              <p className="text-muted-foreground mb-4">يجب تسجيل الدخول للوصول إلى لوحة السائق</p>
              <Button onClick={() => window.location.href = '/auth/signin'}>
                تسجيل الدخول
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل لوحة السائق...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-primary rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white/20">
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-white/20 text-white">
                  {profile?.full_name?.charAt(0) || profile?.first_name?.charAt(0) || 'س'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">لوحة السائق التجريبية</h1>
                <p className="text-white/90">إدارة رحلاتك وحجوزاتك</p>
                <Badge className="bg-white/20 text-white border-white/30 mt-2">
                  DEMO MODE
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/80">التقييم</div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-bold">4.8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <Route className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{trips.length}</div>
              <div className="text-sm text-blue-700">الرحلات المنشورة</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{bookings.length}</div>
              <div className="text-sm text-green-700">إجمالي الحجوزات</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-900">
                {bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-yellow-700">الأرباح (دج)</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <Car className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">{vehicles.length}</div>
              <div className="text-sm text-purple-700">المركبات</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Dialog open={showAddTrip} onOpenChange={setShowAddTrip}>
            <DialogTrigger asChild>
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">إضافة رحلة جديدة</h3>
                  <p className="text-sm text-muted-foreground">أنشئ رحلة جديدة للركاب</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة رحلة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>من (الولاية)</Label>
                    <Select value={newTrip.from_wilaya_id} onValueChange={(value) => 
                      setNewTrip(prev => ({ ...prev, from_wilaya_id: value }))
                    }>
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
                    <Label>إلى (الولاية)</Label>
                    <Select value={newTrip.to_wilaya_id} onValueChange={(value) => 
                      setNewTrip(prev => ({ ...prev, to_wilaya_id: value }))
                    }>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ المغادرة</Label>
                    <Input
                      type="date"
                      value={newTrip.departure_date}
                      onChange={(e) => setNewTrip(prev => ({ ...prev, departure_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>وقت المغادرة</Label>
                    <Input
                      type="time"
                      value={newTrip.departure_time}
                      onChange={(e) => setNewTrip(prev => ({ ...prev, departure_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>سعر المقعد (دج)</Label>
                    <Input
                      type="number"
                      value={newTrip.price_per_seat}
                      onChange={(e) => setNewTrip(prev => ({ ...prev, price_per_seat: e.target.value }))}
                      placeholder="1500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>عدد المقاعد</Label>
                    <Select value={newTrip.total_seats} onValueChange={(value) => 
                      setNewTrip(prev => ({ ...prev, total_seats: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
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
                </div>

                {vehicles.length > 0 && (
                  <div className="space-y-2">
                    <Label>المركبة</Label>
                    <Select value={newTrip.vehicle_id} onValueChange={(value) => 
                      setNewTrip(prev => ({ ...prev, vehicle_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المركبة" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>وصف الرحلة (اختياري)</Label>
                  <Textarea
                    value={newTrip.description}
                    onChange={(e) => setNewTrip(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="معلومات إضافية عن الرحلة..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateTrip} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    إنشاء الرحلة
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddTrip(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
            <DialogTrigger asChild>
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Car className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold mb-1">إضافة مركبة</h3>
                  <p className="text-sm text-muted-foreground">أضف مركبة جديدة</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة مركبة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الماركة</Label>
                    <Input
                      value={newVehicle.make}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, make: e.target.value }))}
                      placeholder="تويوتا، هيونداي..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الموديل</Label>
                    <Input
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="كورولا، أكسنت..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>سنة الصنع</Label>
                    <Input
                      type="number"
                      value={newVehicle.year}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="2020"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>اللون</Label>
                    <Input
                      value={newVehicle.color}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="أبيض، أسود..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم اللوحة</Label>
                    <Input
                      value={newVehicle.license_plate}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, license_plate: e.target.value }))}
                      placeholder="16-123-45"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عدد المقاعد</Label>
                    <Select value={newVehicle.seats} onValueChange={(value) => 
                      setNewVehicle(prev => ({ ...prev, seats: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 مقاعد</SelectItem>
                        <SelectItem value="5">5 مقاعد</SelectItem>
                        <SelectItem value="7">7 مقاعد</SelectItem>
                        <SelectItem value="8">8 مقاعد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateVehicle} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة المركبة
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddVehicle(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Vehicles Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                مركباتي ({vehicles.length})
              </div>
              <Button size="sm" onClick={() => setShowAddVehicle(true)}>
                <Plus className="h-4 w-4 mr-2" />
                إضافة مركبة
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مركبات</h3>
                <p className="text-muted-foreground mb-4">أضف مركبة أولاً لتتمكن من إنشاء الرحلات</p>
                <Button onClick={() => setShowAddVehicle(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة مركبة
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {vehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Car className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{vehicle.make} {vehicle.model}</h3>
                            <Badge variant={vehicle.is_active ? "default" : "secondary"}>
                              {vehicle.is_active ? "نشط" : "غير نشط"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>{vehicle.year} • {vehicle.color}</div>
                            <div>لوحة: {vehicle.license_plate}</div>
                            <div>{vehicle.seats} مقاعد</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trips Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="h-5 w-5 text-secondary" />
                رحلاتي ({trips.length})
              </div>
              <Button size="sm" onClick={() => setShowAddTrip(true)} disabled={vehicles.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                إضافة رحلة
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trips.length === 0 ? (
              <div className="text-center py-8">
                <Route className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد رحلات</h3>
                <p className="text-muted-foreground mb-4">أنشئ رحلة جديدة لتبدأ في استقبال الحجوزات</p>
                {vehicles.length > 0 ? (
                  <Button onClick={() => setShowAddTrip(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة رحلة
                  </Button>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      يجب إضافة مركبة أولاً قبل إنشاء الرحلات
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {trips.map((trip) => (
                  <Card key={trip.id} className="hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={trip.is_active ? "default" : "secondary"}>
                              {trip.is_active ? 'نشط' : 'غير نشط'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">#{trip.id.slice(0, 8)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-lg font-medium mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>
                              {trip.fromWilayaName || trip.from_wilaya_name || getWilayaByCode((trip.fromWilayaId || trip.from_wilaya_id)?.toString())?.name || 'غير محدد'}
                              {(trip.fromWilayaId === 47 || trip.from_wilaya_id === 47) && (trip as any).fromKsar && (
                                <span className="text-xs text-primary font-medium"> - {(trip as any).fromKsar}</span>
                              )}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span>
                              {trip.toWilayaName || trip.to_wilaya_name || getWilayaByCode((trip.toWilayaId || trip.to_wilaya_id)?.toString())?.name || 'غير محدد'}
                              {(trip.toWilayaId === 47 || trip.to_wilaya_id === 47) && (trip as any).toKsar && (
                                <span className="text-xs text-primary font-medium"> - {(trip as any).toKsar}</span>
                              )}
                            </span>
                          </div>
                          {trip.description && (
                            <p className="text-sm text-muted-foreground">{trip.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">{trip.pricePerSeat || trip.price_per_seat} دج</div>
                          <div className="text-sm text-muted-foreground">
                            {trip.availableSeats ?? trip.available_seats}/{trip.totalSeats || trip.total_seats} مقاعد متاحة
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{trip.departureDate || trip.departure_date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{trip.departureTime || trip.departure_time}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-2" onClick={() => handleEditTrip(trip)} />
                          تعديل
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" onClick={() => handleViewBookings(trip.id)} />
                          عرض الحجوزات
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteTrip(trip.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          حذف
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bookings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              الحجوزات الواردة ({bookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد حجوزات</h3>
                <p className="text-muted-foreground">ستظهر الحجوزات هنا عندما يحجز الركاب رحلاتك</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => {
                  const statusInfo = getStatusBadge(booking.status);
                  
                  return (
                    <Card key={booking.id} className="hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                              <span className="text-sm text-muted-foreground">#{booking.id.slice(0, 8)}</span>
                            </div>
                            <h3 className="font-semibold text-lg">
                              {booking.passenger?.full_name || booking.passenger?.email || 'راكب'}
                            </h3>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {booking.passenger?.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  <span>{booking.passenger.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                <span>{booking.passenger?.email}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{booking.total_amount} دج</div>
                            <div className="text-sm text-muted-foreground">
                              {booking.seats_booked} مقاعد
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {booking.payment_method === 'cod' ? 'نقداً' : 'بريدي موب'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm mb-4">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.pickup_location} → {booking.destination_location}</span>
                        </div>

                        {booking.special_requests && (
                          <div className="bg-muted/50 p-3 rounded-lg mb-4">
                            <p className="text-sm"><strong>طلبات خاصة:</strong> {booking.special_requests}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {booking.status === "pending" && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                قبول
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                رفض
                              </Button>
                            </>
                          )}
                          {booking.status === "confirmed" && (
                            <Button 
                              size="sm" 
                              onClick={() => updateBookingStatus(booking.id, 'completed')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              إكمال الرحلة
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            تفاصيل
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demo Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>تعليمات التجربة:</strong> هذه صفحة تجريبية للسائق. يمكنك إضافة مركبات ورحلات جديدة لمشاهدة كيفية عمل النظام. 
            عندما تنشئ رحلة جديدة، ستصل إشعارات للإدارة فوراً.
          </AlertDescription>
        </Alert>
      </main>

      <Footer />
    </div>
  );
};

export default DriverDemo;