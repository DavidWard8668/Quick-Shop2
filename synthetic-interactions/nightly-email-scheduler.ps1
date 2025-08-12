# NIGHTLY EMAIL SCHEDULER FOR CARTPILOT REPORTS
# Sends comprehensive reports to davidward8668@gmail.com

param(
    [string]$EmailTo = "davidward8668@gmail.com",
    [string]$Time = "23:00",  # 11:00 PM daily
    [switch]$SendNow = $false,
    [switch]$UseGmail = $false,
    [switch]$UseOutlook = $false
)

$ErrorActionPreference = "Continue"

Write-Host "📧 NIGHTLY EMAIL REPORT SCHEDULER" -ForegroundColor Magenta
Write-Host "==================================" -ForegroundColor Magenta
Write-Host "Recipient: $EmailTo" -ForegroundColor White
Write-Host "Schedule: Daily at $Time" -ForegroundColor White

function Generate-EmailReport {
    Write-Host "`n📊 Generating comprehensive report..." -ForegroundColor Cyan
    
    # Run the Node.js email reporter
    $reportOutput = node "synthetic-interactions\email-reporter.js" 2>&1
    
    # Get the generated HTML file path
    $today = Get-Date -Format "yyyy-MM-dd"
    $htmlFile = "synthetic-interactions\reports\email-report-$today.html"
    
    if (Test-Path $htmlFile) {
        Write-Host "✅ Report generated successfully" -ForegroundColor Green
        return $htmlFile
    } else {
        Write-Host "❌ Failed to generate report" -ForegroundColor Red
        return $null
    }
}

function Send-EmailViaOutlook {
    param(
        [string]$To,
        [string]$Subject,
        [string]$HtmlFile
    )
    
    try {
        $outlook = New-Object -ComObject Outlook.Application
        $mail = $outlook.CreateItem(0)
        $mail.To = $To
        $mail.Subject = $Subject
        $mail.BodyFormat = 2  # HTML format
        $mail.HTMLBody = Get-Content $HtmlFile -Raw
        $mail.Send()
        
        Write-Host "✅ Email sent via Outlook" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Outlook send failed: $_" -ForegroundColor Red
        return $false
    }
}

function Send-EmailViaSMTP {
    param(
        [string]$To,
        [string]$Subject,
        [string]$HtmlFile
    )
    
    try {
        # Read configuration from environment or use defaults
        $SmtpServer = $env:SMTP_SERVER
        $SmtpPort = $env:SMTP_PORT
        $SmtpUser = $env:SMTP_USER
        $SmtpPass = $env:SMTP_PASS
        
        if (-not $SmtpServer) {
            # Default to Gmail settings
            $SmtpServer = "smtp.gmail.com"
            $SmtpPort = 587
            Write-Host "ℹ️ Using Gmail SMTP (requires app password)" -ForegroundColor Yellow
        }
        
        # Create email message
        $EmailFrom = "CartPilot Testing <noreply@cartpilot.com>"
        $EmailBody = Get-Content $HtmlFile -Raw
        
        $Message = New-Object System.Net.Mail.MailMessage
        $Message.From = $EmailFrom
        $Message.To.Add($To)
        $Message.Subject = $Subject
        $Message.Body = $EmailBody
        $Message.IsBodyHtml = $true
        
        # Configure SMTP client
        $SmtpClient = New-Object System.Net.Mail.SmtpClient($SmtpServer, $SmtpPort)
        $SmtpClient.EnableSsl = $true
        
        if ($SmtpUser -and $SmtpPass) {
            $SmtpClient.Credentials = New-Object System.Net.NetworkCredential($SmtpUser, $SmtpPass)
        }
        
        # Send email
        $SmtpClient.Send($Message)
        
        Write-Host "✅ Email sent via SMTP" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ SMTP send failed: $_" -ForegroundColor Red
        return $false
    }
}

function Send-Report {
    param([string]$HtmlFile)
    
    $subject = "CartPilot Nightly Report - $(Get-Date -Format 'dd/MM/yyyy')"
    
    # Try different sending methods
    if ($UseOutlook) {
        return Send-EmailViaOutlook -To $EmailTo -Subject $subject -HtmlFile $HtmlFile
    } elseif ($UseGmail -or $env:SMTP_SERVER) {
        return Send-EmailViaSMTP -To $EmailTo -Subject $subject -HtmlFile $HtmlFile
    } else {
        # Fallback: Open in browser and save locally
        Write-Host "⚠️ No email service configured - opening report in browser" -ForegroundColor Yellow
        Start-Process $HtmlFile
        
        # Save to a reports archive
        $archiveDir = "C:\Users\David\Apps\Quick-Shop\email-reports"
        if (-not (Test-Path $archiveDir)) {
            New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
        }
        
        $archiveFile = Join-Path $archiveDir "report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
        Copy-Item $HtmlFile $archiveFile
        
        Write-Host "📁 Report archived to: $archiveFile" -ForegroundColor Cyan
        return $true
    }
}

function Create-ScheduledEmailTask {
    Write-Host "`n⏰ Setting up scheduled email task..." -ForegroundColor Cyan
    
    $TaskName = "CartPilot-Nightly-Email"
    $ScriptPath = $PSCommandPath
    
    # Remove existing task if it exists
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    
    # Create action
    $Action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -EmailTo `"$EmailTo`""
    
    # Create trigger for daily at specified time
    $Trigger = New-ScheduledTaskTrigger -Daily -At $Time
    
    # Create settings
    $Settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -MultipleInstances IgnoreNew
    
    # Register task
    try {
        Register-ScheduledTask `
            -TaskName $TaskName `
            -Action $Action `
            -Trigger $Trigger `
            -Settings $Settings `
            -Description "Sends nightly CartPilot testing reports to $EmailTo" `
            -Force
        
        Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
        Write-Host "   Next run: $Time daily" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Failed to create scheduled task: $_" -ForegroundColor Red
    }
}

# Main execution
if ($SendNow) {
    Write-Host "`n🚀 Sending report immediately..." -ForegroundColor Cyan
    
    $htmlFile = Generate-EmailReport
    if ($htmlFile) {
        $sent = Send-Report -HtmlFile $htmlFile
        if ($sent) {
            Write-Host "✅ Report sent successfully to $EmailTo" -ForegroundColor Green
        }
    }
} else {
    # Set up scheduled task
    Create-ScheduledEmailTask
    
    Write-Host "`n📋 Email Configuration:" -ForegroundColor Cyan
    Write-Host "  Recipient: $EmailTo" -ForegroundColor White
    Write-Host "  Schedule: Daily at $Time" -ForegroundColor White
    Write-Host "  Reports saved to: synthetic-interactions\reports\" -ForegroundColor White
    
    Write-Host "`n💡 To send a test email now, run:" -ForegroundColor Yellow
    Write-Host "  .\nightly-email-scheduler.ps1 -SendNow" -ForegroundColor Gray
    
    Write-Host "`n📧 To configure Gmail (recommended):" -ForegroundColor Yellow
    Write-Host "  1. Enable 2-factor authentication in Gmail" -ForegroundColor Gray
    Write-Host "  2. Generate app password: https://myaccount.google.com/apppasswords" -ForegroundColor Gray
    Write-Host "  3. Set environment variables:" -ForegroundColor Gray
    Write-Host '     $env:SMTP_USER = "your-email@gmail.com"' -ForegroundColor Gray
    Write-Host '     $env:SMTP_PASS = "your-app-password"' -ForegroundColor Gray
    Write-Host "  4. Run: .\nightly-email-scheduler.ps1 -SendNow -UseGmail" -ForegroundColor Gray
}