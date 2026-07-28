# Script to send test email notification
$supabaseUrl = "https://kobsavfggcnfemdzsnpj.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYnNhdmZnZ2NuZmVtZHpzbnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTk3ODEsImV4cCI6MjA3NDM3NTc4MX0._TfXDauroKe8EAv_Fv4PQAZfOqk-rHbXAlF8bOU3-Qk"
$testEmail = "0dc28c41d9@webxio.pro"

$htmlContent = @'
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
      <p style="margin: 5px 0 0 0;">© 2025 abride</p>
    </div>
  </div>
</body>
</html>
'@

$emailData = @{
    to = $testEmail
    subject = "🚗 تم قبول حجزك!"
    html = $htmlContent
    text = "السائق أحمد السائق قبل حجزك. يمكنك التواصل معه على +213 555 123 456 لترتيب تفاصيل الرحلة."
} | ConvertTo-Json -Depth 10

Write-Host ""
Write-Host "Sending test email to: $testEmail" -ForegroundColor Cyan
Write-Host ""

try {
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $supabaseAnonKey"
    }

    $response = Invoke-WebRequest -Uri "$supabaseUrl/functions/v1/send-email" -Method POST -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($emailData)) -UseBasicParsing

    if ($response.StatusCode -eq 200) {
        $result = $response.Content | ConvertFrom-Json
        Write-Host "Email sent successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Cyan
        Write-Host ($result | ConvertTo-Json -Depth 10)
    } else {
        Write-Host "Error: HTTP $($response.StatusCode)" -ForegroundColor Red
        Write-Host $response.Content
    }
} catch {
    Write-Host "Error sending email:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}
