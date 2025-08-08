# Basic CartPilot Testing Script
param(
    [string]$CartPilotUrl = "https://cartpilot-sigma.vercel.app/"
)

Write-Host "🚀 Starting Basic CartPilot Test..." -ForegroundColor Green
Write-Host "Target URL: $CartPilotUrl" -ForegroundColor Yellow

# Test 1: Basic connectivity
Write-Host "`n📡 Testing site connectivity..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $CartPilotUrl -TimeoutSec 30
    Write-Host "✅ Site is accessible - Status: $($response.StatusCode)" -ForegroundColor Green
    
    $html = $response.Content
    
    # Test 2: Check for key elements
    Write-Host "`n🔍 Checking for key elements..." -ForegroundColor Cyan
    
    if ($html -match "CARTPILOT") {
        Write-Host "✅ CartPilot branding found" -ForegroundColor Green
    } else {
        Write-Host "❌ CartPilot branding NOT found" -ForegroundColor Red
    }
    
    if ($html -match "NEW BUG REPORTER" -or $html -match "BUG REPORTER") {
        Write-Host "✅ Bug Reporter v4.0 found!" -ForegroundColor Green
    } else {
        Write-Host "❌ Bug Reporter v4.0 NOT found" -ForegroundColor Red
    }
    
    # Test 3: Check JavaScript bundle
    if ($html -match "index-.*\.js") {
        $jsBundle = [regex]::Match($html, 'index-[a-zA-Z0-9_]+\.js').Value
        Write-Host "✅ JavaScript bundle: $jsBundle" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Site test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Try browser automation
Write-Host "`n🌐 Attempting browser test..." -ForegroundColor Cyan
try {
    $ie = New-Object -ComObject InternetExplorer.Application
    $ie.Visible = $true
    $ie.Navigate($CartPilotUrl)
    
    Write-Host "✅ Browser opened successfully" -ForegroundColor Green
    Write-Host "👀 Browser is now open for manual testing!" -ForegroundColor Yellow
    Write-Host "📝 Test the '🚨 NEW BUG REPORTER v4.0' button manually" -ForegroundColor Yellow
    Write-Host "`nPress Enter when done testing..." -ForegroundColor White
    Read-Host
    
    $ie.Quit()
    Write-Host "✅ Browser closed" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Browser automation not available: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "💡 Please open $CartPilotUrl manually to test" -ForegroundColor Yellow
}

Write-Host "`n🎉 Basic test completed!" -ForegroundColor Green