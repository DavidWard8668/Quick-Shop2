# =============================================================================
# 🚀 START CLAUDE AUTO-TRIGGER SYSTEM
# Launches the complete autonomous Claude triggering infrastructure
# =============================================================================

param(
    [switch]$Background = $true,
    [switch]$ShowWindows = $false
)

$ErrorActionPreference = 'Continue'

# Configuration
$SCRIPTS_DIR = "C:\Users\David\Apps\Quick-Shop\synthetic-interactions"
$LOG_FILE = Join-Path $SCRIPTS_DIR "auto-system.log"

function Write-SystemLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage -ForegroundColor $(switch($Level) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        default { "Cyan" }
    })
    $logMessage | Out-File -FilePath $LOG_FILE -Append
}

function Start-ServiceScript {
    param([string]$ScriptName, [string]$Description)
    
    try {
        $scriptPath = Join-Path $SCRIPTS_DIR $ScriptName
        
        if (!(Test-Path $scriptPath)) {
            Write-SystemLog "Script not found: $scriptPath" "ERROR"
            return $false
        }
        
        Write-SystemLog "Starting $Description..." "INFO"
        
        if ($Background -and !$ShowWindows) {
            # Start hidden in background
            $process = Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass", "-File", $scriptPath -WindowStyle Hidden -PassThru
            Write-SystemLog "$Description started in background (PID: $($process.Id))" "SUCCESS"
        } else {
            # Start visible
            $process = Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass", "-File", $scriptPath -PassThru
            Write-SystemLog "$Description started with visible window (PID: $($process.Id))" "SUCCESS"
        }
        
        # Give process a moment to initialize
        Start-Sleep -Seconds 2
        
        # Check if process is still running
        if ($process -and !$process.HasExited) {
            Write-SystemLog "$Description is running successfully" "SUCCESS"
            return $true
        } else {
            Write-SystemLog "$Description failed to start or exited immediately" "ERROR"
            return $false
        }
        
    } catch {
        Write-SystemLog "Failed to start $Description`: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Show-SystemStatus {
    Write-Host ""
    Write-Host "🤖 CLAUDE AUTO-TRIGGER SYSTEM STATUS" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if processes are running
    $monitoringProcess = Get-Process powershell | Where-Object { $_.CommandLine -like "*automated-monitor.ps1*" } -ErrorAction SilentlyContinue
    $launcherProcess = Get-Process powershell | Where-Object { $_.CommandLine -like "*claude-code-launcher.ps1*" } -ErrorAction SilentlyContinue
    
    Write-Host "📊 Monitoring System: " -NoNewline
    if ($monitoringProcess) {
        Write-Host "✅ RUNNING (PID: $($monitoringProcess.Id))" -ForegroundColor Green
    } else {
        Write-Host "❌ NOT RUNNING" -ForegroundColor Red
    }
    
    Write-Host "🚀 Claude Launcher: " -NoNewline
    if ($launcherProcess) {
        Write-Host "✅ RUNNING (PID: $($launcherProcess.Id))" -ForegroundColor Green
    } else {
        Write-Host "❌ NOT RUNNING" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📂 System Files:" -ForegroundColor Yellow
    Write-Host "   - Logs: $LOG_FILE"
    Write-Host "   - Triggers: $SCRIPTS_DIR\CLAUDE_INTERVENTION_NEEDED_*.md"
    Write-Host "   - Processed: $SCRIPTS_DIR\processed-triggers\"
    
    Write-Host ""
    Write-Host "🎯 Auto-Trigger Conditions:" -ForegroundColor Yellow
    Write-Host "   - Same issue fails 3+ times consecutively"
    Write-Host "   - 10+ errors/warnings per 2 hours"
    Write-Host "   - System downtime detected"
    Write-Host "   - Complex issues beyond basic auto-fix"
    
    Write-Host ""
    Write-Host "📧 Notifications sent to: exiledev8668@gmail.com" -ForegroundColor Yellow
    Write-Host ""
}

# Main execution
Write-SystemLog "🚀 Starting Claude Auto-Trigger System..." "INFO"
Write-SystemLog "Background Mode: $Background" "INFO"
Write-SystemLog "Show Windows: $ShowWindows" "INFO"

# Start the monitoring system (already includes Claude trigger checks)
$monitoringStarted = Start-ServiceScript -ScriptName "automated-monitor.ps1" -Description "Automated Monitoring System"

# Start the Claude launcher (watches for trigger files)
$launcherStarted = Start-ServiceScript -ScriptName "claude-code-launcher.ps1" -Description "Claude Code Launcher"

Write-Host ""
if ($monitoringStarted -and $launcherStarted) {
    Write-SystemLog "🎉 Claude Auto-Trigger System fully operational!" "SUCCESS"
    Write-Host "✅ SYSTEM ONLINE - All components running successfully" -ForegroundColor Green
} elseif ($monitoringStarted) {
    Write-SystemLog "⚠️  Monitoring started but launcher failed" "WARNING"
    Write-Host "⚠️  PARTIAL SYSTEM - Monitoring active but launcher needs attention" -ForegroundColor Yellow
} else {
    Write-SystemLog "❌ System startup failed" "ERROR"
    Write-Host "❌ SYSTEM FAILED - Components need manual attention" -ForegroundColor Red
}

# Show current system status
Show-SystemStatus

# Instructions for user
Write-Host "🔧 SYSTEM COMMANDS:" -ForegroundColor Cyan
Write-Host "   To stop all:  Get-Process powershell | Where {`$_.CommandLine -like '*automated-monitor*' -or `$_.CommandLine -like '*claude-code-launcher*'} | Stop-Process"
Write-Host "   To restart:   .\start-claude-auto-system.ps1"
Write-Host "   To check:     Get-Process powershell | Select-Object Id,CommandLine"
Write-Host ""

Write-SystemLog "Claude Auto-Trigger System startup completed" "INFO"

if ($Background) {
    Write-Host "✅ System running in background. Check $LOG_FILE for ongoing activity." -ForegroundColor Green
    Write-Host "💡 The system will now automatically trigger Claude when complex issues are detected." -ForegroundColor Cyan
}