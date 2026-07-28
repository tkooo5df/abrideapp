import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Car, 
  CreditCard, 
  Search, 
  Eye, 
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Download,
  TrendingUp,
  Filter
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { useDatabase } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/use-toast';

interface RecentBooking {
  id: number;
  createdAt: string;
  pickupLocation: string;
  destinationLocation: string;
  passengerId?: string;
  driverId?: string;
  status: string;
  seatsBooked: number;
  totalAmount?: number;
  paymentMethod?: string;
  notes?: string;
  pickupTime?: string;
  specialRequests?: string;
  tripId?: string;
  passenger?: {
    id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  driver?: {
    id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  trip?: {
    id: string;
    fromWilayaName?: string;
    toWilayaName?: string;
    departureDate?: string;
    departureTime?: string;
    pricePerSeat?: number;
  };
}

interface RecentBookingsTableProps {
  onRefresh?: () => void;
  onBookingUpdate?: (bookingId: number, updates: Partial<RecentBooking>) => void;
}

const RecentBookingsTable: React.FC<RecentBookingsTableProps> = ({ 
  onRefresh, 
  onBookingUpdate 
}) => {
  const { isLocal, getDatabaseService } = useDatabase();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [daysFilter, setDaysFilter] = useState('30');
  const [selectedBooking, setSelectedBooking] = useState<RecentBooking | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchRecentBookings();
  }, [daysFilter]);

  const fetchRecentBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      let data: RecentBooking[] = [];
      
      if (isLocal) {
        const db = getDatabaseService();
        data = await db.getRecentBookings(parseInt(daysFilter));
      } else {
        data = await BrowserDatabaseService.getRecentBookings(parseInt(daysFilter));
      }
      // If no data, add some sample data for testing
      if (data.length === 0) {
        data = [
          {
            id: 1,
            createdAt: new Date().toISOString(),
            pickupLocation: 'الجزائر العاصمة',
            destinationLocation: 'وهران',
            passengerId: 'sample-passenger',
            driverId: 'sample-driver',
            status: 'pending',
            seatsBooked: 2,
            totalAmount: 1500,
            paymentMethod: 'cod',
            notes: 'حجز تجريبي',
            pickupTime: '08:00',
            specialRequests: 'لا توجد',
            passenger: {
              id: 'sample-passenger',
              fullName: 'أحمد محمد',
              phone: '0555123456'
            },
            driver: {
              id: 'sample-driver',
              fullName: 'محمد علي',
              phone: '0555987654'
            }
          }
        ];
      }
      
