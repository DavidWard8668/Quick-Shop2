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
    
    # Check for error indicators in HTML
    if ($html -match "error" -or $html -match "Error") {
        Write-Host "⚠️ Error text found in HTML - may indicate issues" -ForegroundColor Yellow
    }
    
    # Check HTML structure for React components
    if ($html -match "CartPilot" -and $html -match "React") {
        Write-Host "✅ React app appears to be loading properly" -ForegroundColor Green
    } elseif ($html -match "id.*root") {
        Write-Host "✅ React root element found" -ForegroundColor Green
    }
    
    Write-Host "`n📊 HTML Analysis Complete!" -ForegroundColor Green
    Write-Host "Content length: $($html.Length) characters" -ForegroundColor White
    
    # Simple browser test using Edge/Chrome
    Write-Host "`n🌐 Attempting to open in default browser..." -ForegroundColor Cyan
    Start-Process $CartPilotUrl
    
    Write-Host "`n✅ Browser opened. Please manually test:" -ForegroundColor Yellow
    Write-Host "1. Look for BugReporter v4.0 button (red, bottom-right)" -ForegroundColor White
    Write-Host "2. Click it and try to submit a test report" -ForegroundColor White
    Write-Host "3. Check browser console (F12) for any errors" -ForegroundColor White
    Write-Host "4. See if email client opens or clipboard gets populated" -ForegroundColor White
    
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Test completed. Check browser for manual verification." -ForegroundColor Green