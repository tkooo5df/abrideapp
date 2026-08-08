import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Car, 
  Phone, 
  ArrowRight,
  Printer,
  QrCode,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import QRCode from 'qrcode';
import { decodeId } from '@/utils/crypto';
import Header from '@/components/layout/Header';

export const VerifyReceipt: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [booking, setBooking] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const searchParams = new URLSearchParams(location.search);
  const codeParam = decodeId(searchParams.get('code') || searchParams.get('receipt') || '');
  const idParam = decodeId(searchParams.get('id') || searchParams.get('bookingId') || '');

  useEffect(() => {
    fetchBooking();
  }, [codeParam, idParam]);

  const fetchBooking = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      let foundBooking: any = null;

      // 1. Lookup by exact receipt_code
      if (codeParam) {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('receipt_code', codeParam)
          .maybeSingle();

        if (!error && data) {
          foundBooking = data;
        }
      }

      // 2. Lookup by numeric ID if provided or extracted from code (e.g. ABR-200 -> 200)
      const rawId = idParam || (codeParam ? codeParam.replace(/^ABR-/i, '') : '');
      if (!foundBooking && rawId && !isNaN(Number(rawId))) {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', Number(rawId))
          .maybeSingle();

        if (!error && data) {
          foundBooking = data;
        }
      }

      // 3. Fallback check in BrowserDatabaseService
      if (!foundBooking && (idParam || codeParam)) {
        try {
          const allBookings = await BrowserDatabaseService.getRecentBookings(365);
          foundBooking = allBookings.find((b: any) => 
            String(b.id) === String(idParam) || 
            String(b.id) === codeParam.replace(/^ABR-/i, '') ||
            b.receiptCode === codeParam ||
            b.receipt_code === codeParam
          );
        } catch (e) {
          // Ignore fallback error
        }
      }

      if (!foundBooking) {
        setErrorMsg('لم يتم العثور على الوصل المطلوب في قاعدة البيانات. قد يكون الرمز غير صحيح.');
        setLoading(false);
        return;
      }

      // Fetch driver and passenger details for full display
      const [driver, passenger, trip] = await Promise.all([
        foundBooking.driver_id ? BrowserDatabaseService.getProfile(foundBooking.driver_id) : null,
        foundBooking.passenger_id ? BrowserDatabaseService.getProfile(foundBooking.passenger_id) : null,
        foundBooking.trip_id ? supabase.from('trips').select('*').eq('id', foundBooking.trip_id).maybeSingle() : null
      ]);

      const tripData = trip?.data;
      let vehicleData = null;
      if (tripData?.vehicle_id) {
        const { data: v } = await supabase.from('vehicles').select('*').eq('id', tripData.vehicle_id).maybeSingle();
        vehicleData = v;
      }

      const fullBooking = {
        ...foundBooking,
        receiptCode: foundBooking.receipt_code || `ABR-${foundBooking.id}`,
        driver: driver,
        passenger: passenger,
        trip: {
          ...tripData,
          fromWilayaName: tripData ? (tripData.from_wilaya_name || `ولاية ${tripData.from_wilaya_id}`) : foundBooking.pickup_location,
          toWilayaName: tripData ? (tripData.to_wilaya_name || `ولاية ${tripData.to_wilaya_id}`) : foundBooking.destination_location,
          departureDate: tripData?.departure_date,
          departureTime: tripData?.departure_time,
          vehicle: vehicleData ? {
            make: vehicleData.make,
            model: vehicleData.model,
            licensePlate: vehicleData.license_plate
          } : (driver?.vehicleBrand ? {
            make: driver.vehicleBrand,
            model: driver.vehicleModel,
            licensePlate: driver.vehiclePlate
          } : null)
        }
      };

      setBooking(fullBooking);

      // Generate QR Code URL for official verification link on abride.online
      const officialVerifyUrl = `https://abride.online/verify-receipt?code=${fullBooking.receiptCode}&id=${fullBooking.id}`;
      QRCode.toDataURL(officialVerifyUrl, { width: 180, margin: 2, color: { dark: '#047857', light: '#ffffff' } })
        .then(url => setQrCodeUrl(url))
        .catch(() => {});

    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء التحقق من الوصل: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  // Dedicated Print Popup Window function (Prevents full page screenshot printing)
  const handlePrintReceipt = () => {
    if (!booking) return;

    const receiptCode = booking.receiptCode || `ABR-${booking.id}`;
    const bookingId = booking.id;
    const verifyUrl = `https://abride.online/verify-receipt?code=${receiptCode}&id=${bookingId}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
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
                    ${booking.total_amount || booking.totalAmount || 0} <span class="amount-currency">دج</span>
                  </div>
                </div>

                <div style="border-bottom: 2px dashed #86efac; margin: 14px 0;"></div>

                <div class="details-grid">
                  <div class="detail-item" style="grid-column: span 2;">
                    <div class="detail-label">مسار الرحلة</div>
                    <div class="detail-val" style="color: #047857;">
                      من ${booking.pickup_location || booking.trip?.fromWilayaName || 'الانطلاق'} إلى ${booking.destination_location || booking.trip?.toWilayaName || 'الوصول'}
                    </div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">الراكب</div>
                    <div class="detail-val">${booking.passenger?.fullName || booking.passenger?.first_name || 'راكب أبريد'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">السائق</div>
                    <div class="detail-val">${booking.driver?.fullName || booking.driver?.first_name || 'سائق أبريد'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">تاريخ ووقت الانطلاق</div>
                    <div class="detail-val">${booking.trip?.departureDate || ''} ${booking.pickup_time || booking.trip?.departureTime || ''}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">المقاعد المجهزة</div>
                    <div class="detail-val">${booking.seats_booked || booking.seatsBooked || 1} مقعد</div>
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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col dir-rtl font-sans" dir="rtl">
      {/* Hide header during native print */}
      <div className="print:hidden">
        <Header />
      </div>

      <main className="flex-1 container mx-auto max-w-2xl px-4 py-8">
        {loading ? (
          <Card className="p-8 text-center border shadow-lg rounded-[20px]">
            <Loader2 className="h-12 w-12 text-[#047857] animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold">جاري التحقق من صحة الوصل...</h2>
            <p className="text-sm text-muted-foreground mt-2">يرجى الانتظار لحظات</p>
          </Card>
        ) : errorMsg || !booking ? (
          <Card className="p-8 text-center border-red-200 bg-red-50/50 dark:bg-red-950/10 shadow-lg rounded-[20px]">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">وصل غير صالح!</h2>
            <p className="text-muted-foreground mt-2">{errorMsg || 'رمز الوصل غير مسجل في قاعدة البيانات'}</p>
            <Button onClick={() => navigate('/')} className="mt-6 bg-[#047857] hover:bg-[#065f46]">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للرئيسية
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            
            {/* Top Verification Status Seal */}
            <div className={`p-6 rounded-[20px] border text-center shadow-lg transition-all print:hidden ${
              booking.status === 'confirmed' || booking.status === 'completed'
                ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#065f46]'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
            }`}>
              <div className="flex justify-center mb-3">
                <div className={`p-3 rounded-full ${
                  booking.status === 'confirmed' || booking.status === 'completed'
                    ? 'bg-[#047857] text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  <ShieldCheck className="h-10 w-10" />
                </div>
              </div>
              <h1 className="text-2xl font-extrabold">
                {booking.status === 'confirmed' || booking.status === 'completed'
                  ? '✅ وصل حجز رسمي ومؤكد'
                  : '⚠️ وصل حجز بانتظار التأكيد'}
              </h1>
              <p className="text-sm mt-1 opacity-90">
                منصة أبريد الرسمية تؤكد صحة هذا الوصل ومطابقته للبيانات في قاعدة البيانات.
              </p>
              <div className="inline-block mt-3 px-4 py-1 rounded-full bg-white border border-[#bbf7d0] font-mono font-bold text-sm text-[#047857] shadow-sm">
                {booking.receiptCode}
              </div>
            </div>

            {/* Official Brand Ticket Stub Display */}
            <div className="bg-white border border-gray-200 shadow-xl rounded-[20px] overflow-hidden">
              
              {/* Brand Header */}
              <div className="bg-[#047857] text-white p-7 text-center relative">
                <img src="https://www.abride.online/logo.svg" alt="Abride Logo" className="w-16 h-16 mx-auto mb-2 filter brightness-0 invert" />
                <div className="text-2xl font-extrabold text-white tracking-wide">
                  أبريد ABRIDE
                </div>
                <div className="text-[11px] font-semibold tracking-[3px] text-emerald-100 uppercase mt-0.5">
                  ABRIDE PLATFORM • RECU SYSTEM
                </div>
              </div>

              {/* Ticket Content */}
              <div className="p-6 space-y-5">
                
                <div className="bg-gradient-to-b from-[#f0fdf4] to-[#ecfdf5] border border-[#bbf7d0] rounded-[18px] p-5 space-y-4">
                  
                  {/* Header Row with Perforation */}
                  <div className="border-b-2 border-dashed border-[#86efac] pb-3.5 flex items-center justify-between">
                    <span className="bg-[#dcfce7] text-[#15803d] rounded-full px-3.5 py-1 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      وصل حجز مؤكد (RECU)
                    </span>
                    <span className="font-mono text-xs font-semibold tracking-wider text-[#047857]">
                      {booking.receiptCode}
                    </span>
                  </div>

                  {/* Amount Climax */}
                  <div className="text-center py-1">
                    <div className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-1">المبلغ الإجمالي</div>
                    <div className="text-4xl font-extrabold text-[#065f46] tracking-tight leading-none">
                      {booking.total_amount || booking.totalAmount || 0} <span className="text-xl font-semibold text-[#047857] mr-1">دج</span>
                    </div>
                  </div>

                  <div className="border-b-2 border-dashed border-[#86efac]"></div>

                  {/* Trip Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="sm:col-span-2 bg-white/80 border border-[#bbf7d0]/60 p-3 rounded-xl">
                      <span className="text-gray-500 text-[11px] block mb-0.5">مسار الرحلة</span>
                      <span className="font-bold text-[#047857] text-sm flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-[#047857]" />
                        من {booking.pickup_location || booking.trip?.fromWilayaName} إلى {booking.destination_location || booking.trip?.toWilayaName}
                      </span>
                    </div>

                    <div className="bg-white/80 border border-[#bbf7d0]/60 p-2.5 rounded-xl">
                      <span className="text-gray-500 text-[11px] block mb-0.5">الراكب</span>
                      <span className="font-bold text-gray-900 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-[#047857]" />
                        {booking.passenger?.fullName || booking.passenger?.first_name || 'راكب أبريد'}
                      </span>
                    </div>

                    <div className="bg-white/80 border border-[#bbf7d0]/60 p-2.5 rounded-xl">
                      <span className="text-gray-500 text-[11px] block mb-0.5">السائق</span>
                      <span className="font-bold text-gray-900 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-[#047857]" />
                        {booking.driver?.fullName || booking.driver?.first_name || 'سائق أبريد'}
                      </span>
                    </div>

                    <div className="bg-white/80 border border-[#bbf7d0]/60 p-2.5 rounded-xl">
                      <span className="text-gray-500 text-[11px] block mb-0.5">تاريخ الانطلاق</span>
                      <span className="font-bold text-gray-900 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#047857]" />
                        {booking.trip?.departureDate || booking.created_at?.split('T')[0]}
                      </span>
                    </div>

                    <div className="bg-white/80 border border-[#bbf7d0]/60 p-2.5 rounded-xl">
                      <span className="text-gray-500 text-[11px] block mb-0.5">المقاعد والنوع</span>
                      <span className="font-bold text-gray-900">
                        {booking.seats_booked || booking.seatsBooked || 1} مقعد ({booking.trip_type === 'round_trip' || booking.tripType === 'round_trip' ? 'ذهاب وإياب' : 'ذهاب فقط'})
                      </span>
                    </div>
                  </div>

                </div>

                {/* QR Display */}
                {qrCodeUrl && (
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-slate-200 rounded-[14px] text-center">
                    <img src={qrCodeUrl} alt="QR Verification" className="w-32 h-32 border rounded-xl bg-white p-1 shadow-sm" />
                    <span className="text-xs font-bold text-[#047857] block mt-2">رمز التوثيق الإلكتروني التلقائي</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2 print:hidden">
                  <Button onClick={handlePrintReceipt} className="flex-1 bg-[#047857] text-white hover:bg-[#065f46] font-bold rounded-[10px]">
                    <Printer className="h-4 w-4 mr-2" />
                    طباعة / تحميل PDF
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')} className="rounded-[10px]">
                    الصفحة الرئيسية
                  </Button>
                </div>

              </div>

              <div className="border-t p-4 text-center text-xs text-gray-500 bg-gray-50">
                منصة أبريد الرسمية للنقل والتنقل • abride.online
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VerifyReceipt;
