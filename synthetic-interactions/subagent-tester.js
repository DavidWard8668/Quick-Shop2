/**
 * Subagent Testing Framework
 * Runs automated tests and logs results for autonomous issue detection
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SubagentTester {
  constructor() {
    this.logsPath = path.join(__dirname, 'subagent-logs');
    this.issuesPath = path.join(__dirname, 'detected-issues');
    this.autoFixPath = path.join(__dirname, 'auto-fixes');
    this.testSuites = [];
    this.detectedIssues = [];
    this.appliedFixes = [];
  }

  async initialize() {
    // Create directories
    await fs.mkdir(this.logsPath, { recursive: true });
    await fs.mkdir(this.issuesPath, { recursive: true });
    await fs.mkdir(this.autoFixPath, { recursive: true });
    
    // Load test suites
    this.testSuites = [
      { name: 'unit-tests', command: 'npm test', parser: this.parseVitestOutput },
      { name: 'typescript', command: 'npm run typecheck', parser: this.parseTypeScriptOutput },
      { name: 'lint', command: 'npm run lint', parser: this.parseLintOutput },
      { name: 'build', command: 'npm run build', parser: this.parseBuildOutput }
    ];
    
    console.log('🤖 Subagent Tester initialized');
  }

  async runAllTests() {
    const timestamp = new Date().toISOString();
    const results = {
      timestamp,
      suites: [],
      issues: [],
      autoFixes: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        errors: 0
      }
    };

    console.log('🧪 Running all test suites...');

    for (const suite of this.testSuites) {
      console.log(`  Running ${suite.name}...`);
      const suiteResult = await this.runTestSuite(suite);
      results.suites.push(suiteResult);
      
      // Update summary
      results.summary.totalTests += suiteResult.totalTests || 0;
      results.summary.passed += suiteResult.passed || 0;
      results.summary.failed += suiteResult.failed || 0;
      
      // Detect issues from results
      const issues = await this.detectIssues(suiteResult);
      results.issues.push(...issues);
    }

    // Attempt auto-fixes for detected issues
    for (const issue of results.issues) {
      const fix = await this.attemptAutoFix(issue);
      if (fix) {
        results.autoFixes.push(fix);
      }
    }

    // Save results to log file
    await this.saveResults(results);
    
    return results;
  }

  async runTestSuite(suite) {
    const startTime = Date.now();
    const result = {
      name: suite.name,
      timestamp: new Date().toISOString(),
      duration: 0,
      status: 'pending',
      output: '',
      parsed: {},
      errors: []
    };

    try {
      // Change to project directory
      process.chdir(path.join(__dirname, '..'));
      
      // Run the test command
      const { stdout, stderr } = await execAsync(suite.command, {
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      
      result.output = stdout + stderr;
      result.status = 'completed';
      
      // Parse the output
      result.parsed = suite.parser.call(this, result.output);
      
      // Determine if suite passed or failed
      if (result.parsed.failed > 0 || result.parsed.errors > 0) {
        result.status = 'failed';
      } else {
        result.status = 'passed';
      }
      
    } catch (error) {
      result.status = 'error';
      result.errors.push({
        message: error.message,
        stack: error.stack
      });
      result.output = error.stdout || error.stderr || error.message;
      
      // Still try to parse even on error
      if (result.output) {
        result.parsed = suite.parser.call(this, result.output);
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  parseVitestOutput(output) {
    const parsed = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      failedTests: []
    };

    // Parse test counts
    const summaryMatch = output.match(/Tests\s+(\d+)\s+failed.*?(\d+)\s+passed/);
    if (summaryMatch) {
      parsed.failed = parseInt(summaryMatch[1]);
      parsed.passed = parseInt(summaryMatch[2]);
      parsed.totalTests = parsed.failed + parsed.passed;
    }

    // Parse failed test names
    const failedMatches = output.matchAll(/FAIL\s+(.*?)(?:\s|$)/g);
    for (const match of failedMatches) {
      parsed.failedTests.push(match[1]);
    }

    // Parse specific errors
    if (output.includes('NotificationService')) {
      parsed.specificIssues = parsed.specificIssues || [];
      parsed.specificIssues.push({
        component: 'NotificationService',
        type: 'permission-handling',
        severity: 'high'
      });
    }

    if (output.includes('RealTimeSyncService')) {
      parsed.specificIssues = parsed.specificIssues || [];
      parsed.specificIssues.push({
        component: 'RealTimeSyncService',
        type: 'websocket-connection',
        severity: 'medium'
      });
    }

    return parsed;
  }

  parseTypeScriptOutput(output) {
    const parsed = {
      errors: 0,
      warnings: 0,
      files: []
    };

    const errorMatches = output.matchAll(/error TS\d+: (.*?)$/gm);
    for (const match of errorMatches) {
      parsed.errors++;
    }

    const fileMatches = output.matchAll(/(.*?\.tsx?).*?error/g);
    for (const match of fileMatches) {
      if (!parsed.files.includes(match[1])) {
        parsed.files.push(match[1]);
      }
    }

    return parsed;
  }

  parseLintOutput(output) {
    const parsed = {
      errors: 0,
      warnings: 0,
      fixable: 0
    };

    if (output.includes('error')) {
      const errorMatch = output.match(/(\d+)\s+error/);
      if (errorMatch) {
        parsed.errors = parseInt(errorMatch[1]);
      }
    }

    if (output.includes('warning')) {
      const warningMatch = output.match(/(\d+)\s+warning/);
      if (warningMatch) {
        parsed.warnings = parseInt(warningMatch[1]);
      }
    }

    if (output.includes('potentially fixable')) {
      parsed.fixable = parsed.errors + parsed.warnings;
    }

    return parsed;
  }

  parseBuildOutput(output) {
    const parsed = {
      success: false,
      errors: [],
      warnings: [],
      buildTime: 0
    };

    if (output.includes('built in')) {
      parsed.success = true;
      const timeMatch = output.match(/built in ([\d.]+)s/);
      if (timeMatch) {
        parsed.buildTime = parseFloat(timeMatch[1]);
      }
    }

    if (output.includes('ERROR')) {
      parsed.success = false;
      const errorMatches = output.matchAll(/ERROR.*?:(.*?)$/gm);
      for (const match of errorMatches) {
        parsed.errors.push(match[1].trim());
      }
    }

    return parsed;
  }

  async detectIssues(suiteResult) {
    const issues = [];

    // Check for test failures
    if (suiteResult.parsed.failed > 0) {
      issues.push({
        id: `issue-${Date.now()}-test-failures`,
        type: 'test-failures',
        suite: suiteResult.name,
        severity: 'high',
        count: suiteResult.parsed.failed,
        details: suiteResult.parsed.failedTests || [],
        autoFixable: true
      });
    }

    // Check for specific component issues
    if (suiteResult.parsed.specificIssues) {
      for (const issue of suiteResult.parsed.specificIssues) {
        issues.push({
          id: `issue-${Date.now()}-${issue.component}`,
          type: 'component-error',
          component: issue.component,
          severity: issue.severity,
          details: issue.type,
          autoFixable: true
        });
      }
    }

    // Check for TypeScript errors
    if (suiteResult.name === 'typescript' && suiteResult.parsed.errors > 0) {
      issues.push({
        id: `issue-${Date.now()}-ts-errors`,
        type: 'typescript-errors',
        severity: 'critical',
        count: suiteResult.parsed.errors,
        files: suiteResult.parsed.files,
        autoFixable: false
      });
    }

    // Check for lint issues
    if (suiteResult.name === 'lint' && suiteResult.parsed.errors > 0) {
      issues.push({
        id: `issue-${Date.now()}-lint`,
        type: 'lint-errors',
        severity: 'medium',
        count: suiteResult.parsed.errors,
        fixable: suiteResult.parsed.fixable > 0,
        autoFixable: suiteResult.parsed.fixable > 0
      });
    }

    // Check for build failures
    if (suiteResult.name === 'build' && !suiteResult.parsed.success) {
      issues.push({
        id: `issue-${Date.now()}-build`,
        type: 'build-failure',
        severity: 'critical',
        errors: suiteResult.parsed.errors,
        autoFixable: false
      });
    }

    return issues;
  }

  async attemptAutoFix(issue) {
    console.log(`🔧 Attempting to auto-fix: ${issue.type}`);
    
    const fix = {
      issueId: issue.id,
      type: issue.type,
      timestamp: new Date().toISOString(),
      status: 'pending',
      actions: []
    };

    try {
      switch (issue.type) {
        case 'test-failures':
          if (issue.details.some(test => test.includes('NotificationService'))) {
            fix.actions.push(await this.fixNotificationTests());
          }
          if (issue.details.some(test => test.includes('RealTimeSyncService'))) {
            fix.actions.push(await this.fixRealTimeSyncTests());
          }
          break;

        case 'component-error':
          if (issue.component === 'NotificationService') {
            fix.actions.push(await this.fixNotificationService());
          }
          break;

        case 'lint-errors':
          if (issue.fixable) {
            fix.actions.push(await this.runLintFix());
          }
          break;
      }

      if (fix.actions.length > 0) {
        fix.status = 'applied';
        
        // Save fix details
        const fixFile = path.join(this.autoFixPath, `${fix.issueId}.json`);
        await fs.writeFile(fixFile, JSON.stringify(fix, null, 2));
        
        console.log(`✅ Auto-fix applied for ${issue.type}`);
        return fix;
      }
    } catch (error) {
      fix.status = 'failed';
      fix.error = error.message;
      console.error(`❌ Auto-fix failed for ${issue.type}:`, error.message);
    }

    return null;
  }

  async fixNotificationTests() {
    const testFile = path.join(__dirname, '..', 'src', 'test', 'services', 'notificationService.test.ts');
    
    try {
      let content = await fs.readFile(testFile, 'utf-8');
      
      // Add proper mocking for Notification API
      const mockCode = `
// Mock Notification API for tests
global.Notification = {
  permission: 'default',
  requestPermission: vi.fn().mockResolvedValue('granted')
} as any;`;

      if (!content.includes('global.Notification')) {
        content = content.replace(/describe\('NotificationService'/, mockCode + '\n\ndescribe(\'NotificationService\'');
        await fs.writeFile(testFile, content);
        
        return {
          action: 'fix-notification-tests',
          file: testFile,
          changes: 'Added Notification API mock'
        };
      }
    } catch (error) {
      console.error('Failed to fix notification tests:', error);
    }
    
    return null;
  }

  async fixRealTimeSyncTests() {
    const testFile = path.join(__dirname, '..', 'src', 'test', 'services', 'realTimeSyncService.test.ts');
    
    try {
      let content = await fs.readFile(testFile, 'utf-8');
      
      // Add WebSocket mock
      const mockCode = `
// Mock WebSocket for tests
global.WebSocket = vi.fn().mockImplementation(() => ({
  readyState: 1,
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
})) as any;`;

      if (!content.includes('global.WebSocket')) {
        content = content.replace(/describe\('RealTimeSyncService'/, mockCode + '\n\ndescribe(\'RealTimeSyncService\'');
        await fs.writeFile(testFile, content);
        
        return {
          action: 'fix-realtimesync-tests',
          file: testFile,
          changes: 'Added WebSocket mock'
        };
      }
    } catch (error) {
      console.error('Failed to fix RealTimeSync tests:', error);
    }
    
    return null;
  }

  async fixNotificationService() {
    const serviceFile = path.join(__dirname, '..', 'src', 'services', 'notificationService.ts');
    
    try {
      let content = await fs.readFile(serviceFile, 'utf-8');
      
      // Add safety check for Notification API
      const safetyCheck = `
  private isNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }`;

      if (!content.includes('isNotificationSupported')) {
        content = content.replace(/class NotificationService {/, `class NotificationService {${safetyCheck}`);
        
        // Update methods to use safety check
        content = content.replace(/Notification\.permission/g, 
          `(this.isNotificationSupported() ? Notification.permission : 'denied')`);
        
        await fs.writeFile(serviceFile, content);
        
        return {
          action: 'fix-notification-service',
          file: serviceFile,
          changes: 'Added Notification API safety checks'
        };
      }
    } catch (error) {
      console.error('Failed to fix NotificationService:', error);
    }
    
    return null;
  }

  async runLintFix() {
    try {
      const { stdout } = await execAsync('npm run lint -- --fix');
      
      return {
        action: 'lint-autofix',
        changes: 'Ran eslint --fix',
        output: stdout
      };
    } catch (error) {
      console.error('Failed to run lint fix:', error);
    }
    
    return null;
  }

  async saveResults(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save main results
    const resultsFile = path.join(this.logsPath, `test-results-${timestamp}.json`);
    await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
    
    // Save issues separately for easy access
    if (results.issues.length > 0) {
      const issuesFile = path.join(this.issuesPath, `issues-${timestamp}.json`);
      await fs.writeFile(issuesFile, JSON.stringify(results.issues, null, 2));
    }
    
    // Create summary log
    const summaryFile = path.join(this.logsPath, `summary-${timestamp}.txt`);
    const summary = `
Subagent Test Results
=====================
Timestamp: ${results.timestamp}
Total Tests: ${results.summary.totalTests}
Passed: ${results.summary.passed}
Failed: ${results.summary.failed}
Issues Detected: ${results.issues.length}
Auto-Fixes Applied: ${results.autoFixes.length}

Issues:
${results.issues.map(i => `- ${i.type} (${i.severity})`).join('\n')}

Auto-Fixes:
${results.autoFixes.map(f => `- ${f.type}: ${f.status}`).join('\n')}
`;
    
    await fs.writeFile(summaryFile, summary);
    
    console.log(`📁 Results saved to ${resultsFile}`);
  }

  async monitorContinuously(intervalMinutes = 30) {
    console.log(`🔄 Starting continuous monitoring (interval: ${intervalMinutes} minutes)`);
    
    const runTests = async () => {
      console.log(`\n⏰ Running scheduled test suite at ${new Date().toLocaleString()}`);
      
      const results = await this.runAllTests();
      
      // Check if email notification needed
      if (results.issues.length > 0 || results.summary.failed > 0) {
        await this.sendEmailNotification(results);
      }
      
      console.log(`✅ Test run complete. Next run in ${intervalMinutes} minutes.`);
    };

    // Run immediately
    await runTests();
    
    // Schedule regular runs
    setInterval(runTests, intervalMinutes * 60 * 1000);
  }

  async sendEmailNotification(results) {
    try {
      // Use the email reporter to send results
      const EmailReporter = (await import('./email-reporter.js')).default;
      const emailReporter = new EmailReporter();
      
      // Customize the report data
      emailReporter.reportData.syntheticTests = {
        totalTests: results.summary.totalTests,
        passedTests: results.summary.passed,
        failedTests: results.summary.failed,
        successRate: results.summary.totalTests > 0 
          ? ((results.summary.passed / results.summary.totalTests) * 100).toFixed(2)
          : 0,
        issues: results.issues,
        autoFixes: results.autoFixes
      };
      
      await emailReporter.sendEmail();
      console.log('📧 Email notification sent');
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new SubagentTester();
  
  const args = process.argv.slice(2);
  const continuous = args.includes('--continuous') || args.includes('-c');
  const interval = parseInt(args.find(a => a.startsWith('--interval='))?.split('=')[1] || '30');
  
  await tester.initialize();
  
  if (continuous) {
    await tester.monitorContinuously(interval);
  } else {
    const results = await tester.runAllTests();
    console.log('\n📊 Test Summary:');
    console.log(`   Total: ${results.summary.totalTests}`);
    console.log(`   Passed: ${results.summary.passed}`);
    console.log(`   Failed: ${results.summary.failed}`);
    console.log(`   Issues: ${results.issues.length}`);
    console.log(`   Auto-fixes: ${results.autoFixes.length}`);
  }
}

export default SubagentTester;