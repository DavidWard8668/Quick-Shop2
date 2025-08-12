/**
 * CLAUDE AUTO-TRIGGER SYSTEM
 * Automatically invokes Claude Code when complex issues are detected
 * Monitors system state and calls Claude for sophisticated problem-solving
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ClaudeAutoTrigger {
  constructor() {
    this.triggerThresholds = {
      maxConsecutiveFailures: 3,      // Same issue failing 3+ times
      maxErrorsPerHour: 10,           // High error rate
      maxUnresolvedIssues: 5,         // Too many pending issues
      criticalSystemDown: 300,        // 5 minutes system unresponsive
      testFailureRate: 70             // >70% tests failing
    };
    
    this.issueHistory = [];
    this.triggerCooldown = 30 * 60 * 1000; // 30 minutes between triggers
    this.lastTrigger = 0;
    this.logPath = path.join(__dirname, 'monitoring-logs');
    this.triggerFile = path.join(__dirname, 'CLAUDE_TRIGGER_REQUEST.json');
  }

  async analyzeSystemState() {
    console.log('🔍 Analyzing system state for Claude trigger conditions...');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      triggerReasons: [],
      severity: 'normal',
      systemHealth: 'healthy',
      issuesSummary: {
        totalIssues: 0,
        criticalIssues: 0,
        consecutiveFailures: 0,
        unresolved: 0
      }
    };

    try {
      // Analyze recent logs
      const logFile = path.join(this.logPath, `monitor-${new Date().toISOString().split('T')[0]}.log`);
      const logContent = await fs.readFile(logFile, 'utf-8');
      const logLines = logContent.split('\n').filter(line => line.trim());

      // Get recent entries (last 2 hours)
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
      const recentLines = logLines.filter(line => {
        const timeMatch = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
        if (timeMatch) {
          const logTime = new Date(timeMatch[1]).getTime();
          return logTime > twoHoursAgo;
        }
        return false;
      });

      // Analyze patterns
      await this.detectConsecutiveFailures(recentLines, analysis);
      await this.detectHighErrorRate(recentLines, analysis);
      await this.detectSystemDowntime(recentLines, analysis);
      await this.detectTestFailureSpiral(recentLines, analysis);
      await this.detectComplexIssues(recentLines, analysis);

      // Determine overall severity
      if (analysis.triggerReasons.length > 0) {
        analysis.severity = analysis.triggerReasons.some(r => r.priority === 'critical') ? 'critical' : 'high';
        analysis.systemHealth = analysis.severity === 'critical' ? 'critical' : 'degraded';
      }

      return analysis;

    } catch (error) {
      console.error('❌ Failed to analyze system state:', error.message);
      return analysis;
    }
  }

  async detectConsecutiveFailures(logLines, analysis) {
    // Look for the same issue repeating multiple times
    const failurePattern = /Fixed Notification API in CartPilot\.test\.tsx/;
    const consecutiveCount = logLines.filter(line => failurePattern.test(line)).length;

    if (consecutiveCount >= this.triggerThresholds.maxConsecutiveFailures) {
      analysis.triggerReasons.push({
        type: 'consecutive_failures',
        priority: 'high',
        message: `Same issue (Notification API) has failed ${consecutiveCount} times`,
        details: 'Auto-fix is repeatedly applying the same fix, indicating a deeper problem',
        suggestedAction: 'Investigate root cause of Notification API test instability'
      });
      analysis.issuesSummary.consecutiveFailures = consecutiveCount;
    }
  }

  async detectHighErrorRate(logLines, analysis) {
    const errorLines = logLines.filter(line => line.includes('[ERROR]'));
    const warningLines = logLines.filter(line => line.includes('[WARNING]'));
    const totalIssues = errorLines.length + warningLines.length;

    analysis.issuesSummary.totalIssues = totalIssues;
    analysis.issuesSummary.criticalIssues = errorLines.length;

    if (totalIssues >= this.triggerThresholds.maxErrorsPerHour) {
      analysis.triggerReasons.push({
        type: 'high_error_rate',
        priority: 'critical',
        message: `${totalIssues} errors/warnings in last 2 hours`,
        details: `${errorLines.length} errors, ${warningLines.length} warnings`,
        suggestedAction: 'Comprehensive system diagnosis and error resolution needed'
      });
    }
  }

  async detectSystemDowntime(logLines, analysis) {
    const serverDownLines = logLines.filter(line => 
      line.includes('server not responding') || 
      line.includes('Failed to restart dev server') ||
      line.includes('connection refused')
    );

    if (serverDownLines.length > 0) {
      analysis.triggerReasons.push({
        type: 'system_downtime',
        priority: 'critical',
        message: 'Development server connectivity issues detected',
        details: `${serverDownLines.length} server downtime events`,
        suggestedAction: 'Investigate server configuration and network connectivity'
      });
    }
  }

  async detectTestFailureSpiral(logLines, analysis) {
    // Look for escalating test failure patterns
    const testWarnings = logLines.filter(line => line.includes('Found 3 failing tests'));
    
    if (testWarnings.length > 5) {
      analysis.triggerReasons.push({
        type: 'test_failure_spiral',
        priority: 'high',
        message: 'Test failures recurring despite auto-fixes',
        details: `${testWarnings.length} instances of "3 failing tests" detected`,
        suggestedAction: 'Deep analysis of test infrastructure and mocking strategy'
      });
    }
  }

  async detectComplexIssues(logLines, analysis) {
    // Identify issues that basic auto-fix can't handle
    const complexPatterns = [
      /timeout/i,
      /permission denied/i,
      /memory/i,
      /database/i,
      /authentication/i,
      /cors/i
    ];

    for (const line of logLines) {
      for (const pattern of complexPatterns) {
        if (pattern.test(line)) {
          analysis.triggerReasons.push({
            type: 'complex_issue',
            priority: 'high',
            message: 'Complex issue detected requiring advanced troubleshooting',
            details: line.trim(),
            suggestedAction: 'Claude investigation and custom solution development'
          });
          break;
        }
      }
    }
  }

  async shouldTriggerClaude(analysis) {
    // Check cooldown period
    const now = Date.now();
    if (now - this.lastTrigger < this.triggerCooldown) {
      console.log('⏰ Claude trigger in cooldown period');
      return false;
    }

    // Check trigger conditions
    const shouldTrigger = 
      analysis.triggerReasons.length > 0 &&
      (
        analysis.severity === 'critical' ||
        analysis.triggerReasons.some(r => r.priority === 'critical') ||
        analysis.issuesSummary.consecutiveFailures >= this.triggerThresholds.maxConsecutiveFailures
      );

    return shouldTrigger;
  }

  async createTriggerRequest(analysis) {
    const triggerRequest = {
      timestamp: new Date().toISOString(),
      urgency: analysis.severity,
      systemHealth: analysis.systemHealth,
      triggerReasons: analysis.triggerReasons,
      issuesSummary: analysis.issuesSummary,
      contextFiles: [
        'synthetic-interactions/monitoring-logs/monitor-2025-08-12.log',
        'synthetic-interactions/reports/intelligent-log-analysis-2025-08-12.json',
        'src/test/**/*.test.tsx',
        'package.json'
      ],
      requestedActions: [
        'Investigate recurring Notification API test failures',
        'Analyze root cause of consecutive auto-fix repetition',
        'Review test infrastructure and mocking strategy',
        'Implement permanent solution to prevent issue recurrence',
        'Optimize monitoring and auto-fix effectiveness'
      ],
      expectedDeliverable: 'Comprehensive issue resolution and system optimization'
    };

    await fs.writeFile(this.triggerFile, JSON.stringify(triggerRequest, null, 2));
    console.log(`📋 Claude trigger request created: ${this.triggerFile}`);
    return triggerRequest;
  }

  async invokeClaude(triggerRequest) {
    console.log('🤖 Invoking Claude Code with intelligent context...');
    
    try {
      // Create a comprehensive context message
      const contextMessage = `
🚨 AUTOMATIC CLAUDE TRIGGER - INTELLIGENT INTERVENTION REQUIRED

## System Analysis
- **Severity:** ${triggerRequest.urgency.toUpperCase()}
- **System Health:** ${triggerRequest.systemHealth.toUpperCase()}
- **Trigger Time:** ${triggerRequest.timestamp}

## Issues Detected
${triggerRequest.triggerReasons.map(reason => `
### ${reason.type.replace('_', ' ').toUpperCase()}
- **Priority:** ${reason.priority}
- **Issue:** ${reason.message}
- **Details:** ${reason.details}
- **Suggested Action:** ${reason.suggestedAction}
`).join('\n')}

## System State Summary
- Total Issues: ${triggerRequest.issuesSummary.totalIssues}
- Critical Issues: ${triggerRequest.issuesSummary.criticalIssues}  
- Consecutive Failures: ${triggerRequest.issuesSummary.consecutiveFailures}

## Context Files to Review
${triggerRequest.contextFiles.map(file => `- ${file}`).join('\n')}

## Requested Actions
${triggerRequest.requestedActions.map(action => `- ${action}`).join('\n')}

Please investigate these issues and implement comprehensive solutions.
      `;

      // Launch Claude Code with context (simulated - would be actual API call in production)
      console.log('📨 Context message prepared for Claude Code:');
      console.log('='.repeat(80));
      console.log(contextMessage);
      console.log('='.repeat(80));

      // In a real implementation, this would make an API call to Claude Code
      // For now, we'll create a notification file that can be monitored
      await this.createClaudeNotification(contextMessage, triggerRequest);

      this.lastTrigger = Date.now();
      return true;

    } catch (error) {
      console.error('❌ Failed to invoke Claude:', error.message);
      return false;
    }
  }

  async createClaudeNotification(contextMessage, triggerRequest) {
    // Create a notification file that could be monitored by Claude Code or user
    const notificationFile = path.join(__dirname, `CLAUDE_INTERVENTION_NEEDED_${Date.now()}.md`);
    
    const notification = `# 🤖 CLAUDE INTERVENTION REQUEST

${contextMessage}

---

## Instructions for Claude Code Integration

To make this automatic, implement:

1. **Monitor this file location** for new CLAUDE_INTERVENTION_NEEDED_*.md files
2. **Auto-launch Claude Code** when files are detected
3. **Pass the context** from this file as initial prompt
4. **Clean up** notification files after processing

## Current Status
- **Request Created:** ${new Date().toLocaleString()}
- **Trigger File:** ${this.triggerFile}
- **Expected Response:** Within 5 minutes of detection

## Auto-Generated Context
This is an automatically generated request based on intelligent system monitoring.
The monitoring system has detected issues beyond basic auto-repair capabilities.
`;

    await fs.writeFile(notificationFile, notification);
    console.log(`📬 Claude notification created: ${notificationFile}`);
    
    return notificationFile;
  }

  async runTriggerCheck() {
    console.log('🎯 Running Claude auto-trigger check...');
    
    try {
      // Analyze current system state
      const analysis = await this.analyzeSystemState();
      
      // Determine if Claude should be triggered
      const shouldTrigger = await this.shouldTriggerClaude(analysis);
      
      if (shouldTrigger) {
        console.log('🚨 TRIGGER CONDITIONS MET - Invoking Claude!');
        
        // Create trigger request
        const triggerRequest = await this.createTriggerRequest(analysis);
        
        // Invoke Claude
        const success = await this.invokeClaude(triggerRequest);
        
        if (success) {
          console.log('✅ Claude successfully triggered for intelligent intervention');
        } else {
          console.log('❌ Failed to trigger Claude - check configuration');
        }
      } else {
        console.log('ℹ️  No trigger conditions met - system operating within normal parameters');
      }

      return analysis;

    } catch (error) {
      console.error('💥 Claude trigger check failed:', error.message);
      throw error;
    }
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const trigger = new ClaudeAutoTrigger();
  trigger.runTriggerCheck()
    .then(analysis => {
      console.log(`🎉 Trigger check completed. Severity: ${analysis.severity}, Triggers: ${analysis.triggerReasons.length}`);
    })
    .catch(error => {
      console.error('💥 Trigger check failed:', error);
      process.exit(1);
    });
}

export default ClaudeAutoTrigger;