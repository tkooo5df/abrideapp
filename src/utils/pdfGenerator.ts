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
      // width of the container must be specific to match the new ticket width
      container.style.width = '440px'; 
      container.style.padding = '0';
      container.style.direction = 'rtl';
      
      const encodedCode = encodeId(data.receiptCode || `ABR-${data.bookingId}`);
      const encodedId = encodeId(data.bookingId);
      const verificationUrl = `https://abride.online/verify-receipt?code=${encodedCode}&id=${encodedId}`;
      let qrCodeDataUrl = '';
      try {
        qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 56,
          margin: 1,
          color: {
            dark: '#16241D',
            light: '#ffffff'
          }
        });
      } catch (e) {
        console.error('Failed to generate QR Code:', e);
      }

      // Build the beautiful new ticket HTML template
      container.innerHTML = `
        <div style="width: 440px; margin: 0 auto; background: #FBF8F2; padding: 40px; font-family: 'Cairo', 'Segoe UI', sans-serif; direction: rtl; box-sizing: border-box;">
          
          <!-- Brand Row -->
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 28px;">
            <div style="width: 30px; height: 30px; border-radius: 9px; position: relative; background: linear-gradient(155deg, #0B6E4F, #063C2B); flex: none;">
              <div style="position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px; border-radius: 5px; transform: rotate(45deg); border: 2px solid #F2A93B; border-left-color: transparent; border-bottom-color: transparent; box-sizing: border-box;"></div>
            </div>
            <div style="font-weight: 800; font-size: 19px; color: #111827; line-height: 1;"><span style="color: #0B6E4F;">أ</span>بريد</div>
          </div>

          <!-- Valid Ticket Box -->
          <div style="background: white; border-radius: 26px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(22,36,29,0.04), 0 20px 40px -18px rgba(6,60,43,0.28); box-sizing: border-box;">
            
            <!-- Header -->
            <div style="position: relative; overflow: hidden; border-top-left-radius: 26px; border-top-right-radius: 26px; padding: 24px 24px 40px 24px; color: white; background: linear-gradient(155deg, #0B6E4F 0%, #063C2B 100%); box-sizing: border-box;">
              <div style="position: absolute; top: 22px; left: 22px; display: flex; align-items: center; gap: 6px; border-radius: 9999px; border: 1.6px solid #F2A93B; padding: 7px 12px; font-size: 12.5px; font-weight: 700; color: #F2A93B; background: rgba(255,255,255,0.08); transform: rotate(-6deg); box-sizing: border-box;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
                تم التحقق
              </div>
              <p style="font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.7); margin: 0 0 4px 0;">وصل حجز رحلة</p>
              <p style="font-size: 20px; font-weight: 800; margin: 0; line-height: 1.2;">${data.tripType || 'رحلة بين المدن'}</p>
            </div>

            <!-- Path Bar -->
            <div style="background: white; margin: -24px 18px 0 18px; border-radius: 20px; padding: 18px; border: 1px solid #e5e7eb; box-shadow: 0 10px 24px -14px rgba(6,60,43,0.15); display: flex; flex-direction: column; gap: 16px; position: relative; z-index: 10; box-sizing: border-box;">
              
              <!-- Outbound Trip -->
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="flex: 1; text-align: center;">
                  <div style="font-size: 16px; font-weight: 800; color: #111827; line-height: 1.2;">${data.fromLocation}</div>
                  <div style="font-size: 11px; font-weight: 600; color: #4B5A50; margin-top: 4px;">نقطة الانطلاق</div>
                </div>
                
                <svg viewBox="0 0 64 20" style="flex: none; width: 64px; height: 20px;">
                  <line x1="4" y1="10" x2="60" y2="10" stroke="#D8D2C2" stroke-width="2" stroke-dasharray="4 4" />
                  <circle cx="32" cy="10" r="4" fill="#F2A93B" />
                </svg>
                
                <div style="flex: 1; text-align: center;">
                  <div style="font-size: 16px; font-weight: 800; color: #111827; line-height: 1.2;">${data.toLocation}</div>
                  <div style="font-size: 11px; font-weight: 600; color: #4B5A50; margin-top: 4px;">الوجهة</div>
                </div>
              </div>

              <!-- Return Trip (If Round Trip) -->
              ${data.tripType && data.tripType.includes('إياب') ? `
              <div style="border-top: 1px dashed #e5e7eb; padding-top: 16px; display: flex; align-items: center; gap: 12px;">
                <div style="flex: 1; text-align: center;">
                  <div style="font-size: 16px; font-weight: 800; color: #111827; line-height: 1.2;">${data.toLocation}</div>
                  <div style="font-size: 11px; font-weight: 600; color: #4B5A50; margin-top: 4px;">عودة من</div>
                </div>
                
                <svg viewBox="0 0 64 20" style="flex: none; width: 64px; height: 20px;">
                  <line x1="4" y1="10" x2="60" y2="10" stroke="#0B6E4F" stroke-width="2" stroke-dasharray="4 4" />
                  <circle cx="32" cy="10" r="4" fill="#0B6E4F" />
                </svg>
                
                <div style="flex: 1; text-align: center;">
                  <div style="font-size: 16px; font-weight: 800; color: #111827; line-height: 1.2;">${data.fromLocation}</div>
                  <div style="font-size: 11px; font-weight: 600; color: #4B5A50; margin-top: 4px;">وصول إلى</div>
                </div>
              </div>
              ` : ''}

            </div>

            <!-- Details -->
            <div style="padding: 24px 24px 6px 24px; box-sizing: border-box;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px 14px;">
                <div>
                  <div style="font-size: 11.5px; font-weight: 600; color: #4B5A50; margin-bottom: 3px;">التاريخ</div>
                  <div style="font-size: 14.5px; font-weight: 700; color: #111827;">${data.departureDate}</div>
                </div>
                <div>
                  <div style="font-size: 11.5px; font-weight: 600; color: #4B5A50; margin-bottom: 3px;">وقت الانطلاق</div>
                  <div style="font-size: 14.5px; font-weight: 700; color: #111827; font-family: monospace; direction: ltr; text-align: left;">${data.departureTime || '---'}</div>
                </div>
                <div>
                  <div style="font-size: 11.5px; font-weight: 600; color: #4B5A50; margin-bottom: 3px;">اسم الراكب</div>
                  <div style="font-size: 14.5px; font-weight: 700; color: #111827;">${data.passengerName}</div>
                </div>
                <div>
                  <div style="font-size: 11.5px; font-weight: 600; color: #4B5A50; margin-bottom: 3px;">رقم المقعد</div>
                  <div style="font-size: 14.5px; font-weight: 700; color: #111827; font-family: monospace; direction: ltr; text-align: left;">${data.seatsBooked}</div>
                </div>
              </div>

              <!-- Perforation -->
              <div style="position: relative; height: 1px; margin: 20px -24px;">
                <div style="position: absolute; top: -13px; left: -13px; width: 26px; height: 26px; border-radius: 50%; background: #FBF8F2;"></div>
                <div style="position: absolute; top: -13px; right: -13px; width: 26px; height: 26px; border-radius: 50%; background: #FBF8F2;"></div>
                <div style="position: absolute; left: 24px; right: 24px; top: 0; border-top: 2px dashed #E1DACB;"></div>
              </div>

              <!-- Booking Code -->
              <div style="margin-bottom: 20px;">
                <div style="font-size: 11.5px; font-weight: 600; color: #4B5A50; margin-bottom: 3px;">رمز الحجز</div>
                <div style="font-size: 15px; font-weight: 700; letter-spacing: 1px; color: #111827; font-family: monospace; direction: ltr; text-align: left;">${data.receiptCode || ('ABR-' + data.bookingId)}</div>
              </div>

              <!-- Amount -->
              <div style="display: flex; align-items: center; justify-content: space-between; background: #F3EEE1; border-radius: 14px; padding: 13px 16px; margin: 20px 0; box-sizing: border-box;">
                <span style="font-size: 13px; font-weight: 700; color: #4B5A50;">المبلغ المدفوع</span>
                <span style="font-size: 19px; font-weight: 800; color: #0B6E4F; font-family: monospace; direction: ltr;">
                  ${data.totalAmount} <span style="font-size: 12px; font-weight: 700; font-family: 'Cairo', sans-serif;">دج</span>
                </span>
              </div>
              
              <!-- Driver Info -->
              <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #E1DACB; border-radius: 14px; padding: 13px 16px; margin: 0 0 20px 0; box-sizing: border-box;">
                <span style="font-size: 13px; font-weight: 700; color: #4B5A50;">السائق: ${data.driverName}</span>
                <span style="font-size: 14px; font-weight: 800; color: #111827; font-family: monospace; direction: ltr;">
                  ${data.driverPhone || '---'}
                </span>
              </div>
              
              <!-- BaridiMob Notice -->
              ${data.paymentMethod === 'BaridiMob' ? (
              '<div style="font-size: 12px; font-weight: 700; color: #15803d; text-align: center; margin-bottom: 16px; background: #dcfce7; padding: 12px; border-radius: 10px; line-height: 1.5; box-sizing: border-box;">' +
                'الرجاء إرسال المبلغ إلى الحساب البريدي (RIP):<br>' +
                '<span style="direction: ltr; display: inline-block; font-family: monospace; margin-top: 6px; font-size: 14px;">00799999004064855725</span>' +
              '</div>'
              ) : ''}

            </div>

            <!-- Footer -->
            <div style="padding: 0 24px 24px 24px; display: flex; align-items: center; gap: 12px; box-sizing: border-box;">
              <div style="flex: none; width: 56px; height: 56px; border-radius: 10px; border: 1px solid #E1DACB; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff;">
                  ${qrCodeDataUrl ? ('<img src="' + qrCodeDataUrl + '" alt="QR" style="width: 56px; height: 56px; display: block;" />') : ''}
              </div>
              <p style="font-size: 11.5px; line-height: 1.6; color: #4B5A50; margin: 0;">
                <b style="color: #16241D;">وصل موثّق إلكترونياً</b> عبر منصة أبريد. أي تعديل على بيانات الرابط يُبطل صلاحية هذا الوصل تلقائياً.
              </p>
            </div>
          </div>

          <div style="text-align: center; font-size: 11px; color: #4B5A50; margin-top: 24px; font-weight: 600;">
            تم التحقق في ${new Date().toLocaleString('ar-DZ')}
          </div>
        </div>
      `;

      document.body.appendChild(container);

      // Wait for fonts to load
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(container, {
            scale: 3, // High resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#FBF8F2', // match background
            onclone: (clonedDoc) => {
              // Ensure fonts are applied before capture
              Array.from(clonedDoc.getElementsByTagName('div')).forEach(div => {
                if(div.style.fontFamily.includes('Cairo')) {
                  div.style.fontFamily = "'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
                }
              });
            }
          });

          // PDF generation - make it look like a nice ticket rather than a full A4 page
          // Use PNG for high quality, lossless text rendering
          const imgData = canvas.toDataURL('image/png');
          
          // Use standard A4
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          // Center the ticket horizontally and vertically
          const yPos = pdfHeight < pdf.internal.pageSize.getHeight() ? 15 : 0;
          
          // Width of ticket in mm
          const targetWidth = 120; // 120mm wide
          const targetHeight = (canvas.height * targetWidth) / canvas.width;
          const xPos = (pdfWidth - targetWidth) / 2;

          pdf.addImage(imgData, 'PNG', xPos, yPos, targetWidth, targetHeight, undefined, 'FAST');
          
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
