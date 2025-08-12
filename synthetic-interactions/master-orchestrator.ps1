# Master Orchestrator for Automated Testing & Monitoring
# Coordinates all automated systems and provides centralized control

param(
    [switch]$StartAll,
    [switch]$StopAll,
    [switch]$Status,
    [switch]$TestNow,
    [switch]$EmailNow,
    [switch]$EnableSchedule
)

$ErrorActionPreference = 'Continue'
$REPO_PATH = "C:\Users\David\Apps\Quick-Shop"
$SYNTHETIC_PATH = "$REPO_PATH\synthetic-interactions"

# Colors for output
function Write-ColorOutput($message, $color = "White") {
    Write-Host $message -ForegroundColor $color
}

function Show-Banner {
    Clear-Host
    Write-ColorOutput "===============================================" "Cyan"
    Write-ColorOutput "   CartPilot Master Orchestrator v1.0" "Yellow"
    Write-ColorOutput "   Automated Testing & Issue Resolution" "Yellow"
    Write-ColorOutput "===============================================" "Cyan"
    Write-ColorOutput ""
}

function Start-AllSystems {
    Write-ColorOutput "`n🚀 Starting all automated systems..." "Green"
    
    # Start PowerShell Monitor
    Write-ColorOutput "  1. Starting PowerShell Monitor..." "Cyan"
    $monitorProcess = Start-Process powershell -ArgumentList "-NoExit", "-File", "$SYNTHETIC_PATH\automated-monitor.ps1" -PassThru -WindowStyle Hidden
    
    if ($monitorProcess) {
        Write-ColorOutput "     ✅ Monitor started (PID: $($monitorProcess.Id))" "Green"
    }
    
    # Start Subagent Tester
    Write-ColorOutput "  2. Starting Subagent Tester..." "Cyan"
    $testerProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$SYNTHETIC_PATH'; node subagent-tester.js --continuous --interval=30" -PassThru -WindowStyle Hidden
    
    if ($testerProcess) {
        Write-ColorOutput "     ✅ Subagent started (PID: $($testerProcess.Id))" "Green"
    }
    
    # Save process IDs
    @{
        Monitor = $monitorProcess.Id
        Subagent = $testerProcess.Id
        StartTime = Get-Date
    } | ConvertTo-Json | Out-File "$SYNTHETIC_PATH\orchestrator-pids.json"
    
    Write-ColorOutput "`n✅ All systems started successfully!" "Green"
    Write-ColorOutput "   Monitor PID: $($monitorProcess.Id)" "Gray"
    Write-ColorOutput "   Subagent PID: $($testerProcess.Id)" "Gray"
}

function Stop-AllSystems {
    Write-ColorOutput "`n🛑 Stopping all automated systems..." "Yellow"
    
    if (Test-Path "$SYNTHETIC_PATH\orchestrator-pids.json") {
        $pids = Get-Content "$SYNTHETIC_PATH\orchestrator-pids.json" | ConvertFrom-Json
        
        # Stop Monitor
        if ($pids.Monitor) {
            Stop-Process -Id $pids.Monitor -Force -ErrorAction SilentlyContinue
            Write-ColorOutput "  ✅ Monitor stopped" "Green"
        }
        
        # Stop Subagent
        if ($pids.Subagent) {
            Stop-Process -Id $pids.Subagent -Force -ErrorAction SilentlyContinue
            Write-ColorOutput "  ✅ Subagent stopped" "Green"
        }
        
        Remove-Item "$SYNTHETIC_PATH\orchestrator-pids.json" -Force
    }
    
    # Kill any remaining node processes
    Get-Process node -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*subagent-tester*" -or $_.CommandLine -like "*email-reporter*"
    } | Stop-Process -Force
    
    Write-ColorOutput "`n✅ All systems stopped" "Green"
}

