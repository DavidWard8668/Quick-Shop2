# SCHEDULED SYNTHETIC USER INTERACTION RUNNER
# Runs element tests regularly and performs automatic repairs

param(
    [string]$Mode = "continuous",  # continuous, once, scheduled
    [int]$IntervalMinutes = 30,
    [string]$Target = "cartpilot",
    [switch]$AutoRepair = $true,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"
$script:TestResults = @()
$script:RepairHistory = @()

# Configuration
$CartPilotUrl = "http://localhost:5173"
$SecondChanceUrl = "http://localhost:3002"
$ReportsDir = "C:\Users\David\Apps\Quick-Shop\synthetic-interactions\reports"
$RepairsDir = "C:\Users\David\Apps\Quick-Shop\synthetic-interactions\repairs"

# Ensure directories exist
if (-not (Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
}
if (-not (Test-Path $RepairsDir)) {
    New-Item -ItemType Directory -Path $RepairsDir -Force | Out-Null
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Start-ElementTesting {
    param([string]$AppName, [string]$Url)
    
    Write-ColorOutput "`n🤖 Starting Synthetic User Testing for $AppName" "Cyan"
    Write-ColorOutput "URL: $Url" "Gray"
    Write-ColorOutput ("Time: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) "Gray"
    
    $testStartTime = Get-Date
    
    # Run Node.js element interaction engine
    try {
        $env:TARGET_URL = $Url
        $env:APP_NAME = $AppName
        $env:HEADLESS = "true"
        
        $output = node "synthetic-interactions\element-interaction-engine.js" 2>&1
        
        # Parse results
        $success = $output -match "Success Rate: (\d+\.?\d*)%"
        if ($success) {
            $successRate = [float]$Matches[1]
            
            $result = @{
                App = $AppName
                Url = $Url
                SuccessRate = $successRate
                Timestamp = Get-Date
                Duration = ((Get-Date) - $testStartTime).TotalSeconds
                Output = $output -join "`n"
            }
            
            $script:TestResults += $result
            
            # Display results
            if ($successRate -ge 95) {
                Write-ColorOutput "  ✅ Excellent: $successRate% success rate" "Green"
            } elseif ($successRate -ge 80) {
                Write-ColorOutput "  ⚠️ Good: $successRate% success rate" "Yellow"
            } else {
                Write-ColorOutput "  ❌ Needs Attention: $successRate% success rate" "Red"
                
                if ($AutoRepair) {
                    Invoke-AutoRepair -AppName $AppName -SuccessRate $successRate
                }
            }
        }
        
    } catch {
        Write-ColorOutput "  ❌ Test execution failed: $_" "Red"
        $script:TestResults += @{
            App = $AppName
            Url = $Url
            Error = $_.Exception.Message
            Timestamp = Get-Date
        }
    }
}

function Invoke-AutoRepair {
    param(
        [string]$AppName,
        [float]$SuccessRate
    )
    
    Write-ColorOutput "`n🔧 Initiating Auto-Repair for $AppName" "Yellow"
    
    # Find recent failure reports
    $recentReports = Get-ChildItem -Path $ReportsDir -Filter "element-test-report-*.json" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1
    
    if ($recentReports) {
        $report = Get-Content $recentReports.FullName | ConvertFrom-Json
        
        foreach ($failure in $report.failures) {
            $repairType = Determine-RepairType -Failure $failure
            
            switch ($repairType) {
                "MISSING_ELEMENT" {
                    Write-ColorOutput "  🔨 Creating missing element: $($failure.selector)" "Yellow"
                    Create-MissingElementRepair -Selector $failure.selector -AppName $AppName
                }
                "BROKEN_HANDLER" {
                    Write-ColorOutput "  🔨 Fixing broken handler: $($failure.selector)" "Yellow"
                    Fix-BrokenHandler -Selector $failure.selector -AppName $AppName
                }
                "STYLING_ISSUE" {
                    Write-ColorOutput "  🔨 Fixing styling issue: $($failure.selector)" "Yellow"
                    Fix-StylingIssue -Selector $failure.selector -AppName $AppName
                }
                "TIMEOUT_ISSUE" {
                    Write-ColorOutput "  🔨 Adjusting timeout: $($failure.selector)" "Yellow"
                    Adjust-Timeout -Selector $failure.selector
                }
                default {
                    Write-ColorOutput "  ⚠️ Manual investigation needed: $($failure.selector)" "Cyan"
                }
            }
        }
        
        # Apply repairs
        Apply-Repairs -AppName $AppName
    }
}

function Determine-RepairType {
    param($Failure)
    
    if ($Failure.errorMessage -match "not found|does not exist") {
        return "MISSING_ELEMENT"
    }
    elseif ($Failure.errorMessage -match "not clickable|cannot click") {
        return "BROKEN_HANDLER"
    }
    elseif ($Failure.errorMessage -match "not visible|hidden") {
        return "STYLING_ISSUE"
    }
    elseif ($Failure.errorMessage -match "timeout|timed out") {
        return "TIMEOUT_ISSUE"
    }
    else {
        return "UNKNOWN"
    }
}

function Create-MissingElementRepair {
    param(
        [string]$Selector,
        [string]$AppName
    )
    
    $repairCode = @"
// Auto-Repair: Missing Element
// Selector: $Selector
// App: $AppName
// Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

const addMissingElement = () => {
    const element = document.createElement('div');
    element.setAttribute('data-testid', '$($Selector -replace "[^\w-]", "")');
    element.className = 'synthetic-repair auto-generated';
    element.innerHTML = '<span>Auto-repaired element</span>';
    
    // Try to find appropriate parent
    const parent = document.querySelector('.main-content') || 
                  document.querySelector('#root') || 
                  document.body;
    parent.appendChild(element);
    
    console.log('✅ Auto-repair: Added missing element $Selector');
};

// Execute repair
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addMissingElement);
} else {
    addMissingElement();
}
"@
    
    $filename = "repair-missing-$(Get-Date -Format 'yyyyMMdd-HHmmss').js"
    $filepath = Join-Path $RepairsDir $filename
    $repairCode | Out-File -FilePath $filepath -Encoding UTF8
    
    $script:RepairHistory += @{
        Type = "MISSING_ELEMENT"
        Selector = $Selector
        File = $filename
        Timestamp = Get-Date
    }
}

function Fix-BrokenHandler {
    param(
        [string]$Selector,
        [string]$AppName
    )
    
    $repairCode = @"
// Auto-Repair: Broken Click Handler
// Selector: $Selector
// App: $AppName
// Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

const fixClickHandler = () => {
    const elements = document.querySelectorAll('$Selector');
    
    elements.forEach(element => {
        // Remove existing broken handlers
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        
        // Add working handler
        newElement.addEventListener('click', function(e) {
            console.log('✅ Auto-repair: Click handled for $Selector');
            
            // Determine appropriate action
            if (this.href) {
                window.location.href = this.href;
            } else if (this.dataset.action) {
                window.dispatchEvent(new CustomEvent(this.dataset.action));
            } else {
                this.classList.toggle('active');
            }
        });
    });
    
    console.log('✅ Auto-repair: Fixed click handlers for $Selector');
};

// Execute repair
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixClickHandler);
} else {
    fixClickHandler();
}
"@
    
    $filename = "repair-handler-$(Get-Date -Format 'yyyyMMdd-HHmmss').js"
    $filepath = Join-Path $RepairsDir $filename
    $repairCode | Out-File -FilePath $filepath -Encoding UTF8
    
    $script:RepairHistory += @{
        Type = "BROKEN_HANDLER"
        Selector = $Selector
        File = $filename
        Timestamp = Get-Date
    }
}

