import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Scanner } from '@yudiel/react-qr-scanner';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
}

const QRScannerModal = ({ isOpen, onClose, driverId }: QRScannerModalProps) => {
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passengerInfo, setPassengerInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleScan = async (result: string) => {
    if (!result) return;
    
    // Play a short sound for successful scan if possible
    try {
      const audio = new Audio('/assets/scan-beep.mp3'); // Optional, if sound exists
      audio.play().catch(e => console.log('Audio play failed', e));
    } catch(e) {}

    setIsLoading(true);
    setScanResult(null);

    try {
      // Expecting URL format: abride.online/verify-receipt?code=123&id=456
      let receiptCode = '';
      let bookingId = '';

      try {
        const url = new URL(result.startsWith('http') ? result : `https://${result}`);
        receiptCode = url.searchParams.get('code') || '';
        bookingId = url.searchParams.get('id') || '';
      } catch (e) {
        // Fallback for non-url QR codes
        if (result.includes('code=')) {
          const params = new URLSearchParams(result.substring(result.indexOf('?')));
          receiptCode = params.get('code') || '';
          bookingId = params.get('id') || '';
        }
      }

      if (!bookingId) {
        // Decode base64 fallback
        try {
          const decoded = atob(result);
          if (decoded.includes('booking_')) {
            bookingId = decoded.replace('booking_', '');
          }
        } catch (e) {}
      }

      if (!bookingId) {
        // Direct number fallback
        if (!isNaN(Number(result))) {
          bookingId = result;
        } else {
          throw new Error('لم يتم التعرف على رمز الاستجابة السريعة (QR Code) أو أنه غير صالح لحجز.');
        }
      }

      // Query database
      const booking = await BrowserDatabaseService.getBookingById(bookingId);
      
      if (!booking) {
        throw new Error('لم يتم العثور على هذا الحجز في النظام.');
      }

      if (booking.driverId !== driverId && booking.trip?.driverId !== driverId) {
        throw new Error('هذا الحجز لا يخص رحلاتك.');
      }

      if (booking.status === 'cancelled' || booking.status === 'rejected') {
        throw new Error('هذا الحجز ملغى أو مرفوض.');
      }

      // Extract passenger info
      const passenger = booking.passenger || {};
      const fullName = passenger.full_name || passenger.fullName || passenger.firstName || 'مجهول';
      const phone = passenger.phone || 'غير متوفر';

      setPassengerInfo({
        name: fullName,
        phone,
        seats: booking.seats,
        status: booking.status,
        amount: booking.totalPrice || booking.total_price || 0
      });
      setScanResult('success');

    } catch (error: any) {
      setErrorMessage(error.message || 'حدث خطأ أثناء قراءة الرمز.');
      setScanResult('error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setPassengerInfo(null);
    setErrorMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetScanner();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            ماسح التذاكر
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4 min-h-[350px]">
          {isLoading ? (
            <div className="flex flex-col items-center text-primary">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className="font-semibold">جاري التحقق من الوصل...</p>
            </div>
          ) : scanResult === 'success' && passengerInfo ? (
            <div className="flex flex-col items-center w-full animate-in zoom-in duration-300">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
                <CheckCircle className="h-24 w-24 text-green-500 relative z-10" />
              </div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">وصل صحيح!</h3>
              
              <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mt-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500 text-sm">الراكب</span>
                  <span className="font-bold text-lg">{passengerInfo.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500 text-sm">رقم الهاتف</span>
                  <span className="font-bold font-mono" dir="ltr">{passengerInfo.phone}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500 text-sm">المقاعد المحجوزة</span>
                  <span className="font-bold">{passengerInfo.seats} مقاعد</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">المبلغ</span>
                  <span className="font-bold text-green-600">{passengerInfo.amount} د.ج</span>
                </div>
              </div>

              <Button onClick={resetScanner} className="w-full mt-6 h-12 text-lg">
                مسح وصل آخر
              </Button>
            </div>
          ) : scanResult === 'error' ? (
            <div className="flex flex-col items-center w-full animate-in zoom-in duration-300">
              <XCircle className="h-24 w-24 text-red-500 mb-4" />
              <h3 className="text-2xl font-bold text-red-600 mb-2">وصل غير صالح</h3>
              <p className="text-center text-slate-600 dark:text-slate-400 mb-6 font-medium">
                {errorMessage}
              </p>
              <Button onClick={resetScanner} variant="outline" className="w-full h-12 text-lg border-red-200 hover:bg-red-50 text-red-600">
                إعادة المحاولة
              </Button>
            </div>
          ) : (
            <div className="w-full aspect-square rounded-2xl overflow-hidden border-4 border-slate-100 shadow-inner relative bg-black flex items-center justify-center">
              <Scanner 
                onScan={(detectedCodes) => {
                  if (detectedCodes && detectedCodes.length > 0) {
                    handleScan(detectedCodes[0].rawValue);
                  }
                }}
                components={{
                  tracker: true,
                  audio: false,
                  finder: false
                }}
                styles={{
                  container: { width: '100%', height: '100%' },
                  video: { objectFit: 'cover' }
                }}
              />
              {/* Custom scanning overlay */}
              <div className="absolute inset-0 pointer-events-none border-[3px] border-primary/50 m-8 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                <div className="w-full h-1 bg-primary animate-[bounce_2s_ease-in-out_infinite] absolute left-0" style={{ boxShadow: '0 0 10px var(--primary)' }}></div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScannerModal;
