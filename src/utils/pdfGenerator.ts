import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as QRCode from 'qrcode';
import { encodeId } from './crypto';

interface ReceiptData {
  receiptCode: string;
  bookingId: string | number;
  passengerName: string;
  passengerPhone?: string;
  driverName: string;
  driverPhone?: string;
  vehicleInfo?: string;
  fromLocation: string;
  toLocation: string;
  departureDate: string;
  departureTime?: string;
  seatsBooked: number;
  totalAmount: number;
  tripType?: string;
  paymentMethod?: string;
  createdAt?: string;
}

export async function generateReceiptPdfBase64(data: ReceiptData): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a hidden container for the HTML receipt
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '800px';
      container.style.backgroundColor = '#f8fafc';
      container.style.padding = '40px';
      container.style.fontFamily = "'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      container.style.direction = 'rtl';
      
      const encodedCode = encodeId(data.receiptCode || `ABR-${data.bookingId}`);
      const encodedId = encodeId(data.bookingId);
      const verificationUrl = `https://abride.online/verify-receipt?code=${encodedCode}&id=${encodedId}`;
      let qrCodeDataUrl = '';
      try {
        qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 150,
          margin: 1,
          color: {
            dark: '#047857',
            light: '#ffffff'
          }
        });
      } catch (e) {
        console.error('Failed to generate QR Code:', e);
      }

      // Build the beautiful HTML template
      container.innerHTML = `
        <div style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #e5e7eb;">
          
          <!-- Header (Emerald Green) -->
          <div style="background-color: #047857; color: white; padding: 40px; text-align: center; position: relative;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 2px; margin-bottom: 8px;">أبريد ABRIDE</div>
            <div style="font-size: 16px; font-weight: 600; letter-spacing: 2px; color: #dcfce7;">وصل حجز رسمي</div>
          </div>

          <!-- Body -->
          <div style="padding: 40px;">
            
            <!-- Receipt Code & Status -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #e5e7eb; padding-bottom: 24px; margin-bottom: 32px;">
              <div>
                <div style="font-size: 14px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">رقم الوصل</div>
                <div style="font-size: 24px; font-weight: 800; color: #111827; letter-spacing: 2px;">${data.receiptCode || `ABR-${data.bookingId}`}</div>
              </div>
              <div style="text-align: left;">
                <div style="display: inline-block; background-color: #dcfce7; color: #15803d; padding: 10px 20px; border-radius: 9999px; font-weight: 800; font-size: 16px;">
                  ✓ مؤكد بواسطة السائق
                </div>
              </div>
            </div>

            <!-- Amount Focus -->
            <div style="text-align: center; margin-bottom: 40px; background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%); border: 1.5px solid #bbf7d0; border-radius: 20px; padding: 32px;">
              <div style="font-size: 18px; font-weight: 700; color: #047857; margin-bottom: 8px;">المبلغ الإجمالي</div>
              <div style="font-size: 56px; font-weight: 900; color: #064e3b; line-height: 1;">
                ${data.totalAmount} <span style="font-size: 24px; font-weight: 700; color: #047857;">د.ج</span>
              </div>
              <div style="font-size: 14px; font-weight: 600; color: #047857; margin-top: 12px; background: #dcfce7; display: inline-block; padding: 4px 16px; border-radius: 20px;">
                طريقة الدفع: ${data.paymentMethod === 'BaridiMob' ? 'بريدي موب (BaridiMob)' : 'الدفع نقداً عند الوصول (Cash)'}
              </div>
              ${data.paymentMethod === 'BaridiMob' ? `
              <div style="font-size: 14px; font-weight: 700; color: #15803d; margin-top: 8px;">
                الرجاء إرسال المبلغ إلى الحساب البريدي (RIP): <span style="direction: ltr; display: inline-block;">00799999004064855725</span>
              </div>
              ` : ''}
            </div>

            <!-- Details Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px;">
              
              <!-- Trip Details -->
              <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
                <h3 style="font-size: 20px; font-weight: 800; color: #047857; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #cbd5e1; padding-bottom: 12px;">تفاصيل الرحلة</h3>
                
                <div style="margin-bottom: 16px;">
                  <div style="font-size: 14px; color: #64748b; font-weight: 700; margin-bottom: 4px;">مسار الرحلة</div>
                  <div style="font-size: 18px; font-weight: 800; color: #0f172a;">من ${data.fromLocation} إلى ${data.toLocation}</div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <div style="font-size: 14px; color: #64748b; font-weight: 700; margin-bottom: 4px;">تاريخ ووقت الانطلاق</div>
                  <div style="font-size: 18px; font-weight: 800; color: #0f172a; direction: ltr; text-align: right;">${data.departureDate}</div>
                </div>

                <div style="display: flex; justify-content: space-between; gap: 16px;">
                  <div>
                    <div style="font-size: 14px; color: #64748b; font-weight: 700; margin-bottom: 4px;">المقاعد المحجوزة</div>
                    <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${data.seatsBooked} مقاعد</div>
                  </div>
                  <div>
                    <div style="font-size: 14px; color: #64748b; font-weight: 700; margin-bottom: 4px;">نوع الرحلة</div>
                    <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${data.tripType || 'ذهاب فقط'}</div>
                  </div>
                </div>
              </div>

              <!-- Persons Details -->
              <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
                <h3 style="font-size: 20px; font-weight: 800; color: #047857; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #cbd5e1; padding-bottom: 12px;">معلومات الراكب والسائق</h3>
                
                <div style="margin-bottom: 16px;">
                  <div style="font-size: 14px; color: #64748b; font-weight: 700; margin-bottom: 4px;">اسم الراكب</div>
                  <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${data.passengerName}</div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <div style="font-size: 14px; color: #64748b; font-weight: 700; margin-bottom: 4px;">السائق المسؤول</div>
                  <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${data.driverName}</div>
                </div>

                <div>
                  <div style="font-size: 14px; color: #64748b; font-weight: 700; margin-bottom: 4px;">هاتف السائق للتواصل</div>
                  <div style="font-size: 18px; font-weight: 800; color: #0f172a; direction: ltr; text-align: right;">${data.driverPhone || '---'}</div>
                </div>
              </div>
            </div>

            <!-- Footer with QR -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #e5e7eb; padding-top: 24px;">
              <div>
                <div style="font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">للتحقق من صحة هذا الوصل، امسح الرمز المربع (QR Code) أو قم بزيارة الرابط:</div>
                <div style="font-size: 13px; font-weight: 600; color: #047857; direction: ltr; text-align: right; background: #f0fdf4; padding: 8px; border-radius: 8px;">${verificationUrl}</div>
                <div style="font-size: 12px; font-weight: 600; color: #9ca3af; margin-top: 16px;">تم الإنشاء آلياً بواسطة منصة أبريد - Abride.online</div>
              </div>
              <div style="background: white; padding: 10px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR Code" style="width: 120px; height: 120px; display: block;" />` : ''}
              </div>
            </div>

          </div>
        </div>
      `;

      document.body.appendChild(container);

      // Wait a tiny bit for fonts to render (optional, but good for Cairo font)
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(container, {
            scale: 2, // High resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });

          // A4 dimensions
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          // Center the image vertically if it's smaller than the page
          const yPos = pdfHeight < pdf.internal.pageSize.getHeight() ? 10 : 0;

          pdf.addImage(imgData, 'PNG', 0, yPos, pdfWidth, pdfHeight);
          
          const dataUri = pdf.output('datauristring');
          const base64 = dataUri.split(',')[1];
          
          // Cleanup
          document.body.removeChild(container);
          resolve(base64);
        } catch (canvasErr) {
          console.error('html2canvas error:', canvasErr);
          document.body.removeChild(container);
          reject(canvasErr);
        }
      }, 300); // 300ms delay to allow QR and Fonts to apply

    } catch (error) {
      console.error('Error generating PDF with html2canvas:', error);
      reject(error);
    }
  });
}
