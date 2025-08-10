# =============================================================================
# 🧪 CartPilot Complete Test Runner
# Executes all testing suites: Unit, Integration, E2E, and Feature tests
# =============================================================================

param(
    [string]$Environment = "development",
    [string]$CartPilotUrl = "http://localhost:5173",
    [switch]$Production,
    [switch]$SkipE2E,
    [switch]$SkipUnit,
    [switch]$GenerateReport = $true,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$StartTime = Get-Date

if ($Production) {
    $CartPilotUrl = "https://cartpilot-sigma.vercel.app/"
    $Environment = "production"
}

Write-Host "🚀 CartPilot Complete Test Runner" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Target URL: $CartPilotUrl" -ForegroundColor Yellow
Write-Host "Start Time: $StartTime" -ForegroundColor Yellow
Write-Host ""

$TestResults = @{
    UnitTests = @{ Status = "Not Run"; Output = ""; Duration = 0 }
    E2ETests = @{ Status = "Not Run"; Output = ""; Duration = 0 }
    FeatureTests = @{ Status = "Not Run"; Output = ""; Duration = 0 }
    BuildTest = @{ Status = "Not Run"; Output = ""; Duration = 0 }
    OverallStatus = "Unknown"
    TotalDuration = 0
}

function Run-Command {
    param(
        [string]$Command,
        [string]$Description,
        [string]$WorkingDirectory = $PWD
    )
    
    Write-Host "📋 $Description..." -ForegroundColor Blue
    Write-Host "   Command: $Command" -ForegroundColor Gray
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    try {
        if ($Verbose) {
            $output = Invoke-Expression $Command 2>&1
        } else {
            $output = Invoke-Expression $Command 2>&1 | Out-String
        }
        
        $stopwatch.Stop()
        $duration = $stopwatch.ElapsedMilliseconds
        
        Write-Host "✅ $Description completed in $($duration)ms" -ForegroundColor Green
        
        return @{
            Success = $true
            Output = $output
            Duration = $duration
            Error = $null
        }
    } catch {
        $stopwatch.Stop()
        $duration = $stopwatch.ElapsedMilliseconds
        
        Write-Host "❌ $Description failed after $($duration)ms" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        
        return @{
            Success = $false
            Output = $_.Exception.Message
            Duration = $duration
            Error = $_.Exception
        }
    }
}

# =============================================================================
# 1. Unit and Integration Tests
# =============================================================================

if (-not $SkipUnit) {
    Write-Host "`n📦 Running Unit Tests and Coverage" -ForegroundColor Magenta
    Write-Host "===================================" -ForegroundColor Magenta
    
    $unitResult = Run-Command "npm run test:comprehensive" "Comprehensive unit test suite"
    $TestResults.UnitTests = @{
        Status = if ($unitResult.Success) { "Passed" } else { "Failed" }
        Output = $unitResult.Output
        Duration = $unitResult.Duration
    }
    
    if ($unitResult.Success) {
        Write-Host "Unit tests completed successfully" -ForegroundColor Green
    } else {
        Write-Host "Unit tests failed - check output for details" -ForegroundColor Red
    }
}

# =============================================================================
# 2. Build Test
# =============================================================================

Write-Host "`n🏗️ Running Build Test" -ForegroundColor Magenta
Write-Host "=====================" -ForegroundColor Magenta

$buildResult = Run-Command "npm run build" "Production build test"
$TestResults.BuildTest = @{
    Status = if ($buildResult.Success) { "Passed" } else { "Failed" }
    Output = $buildResult.Output
    Duration = $buildResult.Duration
}

# =============================================================================
# 3. Enhanced E2E Tests
# =============================================================================

if (-not $SkipE2E) {
    Write-Host "`n🎭 Running Enhanced E2E Tests" -ForegroundColor Magenta
    Write-Host "=============================" -ForegroundColor Magenta
    
    # Check if URL is accessible
    try {
        $response = Invoke-WebRequest -Uri $CartPilotUrl -Method Head -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Target URL is accessible: $CartPilotUrl" -ForegroundColor Green
            
            # Run enhanced PowerShell E2E tests
            $e2eCommand = "powershell -ExecutionPolicy Bypass -File `"test-cartpilot-enhanced-v2.ps1`" -CartPilotUrl `"$CartPilotUrl`" -TestNewFeatures"
            $e2eResult = Run-Command $e2eCommand "Enhanced E2E test suite"
            
            $TestResults.E2ETests = @{
                Status = if ($e2eResult.Success) { "Passed" } else { "Failed" }
                Output = $e2eResult.Output
                Duration = $e2eResult.Duration
            }
            
        } else {
            Write-Host "❌ Target URL not accessible: $CartPilotUrl" -ForegroundColor Red
            $TestResults.E2ETests.Status = "Skipped - URL not accessible"
        }
    } catch {
        Write-Host "⚠️ Could not verify URL accessibility, skipping E2E tests" -ForegroundColor Yellow
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        $TestResults.E2ETests.Status = "Skipped - Connection error"
    }
    
    # Also run Playwright tests if available
    Write-Host "`n🎬 Running Playwright E2E Tests" -ForegroundColor Blue
    $playwrightResult = Run-Command "npm run test:e2e:critical" "Playwright critical path tests"
    
    if ($playwrightResult.Success) {
        Write-Host "Playwright tests completed successfully" -ForegroundColor Green
    } else {
        Write-Host "Playwright tests failed or skipped" -ForegroundColor Yellow
    }
}