      setBookings(data);
      calculateStats(data);
    } catch (err) {
      setError('حدث خطأ في تحميل الحجوزات الحديثة');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData: RecentBooking[]) => {
    const stats = {
      total: bookingsData.length,
      pending: bookingsData.filter(b => b.status === 'pending').length,
      confirmed: bookingsData.filter(b => b.status === 'confirmed').length,
      completed: bookingsData.filter(b => b.status === 'completed').length,
      cancelled: bookingsData.filter(b => b.status === 'cancelled' || b.status === 'rejected').length,
      totalRevenue: bookingsData
        .filter(b => b.status === 'completed' && b.totalAmount)
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    };
    setStats(stats);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'في الانتظار', variant: 'secondary' as const },
      confirmed: { label: 'مؤكد', variant: 'default' as const },
      completed: { label: 'مكتمل', variant: 'default' as const },
      cancelled: { label: 'ملغي', variant: 'destructive' as const },
      rejected: { label: 'مرفوض', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodLabel = (method?: string) => {
    const methods = {
      cod: 'الدفع عند الاستلام',
      baridimob: 'بريدي موب',
      card: 'بطاقة ائتمان'
    };
    return methods[method as keyof typeof methods] || method || 'غير محدد';
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.destinationLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.passenger?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.driver?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toString().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

    const result = matchesSearch && matchesStatus;
    
    // Debug logging for cancelled/rejected bookings
    if (booking.status === 'cancelled' || booking.status === 'rejected') {
    }

    return result;
  });

  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      setUpdating(bookingId);
      
      if (isLocal) {
        const db = getDatabaseService();
        await db.updateBooking(bookingId, { status: newStatus });
      } else {
        await BrowserDatabaseService.updateBooking(bookingId, { status: newStatus });
      }
      
      // If completing a booking, show special message
      if (newStatus === 'completed') {
        toast({
          title: "تم إكمال الرحلة",
          description: "تم إكمال الرحلة لجميع الركاب في نفس الرحلة",
        });
      }
      
      if (onBookingUpdate) {
        onBookingUpdate(bookingId, { status: newStatus });
      }
      
      fetchRecentBookings();
    } catch (error) {
    } finally {
      setUpdating(null);
    }
  };

  const deleteBooking = async (bookingId: number) => {
    try {
      setUpdating(bookingId);
      
      if (isLocal) {
        const db = getDatabaseService();
        await db.deleteBooking(bookingId);
      } else {
        await BrowserDatabaseService.deleteBooking(bookingId);
      }
      
      fetchRecentBookings();
    } catch (error) {
    } finally {
      setUpdating(null);
    }
  };

  const exportRecentBookings = () => {
    const csvContent = [
      ['رقم الحجز', 'التاريخ', 'من', 'إلى', 'الراكب', 'السائق', 'الحالة', 'المقاعد', 'المبلغ', 'طريقة الدفع'],
      ...filteredBookings.map(booking => [
        booking.id,
        format(new Date(booking.createdAt), 'yyyy-MM-dd HH:mm', { locale: ar }),
        booking.pickupLocation,
        booking.destinationLocation,
        booking.passenger?.fullName || 'غير محدد',
        booking.driver?.fullName || 'غير محدد',
        booking.status,
        booking.seatsBooked,
        booking.totalAmount || 0,
        getPaymentMethodLabel(booking.paymentMethod)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `recent-bookings-${daysFilter}-days-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">جاري تحميل الحجوزات الحديثة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">خطأ</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchRecentBookings} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة المحاولة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الحجوزات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">في الانتظار</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">مؤكد</p>
                <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">مكتمل</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Trash2 className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ملغي</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} دج</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في الحجوزات الحديثة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={daysFilter} onValueChange={setDaysFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="فترة زمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">آخر 7 أيام</SelectItem>
                <SelectItem value="15">آخر 15 يوم</SelectItem>
                <SelectItem value="30">آخر 30 يوم</SelectItem>
                <SelectItem value="60">آخر 60 يوم</SelectItem>
                <SelectItem value="90">آخر 90 يوم</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="confirmed">مؤكد</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={fetchRecentBookings} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                تحديث
              </Button>
              <Button onClick={exportRecentBookings} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                تصدير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            الحجوزات الحديثة - آخر {daysFilter} يوم ({filteredBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-gray-500">لا توجد حجوزات حديثة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="text-lg font-semibold truncate">
                            #{booking.id} - {booking.passenger?.fullName || 'غير محدد'} → {booking.driver?.fullName || 'غير محدد'}
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <div className="flex flex-col">
                                <span className="truncate font-medium">{booking.pickupLocation} → {booking.destinationLocation}</span>
                                {(booking.pickupPoint || booking.destinationPoint) && (
                                  <span className="text-xs text-muted-foreground">
                                    {booking.pickupPoint && `من: ${booking.pickupPoint}`}
                                    {booking.pickupPoint && booking.destinationPoint && ' | '}
                                    {booking.destinationPoint && `إلى: ${booking.destinationPoint}`}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{format(new Date(booking.createdAt), 'yyyy-MM-dd HH:mm', { locale: ar })}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{booking.seatsBooked} مقاعد</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{booking.pickupTime || 'غير محدد'}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="font-semibold text-primary truncate">{booking.totalAmount ? `${booking.totalAmount.toLocaleString()} دج` : 'غير محدد'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{getPaymentMethodLabel(booking.paymentMethod)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {(booking.notes || booking.specialRequests) && (
                          <div className="mt-2 flex flex-col gap-1">
                            {booking.notes && (
                              <p className="text-sm text-muted-foreground truncate">
                                <strong>ملاحظات:</strong> {booking.notes}
                              </p>
                            )}
                            {booking.specialRequests && (
                              <p className="text-sm text-muted-foreground truncate">
                                <strong>طلبات خاصة:</strong> {booking.specialRequests}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                        {/* View Details */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>تفاصيل الحجز #{booking.id}</DialogTitle>
                            </DialogHeader>
                            {selectedBooking && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">رقم الحجز</label>
                                    <p className="text-lg font-semibold">#{selectedBooking.id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">التاريخ</label>
                                    <p>{format(new Date(selectedBooking.createdAt), 'yyyy-MM-dd HH:mm', { locale: ar })}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">من</label>
                                    <p>{selectedBooking.pickupLocation}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">إلى</label>
                                    <p>{selectedBooking.destinationLocation}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">الراكب</label>
                                    <p>{selectedBooking.passenger?.fullName || 'غير محدد'}</p>
                                    {selectedBooking.passenger?.phone && (
                                      <p className="text-sm text-gray-500">{selectedBooking.passenger.phone}</p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">السائق</label>
                                    <p>{selectedBooking.driver?.fullName || 'غير محدد'}</p>
                                    {selectedBooking.driver?.phone && (
                                      <p className="text-sm text-gray-500">{selectedBooking.driver.phone}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">الحالة</label>
                                    <div>{getStatusBadge(selectedBooking.status)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">المقاعد</label>
                                    <p>{selectedBooking.seatsBooked}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">المبلغ</label>
                                    <p>{selectedBooking.totalAmount ? `${selectedBooking.totalAmount.toLocaleString()} دج` : 'غير محدد'}</p>
                                  </div>
                                </div>

                                {selectedBooking.paymentMethod && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">طريقة الدفع</label>
                                    <p>{getPaymentMethodLabel(selectedBooking.paymentMethod)}</p>
                                  </div>
                                )}

                                {selectedBooking.notes && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">ملاحظات</label>
                                    <p className="bg-gray-50 p-3 rounded-md">{selectedBooking.notes}</p>
                                  </div>
                                )}

                                {selectedBooking.specialRequests && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">طلبات خاصة</label>
                                    <p className="bg-gray-50 p-3 rounded-md">{selectedBooking.specialRequests}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {/* Status Actions */}
                        {booking.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            disabled={updating === booking.id}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {booking.status === 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            disabled={updating === booking.id}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={updating === booking.id}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>إلغاء الحجز</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من إلغاء هذا الحجز؟ هذا الإجراء لا يمكن التراجع عنه.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  تأكيد الإلغاء
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* Delete Booking */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={updating === booking.id}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف الحجز</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف هذا الحجز نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteBooking(booking.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                تأكيد الحذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentBookingsTable;
