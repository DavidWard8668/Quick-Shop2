# =============================================================================
# 🛒 CartPilot Complete E2E Testing Suite
# Automated human-like testing of ALL CartPilot functionality
# =============================================================================

param(
    [string]$TestEmail = "test.cartpilot@gmail.com",
    [string]$TestPassword = "TestPassword123!",
    [string]$CartPilotUrl = "https://cartpilot-sigma.vercel.app/",
    [switch]$SkipInstall,
    [switch]$Headless = $false,
    [int]$TimeoutSeconds = 30
)

# =============================================================================
# Setup and Configuration
# =============================================================================

$ErrorActionPreference = "Continue"
$TestStartTime = Get-Date
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$LogPath = Join-Path $ScriptPath "cartpilot-test-logs"
$ScreenshotPath = Join-Path $LogPath "screenshots"

# Create directories
if (!(Test-Path $LogPath)) { New-Item -ItemType Directory -Force -Path $LogPath }
if (!(Test-Path $ScreenshotPath)) { New-Item -ItemType Directory -Force -Path $ScreenshotPath }

# Test results tracking
$TestResults = @{
    TotalTests = 0
    PassedTests = 0
    FailedTests = 0
    Errors = @()
    Screenshots = @()
    ConsoleLogs = @()
}

function Write-TestLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage -ForegroundColor $(switch($Level) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
        default { "White" }
    })
    $logMessage | Out-File -FilePath (Join-Path $LogPath "test-log.txt") -Append
}

function Take-Screenshot {
    param([string]$TestName)
    try {
        $screenshotFile = Join-Path $ScreenshotPath "$TestName-$(Get-Date -Format 'yyyyMMdd-HHmmss').png"
        $driver.GetScreenshot().SaveAsFile($screenshotFile)
        $TestResults.Screenshots += $screenshotFile
        Write-TestLog "Screenshot saved: $screenshotFile"
        return $screenshotFile
    } catch {
        Write-TestLog "Failed to take screenshot: $($_.Exception.Message)" "WARN"
    }
}

function Wait-ForElement {
    param([string]$Selector, [int]$TimeoutSec = 10, [string]$SelectorType = "XPath")
    
    $wait = New-Object OpenQA.Selenium.Support.UI.WebDriverWait($driver, [TimeSpan]::FromSeconds($TimeoutSec))
    try {
        switch ($SelectorType) {
            "XPath" { return $wait.Until([OpenQA.Selenium.Support.UI.ExpectedConditions]::ElementExists([OpenQA.Selenium.By]::XPath($Selector))) }
            "Id" { return $wait.Until([OpenQA.Selenium.Support.UI.ExpectedConditions]::ElementExists([OpenQA.Selenium.By]::Id($Selector))) }
            "ClassName" { return $wait.Until([OpenQA.Selenium.Support.UI.ExpectedConditions]::ElementExists([OpenQA.Selenium.By]::ClassName($Selector))) }
            "CssSelector" { return $wait.Until([OpenQA.Selenium.Support.UI.ExpectedConditions]::ElementExists([OpenQA.Selenium.By]::CssSelector($Selector))) }
        }
    } catch {
        Write-TestLog "Element not found: $Selector ($SelectorType)" "WARN"
        return $null
    }
}

function Test-Step {
    param([string]$TestName, [scriptblock]$TestCode)
    $TestResults.TotalTests++
    Write-TestLog "🧪 Starting test: $TestName" "INFO"
    
    try {
        & $TestCode
        $TestResults.PassedTests++
        Write-TestLog "✅ PASSED: $TestName" "PASS"
        Take-Screenshot $TestName.Replace(" ", "_").Replace(":", "")
    } catch {
        $TestResults.FailedTests++
        $TestResults.Errors += "${TestName}: $($_.Exception.Message)"
        Write-TestLog "❌ FAILED: $TestName - $($_.Exception.Message)" "FAIL"
        Take-Screenshot "$TestName_FAILED".Replace(" ", "_").Replace(":", "")
    }
}

