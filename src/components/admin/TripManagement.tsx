import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Route, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  MapPin,
  Calendar,
  Clock,
  Car,
  User,
  Play,
  Pause,
  X
} from "lucide-react";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";
import { toast } from "@/hooks/use-toast";
import { wilayas } from "@/data/wilayas";

interface Trip {
  id: string;
  driverId: string;
  vehicleId: string;
  fromWilayaId: number;
  toWilayaId: number;
  fromWilayaName?: string;
  toWilayaName?: string;
  departureDate: string;
  departureTime: string;
  pricePerSeat: number;
  totalSeats: number;
  availableSeats: number;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'fully_booked' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  driver?: {
    fullName: string;
    phone: string;
  };
  vehicle?: {
    make: string;
    model: string;
    licensePlate: string;
  };
}

const TripManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWilaya, setFilterWilaya] = useState("all");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Load trips from database
  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await BrowserDatabaseService.getTripsWithDetails(undefined, { includeInactive: true });
      setTrips(data || []);
    } catch (error) {
      toast({
        title: "خطأ في تحميل الرحلات",
        description: "حدث خطأ أثناء تحميل قائمة الرحلات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { label: "مجدولة", color: "bg-blue-100 text-blue-800" },
      in_progress: { label: "قيد التنفيذ", color: "bg-yellow-100 text-yellow-800" },
      fully_booked: { label: "محجوز بالكامل", color: "bg-orange-100 text-orange-800" },
      completed: { label: "مكتملة", color: "bg-green-100 text-green-800" },
      cancelled: { label: "ملغاة", color: "bg-red-100 text-red-800" }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.scheduled;
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.driver?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.vehicle?.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.fromWilayaName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.toWilayaName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Exclude cancelled trips when showing "all" status
    const matchesStatus = filterStatus === "all" 
      ? trip.status !== "cancelled"  // Hide cancelled trips when showing "all"
      : trip.status === filterStatus;
    const matchesWilaya = filterWilaya === "all" || 
                         trip.fromWilayaId.toString() === filterWilaya || 
                         trip.toWilayaId.toString() === filterWilaya;
    
    const result = matchesSearch && matchesStatus && matchesWilaya;
    
    // Debug logging for cancelled trips
    if (trip.status === 'cancelled') {
    }
    
    return result;
  });

  const handleToggleTripStatus = async (tripId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'scheduled' ? 'cancelled' : 'scheduled';
      
      await BrowserDatabaseService.updateTrip(tripId, { status: newStatus });
      
      toast({
        title: newStatus === 'scheduled' ? "تم تفعيل الرحلة" : "تم إلغاء الرحلة",
        description: newStatus === 'scheduled' 
          ? "تم تفعيل الرحلة بنجاح" 
          : "تم إلغاء الرحلة بنجاح"
      });
      
      // Reload trips
      loadTrips();
    } catch (error) {
      toast({
        title: "خطأ في تغيير حالة الرحلة",
        description: "حدث خطأ أثناء تغيير حالة الرحلة",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرحلة؟\n\nملاحظة: حذف 3 رحلات في آخر 24 ساعة سيؤدي إلى إيقاف حساب السائق تلقائياً.")) return;
    
    try {
      const result = await BrowserDatabaseService.deleteTrip(tripId);
      
      if (result && result.success) {
        if (result.willSuspend) {
          toast({
            title: "تم حذف الرحلة وإيقاف حساب السائق",
            description: `تم حذف الرحلة. تم إيقاف حساب السائق تلقائياً بسبب حذف ${result.deletionCount} رحلة في آخر 24 ساعة.`,
            variant: "default"
          });
        } else {
          toast({
            title: "تم حذف الرحلة",
            description: `تم حذف الرحلة بنجاح. السائق لديه ${result.remainingDeletions} حذف متبقي قبل إيقاف حسابه.`
          });
        }
        
        // Reload trips
        loadTrips();
      } else {
        throw new Error('Failed to delete trip');
      }
    } catch (error: any) {
      toast({
        title: "خطأ في حذف الرحلة",
        description: error?.message || "حدث خطأ أثناء حذف الرحلة",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الرحلات</h2>
          <p className="text-muted-foreground">إدارة جميع رحلات النظام</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            تصدير البيانات
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في الرحلات (السائق، رقم اللوحة، الولاية)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="scheduled">مجدولة</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="fully_booked">محجوز بالكامل</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterWilaya} onValueChange={setFilterWilaya}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="الولاية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الولايات</SelectItem>
                {wilayas.map((wilaya, index) => (
                  <SelectItem key={index} value={(index + 1).toString()}>
                    {wilaya.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trips List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل الرحلات...</p>
            </CardContent>
          </Card>
        ) : filteredTrips.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Route className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد رحلات</h3>
              <p className="text-muted-foreground">لا توجد رحلات تطابق معايير البحث</p>
            </CardContent>
          </Card>
        ) : (
          filteredTrips.map((trip) => {
            const statusInfo = getStatusBadge(trip.status);
            
            return (
              <Card key={trip.id} className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div className="text-lg font-semibold truncate">
                          {trip.fromWilayaName || `ولاية ${trip.fromWilayaId}`}
                          {trip.fromWilayaId === 47 && (trip as any).fromKsar && (
                            <span className="text-xs text-primary font-medium"> - {(trip as any).fromKsar}</span>
                          )}
                          {' → '}
                          {trip.toWilayaName || `ولاية ${trip.toWilayaId}`}
                          {trip.toWilayaId === 47 && (trip as any).toKsar && (
                            <span className="text-xs text-primary font-medium"> - {(trip as any).toKsar}</span>
                          )}
                        </div>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{trip.driver?.fullName || "غير محدد"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{trip.vehicle?.make} {trip.vehicle?.model} ({trip.vehicle?.licensePlate})</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{trip.departureDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{trip.departureTime}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary">{trip.pricePerSeat} دج</span>
                            <span className="text-muted-foreground">لكل مقعد</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="truncate">{trip.availableSeats}/{trip.totalSeats} مقاعد متاحة</span>
                          </div>
                        </div>
                      </div>
                      
                      {trip.description && (
                        <p className="text-sm text-muted-foreground mt-2 truncate">{trip.description}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedTrip(trip)}>
                            <Eye className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">عرض</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>تفاصيل الرحلة</DialogTitle>
                          </DialogHeader>
                          {selectedTrip && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">معلومات الرحلة</h4>
                                  <div className="space-y-2 text-sm">
                                    <div>من: {selectedTrip.fromWilayaName || `ولاية ${selectedTrip.fromWilayaId}`}
                                      {selectedTrip.fromWilayaId === 47 && (selectedTrip as any).fromKsar && (
                                        <span className="text-xs text-primary font-medium"> - {(selectedTrip as any).fromKsar}</span>
                                      )}
                                    </div>
                                    <div>إلى: {selectedTrip.toWilayaName || `ولاية ${selectedTrip.toWilayaId}`}</div>
                                    <div>التاريخ: {selectedTrip.departureDate}</div>
                                    <div>الوقت: {selectedTrip.departureTime}</div>
                                    <div>السعر: {selectedTrip.pricePerSeat} دج لكل مقعد</div>
                                    <div>المقاعد: {selectedTrip.availableSeats}/{selectedTrip.totalSeats}</div>
                                    <div>الحالة: {getStatusBadge(selectedTrip.status).label}</div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold mb-2">معلومات السائق والمركبة</h4>
                                  <div className="space-y-2 text-sm">
                                    <div>السائق: {selectedTrip.driver?.fullName || "غير محدد"}</div>
                                    <div>الهاتف: {selectedTrip.driver?.phone || "غير محدد"}</div>
                                    <div>المركبة: {selectedTrip.vehicle?.make} {selectedTrip.vehicle?.model}</div>
                                    <div>رقم اللوحة: {selectedTrip.vehicle?.licensePlate || "غير محدد"}</div>
                                  </div>
                                </div>
                              </div>
                              
                              {selectedTrip.description && (
                                <div>
                                  <h4 className="font-semibold mb-2">الوصف</h4>
                                  <p className="text-sm">{selectedTrip.description}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        size="sm" 
                        variant={trip.status === 'scheduled' ? "outline" : "default"}
                        onClick={() => handleToggleTripStatus(trip.id, trip.status)}
                        className={trip.status === 'scheduled' ? "border-yellow-500 text-yellow-600 hover:bg-yellow-50" : ""}
                      >
                        {trip.status === 'scheduled' ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">إلغاء</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">تفعيل</span>
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteTrip(trip.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">حذف</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TripManagement;