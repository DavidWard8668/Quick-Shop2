# QUICK START SCRIPT FOR SYNTHETIC USER TESTING
# Run this to immediately start testing with auto-repair

Write-Host "🚀 STARTING SYNTHETIC USER TESTING SYSTEM" -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Magenta

# Check if CartPilot is running
$cartpilotRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        $cartpilotRunning = $true
        Write-Host "✅ CartPilot is running" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ CartPilot is not running - Starting it now..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "C:\Users\David\Apps\Quick-Shop" -WindowStyle Minimized
    Start-Sleep -Seconds 5
}

# Check if Second Chance is running
$secondChanceRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/health" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        $secondChanceRunning = $true
        Write-Host "✅ Second Chance is running" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Second Chance is not running - Starting it now..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "C:\Users\David\Apps\Second-Chance" -WindowStyle Minimized
    Start-Sleep -Seconds 3
}

Write-Host "`n📊 Opening Monitoring Dashboard..." -ForegroundColor Cyan
Start-Process "C:\Users\David\Apps\Quick-Shop\synthetic-interactions\monitoring-dashboard.html"

Write-Host "`n🤖 Starting Synthetic User Testing..." -ForegroundColor Cyan
Write-Host "Mode: Continuous testing with auto-repair" -ForegroundColor Gray
Write-Host "Interval: Every 30 minutes" -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

# Start the scheduled runner
& "C:\Users\David\Apps\Quick-Shop\synthetic-interactions\scheduled-runner.ps1" -Mode continuous -IntervalMinutes 30 -Target both -AutoRepair -Verbose