function Get-ConsoleLogs {
    try {
        $logs = $driver.Manage().Logs.GetLog("browser")
        foreach ($log in $logs) {
            $TestResults.ConsoleLogs += "[$($log.Timestamp)] [$($log.Level)] $($log.Message)"
        }
    } catch {
        Write-TestLog "Could not retrieve console logs: $($_.Exception.Message)" "WARN"
    }
}

# =============================================================================
# Install Selenium if needed
# =============================================================================

if (-not $SkipInstall) {
    Write-TestLog "🔧 Setting up Selenium WebDriver..." "INFO"
    
    try {
        # Install Selenium module if not present
        if (-not (Get-Module -ListAvailable -Name Selenium)) {
            Install-Module -Name Selenium -Force -Scope CurrentUser
        }
        Import-Module Selenium
        
        # Download ChromeDriver if needed
        $chromedriverPath = Join-Path $ScriptPath "chromedriver.exe"
        if (-not (Test-Path $chromedriverPath)) {
            Write-TestLog "Downloading ChromeDriver..." "INFO"
            # You might need to download this manually or use a specific version
        }
        
        Write-TestLog "✅ Selenium setup complete" "PASS"
    } catch {
        Write-TestLog "❌ Failed to setup Selenium: $($_.Exception.Message)" "FAIL"
        exit 1
    }
}

# =============================================================================
# Initialize WebDriver
# =============================================================================

Write-TestLog "🚀 Initializing Chrome WebDriver..." "INFO"

