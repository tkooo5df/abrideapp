import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Edit, 
  Trash2,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { useDatabase } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/use-toast';

interface Booking {
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
  receiptUrl?: string;
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

interface BookingsTableProps {
  bookings: Booking[];
  onRefresh: () => void;
  onBookingUpdate?: (bookingId: number, updates: Partial<Booking>) => void;
}

const BookingsTable: React.FC<BookingsTableProps> = ({ 
  bookings, 
  onRefresh, 
  onBookingUpdate 
}) => {
  const { isLocal, getDatabaseService } = useDatabase();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

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
      
      onRefresh();
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
      
      onRefresh();
    } catch (error) {
    } finally {
      setUpdating(null);
    }
  };

  const exportBookings = () => {
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
    link.setAttribute('download', `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            قائمة الحجوزات ({filteredBookings.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              تحديث
            </Button>
            <Button onClick={exportBookings} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              تصدير
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث في الحجوزات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الحجز</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>من</TableHead>
                <TableHead>إلى</TableHead>
                <TableHead>الراكب</TableHead>
                <TableHead>السائق</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المقاعد</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد حجوزات</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">#{booking.id}</TableCell>
                    <TableCell>
                      {format(new Date(booking.createdAt), 'yyyy-MM-dd HH:mm', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="max-w-32 truncate font-medium">{booking.pickupLocation}</span>
                        </div>
                        {booking.pickupPoint && (
                          <span className="text-xs text-muted-foreground mr-6">📍 {booking.pickupPoint}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="max-w-32 truncate font-medium">{booking.destinationLocation}</span>
                        </div>
                        {booking.destinationPoint && (
                          <span className="text-xs text-muted-foreground mr-6">📍 {booking.destinationPoint}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{booking.passenger?.fullName || 'غير محدد'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-400" />
                        <span>{booking.driver?.fullName || 'غير محدد'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>{booking.seatsBooked}</TableCell>
                    <TableCell>
                      {booking.totalAmount ? `${booking.totalAmount.toLocaleString()} دج` : 'غير محدد'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">من</label>
                                    <div className="bg-secondary/10 p-3 rounded-lg">
                                      <p className="font-semibold">{selectedBooking.pickupLocation}</p>
                                      {selectedBooking.pickupPoint && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          📍 النقطة المحددة: {selectedBooking.pickupPoint}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">إلى</label>
                                    <div className="bg-secondary/10 p-3 rounded-lg">
                                      <p className="font-semibold">{selectedBooking.destinationLocation}</p>
                                      {selectedBooking.destinationPoint && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          📍 النقطة المحددة: {selectedBooking.destinationPoint}
                                        </p>
                                      )}
                                    </div>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingsTable;
