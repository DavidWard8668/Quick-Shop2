# 📧 NIGHTLY EMAIL REPORTS SETUP GUIDE

Your nightly email reporting system is ready! Here's how to configure and use it.

## 🚀 **QUICK START**

### Option 1: Immediate Test (Opens in Browser)
```powershell
cd synthetic-interactions
npm run email:test
```

### Option 2: Schedule Nightly Emails
```powershell
cd synthetic-interactions
npm run email:schedule
```

---

## 📨 **EMAIL CONFIGURATION**

### **For Gmail (Recommended)**

1. **Enable 2-Factor Authentication**
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → Turn On

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Set Environment Variables**
   ```powershell
   $env:SMTP_USER = "your-email@gmail.com"
   $env:SMTP_PASS = "your-16-char-app-password"
   ```

4. **Test Email**
   ```powershell
   .\nightly-email-scheduler.ps1 -SendNow -UseGmail
   ```

### **For Outlook (Alternative)**
```powershell
.\nightly-email-scheduler.ps1 -SendNow -UseOutlook
```

---

## ⏰ **SCHEDULING OPTIONS**

### **Daily at 11 PM (Default)**
```powershell
.\nightly-email-scheduler.ps1
```

### **Custom Time**
```powershell
.\nightly-email-scheduler.ps1 -Time "22:30"  # 10:30 PM
```

### **Different Email**
```powershell
.\nightly-email-scheduler.ps1 -EmailTo "another@email.com"
```

---

## 📊 **WHAT'S IN THE REPORT**

### **📌 Today's Highlights**
- Test success rates and achievements
- Automatic repairs applied
- System performance highlights
- User activity summary

### **📊 Key Metrics**
- System uptime and stability
- Active users and page views
- Average response times
- Error rates

### **🤖 Synthetic Testing Summary**
- Total tests run today
- Success/failure breakdown
- Elements tested (navigation, forms, etc.)
- Progress charts

### **🔧 Automatic Repairs**
- List of all repairs applied
- Repair types (missing elements, broken handlers)
- Timestamps and details

### **💚 System Health**
- CartPilot and Second Chance status
- Server resources (CPU, memory, disk)
- Performance metrics

### **💡 Recommendations**
- Priority-based action items
- Root cause analysis suggestions
- Maintenance recommendations

---

## 🎨 **SAMPLE EMAIL PREVIEW**

The email includes:
- **Beautiful HTML formatting** with charts and graphs
- **Color-coded status indicators** (green/yellow/red)
- **Interactive progress bars** showing success rates
- **Detailed metrics tables** with key performance indicators
- **Action items** with priority levels
- **Quick links** to dashboard and application

---

## 🔧 **MANAGEMENT COMMANDS**

### **Send Test Email**
```powershell
npm run email:test
```

### **Generate Report Only**
```powershell
npm run email:send
```

### **View Scheduled Task**
```powershell
Get-ScheduledTask -TaskName "CartPilot-Nightly-Email"
```

### **Remove Scheduled Task**
```powershell
Unregister-ScheduledTask -TaskName "CartPilot-Nightly-Email" -Confirm:$false
```

---

## 📁 **FILE LOCATIONS**

- **Email Reports**: `synthetic-interactions\reports\email-report-*.html`
- **Email Archive**: `C:\Users\David\Apps\Quick-Shop\email-reports\`
- **Configuration**: Environment variables (`$env:SMTP_USER`, `$env:SMTP_PASS`)

---

## 🚨 **TROUBLESHOOTING**

### **Gmail Authentication Failed**
- Ensure 2-factor authentication is enabled
- Use app password, not regular password
- Check environment variables are set correctly

### **Outlook Not Working**
- Ensure Outlook is installed and configured
- Run PowerShell as Administrator
- Check Outlook security settings

### **No Email Received**
- Check spam/junk folder
- Verify email address is correct
- Test with `-SendNow` flag first

### **Report Generation Failed**
- Ensure applications are running (CartPilot/Second Chance)
- Check reports directory exists
- Verify Node.js is installed

---

## 🎯 **SAMPLE USAGE**

### **Complete Setup Example**
```powershell
# 1. Set up Gmail credentials
$env:SMTP_USER = "davidward8668@gmail.com"
$env:SMTP_PASS = "your-gmail-app-password"

# 2. Test email immediately
cd synthetic-interactions
.\nightly-email-scheduler.ps1 -SendNow -UseGmail

# 3. Schedule nightly emails at 11 PM
.\nightly-email-scheduler.ps1 -UseGmail

# 4. Verify scheduled task
Get-ScheduledTask -TaskName "CartPilot-Nightly-Email"
```

---

## ✅ **VERIFICATION**

After setup, you should see:
1. ✅ Scheduled task created in Windows Task Scheduler
2. ✅ Test email sent to davidward8668@gmail.com
3. ✅ HTML reports generated in reports folder
4. ✅ Dashboard accessible at localhost

---

## 📞 **QUICK HELP**

**Send immediate test report:**
```powershell
cd C:\Users\David\Apps\Quick-Shop\synthetic-interactions
.\nightly-email-scheduler.ps1 -SendNow
```

**The system will:**
1. 🤖 Collect all test data from today
2. 🔧 Analyze repair history
3. 📊 Generate performance metrics
4. 🎨 Create beautiful HTML email
5. 📧 Send to davidward8668@gmail.com
6. 💾 Archive copy locally

**Your nightly reports will arrive at 11:00 PM daily with complete insights into your application's health and performance!** 🚀