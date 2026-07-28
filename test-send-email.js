// Test script to send email notification via Mailrelay API
const supabaseUrl = 'https://kobsavfggcnfemdzsnpj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYnNhdmZnZ2NuZmVtZHpzbnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTk3ODEsImV4cCI6MjA3NDM3NTc4MX0._TfXDauroKe8EAv_Fv4PQAZfOqk-rHbXAlF8bOU3-Qk';

const testEmail = '0dc28c41d9@webxio.pro';

const emailData = {
  to: testEmail,
  subject: '🚗 تم قبول حجزك!',
  html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تم قبول حجزك!</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="border-left: 4px solid #3b82f6; padding-left: 20px; margin-bottom: 20px;">
      <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">🚗 تم قبول حجزك!</h1>
    </div>
    
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 16px; color: #4b5563;">السائق أحمد السائق قبل حجزك. يمكنك التواصل معه على +213 555 123 456 لترتيب تفاصيل الرحلة.</p>
    </div>

    <a href="https://abride.online/user-dashboard?tab=bookings" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">عرض التفاصيل</a>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      <p style="margin: 0;">هذا إشعار تلقائي من منصة أبريد</p>
      <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} abride</p>
    </div>
  </div>
</body>
</html>
  `.trim(),
  text: 'السائق أحمد السائق قبل حجزك. يمكنك التواصل معه على +213 555 123 456 لترتيب تفاصيل الرحلة.'
};

async function sendTestEmail() {
  try {
    console.log('📧 Sending test email to:', testEmail);
    console.log('📧 Email data:', emailData);

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

// Run if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sendTestEmail, emailData };
}

// Run if in browser environment
if (typeof window !== 'undefined') {
  window.sendTestEmail = sendTestEmail;
  console.log('📧 Test email function loaded. Call sendTestEmail() to send email.');
}

