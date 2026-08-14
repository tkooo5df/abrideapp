import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Phone, User, CreditCard, ExternalLink, Image as ImageIcon } from "lucide-react";

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending': return { label: 'قيد الانتظار', variant: 'secondary' as const };
    case 'confirmed': return { label: 'مؤكد', variant: 'default' as const };
    case 'completed': return { label: 'مكتمل', variant: 'outline' as const };
    case 'cancelled': return { label: 'ملغى', variant: 'destructive' as const };
    default: return { label: status || 'غير معروف', variant: 'outline' as const };
  }
};

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ isOpen, onClose, booking }) => {
  if (!booking) return null;

  const statusInfo = getStatusBadge(booking.status);
  const tripType = booking.tripType || booking.trip_type;
  const isBaridiMob = booking.paymentMethod === 'bpm' || booking.payment_method === 'bpm';
  const receiptUrl = booking.receiptUrl || booking.receipt_url;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] font-cairo">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">تفاصيل الحجز</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4 max-h-[80vh] overflow-y-auto px-2 pb-4">
          
          {/* Header Info */}
          <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
            <div>
              <span className="text-sm text-muted-foreground block">رقم الحجز</span>
              <span className="font-mono font-bold text-primary">
                {booking.receiptCode || booking.receipt_code || `ABR-${booking.id}`}
              </span>
            </div>
            <Badge variant={statusInfo.variant} className="text-sm px-3 py-1">
              {statusInfo.label}
            </Badge>
          </div>

          {/* Passenger Info */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm border-b pb-1">معلومات الراكب</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{booking.passenger?.fullName || booking.passengerName || 'غير متوفر'}</span>
              </div>
              {(booking.passenger?.phone || booking.passengerPhone) && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${booking.passenger?.phone || booking.passengerPhone}`} className="text-blue-600 hover:underline dir-ltr">
                    {booking.passenger?.phone || booking.passengerPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Trip Info */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm border-b pb-1">معلومات الرحلة</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <MapPin className="w-4 h-4 text-emerald-600" />
                {booking.trip?.fromWilayaName || 'غير متوفر'}
                <span className="text-muted-foreground mx-1">←</span>
                {booking.trip?.toWilayaName || 'غير متوفر'}
              </div>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {booking.trip?.departureDate || 'غير محدد'}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {booking.pickupTime || booking.trip?.departureTime || 'غير محدد'}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm border-b pb-1">الدفع والمقاعد</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">المقاعد:</span>
                <span className="font-bold">{booking.seatsBooked || 1}</span>
                <Badge variant="outline" className="text-[10px]">
                  {tripType === 'round_trip' ? '🔄 ذهاب وإياب' : (tripType === 'return') ? '⬅️ عودة فقط' : '➡️ ذهاب فقط'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">السعر:</span>
                <span className="font-bold text-emerald-600">{booking.totalAmount || 0} دج</span>
              </div>
              <div className="col-span-2 flex items-center gap-2 mt-1">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">طريقة الدفع:</span>
                <Badge variant={isBaridiMob ? 'default' : 'outline'} className={isBaridiMob ? 'bg-blue-600 hover:bg-blue-700' : ''}>
                  {isBaridiMob ? 'بريدي موب' : 'الدفع نقداً'}
                </Badge>
              </div>
            </div>
          </div>

          {/* BaridiMob Receipt Section */}
          {isBaridiMob && (
            <div className="space-y-3 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <h3 className="font-bold text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                وصل الدفع (بريدي موب)
              </h3>
              
              {receiptUrl ? (
                <div className="space-y-3">
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-lg border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 transition-colors">
                    <img 
                      src={receiptUrl} 
                      alt="BaridiMob Receipt" 
                      className="w-full h-auto max-h-[300px] object-contain bg-black/5"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium flex items-center gap-2">
                        <ExternalLink className="w-5 h-5" /> تكبير الوصل
                      </span>
                    </div>
                  </a>
                  <p className="text-xs text-center text-muted-foreground">
                    انقر على الصورة لعرضها بحجم كامل
                  </p>
                </div>
              ) : (
                <div className="text-center p-4 border border-dashed border-blue-200 dark:border-blue-800 rounded-lg text-sm text-muted-foreground">
                  لم يتم إرفاق وصل الدفع
                </div>
              )}
            </div>
          )}

          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm border-b pb-1">ملاحظات إضافية</h3>
              <p className="text-sm bg-muted/30 p-3 rounded-lg border">
                {booking.specialRequests}
              </p>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailsModal;
