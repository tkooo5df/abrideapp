import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Car, 
  CreditCard, 
  RefreshCw,
  BarChart3,
  Trash2,
  Users,
  AlertTriangle
} from 'lucide-react';
import BookingsTable from '@/components/admin/BookingsTable';
import CancellationManagement from '@/components/admin/CancellationManagement';

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

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const { isLocal, getDatabaseService } = useDatabase();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0
  });

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');

  // Check if user is admin
  const isAdmin = profile?.role === 'admin' || profile?.role === 'developer';

  // Debug: Log users state changes
  useEffect(() => {
    const swagUser = users.find(u => u.full_name?.includes('swag'));
    const amineUser = users.find(u => u.full_name?.includes('amine'));
    
    if (swagUser) {
    }
    
    if (amineUser) {
    }
  }, [users]);

  useEffect(() => {
    if (!isAdmin) {
      setError('ليس لديك صلاحية للوصول إلى لوحة المدير');
      setLoading(false);
      return;
    }
    fetchBookings();
    fetchAllUsers();
  }, [isAdmin]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: any[] = [];
      
      if (isLocal) {
        const db = getDatabaseService();
        data = await db.getAllBookings();
      } else {
        data = await BrowserDatabaseService.getAllBookings();
      }
      // Convert string IDs to numbers for compatibility with BookingsTable
      const convertedData = data.map(booking => ({
        ...booking,
        id: typeof booking.id === 'string' ? parseInt(booking.id) : booking.id
      }));

      setBookings(convertedData);
      calculateStats(convertedData);
    } catch (err) {
      setError('حدث خطأ في تحميل الحجوزات');
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
      cancelled: bookingsData.filter(b => b.status === 'cancelled' || b.status === 'rejected').length,
      totalRevenue: bookingsData
        .filter(b => b.status === 'completed' && b.totalAmount)
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    };
    setStats(stats);
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch all users (passengers and drivers) with their suspension status
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          account_suspensions!left(
            id,
            suspended_at,
            suspension_type,
            suspension_reason,
            reactivated_at
          )
        `)
        .in('role', ['passenger', 'driver'])
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      // تسجيل مفصل للأفاتار
      const usersWithAvatars = data?.filter(u => u.avatar_url) || [];
      // Process the data to determine actual suspension status
      const processedUsers = data?.map(user => {
        // Check if there's an active suspension (not reactivated)
        const activeSuspension = user.account_suspensions?.find(
          (suspension: any) => !suspension.reactivated_at
        );
        
        // For drivers, check both account_suspended AND is_verified
        // For passengers, check only account_suspended
        let isActuallySuspended = false;
        
        if (user.role === 'driver') {
          // For drivers: suspended if account_suspended OR not verified OR has active suspension
          isActuallySuspended = user.account_suspended || !user.is_verified || !!activeSuspension;
        } else {
          // For passengers: suspended if account_suspended OR has active suspension
          isActuallySuspended = user.account_suspended || !!activeSuspension;
        }
        // تسجيل مفصل للسائق amine Kerkar
        if (user.full_name?.includes('amine')) {
        }
        
        return {
          ...user,
          account_suspended: isActuallySuspended,
          suspension_details: activeSuspension
        };
      }) || [];
      setUsers(processedUsers);
    } catch (error) {
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      // Get user details to determine role
      const { data: userData } = await supabase
        .from('profiles')
        .select('role, is_verified')
        .eq('id', userId)
        .single();
      if (newStatus) {
        // Suspending account
        if (userData?.role === 'driver') {
          // For drivers: set account_suspended = true AND is_verified = false
          const { data: updateData, error: profileError } = await supabase
            .from('profiles')
            .update({ 
              account_suspended: true,
              is_verified: false 
            })
            .eq('id', userId)
            .select();
          if (profileError) {
            throw profileError;
          }
        } else {
          // For passengers: set account_suspended = true
          const { data: updateData, error: profileError } = await supabase
            .from('profiles')
            .update({ account_suspended: true })
            .eq('id', userId)
            .select();
          if (profileError) {
            throw profileError;
          }
        }
        toast.success('تم إيقاف الحساب');
      } else {
        // Reactivating account - use the RPC function to properly reactivate
        const { data: reactivateResult, error: reactivateError } = await (supabase as any).rpc('reactivate_user_account', {
          user_id: userId,
          reactivation_reason: 'تم إعادة تفعيل الحساب من قبل المدير',
          reactivated_by: user?.id
        });
        if (reactivateError) {
          throw reactivateError;
        }
        toast.success('تم تفعيل الحساب بنجاح');
      }

      // Refresh the users list to get updated data
      await fetchAllUsers();
    } catch (error) {
      toast.error(`حدث خطأ في تحديث حالة الحساب: ${error.message || 'خطأ غير معروف'}`);
    }
  };

  const handleBookingUpdate = (bookingId: number, updates: Partial<Booking>) => {
    setBookings(prev => prev.map(booking => 
      booking.id === bookingId ? { ...booking, ...updates } : booking
    ));
    calculateStats(bookings.map(booking => 
      booking.id === bookingId ? { ...booking, ...updates } : booking
    ));
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">غير مصرح</h2>
              <p className="text-muted-foreground">
                ليس لديك صلاحية للوصول إلى لوحة المدير
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل الحجوزات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">خطأ</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchBookings} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">لوحة المدير</h1>
              <p className="text-sm sm:text-base text-gray-600">إدارة الحجوزات والمستخدمين والإلغاءات</p>
            </div>
            <a href="/admin/notification-test">
              <Button variant="outline" className="w-full sm:w-auto">
                اختبار الإشعارات
              </Button>
            </a>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 sm:mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">الحجوزات</span>
            </TabsTrigger>
            <TabsTrigger value="passengers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">المستخدمين</span>
            </TabsTrigger>
            <TabsTrigger value="cancellations" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">الإلغاءات</span>
            </TabsTrigger>
          </TabsList>

          {/* Add Cancellations Tab Button */}
          <div className="mb-4">
            <Button 
              onClick={() => setActiveTab('cancellations')}
              variant={activeTab === 'cancellations' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              الإلغاءات
            </Button>
          </div>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">إجمالي الحجوزات</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">في الانتظار</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">مؤكد</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center">
                <Car className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">مكتمل</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center">
                <Trash2 className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">ملغي</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} دج</p>
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
          </TabsContent>

          {/* Passengers Tab */}
          <TabsContent value="passengers" className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  إدارة المستخدمين
                </CardTitle>
                <CardDescription className="text-sm">
                  إيقاف وتفعيل حسابات المستخدمين - عدد المستخدمين: {users.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الاسم
                          </th>
                          <th className="hidden sm:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            البريد الإلكتروني
                          </th>
                          <th className="hidden md:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الهاتف
                          </th>
                          <th className="hidden lg:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            تاريخ الإنشاء
                          </th>
                          <th className="hidden sm:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            النوع
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الإجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => {
                          // تسجيل مفصل للسائق swag lwal
                          if (user.full_name?.includes('swag')) {
                          }
                          
                          // تسجيل مفصل للسائق amine Kerkar
                          if (user.full_name?.includes('amine')) {
                          }
                          
                          // تسجيل مفصل للأفاتار
                          if (user.full_name?.includes('swag') || user.full_name?.includes('amine')) {
                          }
                          
                          return (
                          <tr key={user.id}>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                                  <img
                                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"
                                    src={user.avatar_url || '/placeholder.svg'}
                                    alt={user.full_name}
                                  />
                                </div>
                                <div className="ml-2 sm:ml-4">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900">
                                    {user.full_name || 'غير محدد'}
                                  </div>
                                  <div className="sm:hidden text-xs text-gray-500">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.email}
                            </td>
                            <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.phone || 'غير محدد'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.account_suspended 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {user.account_suspended ? 'موقوف' : 'نشط'}
                              </span>
                            </td>
                            <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(user.created_at).toLocaleDateString('ar-SA')}
                            </td>
                            <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.role === 'driver' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {user.role === 'driver' ? 'سائق' : 'راكب'}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.account_suspended 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.account_suspended ? 'موقوف' : 'نشط'}
                                </span>
                                {user.suspension_details && (
                                  <span className="text-xs text-gray-500">
                                    {user.suspension_details.suspension_type === 'cancellation_limit' ? 'إلغاءات' : 'يدوي'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                  onClick={() => {
                                    toggleUserStatus(user.id, user.account_suspended);
                                  }}
                                  variant={user.account_suspended ? "default" : "destructive"}
                                  size="sm"
                                  className="w-full sm:w-auto"
                                >
                                  {user.account_suspended ? 'تفعيل' : 'إيقاف'}
                                </Button>
                                <span className="hidden sm:inline text-xs text-gray-500 self-center">
                                  ({user.account_suspended ? 'موقوف' : 'نشط'})
                                </span>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {users.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        لا توجد حسابات مستخدمين
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cancellations Tab */}
          <TabsContent value="cancellations">
            <CancellationManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;