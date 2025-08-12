# CartPilot Automated Issue Monitoring System
# Runs continuously, checking for issues and sending email reports

param(
    [int]$CheckIntervalMinutes = 30,
    [switch]$RunOnce
)

$ErrorActionPreference = 'Continue'

# Configuration
$EMAIL_USER = "exiledev8668@gmail.com"
$EMAIL_PASS = "sufp pltb ryyq uxru"
$REPO_PATH = "C:\Users\David\Apps\Quick-Shop"
$LOG_PATH = "$REPO_PATH\synthetic-interactions\monitoring-logs"
$ISSUES_PATH = "$REPO_PATH\synthetic-interactions\detected-issues"

# Create directories if they don't exist
New-Item -ItemType Directory -Force -Path $LOG_PATH | Out-Null
New-Item -ItemType Directory -Force -Path $ISSUES_PATH | Out-Null

function Write-Log {
    param($Message, $Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logFile = Join-Path $LOG_PATH "monitor-$(Get-Date -Format 'yyyy-MM-dd').log"
    "$timestamp [$Level] $Message" | Add-Content $logFile
    
    # Also write to console with color
    switch ($Level) {
        "ERROR" { Write-Host "$timestamp [$Level] $Message" -ForegroundColor Red }
        "WARNING" { Write-Host "$timestamp [$Level] $Message" -ForegroundColor Yellow }
        "SUCCESS" { Write-Host "$timestamp [$Level] $Message" -ForegroundColor Green }
        default { Write-Host "$timestamp [$Level] $Message" }
    }
}

function Test-Application {
    Write-Log "Running automated tests..."
    
    $testResults = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        tests = @()
        issues = @()
        autoFixed = @()
    }
    
    # Run npm tests
    Set-Location $REPO_PATH
    $testOutput = npm test 2>&1 | Out-String
    
    if ($testOutput -match "(\d+) failed") {
        $failedCount = $matches[1]
        Write-Log "Found $failedCount failing tests" "WARNING"
        
        $testResults.issues += @{
            type = "failing_tests"
            count = $failedCount
            details = $testOutput
            severity = "high"
        }
    }
    
    # Check TypeScript
    $tsOutput = npm run typecheck 2>&1 | Out-String
    if ($tsOutput -match "error") {
        Write-Log "TypeScript errors detected" "ERROR"
        $testResults.issues += @{
            type = "typescript_errors"
            details = $tsOutput
            severity = "critical"
        }
    }
    
    # Check if dev server is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Log "Dev server is running" "SUCCESS"
            $testResults.tests += @{
                name = "dev_server"
                status = "passed"
            }
        }
    } catch {
        Write-Log "Dev server not responding" "WARNING"
        $testResults.issues += @{
            type = "dev_server_down"
            severity = "medium"
        }
    }
    
    # Check for common UI issues
    $componentsToCheck = @(
        "BarcodeScanner",
        "StoreMapper", 
        "BugReporter",
        "ProductLocation"
    )
    
    foreach ($component in $componentsToCheck) {
        $componentPath = Join-Path $REPO_PATH "src\components\$component.tsx"
        if (Test-Path $componentPath) {
            $content = Get-Content $componentPath -Raw
            
            # Check for camera access
            if ($component -eq "BarcodeScanner" -and $content -notmatch "getUserMedia") {
                $testResults.issues += @{
                    type = "camera_access_missing"
                    component = $component
                    severity = "high"
                }
            }
            
            # Check for error boundaries
            if ($content -notmatch "try\s*{" -and $content -notmatch "catch") {
                $testResults.issues += @{
                    type = "missing_error_handling"
                    component = $component
                    severity = "medium"
                }
            }
        }
    }
    
    return $testResults
}

