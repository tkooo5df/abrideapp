# PowerShell Script: Check DNS Settings for abride.online

Write-Host "Checking DNS settings for abride.online..." -ForegroundColor Cyan
Write-Host ""

# Flush DNS Cache
Write-Host "Flushing DNS cache..." -ForegroundColor Yellow
ipconfig /flushdns | Out-Null
Write-Host "DNS cache flushed" -ForegroundColor Green
Write-Host ""

# Check current IP
Write-Host "Checking current IP..." -ForegroundColor Yellow
try {
    $result = Resolve-DnsName -Name "abride.online" -Type A -ErrorAction Stop
    $currentIP = $result[0].IPAddress
    Write-Host "Current IP: $currentIP" -ForegroundColor $(if ($currentIP -eq "66.241.125.205") { "Green" } else { "Red" })
    
    if ($currentIP -eq "66.241.125.205") {
        Write-Host "IP is correct!" -ForegroundColor Green
    } else {
        Write-Host "IP is INCORRECT! Should be: 66.241.125.205" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please update A Record in DNS from:" -ForegroundColor Yellow
        Write-Host "   $currentIP" -ForegroundColor Red
        Write-Host "   to:" -ForegroundColor Yellow
        Write-Host "   66.241.125.205" -ForegroundColor Green
    }
} catch {
    Write-Host "Error checking DNS: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Checking www.abride.online..." -ForegroundColor Yellow
try {
    $resultWWW = Resolve-DnsName -Name "www.abride.online" -Type CNAME -ErrorAction Stop
    $cname = $resultWWW.NameHost
    Write-Host "CNAME: $cname" -ForegroundColor Cyan
    
    if ($cname -like "*fly.dev*") {
        Write-Host "CNAME is correct!" -ForegroundColor Green
    } else {
        Write-Host "CNAME should point to abridasv5.fly.dev" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error checking CNAME: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Required DNS Records:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. A Record:" -ForegroundColor Yellow
Write-Host "   Type: A"
Write-Host "   Name: @ (or leave empty)"
Write-Host "   Value: 66.241.125.205"
Write-Host ""
Write-Host "2. AAAA Record:" -ForegroundColor Yellow
Write-Host "   Type: AAAA"
Write-Host "   Name: @ (or leave empty)"
Write-Host "   Value: 2a09:8280:1::a9:51cc:0"
Write-Host ""
Write-Host "3. CNAME Record (must be updated):" -ForegroundColor Yellow
Write-Host "   Type: CNAME"
Write-Host "   Name: www"
Write-Host "   Value: dmzlq1r.abride-app.fly.dev"
Write-Host "   (Old value: abridasv5.fly.dev - must be updated!)" -ForegroundColor Red
Write-Host ""

Write-Host "After updating DNS, run this script again to verify" -ForegroundColor Cyan
