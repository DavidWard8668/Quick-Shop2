# SETUP WINDOWS SCHEDULED TASK FOR SYNTHETIC USER TESTING
# Creates automated testing that runs every 30 minutes

param(
    [string]$TaskName = "CartPilot-Synthetic-Testing",
    [int]$IntervalMinutes = 30,
    [string]$StartTime = "06:00",
    [switch]$Remove = $false
)

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges to create scheduled tasks." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

$ScriptPath = "C:\Users\David\Apps\Quick-Shop\synthetic-interactions\scheduled-runner.ps1"

if ($Remove) {
    # Remove existing task
    Write-Host "Removing scheduled task: $TaskName" -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "✅ Task removed successfully" -ForegroundColor Green
    exit 0
}

Write-Host "🚀 Setting up Scheduled Synthetic User Testing" -ForegroundColor Cyan
Write-Host "Task Name: $TaskName" -ForegroundColor White
Write-Host "Interval: Every $IntervalMinutes minutes" -ForegroundColor White
Write-Host "Start Time: $StartTime" -ForegroundColor White

# Remove existing task if it exists
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

# Create the action
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -Mode scheduled -IntervalMinutes $IntervalMinutes -Target both -AutoRepair"

# Create triggers
$Triggers = @()

# Daily trigger that repeats every N minutes
$DailyTrigger = New-ScheduledTaskTrigger -Daily -At $StartTime
$DailyTrigger.Repetition.Interval = "PT${IntervalMinutes}M"
$DailyTrigger.Repetition.Duration = "P1D"  # Run for 1 day
$Triggers += $DailyTrigger

# At startup trigger
$StartupTrigger = New-ScheduledTaskTrigger -AtStartup
$Triggers += $StartupTrigger

# Create principal (run whether user is logged in or not)
$Principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType ServiceAccount -RunLevel Highest

# Create settings
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -RestartCount 3 `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2)

# Register the task
try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Triggers `
        -Principal $Principal `
        -Settings $Settings `
        -Description "Automated synthetic user testing for CartPilot and Second Chance applications. Tests all UI elements and performs automatic repairs." `
        -Force
    
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    
    # Get task info
    $task = Get-ScheduledTask -TaskName $TaskName
    Write-Host "`nTask Details:" -ForegroundColor Cyan
    Write-Host "  State: $($task.State)" -ForegroundColor White
    Write-Host "  Next Run: $((Get-ScheduledTaskInfo -TaskName $TaskName).NextRunTime)" -ForegroundColor White
    
    # Option to run immediately
    Write-Host "`nDo you want to run the task immediately? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 'Y' -or $response -eq 'y') {
        Start-ScheduledTask -TaskName $TaskName
        Write-Host "✅ Task started!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Failed to create scheduled task: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Management Commands:" -ForegroundColor Cyan
Write-Host "  View status:  Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "  Run manually: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "  Stop task:    Stop-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "  Remove task:  .\setup-scheduled-task.ps1 -Remove" -ForegroundColor Gray
Write-Host "  View logs:    Get-ScheduledTaskInfo -TaskName '$TaskName'" -ForegroundColor Gray