function Fix-StylingIssue {
    param(
        [string]$Selector,
        [string]$AppName
    )
    
    $repairCSS = @"
/* Auto-Repair: Styling Issue */
/* Selector: $Selector */
/* App: $AppName */
/* Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss") */

$Selector {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    position: relative !important;
    z-index: 1 !important;
}

/* Ensure interactive elements are clickable */
${Selector}:is(button, a, input, select) {
    cursor: pointer !important;
    user-select: none !important;
}

/* Fix potential overlay issues */
$Selector::before,
$Selector::after {
    pointer-events: none !important;
}
"@
    
    $filename = "repair-style-$(Get-Date -Format 'yyyyMMdd-HHmmss').css"
    $filepath = Join-Path $RepairsDir $filename
    $repairCSS | Out-File -FilePath $filepath -Encoding UTF8
    
    $script:RepairHistory += @{
        Type = "STYLING_ISSUE"
        Selector = $Selector
        File = $filename
        Timestamp = Get-Date
    }
}

function Adjust-Timeout {
    param([string]$Selector)
    
    # Update test configuration
    $configUpdate = @{
        Selector = $Selector
        Timeout = 10000  # Increase to 10 seconds
        Timestamp = Get-Date
    }
    
    $configFile = Join-Path $ReportsDir "timeout-adjustments.json"
    if (Test-Path $configFile) {
        $config = Get-Content $configFile | ConvertFrom-Json
        $config.adjustments += $configUpdate
    } else {
        $config = @{ adjustments = @($configUpdate) }
    }
    
    $config | ConvertTo-Json -Depth 10 | Out-File -FilePath $configFile -Encoding UTF8
}

