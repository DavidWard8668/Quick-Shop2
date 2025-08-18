/**
 * Claude Bug Handler
 * This script allows Claude to read bugs and update their status
 * Run with: node claude-bug-handler.js [command] [options]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUG_FILE = path.join(__dirname, 'claude-bugs.json');
const STATUS_FILE = path.join(__dirname, 'claude-bug-status.json');

class ClaudeBugHandler {
  constructor() {
    this.bugs = this.loadBugs();
    this.statusUpdates = this.loadStatusUpdates();
  }

  loadBugs() {
    try {
      if (fs.existsSync(BUG_FILE)) {
        const data = fs.readFileSync(BUG_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Error loading bugs:', err);
    }
    return { bugs: [] };
  }

  loadStatusUpdates() {
    try {
      if (fs.existsSync(STATUS_FILE)) {
        const data = fs.readFileSync(STATUS_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Error loading status updates:', err);
    }
    return [];
  }

  saveStatusUpdate(bugId, status, notes) {
    const update = {
      bugId: bugId,
      status: status,
      notes: notes,
      fixedAt: status === 'fixed' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    };
    
    // Remove any existing update for this bug
    this.statusUpdates = this.statusUpdates.filter(u => u.bugId !== bugId);
    this.statusUpdates.push(update);
    
    fs.writeFileSync(STATUS_FILE, JSON.stringify(this.statusUpdates, null, 2));
    console.log(`✅ Status updated for bug #${bugId}: ${status}`);
  }

  listBugs(filter = 'all') {
    const bugs = this.bugs.bugs || [];
    
    let filtered = bugs;
    if (filter === 'new') {
      filtered = bugs.filter(b => b.status === 'new');
    } else if (filter === 'critical') {
      filtered = bugs.filter(b => b.priority === 'CRITICAL');
    } else if (filter === 'high') {
      filtered = bugs.filter(b => b.priority === 'HIGH' || b.priority === 'CRITICAL');
    }
    
    console.log('\n📋 BUG REPORT SUMMARY');
    console.log('=' .repeat(80));
    console.log(`Total: ${bugs.length} | New: ${bugs.filter(b => b.status === 'new').length} | In Progress: ${bugs.filter(b => b.status === 'in_progress').length} | Fixed: ${bugs.filter(b => b.status === 'fixed').length}`);
    console.log('=' .repeat(80));
    
    filtered.forEach(bug => {
      const statusEmoji = {
        'new': '🆕',
        'in_progress': '🔧',
        'fixed': '✅'
      }[bug.status] || '❓';
      
      const priorityEmoji = {
        'CRITICAL': '🔴',
        'HIGH': '🟠',
        'MEDIUM': '🟡',
        'LOW': '🟢'
      }[bug.priority] || '⚪';
      
      console.log(`\n${statusEmoji} Bug #${bug.id} ${priorityEmoji} ${bug.priority}`);
      console.log(`   Category: ${bug.category}`);
      console.log(`   Subject: ${bug.subject}`);
      console.log(`   From: ${bug.from}`);
      console.log(`   Time: ${bug.timestamp}`);
      console.log(`   Body: ${bug.body.substring(0, 150)}...`);
      
      if (bug.claudeNotes) {
        console.log(`   📝 Notes: ${bug.claudeNotes}`);
      }
    });
  }

  showBug(bugId) {
    const bug = this.bugs.bugs.find(b => b.id === parseInt(bugId));
    if (!bug) {
      console.log(`❌ Bug #${bugId} not found`);
      return;
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log(`BUG #${bug.id} - ${bug.priority} - ${bug.status}`);
    console.log('=' .repeat(80));
    console.log(`From: ${bug.from}`);
    console.log(`Time: ${bug.timestamp}`);
    console.log(`Category: ${bug.category}`);
    console.log(`Subject: ${bug.subject}`);
    console.log('\nBody:');
    console.log(bug.body);
    
    if (bug.claudeNotes) {
      console.log('\n📝 Claude Notes:');
      console.log(bug.claudeNotes);
    }
  }

  startWork(bugId) {
    this.saveStatusUpdate(parseInt(bugId), 'in_progress', 'Claude started working on this bug');
    console.log(`🔧 Started working on bug #${bugId}`);
  }

  markFixed(bugId, notes) {
    this.saveStatusUpdate(parseInt(bugId), 'fixed', notes || 'Fixed by Claude');
    console.log(`✅ Bug #${bugId} marked as fixed`);
  }

  addNote(bugId, notes) {
    const bug = this.bugs.bugs.find(b => b.id === parseInt(bugId));
    if (!bug) {
      console.log(`❌ Bug #${bugId} not found`);
      return;
    }
    
    this.saveStatusUpdate(parseInt(bugId), bug.status, notes);
    console.log(`📝 Note added to bug #${bugId}`);
  }

  generateFixScript() {
    const criticalBugs = this.bugs.bugs.filter(b => 
      b.status === 'new' && (b.priority === 'CRITICAL' || b.priority === 'HIGH')
    );
    
    if (criticalBugs.length === 0) {
      console.log('✅ No critical bugs to fix!');
      return;
    }
    
    console.log('\n🚨 CRITICAL BUG FIX SCRIPT');
    console.log('=' .repeat(80));
    console.log('# Auto-generated fix script for critical bugs\n');
    
    criticalBugs.forEach(bug => {
      console.log(`# Bug #${bug.id}: ${bug.subject}`);
      console.log(`# Priority: ${bug.priority}`);
      console.log(`# Category: ${bug.category}`);
      
      // Generate category-specific fix commands
      switch(bug.category) {
        case 'barcode-scanner':
          console.log('npm test -- src/test/components/BarcodeScanner.test.tsx');
          console.log('# Check camera permissions and WebRTC implementation');
          break;
        case 'navigation':
          console.log('npm test -- src/test/services/navigationService.test.ts');
          console.log('# Verify GPS and mapping services');
          break;
        case 'authentication':
          console.log('npm test -- src/test/services/authService.test.ts');
          console.log('# Check Supabase auth configuration');
          break;
        case 'shopping-cart':
          console.log('npm test -- src/test/components/ShoppingCart.test.tsx');
          console.log('# Verify state management and localStorage');
          break;
        case 'pwa':
          console.log('npm test -- src/test/services/pwaService.test.ts');
          console.log('# Check service worker and manifest');
          break;
        default:
          console.log('npm test');
          console.log('npm run typecheck');
      }
      console.log('');
    });
  }
}

// CLI Interface
const handler = new ClaudeBugHandler();
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch(command) {
  case 'list':
    handler.listBugs(arg1);
    break;
  case 'show':
    if (!arg1) {
      console.log('Usage: node claude-bug-handler.js show <bug-id>');
    } else {
      handler.showBug(arg1);
    }
    break;
  case 'start':
    if (!arg1) {
      console.log('Usage: node claude-bug-handler.js start <bug-id>');
    } else {
      handler.startWork(arg1);
    }
    break;
  case 'fixed':
    if (!arg1) {
      console.log('Usage: node claude-bug-handler.js fixed <bug-id> [notes]');
    } else {
      handler.markFixed(arg1, arg2);
    }
    break;
  case 'note':
    if (!arg1 || !arg2) {
      console.log('Usage: node claude-bug-handler.js note <bug-id> <notes>');
    } else {
      handler.addNote(arg1, arg2);
    }
    break;
  case 'fix-script':
    handler.generateFixScript();
    break;
  default:
    console.log(`
🤖 Claude Bug Handler - Full Circle Integration

Commands:
  list [filter]        List all bugs (filter: all, new, critical, high)
  show <bug-id>        Show detailed bug information
  start <bug-id>       Mark bug as in progress
  fixed <bug-id> [note] Mark bug as fixed with optional note
  note <bug-id> <text> Add a note to a bug
  fix-script           Generate fix commands for critical bugs

Examples:
  node claude-bug-handler.js list new
  node claude-bug-handler.js show 1234567890
  node claude-bug-handler.js start 1234567890
  node claude-bug-handler.js fixed 1234567890 "Fixed null check in cart"
  node claude-bug-handler.js note 1234567890 "Investigating root cause"
  node claude-bug-handler.js fix-script
    `);
}