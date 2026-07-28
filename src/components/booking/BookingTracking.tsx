import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookingTrackingService, BookingStatus } from '@/integrations/database/bookingTrackingService';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import { 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Car,
  MapPin,
  Phone
} from 'lucide-react';

interface BookingTrackingProps {
  bookingId: string;
  onStatusChange?: () => void;
}

const BookingTracking = ({ bookingId, onStatusChange }: BookingTrackingProps) => {
  const { user: supabaseUser } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal } = useDatabase();
  
  const user = isLocal ? localUser : supabaseUser;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const bookingWithHistory = await BookingTrackingService.getBookingWithHistory(bookingId);
      setBooking(bookingWithHistory);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل تفاصيل الحجز",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusAction = async (action: string, newStatus: BookingStatus) => {
    if (!user || !booking) return;

    try {
      setActionLoading(true);
      
      // Properly type and validate the user role
      let userRole: 'passenger' | 'driver' | 'admin' = 'passenger';
      
      if (user.role) {
        if (user.role === 'driver') {
          userRole = 'driver';
        } else if (user.role === 'admin') {
          userRole = 'admin';
        }
        // For 'passenger' or any other role, default to 'passenger'
      }
      
      await BookingTrackingService.trackStatusChange(
        bookingId,
        newStatus,
        userRole === 'admin' ? 'driver' : userRole, // Map admin to driver for tracking purposes
        user.id,
        `تم ${action} الحجز من قبل ${userRole === 'driver' ? 'السائق' : 'الراكب'}`
      );

      await loadBookingDetails();
      onStatusChange?.();

      const statusInfo = BookingTrackingService.getStatusInfo(newStatus);
      toast({
        title: "تم تحديث الحجز",
        description: `حالة الحجز: ${statusInfo.label}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الحجز",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">لم يتم العثور على الحجز</p>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = BookingTrackingService.getStatusInfo(booking.status);
  
  // Properly type and validate the user role for available actions
  let userRoleForActions: 'passenger' | 'driver' | 'admin' = 'passenger';
  
  if (user?.role) {
    if (user.role === 'driver') {
      userRoleForActions = 'driver';
    } else if (user.role === 'admin') {
      userRoleForActions = 'admin';
    }
    // For 'passenger' or any other role, default to 'passenger'
  }
  
  const availableActions = BookingTrackingService.getAvailableActions(
    booking.status,
    userRoleForActions
  );

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{statusInfo.icon}</span>
            <span>حالة الحجز الحالية</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
            <span className="text-sm text-muted-foreground">#{booking.id}</span>
          </div>
          <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
          
          {/* Booking Details */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{booking.pickupLocation}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{booking.destinationLocation}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-right">
                <div className="text-lg font-bold text-primary">{booking.totalAmount} دج</div>
                <div className="text-sm text-muted-foreground">{booking.seatsBooked} مقعد</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {availableActions.length > 0 && (
            <div className="flex gap-2 pt-4 border-t">
              {availableActions.map((action) => (
                <Button
                  key={action.action}
                  variant={action.variant}
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => handleStatusAction(action.label, action.newStatus)}
                >
                  <span className="mr-2">{action.icon}</span>
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>تاريخ الحجز</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {booking.history && booking.history.length > 0 ? (
            <div className="space-y-4">
              {booking.history.map((entry: any, index: number) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      index === 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {BookingTrackingService.getStatusInfo(entry.status).label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{entry.notes || `تم ${entry.event} الحجز`}</p>
                    <p className="text-xs text-muted-foreground">
                      بواسطة: {entry.actor === 'driver' ? 'السائق' : 
                                entry.actor === 'passenger' ? 'الراكب' : 'النظام'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              لا يوجد تاريخ للحجز بعد
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingTracking;