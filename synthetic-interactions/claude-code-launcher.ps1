# =============================================================================
# 🤖 CLAUDE CODE AUTO-LAUNCHER
# Monitors for trigger files and automatically launches Claude Code sessions
# =============================================================================

param(
    [switch]$RunOnce = $false,
    [int]$CheckIntervalSeconds = 60
)

$ErrorActionPreference = 'Continue'

# Configuration
$WATCH_DIR = "C:\Users\David\Apps\Quick-Shop\synthetic-interactions"
$TRIGGER_PATTERN = "CLAUDE_INTERVENTION_NEEDED_*.md"
$PROCESSED_DIR = Join-Path $WATCH_DIR "processed-triggers"
$LOG_FILE = Join-Path $WATCH_DIR "claude-launcher.log"

# Ensure processed directory exists
if (!(Test-Path $PROCESSED_DIR)) {
    New-Item -ItemType Directory -Force -Path $PROCESSED_DIR | Out-Null
}

function Write-LauncherLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage -ForegroundColor $(switch($Level) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        default { "White" }
    })
    $logMessage | Out-File -FilePath $LOG_FILE -Append
}

function Launch-ClaudeCode {
    param([string]$TriggerFile)
    
    Write-LauncherLog "Launching Claude Code for: $TriggerFile" "INFO"
    
    try {
        # Read the trigger file content
        $triggerContent = Get-Content $TriggerFile -Raw
        
        # Extract the context message for Claude
        $contextMatch = $triggerContent -match '🚨 AUTOMATIC CLAUDE TRIGGER[^#]+## Instructions'
        if ($contextMatch) {
            $contextSection = ($triggerContent -split '## Instructions')[0]
            
            # Create a temporary context file for Claude
            $contextFile = Join-Path $WATCH_DIR "claude-context-temp.md"
            $contextSection | Out-File $contextFile -Encoding UTF8
            
            Write-LauncherLog "Context extracted and saved to: $contextFile" "SUCCESS"
        }
        
        # Method 1: Try to launch Claude Code CLI if available
        try {
            Write-LauncherLog "Attempting to launch Claude Code CLI..." "INFO"
            
            # Check if Claude Code CLI is available
            $claudeCodePath = Get-Command claude-code -ErrorAction SilentlyContinue
            if ($claudeCodePath) {
                # Launch Claude Code with the context
                $claudeProcess = Start-Process -FilePath "claude-code" -ArgumentList "--file", $TriggerFile -PassThru -NoNewWindow
                Write-LauncherLog "Claude Code CLI launched successfully (PID: $($claudeProcess.Id))" "SUCCESS"
                return $true
            }
        } catch {
            Write-LauncherLog "Claude Code CLI not available: $($_.Exception.Message)" "WARNING"
        }
        
        # Method 2: Try to open in default editor with specific instructions
        try {
            Write-LauncherLog "Opening trigger file in default editor..." "INFO"
            Start-Process $TriggerFile
            
            # Also create a desktop notification
            Add-Type -AssemblyName System.Windows.Forms
            $notification = New-Object System.Windows.Forms.NotifyIcon
            $notification.Icon = [System.Drawing.SystemIcons]::Information
            $notification.BalloonTipTitle = "🤖 Claude Intervention Needed"
            $notification.BalloonTipText = "System has detected issues requiring Claude's attention. Check the opened file for details."
            $notification.Visible = $true
            $notification.ShowBalloonTip(10000)
            
            Write-LauncherLog "Trigger file opened and notification shown" "SUCCESS"
            return $true
            
        } catch {
            Write-LauncherLog "Failed to open trigger file: $($_.Exception.Message)" "ERROR"
        }
        
        # Method 3: Email notification as fallback
        try {
            Write-LauncherLog "Sending email notification as fallback..." "INFO"
            
            # Create simple email notification
            $emailScript = @"
import { createTransport } from 'nodemailer';
import fs from 'fs/promises';

const transporter = createTransport({
    service: 'gmail',
    auth: {
        user: 'davidward8668@gmail.com',
        pass: 'sufp pltb ryyq uxru'
    }
});

await transporter.sendMail({
    from: 'Claude Auto-Trigger <davidward8668@gmail.com>',
    to: 'exiledev8668@gmail.com',
    subject: '🚨 URGENT: Claude Intervention Required',
    text: 'Claude intervention has been triggered. Check the monitoring system for details.'
});

console.log('Emergency email sent');
"@
            
            $emailScript | Out-File -FilePath "$WATCH_DIR\temp-email.mjs" -Encoding UTF8
            Set-Location $WATCH_DIR
            $emailResult = node temp-email.mjs 2>&1
            Remove-Item "temp-email.mjs" -ErrorAction SilentlyContinue
            
            Write-LauncherLog "Emergency email result: $emailResult" "SUCCESS"
            return $true
            
        } catch {
            Write-LauncherLog "Failed to send emergency email: $($_.Exception.Message)" "ERROR"
        }
        
        return $false
        
    } catch {
        Write-LauncherLog "Failed to launch Claude Code: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Process-TriggerFiles {
    $triggerFiles = Get-ChildItem -Path $WATCH_DIR -Filter $TRIGGER_PATTERN | Sort-Object CreationTime
    
    if ($triggerFiles.Count -eq 0) {
        Write-LauncherLog "No trigger files found" "INFO"
        return 0
    }
    
    Write-LauncherLog "Found $($triggerFiles.Count) trigger file(s) to process" "INFO"
    
    $processedCount = 0
    foreach ($triggerFile in $triggerFiles) {
        Write-LauncherLog "Processing trigger file: $($triggerFile.Name)" "INFO"
        
        # Launch Claude Code
        $success = Launch-ClaudeCode -TriggerFile $triggerFile.FullName
        
        if ($success) {
            # Move processed file
            $processedPath = Join-Path $PROCESSED_DIR $triggerFile.Name
            Move-Item $triggerFile.FullName $processedPath
            Write-LauncherLog "Trigger file processed and archived: $processedPath" "SUCCESS"
            $processedCount++
        } else {
            Write-LauncherLog "Failed to process trigger file: $($triggerFile.Name)" "ERROR"
        }
    }
    
    return $processedCount
}

function Start-TriggerMonitoring {
    Write-LauncherLog "Starting Claude Code trigger monitoring..." "INFO"
    Write-LauncherLog "Watch Directory: $WATCH_DIR" "INFO"
    Write-LauncherLog "Trigger Pattern: $TRIGGER_PATTERN" "INFO"
    Write-LauncherLog "Check Interval: $CheckIntervalSeconds seconds" "INFO"
    
    while ($true) {
        try {
            $processedCount = Process-TriggerFiles
            
            if ($processedCount -gt 0) {
                Write-LauncherLog "Processed $processedCount trigger file(s)" "SUCCESS"
            }
            
            if ($RunOnce) {
                Write-LauncherLog "Run once mode - exiting" "INFO"
                break
            }
            
            Write-LauncherLog "Waiting $CheckIntervalSeconds seconds until next check..." "INFO"
            Start-Sleep -Seconds $CheckIntervalSeconds
            
        } catch {
            Write-LauncherLog "Monitoring error: $($_.Exception.Message)" "ERROR"
            Start-Sleep -Seconds 30  # Brief pause before retry
        }
    }
}

# Main execution
Write-LauncherLog "Claude Code Auto-Launcher starting..." "INFO"

# Process any existing trigger files first
$initialCount = Process-TriggerFiles
if ($initialCount -gt 0) {
    Write-LauncherLog "Processed $initialCount existing trigger file(s)" "SUCCESS"
}

if (!$RunOnce) {
    # Start continuous monitoring
    Start-TriggerMonitoring
} else {
    Write-LauncherLog "Run once mode completed" "INFO"
}

Write-LauncherLog "Claude Code Auto-Launcher finished" "INFO"