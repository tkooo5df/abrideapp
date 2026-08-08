import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { decodeId, encodeId } from '@/utils/crypto';
import Header from '@/components/layout/Header';
import QRCode from 'react-qr-code';

// ============================================================
// أنواع البيانات
// ============================================================
type ReceiptData = {
  fromCity: string;
  toCity: string;
  date: string;
  time: string;
  passengerName: string;
  seatNumber: string;
  bookingCode: string;
  amount: string;
  verifiedAt: string;
};

type VerifyState =
  | { status: 'loading' }
  | { status: 'valid'; data: ReceiptData }
  | { status: 'invalid' };

// ============================================================
// المكوّن الرئيسي
// ============================================================
export default function VerifyReceipt() {
  const location = useLocation();
  const [state, setState] = useState<VerifyState>({ status: 'loading' });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const codeParam = decodeId(searchParams.get('code') || searchParams.get('receipt') || '');
    const idParam = decodeId(searchParams.get('id') || searchParams.get('bookingId') || '');

    if (!codeParam && !idParam) {
      setState({ status: 'invalid' });
      return;
    }

    fetchBookingData(codeParam, idParam);
  }, [location.search]);

  const fetchBookingData = async (codeParam: string, idParam: string) => {
    setState({ status: 'loading' });

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
        setState({ status: 'invalid' });
        return;
      }

      // Fetch passenger and trip details for full display
      const [passenger, trip] = await Promise.all([
        foundBooking.passenger_id ? BrowserDatabaseService.getProfile(foundBooking.passenger_id) : null,
        foundBooking.trip_id ? supabase.from('trips').select('*').eq('id', foundBooking.trip_id).maybeSingle() : null
      ]);

      const tripData = trip?.data;
      
      const receiptData: ReceiptData = {
        fromCity: foundBooking.pickup_location || tripData?.from_wilaya_name || 'الانطلاق',
        toCity: foundBooking.destination_location || tripData?.to_wilaya_name || 'الوصول',
        date: tripData?.departure_date || foundBooking.created_at?.split('T')[0] || '---',
        time: foundBooking.pickup_time || tripData?.departure_time || '---',
        passengerName: passenger?.fullName || passenger?.first_name || 'راكب أبريد',
        seatNumber: String(foundBooking.seats_booked || foundBooking.seatsBooked || '1'),
        bookingCode: foundBooking.receipt_code || `ABR-${foundBooking.id}`,
        amount: String(foundBooking.total_amount || foundBooking.totalAmount || '0'),
        verifiedAt: new Date().toLocaleString('ar-DZ')
      };

      setState({ status: 'valid', data: receiptData });

    } catch (err) {
      console.error('Error verifying receipt:', err);
      setState({ status: 'invalid' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" dir="rtl">
      {/* Hide header during print */}
      <div className="print:hidden">
        <Header />
      </div>

      <div
        className="flex-1 flex items-start justify-center px-4 py-12 sm:py-16"
        style={{
          background:
            'radial-gradient(1200px 600px at 15% -10%, rgba(11,110,79,0.08), transparent 60%), radial-gradient(900px 500px at 100% 0%, rgba(242,169,59,0.10), transparent 55%), #FBF8F2',
        }}
      >
        <div className="w-full max-w-[440px]">
          <BrandRow />

          {state.status === 'loading' && <LoadingTicket />}
          {state.status === 'valid' && <ValidTicket data={state.data} />}
          {state.status === 'invalid' && <InvalidTicket />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// شعار أبريد
// ============================================================
function BrandRow() {
  return (
    <div className="flex items-center justify-center gap-2 mb-7 print:hidden">
      <div
        className="w-[30px] h-[30px] rounded-[9px] relative flex-none"
        style={{ background: 'linear-gradient(155deg, #0B6E4F, #063C2B)' }}
      >
        <div
          className="absolute inset-2 rounded-[5px] rotate-45"
          style={{ border: '2px solid #F2A93B', borderLeftColor: 'transparent', borderBottomColor: 'transparent' }}
        />
      </div>
      <div className="font-extrabold text-[19px]">
        <span className="text-[#0B6E4F]">أ</span>بريد
      </div>
    </div>
  );
}

// ============================================================
// خط التقطيع (تأثير تذكرة الورق) — العنصر المميز في التصميم
// ============================================================
function Perforation() {
  return (
    <div className="relative h-px -mx-6 my-4">
      <div className="absolute -top-[13px] -left-[13px] w-[26px] h-[26px] rounded-full bg-[#FBF8F2] print:bg-white" />
      <div className="absolute -top-[13px] -right-[13px] w-[26px] h-[26px] rounded-full bg-[#FBF8F2] print:bg-white" />
      <div className="absolute inset-x-6 top-0 border-t-2 border-dashed border-[#E1DACB]" />
    </div>
  );
}

// ============================================================
// حالة النجاح
// ============================================================
function ValidTicket({ data }: { data: ReceiptData }) {
  return (
    <>
      <div className="bg-white rounded-[26px] shadow-[0_1px_2px_rgba(22,36,29,0.04),0_20px_40px_-18px_rgba(6,60,43,0.28)] print:shadow-none print:border print:border-gray-200">
        {/* الرأس */}
        <div
          className="relative overflow-hidden rounded-t-[26px] px-6 pt-6 pb-10 text-white print:!bg-[#0B6E4F]"
          style={{ background: 'linear-gradient(155deg, #0B6E4F 0%, #063C2B 100%)' }}
        >
          <div className="absolute -left-10 -top-16 w-[220px] h-[220px] rounded-full bg-white/5" />
          <div
            className="absolute top-[22px] left-[22px] flex items-center gap-1.5 rounded-full border-[1.6px] px-3 py-[7px] text-[12.5px] font-bold -rotate-6"
            style={{ borderColor: '#F2A93B', color: '#F2A93B', background: 'rgba(255,255,255,0.08)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            تم التحقق
          </div>
          <p className="text-[12px] font-semibold text-white/70 mb-1">وصل حجز رحلة</p>
          <p className="text-[20px] font-extrabold">رحلة بين المدن</p>
        </div>

        {/* شريط المسار */}
        <div className="bg-white -mt-6 mx-[18px] rounded-[20px] px-[18px] pt-[18px] pb-4 shadow-[0_10px_24px_-14px_rgba(6,60,43,0.35)] flex items-center gap-3 print:shadow-none print:border print:border-gray-200">
          <City name={data.fromCity} label="نقطة الانطلاق" />
          <PathDots />
          <City name={data.toCity} label="الوجهة" />
        </div>

        {/* التفاصيل */}
        <div className="px-6 pt-5 pb-1.5">
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-4">
            <Field label="التاريخ" value={data.date} />
            <Field label="وقت الانطلاق" value={data.time} mono />
            <Field label="اسم الراكب" value={data.passengerName} />
            <Field label="رقم المقعد" value={data.seatNumber} mono />
          </div>

          <Perforation />

          <Field label="رمز الحجز" value={data.bookingCode} mono large />

          <div className="flex items-center justify-between bg-[#F3EEE1] print:bg-gray-100 rounded-[14px] px-4 py-[13px] my-5">
            <span className="text-[13px] font-bold text-[#4B5A50]">المبلغ المدفوع</span>
            <span className="text-[19px] font-extrabold text-[#0B6E4F] font-mono" dir="ltr">
              {data.amount} <span className="text-[12px] font-bold">دج</span>
            </span>
          </div>
        </div>

        {/* التذييل */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <div
            className="flex-none w-14 h-14 rounded-[10px] border border-[#E1DACB] print:hidden bg-white flex items-center justify-center overflow-hidden p-1"
          >
            <QRCode
              value={`https://abride.online/verify-receipt?code=${encodeId(data.bookingCode || `ABR-${data.bookingId}`)}&id=${encodeId(data.bookingId)}`}
              size={48}
              bgColor="#ffffff"
              fgColor="#16241D"
              level="M"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <p className="text-[11.5px] leading-[1.6] text-[#4B5A50]">
            <b className="text-[#16241D]">وصل موثّق إلكترونياً</b> عبر منصة أبريد. أي تعديل على بيانات الرابط يُبطل
            صلاحية هذا الوصل تلقائياً.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 mt-5 print:hidden">
        <button 
          onClick={() => window.print()}
          className="bg-white border border-gray-200 text-[#0B6E4F] font-bold text-sm px-6 py-2.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
        >
          طباعة التذكرة
        </button>
        <p className="text-center text-[12px] text-[#4B5A50] leading-[1.7]">تم التحقق في {data.verifiedAt}</p>
      </div>
    </>
  );
}

function City({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex-1 text-center">
      <div className="text-[16px] font-extrabold">{name}</div>
      <div className="text-[11px] font-semibold text-[#4B5A50] mt-0.5">{label}</div>
    </div>
  );
}

function PathDots() {
  return (
    <svg viewBox="0 0 64 20" className="flex-none w-16 h-5">
      <line x1="4" y1="10" x2="60" y2="10" stroke="#D8D2C2" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="32" cy="10" r="4" fill="#F2A93B" />
    </svg>
  );
}

function Field({ label, value, mono, large }: { label: string; value: string; mono?: boolean; large?: boolean }) {
  return (
    <div>
      <div className="text-[11.5px] font-semibold text-[#4B5A50] mb-[3px]">{label}</div>
      <div
        className={`font-bold ${large ? 'text-[15px] tracking-wide' : 'text-[14.5px]'} ${mono ? 'font-mono' : ''}`}
        dir={mono ? 'ltr' : undefined}
        style={mono && !large ? { textAlign: 'left' } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================
// حالة الرابط غير الصالح
// ============================================================
function InvalidTicket() {
  return (
    <>
      <div className="bg-white rounded-[26px] shadow-[0_1px_2px_rgba(22,36,29,0.04),0_20px_40px_-18px_rgba(6,60,43,0.28)]">
        <div
          className="relative overflow-hidden rounded-t-[26px] px-6 pt-6 pb-10 text-white"
          style={{ background: 'linear-gradient(155deg, #6B6157 0%, #3A3530 100%)' }}
        >
          <div
            className="absolute top-[22px] left-[22px] flex items-center gap-1.5 rounded-full border-[1.6px] border-white/85 px-3 py-[7px] text-[12.5px] font-bold -rotate-6 bg-white/8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            غير صالح
          </div>
          <p className="text-[12px] font-semibold text-white/70 mb-1">وصل حجز رحلة</p>
          <p className="text-[20px] font-extrabold">تعذّر التحقق من الوصل</p>
        </div>

        <div className="bg-white -mt-6 mx-[18px] rounded-[20px] px-[18px] pt-[18px] pb-4 shadow-[0_10px_24px_-14px_rgba(6,60,43,0.35)] flex items-center gap-3 opacity-55 grayscale-[0.4]">
          <City name="— — —" label="نقطة الانطلاق" />
          <PathDots />
          <City name="— — —" label="الوجهة" />
        </div>

        <div className="px-6 pt-5 pb-6">
          <div className="bg-[#FBEEEC] border border-[#F2CFC8] rounded-[14px] px-4 pt-4 pb-3.5">
            <div className="flex items-center gap-2 text-[#B23A2F] font-extrabold text-[14.5px] mb-1.5">
              ⚠ هذا الرابط غير صالح
            </div>
            <p className="text-[13px] leading-[1.7] text-[#7A4038] m-0">
              لم نتمكن من مطابقة هذا الوصل مع أي حجز مسجَّل لدينا. تأكد من استخدام الرابط الأصلي المُرسَل إليك دون
              تعديل، أو تواصل مع الدعم لمراجعة حجزك.
            </p>
            <a
              href="/"
              className="inline-block mt-3 bg-[#B23A2F] text-white no-underline font-bold text-[13px] px-[18px] py-[9px] rounded-[10px]"
            >
              العودة للرئيسية
            </a>
          </div>
        </div>
      </div>

      <p className="text-center text-[12px] text-[#4B5A50] mt-5 leading-[1.7]">
        لأسباب أمنية، لا يتم عرض أي أرقام حجوزات حقيقية هنا.
      </p>
    </>
  );
}

// ============================================================
// حالة التحميل
// ============================================================
function LoadingTicket() {
  return (
    <div className="bg-white rounded-[26px] shadow-[0_1px_2px_rgba(22,36,29,0.04),0_20px_40px_-18px_rgba(6,60,43,0.28)] p-10 flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-[3px] border-[#E1DACB] border-t-[#0B6E4F] animate-spin" />
      <p className="text-[13.5px] font-semibold text-[#4B5A50]">جارٍ التحقق من الوصل...</p>
    </div>
  );
}