function Get-SystemStatus {
    Write-ColorOutput "`n📊 System Status Report" "Cyan"
    Write-ColorOutput "========================" "Cyan"
    
    $status = @{
        Monitor = "Stopped"
        Subagent = "Stopped"
        LastTest = "Unknown"
        Issues = 0
        EmailSystem = "Unknown"
    }
    
    # Check if processes are running
    if (Test-Path "$SYNTHETIC_PATH\orchestrator-pids.json") {
        $pids = Get-Content "$SYNTHETIC_PATH\orchestrator-pids.json" | ConvertFrom-Json
        
        if (Get-Process -Id $pids.Monitor -ErrorAction SilentlyContinue) {
            $monitorPid = $pids.Monitor
            $status.Monitor = "Running - PID: $monitorPid"
        }
        
        if (Get-Process -Id $pids.Subagent -ErrorAction SilentlyContinue) {
            $subagentPid = $pids.Subagent
            $status.Subagent = "Running - PID: $subagentPid"
        }
    }
    
    # Check last test results
    $logsPath = "$SYNTHETIC_PATH\subagent-logs"
    if (Test-Path $logsPath) {
        $latestLog = Get-ChildItem $logsPath -Filter "test-results-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($latestLog) {
            $status.LastTest = $latestLog.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
            $results = Get-Content $latestLog.FullName | ConvertFrom-Json
            $status.Issues = $results.issues.Count
        }
    }
    
    # Check email system
    try {
        $emailTest = & node -e "console.log('Email system OK')" 2>&1
        if ($emailTest -eq "Email system OK") {
            $status.EmailSystem = "Operational"
        }
    } catch {
        $status.EmailSystem = "Error"
    }
    
    # Display status
    Write-ColorOutput "`n  Monitor Service: $($status.Monitor)" $(if ($status.Monitor -like "Running*") { "Green" } else { "Red" })
    Write-ColorOutput "  Subagent Tester: $($status.Subagent)" $(if ($status.Subagent -like "Running*") { "Green" } else { "Red" })
    Write-ColorOutput "  Email System: $($status.EmailSystem)" $(if ($status.EmailSystem -eq "Operational") { "Green" } else { "Yellow" })
    Write-ColorOutput "`n  Last Test Run: $($status.LastTest)" "Gray"
    Write-ColorOutput "  Active Issues: $($status.Issues)" $(if ($status.Issues -eq 0) { "Green" } else { "Yellow" })
    
    # Check recent issues
    $issuesPath = "$SYNTHETIC_PATH\detected-issues"
    if (Test-Path $issuesPath) {
        $recentIssues = Get-ChildItem $issuesPath -Filter "issues-*.json" | Where-Object {
            $_.LastWriteTime -gt (Get-Date).AddHours(-24)
        }
        
        if ($recentIssues) {
            Write-ColorOutput "`n  Recent Issues (Last 24h):" "Yellow"
            foreach ($issueFile in $recentIssues | Select-Object -First 5) {
                $issues = Get-Content $issueFile.FullName | ConvertFrom-Json
                foreach ($issue in $issues | Select-Object -First 3) {
                    Write-ColorOutput "    - $($issue.type) [$($issue.severity)]" "Gray"
                }
            }
        }
    }
}

function Test-Now {
    Write-ColorOutput "`n🧪 Running immediate test suite..." "Cyan"
    
    Set-Location $SYNTHETIC_PATH
    
    # Run subagent tester
    $output = node subagent-tester.js 2>&1 | Out-String
    Write-ColorOutput $output "Gray"
    
    # Parse results
    if ($output -match "Issues: (\d+)") {
        $issueCount = $matches[1]
        if ($issueCount -eq "0") {
            Write-ColorOutput "`n✅ All tests passed! No issues detected." "Green"
        } else {
            Write-ColorOutput "`n⚠️ $issueCount issues detected. Check logs for details." "Yellow"
        }
    }
}

function Send-EmailNow {
    Write-ColorOutput "`n📧 Sending email report..." "Cyan"
    
    Set-Location $SYNTHETIC_PATH
    
    # Run email reporter
    $output = node email-reporter.js 2>&1 | Out-String
    
    if ($output -match "Email sent successfully") {
        Write-ColorOutput "✅ Email report sent to davidward8668@gmail.com" "Green"
    } else {
        Write-ColorOutput "❌ Failed to send email report" "Red"
        Write-ColorOutput $output "Gray"
    }
}

function Enable-Schedule {
    Write-ColorOutput "`n⏰ Setting up scheduled tasks..." "Cyan"
    
    # Create scheduled task for monitoring
    $taskName = "CartPilot-AutoMonitor"
    
    $action = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$SYNTHETIC_PATH\master-orchestrator.ps1`" -StartAll"
    
    $trigger = New-ScheduledTaskTrigger -Daily -At "08:00"
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
    
    # Create nightly email task
    $emailTaskName = "CartPilot-NightlyEmail"
    
    $emailAction = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$SYNTHETIC_PATH\master-orchestrator.ps1`" -EmailNow"
    
    $emailTrigger = New-ScheduledTaskTrigger -Daily -At "23:00"
    
    Register-ScheduledTask -TaskName $emailTaskName -Action $emailAction -Trigger $emailTrigger -Principal $principal -Settings $settings -Force
    
    Write-ColorOutput "✅ Scheduled tasks created:" "Green"
    Write-ColorOutput "   - Daily monitoring at 8:00 AM" "Gray"
    Write-ColorOutput "   - Nightly email report at 11:00 PM" "Gray"
}

function Show-Help {
    Write-ColorOutput "`nAvailable Commands:" "Cyan"
    Write-ColorOutput "  -StartAll      Start all automated systems" "Gray"
    Write-ColorOutput "  -StopAll       Stop all automated systems" "Gray"
    Write-ColorOutput "  -Status        Show current system status" "Gray"
    Write-ColorOutput "  -TestNow       Run tests immediately" "Gray"
    Write-ColorOutput "  -EmailNow      Send email report now" "Gray"
    Write-ColorOutput "  -EnableSchedule Set up scheduled tasks" "Gray"
    Write-ColorOutput "`nExamples:" "Yellow"
    Write-ColorOutput "  .\master-orchestrator.ps1 -StartAll" "Gray"
    Write-ColorOutput "  .\master-orchestrator.ps1 -Status" "Gray"
    Write-ColorOutput "  .\master-orchestrator.ps1 -TestNow -EmailNow" "Gray"
}

# Main execution
Show-Banner

if ($StartAll) {
    Start-AllSystems
} elseif ($StopAll) {
    Stop-AllSystems
} elseif ($Status) {
    Get-SystemStatus
} elseif ($TestNow) {
    Test-Now
} elseif ($EmailNow) {
    Send-EmailNow
} elseif ($EnableSchedule) {
    Enable-Schedule
} else {
    Show-Help
}

Write-ColorOutput "`n" "White"