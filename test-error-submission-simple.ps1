# Simple Error Submission Test for CartPilot
param(
    [string]$CartPilotUrl = "https://cartpilot-sigma.vercel.app/"
)

Write-Host "🔍 Testing CartPilot Error Submission..." -ForegroundColor Green
Write-Host "Target URL: $CartPilotUrl" -ForegroundColor Yellow

try {
    # Test basic connectivity
    Write-Host "`n📡 Testing site connectivity..." -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri $CartPilotUrl -TimeoutSec 30
    Write-Host "✅ Site accessible - Status: $($response.StatusCode)" -ForegroundColor Green
    
    $html = $response.Content
    
    # Check for BugReporter components
    Write-Host "`n🔍 Checking for error reporting components..." -ForegroundColor Cyan
    
    if ($html -match "BUG REPORTER v4.0" -or $html -match "NEW BugReporter") {
        Write-Host "✅ BugReporter v4.0 found in HTML!" -ForegroundColor Green
    } elseif ($html -match "Report Issue" -or $html -match "🐛") {
        Write-Host "✅ ReportIssue component found in HTML" -ForegroundColor Green
    } else {
        Write-Host "❌ No error reporting components found in HTML" -ForegroundColor Red
    }
    
    # Check for key JavaScript bundles
    if ($html -match "index-.*\.js") {
        $jsBundle = [regex]::Match($html, 'index-[a-zA-Z0-9_-]+\.js').Value
        Write-Host "✅ JavaScript bundle found: $jsBundle" -ForegroundColor Green
    }
    
    Write-Host "`n📊 HTML Analysis Complete!" -ForegroundColor Green
    Write-Host "Content length: $($html.Length) characters" -ForegroundColor White
    
    # Simple browser test
    Write-Host "`n🌐 Opening in default browser for manual test..." -ForegroundColor Cyan
    Start-Process $CartPilotUrl
    Write-Host "✅ Browser opened." -ForegroundColor Green
    
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Manual test required:" -ForegroundColor Yellow
Write-Host "1. Look for red BugReporter button (bottom-right)" -ForegroundColor White  
Write-Host "2. Click it and submit a test report" -ForegroundColor White
Write-Host "3. Check if email opens or gets copied to clipboard" -ForegroundColor White
Write-Host "`n🎉 Test script completed!" -ForegroundColor Green