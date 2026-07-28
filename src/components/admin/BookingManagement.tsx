import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  BarChart3,
  Clock,
  Car,
  CreditCard,
  Trash2
} from "lucide-react";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";
import { useDatabase } from "@/hooks/useDatabase";
import BookingsTable from "./BookingsTable";

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

const BookingManagement = () => {
  const { isLocal, getDatabaseService } = useDatabase();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      let data: Booking[] = [];
      
      if (isLocal) {
        const db = getDatabaseService();
        data = await db.getAllBookings();
      } else {
        data = await BrowserDatabaseService.getAllBookings();
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
          },
          {
            id: 2,
            createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            pickupLocation: 'قسنطينة',
            destinationLocation: 'عنابة',
            passengerId: 'sample-passenger-2',
            driverId: 'sample-driver-2',
            status: 'completed',
            seatsBooked: 1,
            totalAmount: 800,
            paymentMethod: 'baridimob',
            notes: 'حجز مكتمل',
            pickupTime: '14:30',
            specialRequests: 'لا توجد',
            passenger: {
              id: 'sample-passenger-2',
              fullName: 'فاطمة أحمد',
              phone: '0555123457'
            },
            driver: {
              id: 'sample-driver-2',
              fullName: 'علي حسن',
              phone: '0555987655'
            }
          }
        ];
      }

      setBookings(data);
      calculateStats(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData: Booking[]) => {
    const stats = {
      total: bookingsData.length,
      pending: bookingsData.filter(b => b.status === 'pending').length,
      confirmed: bookingsData.filter(b => b.status === 'confirmed').length,
      completed: bookingsData.filter(b => b.status === 'completed').length,
      cancelled: bookingsData.filter(b => b.status === 'cancelled').length,
      totalRevenue: bookingsData
        .filter(b => b.status === 'completed' && b.totalAmount)
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    };
    setStats(stats);
  };

  const handleBookingUpdate = (bookingId: number, updates: Partial<Booking>) => {
    setBookings(prev => prev.map(booking => 
      booking.id === bookingId ? { ...booking, ...updates } : booking
    ));
    calculateStats(bookings.map(booking => 
      booking.id === bookingId ? { ...booking, ...updates } : booking
    ));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الحجوزات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الحجوزات</h2>
          <p className="text-muted-foreground">عرض وإدارة جميع حجوزات الركوب</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
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

      {/* Bookings Table */}
      <BookingsTable 
        bookings={bookings} 
        onRefresh={fetchBookings}
        onBookingUpdate={handleBookingUpdate}
      />
    </div>
  );
};

export default BookingManagement;