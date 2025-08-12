/**
 * BACKUP EMAIL SYSTEM
 * Alternative delivery methods if primary Gmail fails
 */

import { createTransport } from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

class BackupEmailSystem {
  constructor() {
    this.recipientEmail = 'exiledev@gmail.com';
    this.backupRecipients = ['davidward8668@gmail.com']; // fallback
    this.localBackupPath = 'C:\\Users\\David\\Apps\\email-backups';
  }

  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.localBackupPath, { recursive: true });
    } catch (error) {
      console.log('Could not create backup directory:', error.message);
    }
  }

  async saveEmailLocally(subject, htmlContent) {
    await this.ensureBackupDirectory();
    const filename = `email-backup-${Date.now()}.html`;
    const filepath = path.join(this.localBackupPath, filename);
    
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>${subject}</title>
    <style>body { font-family: Arial, sans-serif; margin: 20px; }</style>
</head>
<body>
    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3>📧 EMAIL BACKUP - Not Delivered to ${this.recipientEmail}</h3>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Reason:</strong> Primary delivery failed, saved locally for manual review</p>
    </div>
    ${htmlContent}
</body>
</html>`;
    
    await fs.writeFile(filepath, fullHtml, 'utf-8');
    console.log(`📁 Email saved locally: ${filepath}`);
    return filepath;
  }

  async tryAlternativeDelivery(subject, htmlContent) {
    console.log('🔄 Attempting alternative email delivery methods...');
    
    // Method 1: Try different SMTP settings
    const altConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'davidward8668@gmail.com',
        pass: 'sufp pltb ryyq uxru'
      },
      tls: {
        ciphers: 'SSLv3'
      }
    };

    try {
      const transporter = createTransporter(altConfig);
      const result = await transporter.sendMail({
        from: '"CartPilot System" <davidward8668@gmail.com>',
        to: this.recipientEmail,
        subject: subject,
        html: htmlContent,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      });
      console.log('✅ Alternative delivery successful:', result.messageId);
      return true;
    } catch (error) {
      console.log('❌ Alternative delivery failed:', error.message);
    }

    // Method 2: Try backup recipients
    try {
      const transporter = createTransport({
        service: 'gmail',
        auth: {
          user: 'davidward8668@gmail.com',
          pass: 'sufp pltb ryyq uxru'
        }
      });

      for (const backup of this.backupRecipients) {
        try {
          await transporter.sendMail({
            from: 'CartPilot Alert <davidward8668@gmail.com>',
            to: backup,
            subject: `[BACKUP] Failed to deliver to ${this.recipientEmail} - ${subject}`,
            html: `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h3>⚠️ Email Delivery Issue</h3>
              <p><strong>Original Recipient:</strong> ${this.recipientEmail}</p>
              <p><strong>Issue:</strong> Email delivery failed despite successful SMTP response</p>
              <p><strong>Action Needed:</strong> Please verify ${this.recipientEmail} is correct and check spam folders</p>
            </div>
            <hr>
            <h4>Original Email Content:</h4>
            ${htmlContent}
            `
          });
          console.log(`📧 Backup notification sent to: ${backup}`);
        } catch (backupError) {
          console.log(`❌ Failed to send backup to ${backup}: ${backupError.message}`);
        }
      }
    } catch (error) {
      console.log('❌ Backup notification failed:', error.message);
    }

    return false;
  }

  async deliverEmailWithBackup(subject, htmlContent) {
    console.log(`📧 Attempting delivery: ${subject}`);
    
    // Save local backup first
    await this.saveEmailLocally(subject, htmlContent);
    
    // Try primary delivery
    try {
      const transporter = createTransport({
        service: 'gmail',
        auth: {
          user: 'davidward8668@gmail.com',
          pass: 'sufp pltb ryyq uxru'
        }
      });
      
      const result = await transporter.sendMail({
        from: 'CartPilot Monitor <davidward8668@gmail.com>',
        to: this.recipientEmail,
        subject: subject,
        html: htmlContent
      });
      
      console.log('✅ Primary delivery succeeded:', result.messageId);
      
      // Send confirmation to backup that email was sent
      await transporter.sendMail({
        from: 'CartPilot System <davidward8668@gmail.com>',
        to: 'davidward8668@gmail.com',
        subject: `✅ Email Delivered to ${this.recipientEmail}`,
        html: `
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px;">
          <h3>✅ Successful Email Delivery</h3>
          <p><strong>Recipient:</strong> ${this.recipientEmail}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message ID:</strong> ${result.messageId}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        `
      });
      
      return true;
    } catch (error) {
      console.log('❌ Primary delivery failed:', error.message);
      return await this.tryAlternativeDelivery(subject, htmlContent);
    }
  }
}

// Test the backup system
async function testBackupSystem() {
  const backupSystem = new BackupEmailSystem();
  
  await backupSystem.deliverEmailWithBackup(
    '🔧 BACKUP EMAIL SYSTEM TEST',
    `
    <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
        <h1>🔧 Backup Email System Test</h1>
      </div>
      
      <div style="padding: 20px; background: #f8f9fa;">
        <h2>✅ Backup System Features</h2>
        <ul>
          <li>🏠 Local file backup of all emails</li>
          <li>🔄 Alternative SMTP configurations</li>
          <li>📧 Backup recipient notifications</li>
          <li>✅ Delivery confirmation system</li>
        </ul>
        
        <h3>📍 Current Status</h3>
        <p><strong>Primary Target:</strong> exiledev@gmail.com</p>
        <p><strong>Backup Location:</strong> C:\\Users\\David\\Apps\\email-backups</p>
        <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <strong>📋 Troubleshooting Checklist for exiledev@gmail.com:</strong>
          <ol>
            <li>Check spam/junk folder for emails from davidward8668@gmail.com</li>
            <li>Check Gmail tabs: Promotions, Updates, Social</li>
            <li>Verify no email filters are blocking the sender</li>
            <li>Check "All Mail" folder in Gmail</li>
            <li>Try searching for "CartPilot" in Gmail search</li>
          </ol>
        </div>
      </div>
    </div>
    `
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testBackupSystem().catch(console.error);
}

export default BackupEmailSystem;