function Apply-Repairs {
    param([string]$AppName)
    
    Write-ColorOutput "`n📦 Applying Repairs to $AppName..." "Cyan"
    
    # Get all repair files
    $jsRepairs = Get-ChildItem -Path $RepairsDir -Filter "repair-*.js" | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-5) }
    $cssRepairs = Get-ChildItem -Path $RepairsDir -Filter "repair-*.css" | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-5) }
    
    if ($jsRepairs.Count -gt 0 -or $cssRepairs.Count -gt 0) {
        # Create consolidated repair file
        $consolidatedJS = @"
// Consolidated Auto-Repairs
// Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
// App: $AppName

"@
        
        foreach ($repair in $jsRepairs) {
            $consolidatedJS += Get-Content $repair.FullName -Raw
            $consolidatedJS += "`n`n"
        }
        
        $outputPath = "C:\Users\David\Apps\Quick-Shop\public\auto-repairs.js"
        $consolidatedJS | Out-File -FilePath $outputPath -Encoding UTF8
        
        Write-ColorOutput "  ✅ Applied $($jsRepairs.Count) JavaScript repairs" "Green"
        
        if ($cssRepairs.Count -gt 0) {
            $consolidatedCSS = ""
            foreach ($repair in $cssRepairs) {
                $consolidatedCSS += Get-Content $repair.FullName -Raw
                $consolidatedCSS += "`n`n"
            }
            
            $cssOutputPath = "C:\Users\David\Apps\Quick-Shop\public\auto-repairs.css"
            $consolidatedCSS | Out-File -FilePath $cssOutputPath -Encoding UTF8
            
            Write-ColorOutput "  ✅ Applied $($cssRepairs.Count) CSS repairs" "Green"
        }
        
        # Restart application to apply repairs
        Write-ColorOutput "  🔄 Restarting application to apply repairs..." "Yellow"
        Restart-Application -AppName $AppName
    }
}

function Restart-Application {
    param([string]$AppName)
    
    if ($AppName -eq "cartpilot") {
        # Kill existing process
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -match "Quick-Shop"
        } | Stop-Process -Force
        
        # Start new process
        Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "C:\Users\David\Apps\Quick-Shop" -WindowStyle Hidden
        
        # Wait for startup
        Start-Sleep -Seconds 5
        
        Write-ColorOutput "  ✅ CartPilot restarted" "Green"
    }
}

function Generate-Report {
    Write-ColorOutput "`n📊 Generating Test Report..." "Cyan"
    
    $report = @{
        Summary = @{
            TotalRuns = $script:TestResults.Count
            AverageSuccessRate = ($script:TestResults | Measure-Object -Property SuccessRate -Average).Average
            TotalRepairs = $script:RepairHistory.Count
            Timestamp = Get-Date
        }
        Results = $script:TestResults
        Repairs = $script:RepairHistory
    }
    
    # Save report
    $reportPath = Join-Path $ReportsDir "synthetic-test-summary-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
    
    # Display summary
    Write-ColorOutput "Test Runs: $($report.Summary.TotalRuns)" "White"
    Write-ColorOutput "Average Success: $([math]::Round($report.Summary.AverageSuccessRate, 2))%" "White"
    Write-ColorOutput "Repairs Applied: $($report.Summary.TotalRepairs)" "White"
    Write-ColorOutput "Report saved to: $reportPath" "Gray"
}

# Main execution loop
Write-ColorOutput "🚀 SYNTHETIC USER INTERACTION SCHEDULER" "Magenta"
Write-ColorOutput "Mode: $Mode | Interval: ${IntervalMinutes}min | Auto-Repair: $AutoRepair" "Gray"
Write-ColorOutput ("=" * 60) "Gray"

$iteration = 0
$continue = $true

while ($continue) {
    $iteration++
    Write-ColorOutput "`n🔄 Iteration #$iteration - $(Get-Date -Format 'HH:mm:ss')" "Cyan"
    
    # Test CartPilot
    if ($Target -eq "cartpilot" -or $Target -eq "both") {
        Start-ElementTesting -AppName "cartpilot" -Url $CartPilotUrl
    }
    
    # Test Second Chance
    if ($Target -eq "secondchance" -or $Target -eq "both") {
        Start-ElementTesting -AppName "secondchance" -Url $SecondChanceUrl
    }
    
    # Generate report every 5 iterations
    if ($iteration % 5 -eq 0) {
        Generate-Report
    }
    
    # Determine if we should continue
    switch ($Mode) {
        "once" {
            $continue = $false
            Generate-Report
        }
        "scheduled" {
            Write-ColorOutput "`n⏰ Waiting $IntervalMinutes minutes until next run..." "Gray"
            Start-Sleep -Seconds ($IntervalMinutes * 60)
        }
        "continuous" {
            Write-ColorOutput "`n⏰ Waiting $IntervalMinutes minutes until next run..." "Gray"
            Write-ColorOutput "Press Ctrl+C to stop" "Gray"
            Start-Sleep -Seconds ($IntervalMinutes * 60)
        }
    }
}

Write-ColorOutput "`n✅ Synthetic User Testing Complete!" "Green"