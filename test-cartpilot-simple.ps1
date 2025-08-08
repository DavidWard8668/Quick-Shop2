# Simple CartPilot Testing Script
param(
    [string]$TestEmail = "test.cartpilot@gmail.com",
    [string]$CartPilotUrl = "https://cartpilot-sigma.vercel.app/"
)

Write-Host "🚀 Starting CartPilot Simple Test Suite..." -ForegroundColor Green
Write-Host "Target URL: $CartPilotUrl" -ForegroundColor Yellow

try {
    # Try to test with basic PowerShell web request first
    Write-Host "`n📡 Testing basic connectivity..." -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri $CartPilotUrl -TimeoutSec 30
    Write-Host "✅ Site is accessible - Status: $($response.StatusCode)" -ForegroundColor Green
    
    # Check for key elements in the HTML
    $html = $response.Content
    
    Write-Host "`n🔍 Analyzing page content..." -ForegroundColor Cyan
    
    if ($html -match "CARTPILOT") {
        Write-Host "✅ CartPilot branding found" -ForegroundColor Green
    } else {
        Write-Host "❌ CartPilot branding NOT found" -ForegroundColor Red
    }
    
    if ($html -match "BUG REPORTER" -or $html -match "Report Bug") {
        Write-Host "✅ Bug Reporter v4.0 elements found!" -ForegroundColor Green
    } else {
        Write-Host "❌ Bug Reporter v4.0 NOT found" -ForegroundColor Red
    }
    
    if ($html -match "Stores" -and $html -match "Cart" -and $html -match "Navigate") {
        Write-Host "✅ Main navigation tabs found" -ForegroundColor Green
    } else {
        Write-Host "❌ Some navigation tabs missing" -ForegroundColor Red
    }
    
    # Check for new JavaScript bundle
    if ($html -match "index-.*\.js") {
        $jsBundle = [regex]::Match($html, 'index-[a-zA-Z0-9_]+\.js').Value
        Write-Host "✅ JavaScript bundle: $jsBundle" -ForegroundColor Green
    }
    
    Write-Host "`n🎯 Attempting browser automation test..." -ForegroundColor Cyan
    
    # Try simple Internet Explorer automation as fallback
    try {
        $ie = New-Object -ComObject InternetExplorer.Application
        $ie.Visible = $true
        $ie.Navigate($CartPilotUrl)
        
        Write-Host "🌐 Opening Internet Explorer..." -ForegroundColor Yellow
        
        # Wait for page to load
        do { Start-Sleep 1 } while ($ie.Busy)
        Start-Sleep 5
        
        Write-Host "✅ Page loaded in Internet Explorer" -ForegroundColor Green
        
        # Try to find and click the bug reporter button
        $document = $ie.Document
        $buttons = $document.getElementsByTagName("button")
        
        $bugReporterFound = $false
        for ($i = 0; $i -lt $buttons.length; $i++) {
            $button = $buttons.item($i)
            if ($button.innerText -match "BUG REPORTER" -or $button.innerText -match "Report") {
                Write-Host "🎯 Found Bug Reporter button: $($button.innerText)" -ForegroundColor Green
                $bugReporterFound = $true
                
                try {
                    $button.click()
                    Start-Sleep 3
                    Write-Host "✅ Bug Reporter button clicked successfully!" -ForegroundColor Green
                    break
                } catch {
                    Write-Host "⚠️ Could not click button: $($_.Exception.Message)" -ForegroundColor Yellow
                }
            }
        }
        
        if (-not $bugReporterFound) {
            Write-Host "❌ Bug Reporter button not found in DOM" -ForegroundColor Red
        }
        
        # Keep browser open for manual inspection
        Write-Host "`n🔍 Browser left open for manual inspection..." -ForegroundColor Cyan
        Write-Host "👀 You can now manually test the Bug Reporter v4.0!" -ForegroundColor Yellow
        Write-Host "📝 Look for console logs with '🎯 BugReporter v4.0'" -ForegroundColor Yellow
        Write-Host "`nPress Enter to close browser and finish test..." -ForegroundColor White
        Read-Host
        
        $ie.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ie) | Out-Null
        
    } catch {
        Write-Host "❌ Browser automation failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Try opening $CartPilotUrl manually to test" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 CartPilot test completed!" -ForegroundColor Green
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "- Site accessibility: Tested" -ForegroundColor White
Write-Host "- Content analysis: Completed" -ForegroundColor White
Write-Host "- Browser test: Attempted" -ForegroundColor White
Write-Host "`n💡 For full automation, install Selenium WebDriver" -ForegroundColor Yellow