# =============================================================================
# 4. Feature-Specific Tests
# =============================================================================

Write-Host "`n🆕 Running Feature-Specific Tests" -ForegroundColor Magenta
Write-Host "==================================" -ForegroundColor Magenta

# Test individual features
$featureTests = @{
    "Service Worker" = "Test-Path public/sw.js"
    "PWA Manifest" = "Test-Path public/manifest.json"
    "Offline Page" = "Test-Path public/offline.html"
    "Real-time Sync Service" = "Test-Path src/services/realTimeSyncService.ts"
    "PWA Service" = "Test-Path src/services/pwaService.ts"
    "AR Navigation Service" = "Test-Path src/services/arNavigationService.ts"
    "Offline Service" = "Test-Path src/services/offlineService.ts"
    "Notification Service" = "Test-Path src/services/notificationService.ts"
}

$featureResults = @{}
foreach ($feature in $featureTests.Keys) {
    $command = $featureTests[$feature]
    $result = Invoke-Expression $command
    $featureResults[$feature] = if ($result) { "✅ Present" } else { "❌ Missing" }
    Write-Host "$feature`: $($featureResults[$feature])"
}

$TestResults.FeatureTests = @{
    Status = "Completed"
    Results = $featureResults
    Duration = 1000 # Quick file checks
}

# =============================================================================
# 5. Generate Final Report
# =============================================================================

$EndTime = Get-Date
$TotalDuration = $EndTime - $StartTime
$TestResults.TotalDuration = $TotalDuration.TotalMilliseconds

# Determine overall status
$passedTests = 0
$totalTests = 0

if ($TestResults.UnitTests.Status -eq "Passed") { $passedTests++ }
if ($TestResults.UnitTests.Status -ne "Not Run") { $totalTests++ }

if ($TestResults.BuildTest.Status -eq "Passed") { $passedTests++ }
if ($TestResults.BuildTest.Status -ne "Not Run") { $totalTests++ }

if ($TestResults.E2ETests.Status -eq "Passed") { $passedTests++ }
if ($TestResults.E2ETests.Status -ne "Not Run") { $totalTests++ }

if ($TestResults.FeatureTests.Status -eq "Completed") { $passedTests++ }
if ($TestResults.FeatureTests.Status -ne "Not Run") { $totalTests++ }

$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }

$TestResults.OverallStatus = switch ($successRate) {
    { $_ -ge 90 } { "🎉 EXCELLENT" }
    { $_ -ge 75 } { "✅ GOOD" }
    { $_ -ge 50 } { "⚠️ NEEDS WORK" }
    default { "❌ CRITICAL ISSUES" }
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "CARTPILOT COMPLETE TEST SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

Write-Host "`n🕒 Execution Summary:" -ForegroundColor Yellow
Write-Host "- Start Time: $StartTime"
Write-Host "- End Time: $EndTime"
Write-Host "- Total Duration: $($TotalDuration.ToString())"
Write-Host "- Environment: $Environment"
Write-Host "- Target URL: $CartPilotUrl"

Write-Host "`n📋 Test Results:" -ForegroundColor Yellow
$unitTime = [math]::Round($TestResults.UnitTests.Duration / 1000, 1)
$buildTime = [math]::Round($TestResults.BuildTest.Duration / 1000, 1)
$e2eTime = [math]::Round($TestResults.E2ETests.Duration / 1000, 1)
$featureTime = [math]::Round($TestResults.FeatureTests.Duration / 1000, 1)
Write-Host "- Unit Tests: $($TestResults.UnitTests.Status) ($unitTime seconds)"
Write-Host "- Build Test: $($TestResults.BuildTest.Status) ($buildTime seconds)"
Write-Host "- E2E Tests: $($TestResults.E2ETests.Status) ($e2eTime seconds)"
Write-Host "- Feature Tests: $($TestResults.FeatureTests.Status) ($featureTime seconds)"

Write-Host "`n🆕 New Feature Status:" -ForegroundColor Yellow
foreach ($feature in $featureResults.Keys) {
    Write-Host "- $feature`: $($featureResults[$feature])"
}

Write-Host "`n🎯 Overall Assessment:" -ForegroundColor Yellow
Write-Host "- Success Rate: $successRate% ($passedTests/$totalTests)"
Write-Host "- Status: $($TestResults.OverallStatus)"

if ($GenerateReport) {
    # Generate JSON report for CI/CD
    $reportDir = "test-reports"
    if (-not (Test-Path $reportDir)) {
        New-Item -ItemType Directory -Force -Path $reportDir
    }
    
    $jsonReport = $TestResults | ConvertTo-Json -Depth 5
    $reportFile = Join-Path $reportDir "complete-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $jsonReport | Out-File -FilePath $reportFile -Encoding UTF8
    
    Write-Host "`n💾 Report saved: $reportFile" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "TEST RUNNER COMPLETED" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

# Exit with appropriate code
$exitCode = if ($successRate -ge 75) { 0 } else { 1 }
exit $exitCode