# Simple Email Test Script
Write-Host "📧 Testing Email Report Generation..." -ForegroundColor Cyan

# Create sample test data
$reportData = @{
    date = Get-Date -Format "dd/MM/yyyy"
    time = Get-Date -Format "HH:mm:ss"
    totalTests = 150
    passedTests = 142
    failedTests = 8
    successRate = 94.67
    repairs = 3
    uptime = "99.8%"
    activeUsers = 78
}

Write-Host "📊 Sample Report Data:" -ForegroundColor Yellow
Write-Host "  Date: $($reportData.date)" -ForegroundColor White
Write-Host "  Total Tests: $($reportData.totalTests)" -ForegroundColor White
Write-Host "  Success Rate: $($reportData.successRate)%" -ForegroundColor White
Write-Host "  Repairs: $($reportData.repairs)" -ForegroundColor White

# Generate Node.js email report
Write-Host "`n🤖 Running email reporter..." -ForegroundColor Cyan
$output = node email-reporter.js

# Check for generated files
$today = Get-Date -Format "yyyy-MM-dd"
$htmlFile = "reports\email-report-$today.html"

if (Test-Path $htmlFile) {
    Write-Host "✅ Email report generated successfully!" -ForegroundColor Green
    Write-Host "📄 File: $htmlFile" -ForegroundColor Gray
    
    # Open in browser for preview
    Write-Host "`n🌐 Opening report in browser..." -ForegroundColor Cyan
    Start-Process $htmlFile
    
    Write-Host "`n📧 Email Report Ready!" -ForegroundColor Green
    Write-Host "To: davidward8668@gmail.com" -ForegroundColor White
    Write-Host "Subject: CartPilot Nightly Report - $($reportData.date)" -ForegroundColor White
    
} else {
    Write-Host "❌ Failed to generate email report" -ForegroundColor Red
}

Write-Host "`n✅ Email test complete!" -ForegroundColor Green