# Simple Synthetic Test Runner
Write-Host "🤖 Running Synthetic User Testing..." -ForegroundColor Cyan

# Ensure apps are running
$cartpilotUrl = "http://localhost:5173"
try {
    $response = Invoke-WebRequest -Uri $cartpilotUrl -UseBasicParsing -TimeoutSec 2
    Write-Host "✅ CartPilot is accessible" -ForegroundColor Green
} catch {
    Write-Host "⚠️ CartPilot not running - please start it first" -ForegroundColor Yellow
    Write-Host "Run: cd Quick-Shop && npm run dev" -ForegroundColor Gray
}

# Run the Node.js test engine
Write-Host "`n🧪 Starting element interaction tests..." -ForegroundColor Cyan
$env:TARGET_URL = $cartpilotUrl
$env:APP_NAME = "cartpilot"
$env:HEADLESS = "false"  # Show browser for demo

cd synthetic-interactions
node element-interaction-engine.js

Write-Host "`n✅ Test complete! Check synthetic-interactions\reports for results" -ForegroundColor Green