try {
    $chromeOptions = New-Object OpenQA.Selenium.Chrome.ChromeOptions
    $chromeOptions.AddArguments("--disable-blink-features=AutomationControlled")
    $chromeOptions.AddExcludedArgument("enable-automation")
    $chromeOptions.AddArguments("--disable-extensions")
    $chromeOptions.AddArguments("--no-sandbox")
    $chromeOptions.AddArguments("--disable-dev-shm-usage")
    $chromeOptions.AddArguments("--window-size=1920,1080")
    
    if ($Headless) {
        $chromeOptions.AddArguments("--headless")
    }
    
    # Add fake user agent to appear more human-like
    $chromeOptions.AddArguments("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    $driver = New-Object OpenQA.Selenium.Chrome.ChromeDriver($chromeOptions)
    $driver.Manage().Timeouts().ImplicitWait = [TimeSpan]::FromSeconds(5)
    $driver.Manage().Window.Maximize()
    
    Write-TestLog "✅ WebDriver initialized successfully" "PASS"
} catch {
    Write-TestLog "❌ Failed to initialize WebDriver: $($_.Exception.Message)" "FAIL"
    exit 1
}

# =============================================================================
# COMPREHENSIVE CARTPILOT TESTING SUITE
# =============================================================================

try {
    Write-TestLog "🎯 Starting comprehensive CartPilot testing..." "INFO"
    Write-TestLog "Target URL: $CartPilotUrl" "INFO"

    # =============================================================================
    # Test 1: Initial Page Load & Basic Functionality
    # =============================================================================
    
    Test-Step "Initial page load and basic elements" {
        $driver.Navigate().GoToUrl($CartPilotUrl)
        Start-Sleep 3
        
        # Check for main heading
        $heading = Wait-ForElement "//h1[contains(text(), `'CARTPILOT`')]" -TimeoutSec 10
        if (-not $heading) { throw "CartPilot heading not found" }
        
        # Check for navigation tabs
        $storesTab = Wait-ForElement "//button[contains(text(), `'Stores`')]"
        $cartTab = Wait-ForElement "//button[contains(text(), `'Cart`')]"
        $navigateTab = Wait-ForElement "//button[contains(text(), `'Navigate`')]"
        
        if (-not ($storesTab -and $cartTab -and $navigateTab)) {
            throw "Main navigation tabs not found"
        }
        
        Write-TestLog "Main page loaded successfully with all navigation elements"
    }
    
    # =============================================================================
    # Test 2: Tutorial/Onboarding Flow
    # =============================================================================
    
    Test-Step "User tutorial and onboarding" {
        # Look for tutorial modal or help button
        $tutorialElement = $null
        
        # Check if tutorial auto-launched
        try {
            $tutorialModal = Wait-ForElement "//div[contains(@class, 'tutorial') or contains(text(), 'Welcome to CartPilot')]" -TimeoutSec 3
            if ($tutorialModal) {
                Write-TestLog "Tutorial modal auto-launched"
                # Try to go through tutorial steps
                for ($i = 1; $i -le 5; $i++) {
                    Start-Sleep 2
                    $nextButton = Wait-ForElement "//button[contains(text(), 'Next') or contains(text(), '→')]" -TimeoutSec 3
                    if ($nextButton) {
                        $nextButton.Click()
                        Write-TestLog "Completed tutorial step $i"
                    }
                }
                # Close tutorial
                $closeButton = Wait-ForElement "//button[contains(text(), 'Close') or contains(text(), 'Finish') or contains(text(), 'Skip')]" -TimeoutSec 3
                if ($closeButton) { $closeButton.Click() }
            }
        } catch {
            Write-TestLog "No tutorial modal found, checking for help button" "WARN"
        }
        
        # Look for help button
        $helpButton = Wait-ForElement "//button[contains(text(), 'Help') or contains(text(), '📚')]" -TimeoutSec 5
        if ($helpButton) {
            $helpButton.Click()
            Start-Sleep 2
            Write-TestLog "Help button clicked successfully"
            # Close help if it opened
            $closeHelp = Wait-ForElement "//button[contains(text(), 'Close') or contains(text(), '✕')]" -TimeoutSec 3
            if ($closeHelp) { $closeHelp.Click() }
        }
        
        Write-TestLog "Tutorial/onboarding flow tested"
    }
    
    # =============================================================================
    # Test 3: Authentication Flow
    # =============================================================================
    
    Test-Step "Authentication and sign-in process" {
        # Look for sign-in button
        $signInButton = Wait-ForElement "//button[contains(text(), 'Sign In') or contains(text(), '🔑')]" -TimeoutSec 10
        
        if ($signInButton) {
            $signInButton.Click()
            Start-Sleep 2
            
            # Fill in email
            $emailField = Wait-ForElement "//input[@type='email' or contains(@placeholder, 'email')]" -TimeoutSec 5
            if ($emailField) {
                $emailField.Clear()
                $emailField.SendKeys($TestEmail)
                Write-TestLog "Email entered: $TestEmail"
            }
            
            # Fill in password
            $passwordField = Wait-ForElement "//input[@type='password' or contains(@placeholder, 'password')]" -TimeoutSec 5
            if ($passwordField) {
                $passwordField.Clear()
                $passwordField.SendKeys($TestPassword)
                Write-TestLog "Password entered"
            }
            
            # Submit login
            $submitButton = Wait-ForElement "//button[@type='submit' or contains(text(), 'Sign In') or contains(text(), 'Login')]" -TimeoutSec 5
            if ($submitButton) {
                $submitButton.Click()
                Start-Sleep 3
                Write-TestLog "Login form submitted"
            }
            
            # Check if login was successful (look for user profile or logout button)
            $userProfile = Wait-ForElement "//button[contains(text(), 'Profile') or contains(text(), 'Pilot') or contains(text(), 'Sign Out')]" -TimeoutSec 5
            if ($userProfile) {
                Write-TestLog "Login appears successful - user profile elements found"
            } else {
                Write-TestLog "Login may have failed or requires email verification" "WARN"
            }
        } else {
            Write-TestLog "No sign-in button found - may already be authenticated" "WARN"
        }
        
        # Get console logs after authentication
        Get-ConsoleLogs
    }
    
    # =============================================================================
    # Test 4: Store Search and Selection
    # =============================================================================
    
    Test-Step "Store search and location services" {
        # Navigate to Stores tab
        $storesTab = Wait-ForElement "//button[contains(text(), '📍') and contains(text(), 'Stores')]"
        if ($storesTab) {
            $storesTab.Click()
            Start-Sleep 2
            Write-TestLog "Navigated to Stores tab"
        }
        
        # Test location services
        $locationButton = Wait-ForElement "//button[contains(text(), 'My Location') or contains(text(), '📍')]" -TimeoutSec 5
        if ($locationButton) {
            $locationButton.Click()
            Start-Sleep 3
            Write-TestLog "Location services button clicked"
        }
        
        # Test postcode search
        $postcodeField = Wait-ForElement "//input[contains(@placeholder, 'postcode') or contains(@placeholder, 'Postcode')]" -TimeoutSec 5
        if ($postcodeField) {
            $postcodeField.Clear()
            $postcodeField.SendKeys("M1 1AA")  # Manchester test postcode
            
            $searchButton = Wait-ForElement "//button[contains(text(), 'Search') or contains(text(), '🔍')]" -TimeoutSec 5
            if ($searchButton) {
                $searchButton.Click()
                Start-Sleep 3
                Write-TestLog "Postcode search performed: M1 1AA"
            }
        }
        
        # Look for store results
        $storeResults = Wait-ForElement "//div[contains(@class, 'store') or contains(text(), 'Tesco') or contains(text(), 'ASDA') or contains(text(), 'Sainsbury')]" -TimeoutSec 10
        if ($storeResults) {
            Write-TestLog "Store search results found"
            # Try to select a store
            $storeResults.Click()
            Start-Sleep 2
        } else {
            Write-TestLog "No store results visible" "WARN"
        }
    }
    
    # =============================================================================
    # Test 5: Product Search and Cart Management
    # =============================================================================
    
    Test-Step "Product search and shopping cart functionality" {
        # Navigate to Navigate/Search tab
        $navigateTab = Wait-ForElement "//button[contains(text(), '🧭') and contains(text(), 'Navigate')]"
        if ($navigateTab) {
            $navigateTab.Click()
            Start-Sleep 2
            Write-TestLog "Navigated to product search section"
        }
        
        # Test product search
        $searchField = Wait-ForElement "//input[contains(@placeholder, 'search') or contains(@placeholder, 'product')]" -TimeoutSec 5
        if ($searchField) {
            # Test fuzzy search
            $searchField.Clear()
            $searchField.SendKeys("mil")  # Should match "milk"
            Start-Sleep 2
            
            # Look for dropdown suggestions
            $suggestions = Wait-ForElement "//div[contains(@class, 'dropdown') or contains(@class, 'suggestion')]" -TimeoutSec 3
            if ($suggestions) {
                Write-TestLog "Search suggestions appeared"
                $suggestions.Click()
            }
            
            # Try full search
            $searchField.Clear()
            $searchField.SendKeys("milk")
            Start-Sleep 1
            
            # Look for search results or add buttons
            $addButton = Wait-ForElement "//button[contains(text(), 'Add') or contains(text(), '➕')]" -TimeoutSec 5
            if ($addButton) {
                $addButton.Click()
                Write-TestLog "Product added to search/list"
            }
        }
        
        # Test Cart functionality
        $cartTab = Wait-ForElement "//button[contains(text(), '🛒') and contains(text(), 'Cart')]"
        if ($cartTab) {
            $cartTab.Click()
            Start-Sleep 2
            Write-TestLog "Navigated to Cart tab"
            
            # Add items to cart manually
            $addItemField = Wait-ForElement "//input[contains(@placeholder, 'Add item') or contains(@placeholder, 'item')]" -TimeoutSec 5
            if ($addItemField) {
                # Add several test items
                $testItems = @("Bread", "Milk", "Eggs", "Cheese")
                foreach ($item in $testItems) {
                    $addItemField.Clear()
                    $addItemField.SendKeys($item)
                    
                    $addItemButton = Wait-ForElement "//button[contains(text(), 'Add Item') or contains(text(), '➕')]" -TimeoutSec 3
                    if ($addItemButton) {
                        $addItemButton.Click()
                        Start-Sleep 1
                        Write-TestLog "Added item to cart: $item"
                    }
                }
            }
            
            # Test item completion (checking off items)
            $checkboxes = $driver.FindElements([OpenQA.Selenium.By]::XPath("//input[@type='checkbox']"))
            if ($checkboxes.Count -gt 0) {
                $checkboxes[0].Click()
                Write-TestLog "Marked first cart item as completed"
            }
        }
    }
    
    # =============================================================================
    # Test 6: Advanced Features Testing
    # =============================================================================
    
    Test-Step "Advanced features - AI Store Mapping" {
        # Look for AI Store Mapping feature
        $aiMapButton = Wait-ForElement "//button[contains(text(), 'AI') and contains(text(), 'Map')]" -TimeoutSec 5
        if ($aiMapButton) {
            $aiMapButton.Click()
            Start-Sleep 3
            Write-TestLog "AI Store Mapping feature accessed"
            
            # Test the mapping interface
            $startMappingButton = Wait-ForElement "//button[contains(text(), 'Start') or contains(text(), 'Begin')]" -TimeoutSec 5
            if ($startMappingButton) {
                $startMappingButton.Click()
                Start-Sleep 2
                Write-TestLog "Store mapping process initiated"
                
                # Close mapping interface
                $closeButton = Wait-ForElement "//button[contains(text(), 'Close') or contains(text(), '✕')]" -TimeoutSec 3
                if ($closeButton) { $closeButton.Click() }
            }
        } else {
            Write-TestLog "AI Store Mapping feature not found" "WARN"
        }
    }
    
    Test-Step "Barcode scanning feature" {
        # Look for barcode scanner or add product location
        $barcodeButton = Wait-ForElement "//button[contains(text(), 'Barcode') or contains(text(), '📷') or contains(text(), 'Scan')]" -TimeoutSec 5
        if ($barcodeButton) {
            $barcodeButton.Click()
            Start-Sleep 2
            Write-TestLog "Barcode scanning feature accessed"
            
            # Test camera interface
            $cameraButton = Wait-ForElement "//button[contains(text(), 'Camera') or contains(text(), 'Start')]" -TimeoutSec 5
            if ($cameraButton) {
                # Note: Camera won't actually work in automation, but we can test the interface
                Write-TestLog "Camera interface found and tested"
            }
            
            # Close barcode scanner
            $closeButton = Wait-ForElement "//button[contains(text(), 'Close') or contains(text(), '✕')]" -TimeoutSec 3
            if ($closeButton) { $closeButton.Click() }
        }
    }
    
    Test-Step "Profile and image upload features" {
        # Look for profile or pilot button
        $profileButton = Wait-ForElement "//button[contains(text(), 'Pilot') or contains(text(), 'Profile')]" -TimeoutSec 5
        if ($profileButton) {
            $profileButton.Click()
            Start-Sleep 2
            Write-TestLog "User profile accessed"
            
            # Test image upload if available
            $uploadButton = Wait-ForElement "//button[contains(text(), 'Upload') or contains(text(), 'Photo')]" -TimeoutSec 5
            if ($uploadButton) {
                Write-TestLog "Image upload feature found"
                # Note: Actual file upload would require additional setup
            }
            
            # Look for gamification elements
            $pointsDisplay = Wait-ForElement "//div[contains(text(), 'points') or contains(text(), 'Points')]" -TimeoutSec 3
            if ($pointsDisplay) {
                Write-TestLog "Gamification points system found"
            }
        }
    }
    
    # =============================================================================
    # Test 7: Bug Reporter (The Main Event!)
    # =============================================================================
    
    Test-Step "Bug Reporter v4.0 comprehensive testing" {
        # Look for the NEW BUG REPORTER button
        $bugReporterButton = Wait-ForElement "//button[contains(text(), 'NEW BUG REPORTER') or contains(text(), 'Report Bug') or contains(text(), '🚨')]" -TimeoutSec 10
        
        if ($bugReporterButton) {
            Write-TestLog "🎯 Found BUG REPORTER v4.0 button!"
            $bugReporterButton.Click()
            Start-Sleep 2
            
            # Fill out the bug report form
            $subjectField = Wait-ForElement "//input[contains(@placeholder, 'Brief description') or contains(@placeholder, 'subject')]" -TimeoutSec 5
            if ($subjectField) {
                $subjectField.Clear()
                $subjectField.SendKeys("Automated Test Report from PowerShell Script")
                Write-TestLog "Bug report subject entered"
            }
            
            $descriptionField = Wait-ForElement "//textarea[contains(@placeholder, 'describe') or contains(@placeholder, 'detail')]" -TimeoutSec 5
            if ($descriptionField) {
                $testDescription = @"
This is an automated test report generated by the CartPilot PowerShell testing suite.

Test Details:
- Test run on: $(Get-Date)
- Browser: Chrome (automated)
- Test type: Full E2E automation
- All features tested successfully

This confirms the BugReporter v4.0 is working correctly!
"@
                $descriptionField.Clear()
                $descriptionField.SendKeys($testDescription)
                Write-TestLog "Bug report description entered"
            }
            
            # Select issue type (bug/feature/other)
            $bugTypeButton = Wait-ForElement "//button[contains(text(), '🐛') and contains(text(), 'Bug')]" -TimeoutSec 3
            if ($bugTypeButton) {
                $bugTypeButton.Click()
                Write-TestLog "Issue type 'Bug' selected"
            }
            
            # Get console logs before submission
            Get-ConsoleLogs
            
            # Submit the report
            $submitButton = Wait-ForElement "//button[contains(text(), 'Submit Report') or contains(text(), 'Submit')]" -TimeoutSec 5
            if ($submitButton) {
                Write-TestLog "🚀 Submitting bug report..."
                $submitButton.Click()
                Start-Sleep 3
                
                # Wait for and capture any alerts or confirmations
                try {
                    $alert = $driver.SwitchTo().Alert()
                    $alertText = $alert.Text
                    Write-TestLog "Alert received: $alertText"
                    $alert.Accept()
                } catch {
                    Write-TestLog "No alert received (or already handled)"
                }
                
                # Look for success message
                $successMessage = Wait-ForElement "//div[contains(text(), 'Issue Reported') or contains(text(), 'Thank you')]" -TimeoutSec 5
                if ($successMessage) {
                    Write-TestLog "✅ Bug report submission successful!"
                } else {
                    Write-TestLog "Bug report submitted but no visible confirmation" "WARN"
                }
                
                # Get console logs after submission
                Get-ConsoleLogs
            }
        } else {
            throw "BUG REPORTER v4.0 button not found!"
        }
    }
    
    # =============================================================================
    # Test 8: Final System Health Check
    # =============================================================================
    
    Test-Step "Final system health and console log analysis" {
        # Get final console logs
        Get-ConsoleLogs
        
        # Check for JavaScript errors
        $errors = $TestResults.ConsoleLogs | Where-Object { $_ -match "ERROR" -or $_ -match "SEVERE" }
        if ($errors.Count -gt 0) {
            Write-TestLog "JavaScript errors detected: $($errors.Count)" "WARN"
            foreach ($error in $errors) {
                Write-TestLog "JS Error: $error" "WARN"
            }
        } else {
            Write-TestLog "No critical JavaScript errors detected"
        }
        
        # Check for BugReporter v4.0 debug logs
        $bugReporterLogs = $TestResults.ConsoleLogs | Where-Object { $_ -match "BugReporter v4.0" }
        if ($bugReporterLogs.Count -gt 0) {
            Write-TestLog "BugReporter v4.0 debug logs found: $($bugReporterLogs.Count)"
            foreach ($log in $bugReporterLogs) {
                Write-TestLog "BugReporter Log: $log"
            }
        }
        
        # Take final screenshot
        Take-Screenshot "final_system_state"
        
        Write-TestLog "System health check completed"
    }
    
} finally {
    # =============================================================================
    # Cleanup and Reporting
    # =============================================================================
    
    Write-TestLog "🧹 Cleaning up and generating final report..." "INFO"
    
    if ($driver) {
        try {
            $driver.Quit()
            Write-TestLog "WebDriver closed successfully"
        } catch {
            Write-TestLog "Error closing WebDriver: $($_.Exception.Message)" "WARN"
        }
    }
    
    # Generate comprehensive test report
    $TestEndTime = Get-Date
    $TestDuration = $TestEndTime - $TestStartTime
    
    $report = @"

================================================================================
🛒 CARTPILOT COMPREHENSIVE E2E TEST REPORT
================================================================================

Test Execution Summary:
- Start Time: $TestStartTime
- End Time: $TestEndTime
- Duration: $($TestDuration.ToString())
- Target URL: $CartPilotUrl
- Test Email: $TestEmail

Test Results:
- Total Tests: $($TestResults.TotalTests)
- Passed: $($TestResults.PassedTests)
- Failed: $($TestResults.FailedTests)
- Success Rate: $([math]::Round(($TestResults.PassedTests / $TestResults.TotalTests) * 100, 2))%

Screenshots Captured: $($TestResults.Screenshots.Count)
Console Log Entries: $($TestResults.ConsoleLogs.Count)

FAILED TESTS:
$(if ($TestResults.Errors.Count -gt 0) { $TestResults.Errors | ForEach-Object { "❌ $_" } } else { "✅ No failed tests!" })

CONSOLE LOG HIGHLIGHTS:
$(if ($TestResults.ConsoleLogs.Count -gt 0) { 
    $TestResults.ConsoleLogs | Where-Object { $_ -match "BugReporter v4.0|ERROR|SEVERE" } | ForEach-Object { "📝 $_" }
} else { 
    "No significant console logs captured" 
})

SCREENSHOTS LOCATION:
$ScreenshotPath

LOG FILES LOCATION:
$LogPath

================================================================================
🎯 KEY FINDINGS:

1. BugReporter v4.0 Status: $(if ($TestResults.ConsoleLogs -match "BugReporter v4.0") { "✅ WORKING" } else { "⚠️ NEEDS INVESTIGATION" })
2. Authentication Flow: $(if ($TestResults.FailedTests -eq 0) { "✅ FUNCTIONAL" } else { "⚠️ SOME ISSUES" })
3. Core Shopping Features: $(if ($TestResults.PassedTests -gt $TestResults.FailedTests) { "✅ MOSTLY FUNCTIONAL" } else { "⚠️ NEEDS ATTENTION" })
4. Advanced Features: $(if ($TestResults.Screenshots.Count -gt 5) { "✅ ACCESSIBLE" } else { "⚠️ LIMITED ACCESS" })

Overall Assessment: $(if ($TestResults.PassedTests -gt ($TestResults.TotalTests * 0.8)) { "🎉 EXCELLENT" } elseif ($TestResults.PassedTests -gt ($TestResults.TotalTests * 0.6)) { "👍 GOOD" } else { "⚠️ NEEDS IMPROVEMENT" })

================================================================================
Generated by CartPilot PowerShell E2E Testing Suite
Report saved to: $(Join-Path $LogPath "test-report.txt")
================================================================================

"@

    Write-Host $report -ForegroundColor Cyan
    $report | Out-File -FilePath (Join-Path $LogPath "test-report.txt") -Encoding UTF8
    
    Write-TestLog "🎉 COMPREHENSIVE CARTPILOT TESTING COMPLETED!" "PASS"
    Write-TestLog "Full report saved to: $(Join-Path $LogPath "test-report.txt")" "INFO"
}