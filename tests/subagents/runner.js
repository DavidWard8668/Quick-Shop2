#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const cron = require('node-cron');

class SubAgentRunner {
  constructor(configPath = './config.json') {
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    this.activeJobs = new Map();
    this.metrics = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      startTime: new Date()
    };
    
    console.log('🤖 CartPilot SubAgent Runner initialized');
    console.log(`📊 Monitoring ${this.config.subagents.length} subagents`);
  }

  start() {
    console.log('🚀 Starting subagent scheduler...');
    
    this.config.subagents.forEach(agent => {
      this.scheduleAgent(agent);
    });

    // Health check endpoint
    this.startHealthCheckServer();
    
    console.log('✅ All subagents scheduled successfully');
  }

  scheduleAgent(agent) {
    const { name, schedule } = agent;
    
    let cronExpression;
    
    if (schedule.interval === 'daily') {
      const [hour, minute] = schedule.time.split(':');
      cronExpression = `${minute || 0} ${hour || 2} * * *`;
    } else if (schedule.interval === 'weekly') {
      const [hour, minute] = schedule.time.split(':');
      const dayMap = { 
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3, 
        thursday: 4, friday: 5, saturday: 6 
      };
      cronExpression = `${minute || 0} ${hour || 2} * * ${dayMap[schedule.day] || 0}`;
    } else if (schedule.interval === 'hourly') {
      const minutes = schedule.minutes || [0];
      cronExpression = `${minutes.join(',')} * * * *`;
    } else if (schedule.interval === 'every_6_hours') {
      cronExpression = `0 */6 * * *`;
    }

    if (cronExpression) {
      cron.schedule(cronExpression, () => {
        this.runAgent(agent);
      });
      
      console.log(`⏰ Scheduled ${name}: ${cronExpression}`);
    }

    // Run immediately if it's a critical agent or in development
    if (process.env.NODE_ENV === 'development' || agent.run_immediately) {
      setTimeout(() => this.runAgent(agent), 5000);
    }
  }

  async runAgent(agent) {
    const { name, tasks, reporting } = agent;
    const runId = this.generateRunId();
    
    console.log(`🏃 Running subagent: ${name} (${runId})`);
    
    this.metrics.totalRuns++;
    
    const results = {
      agent: name,
      runId,
      startTime: new Date(),
      tasks: [],
      success: true,
      artifacts: []
    };

    try {
      for (const task of tasks) {
        const taskResult = await this.runTask(task, agent);
        results.tasks.push(taskResult);
        
        if (taskResult.failed && task.critical) {
          results.success = false;
          break;
        }
      }

      if (results.success) {
        this.metrics.successfulRuns++;
        console.log(`✅ Subagent ${name} completed successfully`);
      } else {
        this.metrics.failedRuns++;
        console.log(`❌ Subagent ${name} failed`);
      }

    } catch (error) {
      console.error(`💥 Subagent ${name} crashed:`, error);
      results.success = false;
      results.error = error.message;
      this.metrics.failedRuns++;
    }

    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;

    // Generate reports
    await this.generateReport(results, reporting);
    
    // Send notifications
    if (!results.success && reporting) {
      await this.sendFailureNotifications(results, reporting);
    }

    return results;
  }

  async runTask(task, agent) {
    const { name, command, timeout, retries = 0, critical = false } = task;
    
    console.log(`  🔧 Running task: ${name}`);
    
    const taskResult = {
      name,
      command,
      startTime: new Date(),
      attempts: [],
      success: false,
      failed: false,
      critical
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      const attemptResult = await this.executeCommand(command, timeout, attempt + 1);
      taskResult.attempts.push(attemptResult);
      
      if (attemptResult.success) {
        taskResult.success = true;
        console.log(`    ✅ Task ${name} succeeded on attempt ${attempt + 1}`);
        break;
      } else {
        console.log(`    ❌ Task ${name} failed on attempt ${attempt + 1}: ${attemptResult.error}`);
        
        if (attempt < retries) {
          console.log(`    🔄 Retrying task ${name} (${attempt + 1}/${retries})`);
          await this.sleep(5000); // Wait 5 seconds between retries
        }
      }
    }

    if (!taskResult.success) {
      taskResult.failed = true;
      console.log(`    💀 Task ${name} failed after ${retries + 1} attempts`);
    }

    taskResult.endTime = new Date();
    taskResult.duration = taskResult.endTime - taskResult.startTime;
    
    return taskResult;
  }

  executeCommand(command, timeout = 30000, attempt = 1) {
    return new Promise((resolve) => {
      const startTime = new Date();
      let killed = false;
      
      console.log(`    🚀 Executing: ${command} (attempt ${attempt})`);
      
      const child = spawn('bash', ['-c', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutId = setTimeout(() => {
        killed = true;
        child.kill('SIGKILL');
        console.log(`    ⏰ Command timed out after ${timeout}ms`);
      }, timeout);

      child.on('exit', (code, signal) => {
        clearTimeout(timeoutId);
        
        const endTime = new Date();
        const duration = endTime - startTime;
        
        const result = {
          success: code === 0 && !killed,
          exitCode: code,
          signal,
          stdout,
          stderr,
          duration,
          timedOut: killed,
          attempt
        };

        if (killed) {
          result.error = `Command timed out after ${timeout}ms`;
        } else if (code !== 0) {
          result.error = `Command failed with exit code ${code}`;
        }

        resolve(result);
      });
    });
  }

  async generateReport(results, reportingConfig) {
    if (!reportingConfig?.generate_report) return;

    const reportDir = path.join(process.cwd(), 'test-results/subagent-reports');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportFile = path.join(reportDir, `${results.agent}-${results.runId}.json`);
    
    // Enhanced report with metrics
    const report = {
      ...results,
      metrics: this.metrics,
      environment: {
        node_version: process.version,
        platform: process.platform,
        memory_usage: process.memoryUsage(),
        uptime: process.uptime()
      },
      artifacts: await this.collectArtifacts(results)
    };

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    if (reportingConfig.generate_html) {
      await this.generateHTMLReport(report, reportDir);
    }
    
    console.log(`📄 Report generated: ${reportFile}`);
  }

  async collectArtifacts(results) {
    const artifacts = [];
    const artifactDirs = [
      'test-results',
      'playwright-report', 
      'coverage',
      'screenshots'
    ];

    for (const dir of artifactDirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        artifacts.push({
          type: dir,
          path: fullPath,
          size: this.getDirectorySize(fullPath)
        });
      }
    }

    return artifacts;
  }

  async sendFailureNotifications(results, reportingConfig) {
    const { slack_webhook, email_alerts } = reportingConfig;
    
    if (slack_webhook && process.env.SLACK_WEBHOOK_URL) {
      await this.sendSlackNotification(results);
    }

    if (email_alerts?.length > 0) {
      await this.sendEmailNotification(results, email_alerts);
    }
  }

  async sendSlackNotification(results) {
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    if (!slackWebhook) return;

    const failedTasks = results.tasks.filter(t => t.failed);
    const criticalFailures = failedTasks.filter(t => t.critical);
    
    const payload = {
      text: `🚨 SubAgent Failure Alert`,
      attachments: [
        {
          color: criticalFailures.length > 0 ? 'danger' : 'warning',
          title: `SubAgent: ${results.agent}`,
          fields: [
            {
              title: 'Status',
              value: results.success ? '✅ Success' : '❌ Failed',
              short: true
            },
            {
              title: 'Duration',
              value: `${Math.round(results.duration / 1000)}s`,
              short: true
            },
            {
              title: 'Failed Tasks',
              value: failedTasks.map(t => `• ${t.name}`).join('\n') || 'None',
              short: false
            },
            {
              title: 'Run ID',
              value: results.runId,
              short: true
            },
            {
              title: 'Timestamp',
              value: results.startTime.toISOString(),
              short: true
            }
          ]
        }
      ]
    };

    try {
      const fetch = await import('node-fetch').then(mod => mod.default);
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('📱 Slack notification sent');
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  async sendEmailNotification(results, recipients) {
    // Email implementation would go here
    console.log(`📧 Would send email notification to: ${recipients.join(', ')}`);
  }

  startHealthCheckServer() {
    const http = require('http');
    const server = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          uptime: process.uptime(),
          metrics: this.metrics,
          activeJobs: this.activeJobs.size,
          memory: process.memoryUsage()
        }));
      } else if (req.url === '/metrics') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.metrics));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    const port = process.env.HEALTH_CHECK_PORT || 3001;
    server.listen(port, () => {
      console.log(`🏥 Health check server running on port ${port}`);
    });
  }

  generateRunId() {
    return `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getDirectorySize(dirPath) {
    let totalSize = 0;
    try {
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          totalSize += this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      });
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
    return totalSize;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
if (require.main === module) {
  const configPath = process.argv[2] || './config.json';
  const runner = new SubAgentRunner(configPath);
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down subagent runner...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    process.exit(0);
  });

  runner.start();
}

module.exports = SubAgentRunner;