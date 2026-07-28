// 🧪 سكريبت اختبار إرسال البريد عبر Resend
// Test script to send email via Resend API

// استبدل YOUR_EMAIL@example.com ببريدك الإلكتروني
const TEST_EMAIL = 'YOUR_EMAIL@example.com'; // ضع بريدك هنا
const SUPABASE_URL = 'https://kobsavfggcnfemdzsnpj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYnNhdmZnZ2NuZmVtZHpzbnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTk3ODEsImV4cCI6MjA3NDM3NTc4MX0._TfXDauroKe8EAv_Fv4PQAZfOqk-rHbXAlF8bOU3-Qk';

async function testEmail() {
  if (TEST_EMAIL === 'YOUR_EMAIL@example.com') {
    console.error('❌ يرجى تغيير TEST_EMAIL إلى بريدك الإلكتروني');
    return;
  }

  console.log('🧪 بدء اختبار إرسال البريد...');
  console.log('📧 إلى:', TEST_EMAIL);
  console.log('🔗 Edge Function:', `${SUPABASE_URL}/functions/v1/send-email`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        to: TEST_EMAIL,
        subject: '🧪 اختبار من أبريد - تأكيد الحجز',
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="border-left: 4px solid #10b981; padding-left: 20px; margin-bottom: 20px;">
                <h1 style="color: #10b981; margin: 0; font-size: 24px;">🧪 اختبار من أبريد</h1>
              </div>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 16px; color: #4b5563;">هذا بريد تجريبي للتأكد من أن إعداد Resend API يعمل بشكل صحيح.</p>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
                <p style="margin: 0;">هذا إشعار تلقائي من منصة أبريد</p>
                <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} abride</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: '🧪 اختبار من أبريد - هذا بريد تجريبي للتأكد من أن إعداد Resend API يعمل بشكل صحيح.'
      })
    });

    console.log('📊 Status:', response.status, response.statusText);

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ البريد أُرسل بنجاح!');
      console.log('✅ Provider:', result.provider);
      console.log('✅ Result:', result);
      console.log('📧 تحقق من بريدك:', TEST_EMAIL);
      console.log('📧 تحقق أيضاً من مجلد Spam');
    } else {
      console.error('❌ فشل الإرسال:', result);
      if (result.error) {
        console.error('❌ Error:', result.error);
      }
      if (result.details) {
        console.error('❌ Details:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ خطأ في الإرسال:', error);
    console.error('❌ Error message:', error.message);
  }
}

// تشغيل الاختبار
testEmail();

// للاستخدام في المتصفح: انسخ هذا الكود والصقه في Console
// For browser: Copy this code and paste it in Console

