# Send Email via Gmail SMTP
param(
    [string]$EmailTo = "davidward8668@gmail.com",
    [string]$SmtpUser = "davidward8668@gmail.com",
    [string]$SmtpPass = "sufp pltb ryyq uxru"
)

Write-Host "📧 SENDING CARTPILOT NIGHTLY REPORT" -ForegroundColor Magenta
Write-Host "To: $EmailTo" -ForegroundColor White

# Generate report first
Write-Host "`n📊 Generating report..." -ForegroundColor Cyan
try {
    $output = node simple-email-test.js
    Write-Host $output -ForegroundColor Green
} catch {
    Write-Host "Error generating report: $_" -ForegroundColor Red
    exit 1
}

# Find generated HTML file
$today = Get-Date -Format "yyyy-MM-dd"
$htmlFile = "reports\email-report-$today.html"

if (-not (Test-Path $htmlFile)) {
    Write-Host "❌ Email report file not found: $htmlFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Report file found: $htmlFile" -ForegroundColor Green

# Read HTML content
$htmlContent = Get-Content $htmlFile -Raw

# Create email
Write-Host "`n📤 Sending email..." -ForegroundColor Cyan

try {
    # Create Mail Message
    $Message = New-Object System.Net.Mail.MailMessage
    $Message.From = "CartPilot Testing <noreply@cartpilot.com>"
    $Message.To.Add($EmailTo)
    $Message.Subject = "CartPilot Nightly Report - $(Get-Date -Format 'dd/MM/yyyy')"
    $Message.Body = $htmlContent
    $Message.IsBodyHtml = $true

    # Configure SMTP
    $SmtpClient = New-Object System.Net.Mail.SmtpClient("smtp.gmail.com", 587)
    $SmtpClient.EnableSsl = $true
    $SmtpClient.Credentials = New-Object System.Net.NetworkCredential($SmtpUser, $SmtpPass)

    # Send Email
    $SmtpClient.Send($Message)
    
    Write-Host "✅ EMAIL SENT SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "📧 Sent to: $EmailTo" -ForegroundColor White
    Write-Host "📄 Subject: CartPilot Nightly Report - $(Get-Date -Format 'dd/MM/yyyy')" -ForegroundColor White
    
} catch {
    Write-Host "❌ Failed to send email: $_" -ForegroundColor Red
    Write-Host "`n💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "  1. Verify Gmail app password is correct" -ForegroundColor Gray
    Write-Host "  2. Ensure 2-factor authentication is enabled" -ForegroundColor Gray
    Write-Host "  3. Check internet connection" -ForegroundColor Gray
    
    # Fallback: Open in browser
    Write-Host "`n🌐 Opening report in browser as fallback..." -ForegroundColor Cyan
    Start-Process $htmlFile
} finally {
    # Cleanup
    if ($Message) { $Message.Dispose() }
    if ($SmtpClient) { $SmtpClient.Dispose() }
}

Write-Host "`n🎉 Email process complete!" -ForegroundColor Green