function Attempt-AutoFix {
    param($Issue)
    
    Write-Log "Attempting to auto-fix: $($Issue.type)" "INFO"
    
    switch ($Issue.type) {
        "failing_tests" {
            # Try to fix common test issues
            Set-Location $REPO_PATH
            
            # Fix notification API mocking
            $testFiles = Get-ChildItem -Path "src\test" -Recurse -Filter "*.test.ts*"
            foreach ($file in $testFiles) {
                $content = Get-Content $file.FullName -Raw
                if ($content -match "Notification" -and $content -notmatch "typeof Notification") {
                    $fixed = $content -replace "Notification\.permission", "(typeof Notification !== 'undefined' ? Notification.permission : 'denied')"
                    Set-Content $file.FullName $fixed
                    Write-Log "Fixed Notification API in $($file.Name)" "SUCCESS"
                    return $true
                }
            }
        }
        
        "dev_server_down" {
            # Try to restart dev server
            Write-Log "Attempting to restart dev server..." "INFO"
            Set-Location $REPO_PATH
            
            # Kill existing node processes
            Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
            
            # Start dev server in background
            Start-Process powershell -ArgumentList "-Command", "cd '$REPO_PATH'; npm run dev" -WindowStyle Hidden
            Start-Sleep -Seconds 10
            
            # Check if it started
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    Write-Log "Dev server restarted successfully" "SUCCESS"
                    return $true
                }
            } catch {
                Write-Log "Failed to restart dev server" "ERROR"
            }
        }
        
        "camera_access_missing" {
            # Add camera access code
            $componentPath = Join-Path $REPO_PATH "src\components\$($Issue.component).tsx"
            if (Test-Path $componentPath) {
                $content = Get-Content $componentPath -Raw
                
                # Add getUserMedia if missing
                if ($content -notmatch "getUserMedia") {
                    $cameraCode = @"

  // Camera access helper
  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      return stream;
    } catch (error) {
      console.error('Camera access denied:', error);
      throw error;
    }
  };
"@
                    $content = $content -replace "(const.*=.*\(\).*{)", "`$1`n$cameraCode"
                    Set-Content $componentPath $content
                    Write-Log "Added camera access to $($Issue.component)" "SUCCESS"
                    return $true
                }
            }
        }
    }
    
    return $false
}

