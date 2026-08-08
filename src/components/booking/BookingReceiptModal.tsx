import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Printer, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Car, 
  Phone, 
  ShieldCheck, 
  QrCode,
  Copy
} from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from '@/hooks/use-toast';

interface BookingReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export const BookingReceiptModal: React.FC<BookingReceiptModalProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!booking) return null;

  const bookingId = booking.id;
  const receiptCode = booking.receiptCode || booking.receipt_code || `ABR-${bookingId}`;
  const verifyUrl = `https://abride.online/verify-receipt?code=${encodeId(receiptCode)}&id=${encodeId(bookingId)}`;

  const fromLocation = booking.pickupLocation || booking.trip?.fromWilayaName || 'ولاية الانطلاق';
  const toLocation = booking.destinationLocation || booking.trip?.toWilayaName || 'ولاية الوصول';
  const driverName = booking.driver?.fullName || booking.driverName || 'سائق أبريد';
  const driverPhone = booking.driver?.phone || booking.driverPhone || '';
  const passengerName = booking.passenger?.fullName || booking.passengerName || 'راكب أبريد';
  const passengerPhone = booking.passenger?.phone || booking.passengerPhone || '';
  const departureDate = booking.trip?.departureDate || booking.departureDate || '';
  const departureTime = booking.pickupTime || booking.trip?.departureTime || '';
  const seatsBooked = booking.seatsBooked || 1;
  const totalAmount = booking.totalAmount || 0;
  const vehicleInfo = `${booking.trip?.vehicle?.make || ''} ${booking.trip?.vehicle?.model || ''}`.trim() || 'مركبة معتمدة';

  useEffect(() => {
    if (isOpen && booking) {
      QRCode.toDataURL(verifyUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#047857',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR Code error:', err));
    }
  }, [isOpen, booking, verifyUrl]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'تعذر فتح نافذة الطباعة',
        description: 'يرجى السماح بالنوافذ المنبثقة من إعدادات المتصفح',
        variant: 'destructive',
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>وصل حجز - ${receiptCode}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 24px;
              direction: rtl;
              background-color: #f8fafc;
              color: #111827;
              margin: 0;
            }
            .receipt-box {
              max-width: 580px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 20px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
            }
            .header-block {
              background-color: #047857;
              padding: 28px 24px 20px 24px;
              text-align: center;
            }
            .logo-badge {
              background: rgba(255, 255, 255, 0.18);
              border: 1px solid rgba(255, 255, 255, 0.35);
              border-radius: 50%;
              width: 56px;
              height: 56px;
              margin: 0 auto 10px auto;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .brand-wordmark {
              color: #ffffff;
              font-size: 24px;
              font-weight: 800;
              letter-spacing: 1px;
            }
            .brand-eyebrow {
              color: #dcfce7;
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 3px;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .route-strip {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              margin-top: 14px;
              color: #ffffff;
              font-size: 14px;
            }
            .dots { color: rgba(255,255,255,0.4); letter-spacing: 3px; font-size: 12px; }
            .content-area {
              padding: 24px;
            }
            .ticket-card {
              background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%);
              border: 1.5px solid #bbf7d0;
              border-radius: 18px;
              padding: 22px;
              margin-bottom: 20px;
            }
            .perforation {
              border-bottom: 2px dashed #86efac;
              padding-bottom: 14px;
              margin-bottom: 14px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .status-pill {
              background-color: #dcfce7;
              color: #15803d;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 700;
              padding: 4px 14px;
            }
            .receipt-code-label {
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 2px;
              color: #047857;
              font-family: 'Cairo', sans-serif;
            }
            .amount-climax {
              text-align: center;
              margin: 16px 0;
            }
            .amount-label {
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 2px;
              color: #6b7280;
              text-transform: uppercase;
            }
            .amount-value {
              font-size: 38px;
              font-weight: 800;
              color: #065f46;
              line-height: 1.1;
            }
            .amount-currency {
              font-size: 20px;
              font-weight: 600;
              color: #047857;
              margin-right: 6px;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-top: 14px;
              font-size: 13px;
            }
            .detail-item {
              background: rgba(255, 255, 255, 0.7);
              padding: 10px 14px;
              border-radius: 10px;
              border: 1px solid rgba(187, 247, 208, 0.6);
            }
            .detail-label { color: #6b7280; font-size: 11px; margin-bottom: 2px; }
            .detail-val { font-weight: 700; color: #111827; }
            .qr-section {
              text-align: center;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
            }
            .qr-section img {
              width: 140px;
              height: 140px;
              border-radius: 12px;
              padding: 6px;
              border: 1px solid #e5e7eb;
              background: #fff;
            }
            .footer {
              border-top: 1px solid #e5e7eb;
              padding: 18px;
              text-align: center;
              color: #9ca3af;
              font-size: 12px;
              background-color: #f8fafc;
            }
            @media print {
              body { padding: 0; background: #fff; }
              .receipt-box { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header-block" style="padding: 32px 24px 24px 24px;">
              <img src="https://www.abride.online/logo.svg" alt="Abride" width="68" height="68" style="filter: brightness(0) invert(1); margin: 0 auto 10px auto; display: block;" />
              <div class="brand-wordmark" style="font-size: 26px;">أبريد ABRIDE</div>
              <div class="brand-eyebrow">ABRIDE PLATFORM • RECU SYSTEM</div>
            </div>

            <div class="content-area">
              <div class="ticket-card">
                <div class="perforation">
                  <div class="status-pill">✓ وصل حجز مؤكد (RECU)</div>
                  <div class="receipt-code-label">${receiptCode}</div>
                </div>

                <div class="amount-climax">
                  <div class="amount-label">المبلغ الإجمالي</div>
                  <div class="amount-value">
                    ${totalAmount} <span class="amount-currency">دج</span>
                  </div>
                </div>

                <div style="border-bottom: 2px dashed #86efac; margin: 14px 0;"></div>

                <div class="details-grid">
                  <div class="detail-item" style="grid-column: span 2;">
                    <div class="detail-label">مسار الرحلة</div>
                    <div class="detail-val" style="color: #047857;">من ${fromLocation} إلى ${toLocation}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">الراكب</div>
                    <div class="detail-val">${passengerName}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">السائق</div>
                    <div class="detail-val">${driverName} ${driverPhone ? `(${driverPhone})` : ''}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">تاريخ ووقت الانطلاق</div>
                    <div class="detail-val">${departureDate} ${departureTime}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">المقاعد المجهزة</div>
                    <div class="detail-val">${seatsBooked} مقعد</div>
                  </div>
                </div>
              </div>

              <div class="qr-section">
                ${qrCodeUrl ? `<img src="${qrCodeUrl}" alt="QR Code" />` : ''}
                <div style="font-size: 13px; font-weight: 700; color: #047857; margin-top: 8px;">
                  امسح الكود للتحقق المباشر عبر المنصة الرسمية
                </div>
                <div style="font-size: 11px; color: #6b7280; font-family: monospace; margin-top: 2px;">
                  ${verifyUrl}
                </div>
              </div>
            </div>

            <div class="footer">
              <p style="margin: 0 0 4px 0; color: #6b7280; font-weight: 600;">منصة أبريد - الرحلات والتنقل بين الولايات الجزائرية</p>
              <p style="margin: 0;">جميع الحقوق محفوظة © ${new Date().getFullYear()} abride.online</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    toast({
      title: 'تم نسخ رابط التحقق',
      description: 'يمكنك الآن إرسال الرابط أو مشاركته للتحقق من الحجز عبر abride.online',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden bg-background border border-emerald-500/20 shadow-2xl rounded-[20px] font-sans dir-rtl text-right">
        
        {/* Brand Header */}
        <div className="bg-[#047857] text-white p-7 text-center relative">
          <img src="https://www.abride.online/logo.svg" alt="Abride Logo" className="w-16 h-16 mx-auto mb-2 filter brightness-0 invert" />
          <DialogTitle className="text-2xl font-extrabold text-white tracking-wide">
            أبريد ABRIDE
          </DialogTitle>
          <div className="text-[11px] font-semibold tracking-[3px] text-emerald-100 uppercase mt-0.5">
            ABRIDE PLATFORM • RECU SYSTEM
          </div>
        </div>

        {/* Modal Body / Ticket Stub */}
        <div ref={receiptRef} className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* Ticket Card Component */}
          <div className="bg-gradient-to-b from-[#f0fdf4] to-[#ecfdf5] border border-[#bbf7d0] rounded-[18px] p-5 shadow-sm space-y-4">
            
            {/* Header Row with Perforation */}
            <div className="border-b-2 border-dashed border-[#86efac] pb-3.5 flex items-center justify-between">
              <span className="bg-[#dcfce7] text-[#15803d] rounded-full px-3.5 py-1 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                وصل حجز مؤكد (RECU)
              </span>
              <span className="font-mono text-xs font-semibold tracking-wider text-[#047857]">
                {receiptCode}
              </span>
            </div>

            {/* Amount Climax */}
            <div className="text-center py-1">
              <div className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-1">المبلغ الإجمالي</div>
              <div className="text-4xl font-extrabold text-[#065f46] tracking-tight leading-none">
                {totalAmount} <span className="text-xl font-semibold text-[#047857] mr-1">دج</span>
              </div>
            </div>

            <div className="border-b-2 border-dashed border-[#86efac]"></div>

            {/* Trip Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="col-span-2 bg-white/80 border border-[#bbf7d0]/60 p-2.5 rounded-xl">
                <span className="text-gray-500 text-[11px] block mb-0.5">مسار الرحلة</span>
                <span className="font-bold text-[#047857] text-sm flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#047857]" />
                  من {fromLocation} إلى {toLocation}
                </span>
              </div>

              <div className="bg-white/80 border border-[#bbf7d0]/60 p-2.5 rounded-xl">
                <span className="text-gray-500 text-[11px] block mb-0.5">الراكب</span>
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-[#047857]" />
                  {passengerName}
                </span>
              </div>

              <div className="bg-white/80 border border-[#bbf7d0]/60 p-2.5 rounded-xl">
                <span className="text-gray-500 text-[11px] block mb-0.5">السائق</span>
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-[#047857]" />
                  {driverName}
                </span>
                {driverPhone && (
                  <span className="text-[11px] text-gray-500 block mt-0.5">
                    <Phone className="h-3 w-3 inline mr-1 text-[#047857]" />
                    {driverPhone}
                  </span>
                )}
              </div>

              <div className="bg-white/80 border border-[#bbf7d0]/60 p-2.5 rounded-xl">
                <span className="text-gray-500 text-[11px] block mb-0.5">تاريخ الانطلاق</span>
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#047857]" />
                  {departureDate} {departureTime}
                </span>
              </div>

              <div className="bg-white/80 border border-[#bbf7d0]/60 p-2.5 rounded-xl">
                <span className="text-gray-500 text-[11px] block mb-0.5">المقاعد والنوع</span>
                <span className="font-bold text-gray-900">
                  {seatsBooked} مقعد ({booking.tripType === 'round_trip' ? 'ذهاب وإياب' : 'ذهاب فقط'})
                </span>
              </div>
            </div>

          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-slate-200 rounded-[14px] text-center">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Verification Code" 
                className="w-32 h-32 border border-slate-200 rounded-xl p-1 bg-white shadow-sm"
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-xl">
                <QrCode className="h-8 w-8 text-gray-400 animate-pulse" />
              </div>
            )}
            <p className="text-xs font-bold text-[#047857] mt-2">
              امسح الكود ضوئياً بواسطة كاميرا الهاتف للتحقق المباشر
            </p>
            <p className="text-[11px] text-gray-500 dir-ltr font-mono mt-0.5 truncate max-w-xs">
              {verifyUrl}
            </p>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-gray-50 border-t flex flex-wrap gap-2">
          <Button 
            onClick={handlePrint} 
            className="flex-1 bg-[#047857] text-white hover:bg-[#065f46] font-bold rounded-[10px]"
          >
            <Printer className="h-4 w-4 mr-2" />
            طباعة / تحميل PDF
          </Button>

          <Button 
            variant="outline" 
            onClick={handleCopyLink} 
            className="flex-1 rounded-[10px] border-[#047857] text-[#047857] hover:bg-[#f0fdf4]"
          >
            <Copy className="h-4 w-4 mr-2" />
            نسخ رابط التحقق
          </Button>

          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="w-full sm:w-auto text-gray-600 hover:text-gray-900"
          >
            إغلاق
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default BookingReceiptModal;