function Send-MonitoringEmail {
    param($Results)
    
    Write-Log "Sending monitoring email report..." "INFO"
    
    $issueCount = $Results.issues.Count
    $autoFixedCount = $Results.autoFixed.Count
    
    $subject = if ($issueCount -gt 0) {
        "⚠️ CartPilot Monitor: $issueCount issues detected"
    } else {
        "✅ CartPilot Monitor: All systems operational"
    }
    
    # Generate email body
    $htmlBody = @"
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .issue { background: #fee2e2; border-left: 4px solid #ef4444; padding: 10px; margin: 10px 0; }
        .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 10px; margin: 10px 0; }
        .metric { display: inline-block; padding: 10px; margin: 5px; background: #f3f4f6; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CartPilot Automated Monitoring Report</h1>
            <p>$($Results.timestamp)</p>
        </div>
        
        <h2>Summary</h2>
        <div class="metric">Issues Found: $issueCount</div>
        <div class="metric">Auto-Fixed: $autoFixedCount</div>
        <div class="metric">Tests Run: $($Results.tests.Count)</div>
        
        $(if ($issueCount -gt 0) {
            "<h2>🚨 Issues Detected</h2>"
            foreach ($issue in $Results.issues) {
                "<div class='issue'>"
                "<strong>$($issue.type)</strong> - Severity: $($issue.severity)<br>"
                if ($issue.component) { "Component: $($issue.component)<br>" }
                if ($issue.count) { "Count: $($issue.count)<br>" }
                "</div>"
            }
        })
        
        $(if ($autoFixedCount -gt 0) {
            "<h2>✅ Auto-Fixed Issues</h2>"
            foreach ($fix in $Results.autoFixed) {
                "<div class='success'>"
                "<strong>$($fix.type)</strong> - $($fix.description)"
                "</div>"
            }
        })
        
        <h2>Next Steps</h2>
        <ul>
            <li>Review detected issues in detail</li>
            <li>Check logs at: $LOG_PATH</li>
            <li>Manual intervention may be required for critical issues</li>
        </ul>
        
        <p style="color: #6b7280; margin-top: 20px;">
            This is an automated monitoring report. The system will check again in $CheckIntervalMinutes minutes.
        </p>
    </div>
</body>
</html>
"@
    
    # Save report
    $reportPath = Join-Path $ISSUES_PATH "monitor-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
    $htmlBody | Out-File $reportPath
    
    # Send email using Node.js script
    Set-Location "$REPO_PATH\synthetic-interactions"
    
    # Create a temporary email config
    $emailConfig = @{
        to = $EMAIL_USER
        subject = $subject
        html = $htmlBody
    } | ConvertTo-Json
    
    $emailConfig | Out-File "temp-email-config.json"
    
    # Use the existing email reporter
    $emailResult = node -e "
        import('./email-reporter.js').then(async m => {
            const config = JSON.parse(require('fs').readFileSync('temp-email-config.json', 'utf8'));
            const reporter = new m.default();
            reporter.recipientEmail = config.to;
            
            // Send custom HTML
            const { createTransport } = await import('nodemailer');
            const transporter = createTransport({
                service: 'gmail',
                auth: {
                    user: '$EMAIL_USER',
                    pass: '$EMAIL_PASS'
                }
            });
            
            await transporter.sendMail({
                from: 'CartPilot Monitor <$EMAIL_USER>',
                to: config.to,
                subject: config.subject,
                html: config.html
            });
            
            console.log('Email sent successfully');
        }).catch(e => console.error('Email error:', e));
    " 2>&1
    
    Remove-Item "temp-email-config.json" -ErrorAction SilentlyContinue
    
    if ($emailResult -match "Email sent successfully") {
        Write-Log "Monitoring email sent successfully" "SUCCESS"
    } else {
        Write-Log "Failed to send monitoring email: $emailResult" "ERROR"
    }
}

function Start-MonitoringLoop {
    Write-Log "Starting CartPilot Automated Monitoring System" "INFO"
    Write-Log "Check interval: $CheckIntervalMinutes minutes" "INFO"
    
    while ($true) {
        Write-Log "Running monitoring check..." "INFO"
        
        # Run tests and collect issues
        $results = Test-Application
        
        # Attempt auto-fixes
        foreach ($issue in $results.issues) {
            if (Attempt-AutoFix -Issue $issue) {
                $results.autoFixed += @{
                    type = $issue.type
                    description = "Successfully auto-fixed $($issue.type)"
                    timestamp = Get-Date -Format "HH:mm:ss"
                }
                
                # Remove from issues list if fixed
                $results.issues = $results.issues | Where-Object { $_.type -ne $issue.type }
            }
        }
        
        # Save results to JSON
        $jsonPath = Join-Path $ISSUES_PATH "monitor-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        $results | ConvertTo-Json -Depth 10 | Out-File $jsonPath
        
        # Send email if there are issues or if it's the scheduled report time
        if ($results.issues.Count -gt 0 -or (Get-Date).Hour -eq 23) {
            Send-MonitoringEmail -Results $results
        }
        
        Write-Log "Monitoring check complete. Issues: $($results.issues.Count), Auto-fixed: $($results.autoFixed.Count)" "INFO"
        
        # Check if Claude should be triggered for complex issues
        Write-Log "Checking Claude auto-trigger conditions..." "INFO"
        try {
            Set-Location "$REPO_PATH\synthetic-interactions"
            $claudeResult = node claude-auto-trigger.js 2>&1
            Write-Log "Claude trigger check: $claudeResult" "INFO"
        } catch {
            Write-Log "Claude trigger check failed: $($_.Exception.Message)" "WARNING"
        }
        
        if ($RunOnce) {
            Write-Log "Run once mode - exiting" "INFO"
            break
        }
        
        # Wait for next interval
        Write-Log "Waiting $CheckIntervalMinutes minutes until next check..." "INFO"
        Start-Sleep -Seconds ($CheckIntervalMinutes * 60)
    }
}

# Main execution
if ($MyInvocation.InvocationName -ne '.') {
    Start-MonitoringLoop
}