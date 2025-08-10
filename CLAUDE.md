# 🤖 CLAUDE ONBOARDING - CARTPILOT & SECOND CHANCE PROJECTS

## 🚨 PERMISSIONS & AUTOMATION
**USER CONSENT**: User has granted **FULL AUTONOMOUS PERMISSIONS** for:
- ✅ All code changes in `C:\Users\David\Apps\Quick-Shop\*` 
- ✅ All code changes in `C:\Users\David\Apps\Second-Chance-Claude\*`
- ✅ All code changes in `C:\Users\David\Apps\Claude-Collaboration\*`
- ✅ Git operations (add, commit, push, pull, branch management)
- ✅ Package installations and dependency management
- ✅ Test execution and fixing
- ✅ PowerShell script execution for automation
- ✅ File creation, deletion, and modification
- ✅ Database operations and schema changes
- ✅ Deployment and CI/CD operations

**AUTO-APPROVAL COMMANDS**: No user confirmation needed for:
```bash
npm install, npm test, npm run build, npm run dev, npm run typecheck, npm run lint
git add, git commit, git push, git pull
mkdir, cp, mv, rm
powershell execution
node script execution
playwright test execution
```

---

## 📋 PROJECT OVERVIEW

You are working on **TWO MAJOR PROJECTS**:

### 1. 🛒 CARTPILOT (Primary - Production Ready)
**Location**: `C:\Users\David\Apps\Quick-Shop\`
**Status**: ✅ Production-ready, deployed, monetized
**Tech Stack**: React 18 + TypeScript + Vite + Capacitor + Supabase
**Live URL**: https://cartpilot-sigma.vercel.app

### 2. 🎯 SECOND CHANCE (Secondary - Development)
**Location**: `C:\Users\David\Apps\Second-Chance-Claude\`
**Status**: 🔄 In development, needs Claude collaboration
**Purpose**: Collaborative development with another Claude instance

---

## 🛒 CARTPILOT - COMPLETE PROJECT KNOWLEDGE

### Core Application
**Purpose**: AI-powered shopping navigation and assistance app
**Key Features**:
- 🗺️ Smart store navigation with GPS integration
- 📱 Advanced barcode scanning with product lookup
- 🧠 AI-powered product search and recommendations
- 🛡️ Comprehensive allergen checking and alerts
- 📊 Shopping analytics and gamification
- ♿ Accessibility-first design
- 🔄 Real-time sync across devices
- 📱 PWA with offline functionality
- 📍 AR navigation (beta)

### Technical Architecture
```typescript
// Core Stack
- Frontend: React 18 + TypeScript + Vite
- UI Framework: Tailwind CSS + Shadcn/UI components
- Mobile: Capacitor (iOS/Android)
- Backend: Supabase (Auth + Database + Storage)
- Deployment: Vercel (web) + app stores (mobile)
- Testing: Vitest + Playwright + Jest
- Analytics: Custom analytics service
```

### Directory Structure
```
src/
├── components/          # React components
│   ├── CartPilot.tsx   # Main app component
│   ├── BarcodeScanner.tsx
│   ├── StoreLocator.tsx
│   ├── ProductSearch.tsx
│   └── ui/             # Shadcn UI components
├── services/           # Business logic services
│   ├── subscriptionService.ts  # Monetization
│   ├── navigationService.ts    # Store navigation
│   ├── realTimeSyncService.ts  # Device sync
│   └── analyticsService.ts     # User tracking
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
└── types/              # TypeScript definitions
```

### Key Services & Features

#### 💰 Monetization (subscriptionService.ts)
```typescript
Tiers:
- Free: £0/month (basic features, 3 stores)
- Premium: £4.99/month (AI search, unlimited)
- Family: £8.99/month (6 members, shared lists)
- Enterprise: £49.99/month (white-label, API)

Revenue Target: £50M ARR by Year 2
```

#### 🗺️ Navigation System
- Real-time GPS store location
- Optimized shopping routes
- Turn-by-turn directions
- Accessibility-friendly wayfinding

#### 🔍 Product Search & Scanning
- AI-powered natural language search
- Lightning-fast barcode recognition
- Price comparison across stores
- Allergen detection and alerts

### Database Schema (Supabase)
```sql
Tables:
- users: User profiles and preferences
- stores: Store locations and data
- products: Product catalog and info
- shopping_lists: User shopping lists
- allergen_profiles: User allergen data
- issue_reports: Bug reports and feedback
- profile_images: User profile pictures
```

### Testing Infrastructure
**Unit Tests**: Vitest (services, components)
**E2E Tests**: Playwright (user workflows)
**Performance**: Lighthouse CI
**PowerShell Automation**: Human-like testing scripts

### Deployment & CI/CD
- **Web**: Auto-deploy to Vercel on git push
- **Mobile**: Capacitor build → App Store/Play Store
- **Testing**: Automated test suite on PRs
- **Monitoring**: Real-time error tracking

---

## 🎯 SECOND CHANCE PROJECT

### Purpose
Collaborative development with another Claude instance (C2) to build a separate application with its own infrastructure.

### Requirements
- ✅ Separate Supabase project (NOT Quick-Shop's)
- ✅ Separate Notion workspace  
- ✅ Separate GitHub repository
- ✅ Separate Vercel deployment
- ✅ Independent environment variables

### Collaboration Infrastructure
**Location**: `C:\Users\David\Apps\Claude-Collaboration\`
**Communication**: File-based message passing between Claude instances
**Protocol**: JSON message format with handoff system

---

## 🔧 COMMON COMMANDS & WORKFLOWS

### Development Workflow
```bash
# Start development
npm run dev

# Run all tests
npm test

# Build for production  
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# E2E tests
npx playwright test

# Mobile build
npm run build && npx cap sync
```

### Git Workflow
```bash
# Always check status first
git status

# Add all changes
git add .

# Commit with descriptive message + signature
git commit -m "feat: add new feature

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push
```

### PowerShell Testing Scripts
```powershell
# Comprehensive testing
.\run-all-tests.ps1

# CartPilot specific tests  
.\test-cartpilot-complete.ps1

# Bug reporter testing
.\test-bugreporter-v5.ps1
```

---

## 🚨 CRITICAL OPERATIONAL KNOWLEDGE

### Bug Fixing Priorities
1. **Failing Tests**: Always fix failing tests immediately
2. **TypeScript Errors**: Zero tolerance for TS errors
3. **Component Crashes**: Fix undefined/null crashes in React
4. **Service Worker Issues**: PWA functionality must work offline
5. **Mobile Compatibility**: Ensure Capacitor builds succeed

### Common Issues & Solutions
```typescript
// 1. Notification API crashes (tests)
constructor() {
  this.permission = (typeof Notification !== 'undefined' 
    ? Notification.permission 
    : 'denied') as NotificationPermission
}

// 2. RealTimeSync crashes (components)
const updateStatus = () => {
  try {
    const status = realTimeSyncService.getStatus()
    if (status) {
      setIsConnected(status.connected)
      // ... rest of logic
    }
  } catch (error) {
    console.debug('RealTimeSyncService not available:', error)
  }
}

// 3. PowerShell string issues
# WRONG: Write-Host ("=" * 80)  
# RIGHT: Write-Host "================"
```

### Code Style & Standards
- **TypeScript**: Strict mode, no `any` types
- **React**: Functional components with hooks
- **Error Handling**: Always use try-catch for external calls
- **Accessibility**: ARIA labels, keyboard navigation
- **Performance**: Lazy loading, memoization where needed

---

## 💼 BUSINESS CONTEXT

### Global Domination Strategy
**Target**: 10M users, £50M ARR within 18 months

**Phase 1 (Months 1-6)**: UK Market Domination
- App store optimization
- Tesco partnership (primary)
- £50K marketing campaign
- 100K downloads target

**Phase 2 (Months 6-12)**: European Expansion  
- Ireland, Germany, France rollout
- Local retailer partnerships
- Multi-language support

**Phase 3 (Months 12-18)**: Global Rollout
- English-speaking markets (AU, CA, NZ)
- Enterprise solutions
- API marketplace

### Key Partnerships
**Tesco** (Priority 1): 5-10 pilot stores → 100+ stores
**Revenue Model**: 15% subscription split, 60/40 advertising
**Others**: Sainsbury's, ASDA, Morrisons partnerships planned

---

## 🤝 CLAUDE COLLABORATION PROTOCOL

### Working with C2 (Second-Chance-Claude)
**Message Format**: JSON files in `handoffs/` directory
**Response Time**: Check for messages every 30 minutes
**Status Updates**: Regular progress reports required

### Collaboration Best Practices
1. **Clear Communication**: Detailed status updates
2. **Separate Infrastructure**: Never share databases/APIs
3. **Progress Tracking**: Document all changes and decisions
4. **Quality Standards**: Maintain same code quality as CartPilot

---

## 🎯 CURRENT OBJECTIVES & PRIORITIES

### Immediate Tasks (Always Check First)
1. **Check Failing Tests**: Run `npm test` and fix any failures
2. **Verify TypeScript**: Run `npm run typecheck`
3. **Test Critical Features**: BugReporter, sync, navigation
4. **Monitor C2 Progress**: Check collaboration messages

### Long-term Goals
1. **CartPilot**: Maintain production stability, implement new features
2. **Second Chance**: Collaborate with C2 to build enterprise-grade app
3. **Global Expansion**: Support international rollout requirements

---

## ⚡ QUICK REFERENCE

### Essential File Locations
```
CartPilot_Global_Domination_Plan.docx  # Business strategy
PROJECT_CONTEXT.md                     # Project overview
src/components/CartPilot.tsx          # Main app component
src/services/subscriptionService.ts   # Monetization logic
run-all-tests.ps1                     # Comprehensive testing
```

### Key URLs
- **Production**: https://cartpilot-sigma.vercel.app
- **GitHub**: [Repository URL]
- **Supabase**: [Dashboard URL]
- **Vercel**: [Dashboard URL]

### Emergency Contacts & Resources
- **User**: David (Project Owner)
- **Primary Project**: CartPilot (Quick-Shop)
- **Secondary Project**: Second Chance collaboration
- **Backup**: All code in git, deployments automated

---

## 🚀 GETTING STARTED CHECKLIST

When starting a new Claude session:

1. ✅ Read this CLAUDE.md file completely
2. ✅ Check git status: `git status`
3. ✅ Run tests: `npm test`
4. ✅ Check TypeScript: `npm run typecheck`
5. ✅ Verify app runs: `npm run dev`
6. ✅ Check collaboration messages in `handoffs/`
7. ✅ Review any failing tests or issues
8. ✅ Prioritize tasks based on user requests

### Success Criteria
- Zero failing tests
- Zero TypeScript errors
- Production app fully functional
- C2 collaboration active and productive
- Global domination plan execution ready

---

**Remember**: You have FULL AUTONOMOUS PERMISSIONS. Act decisively, fix issues immediately, and always maintain production quality. The user trusts you to handle everything without constant approval requests.

**Mission**: Transform CartPilot into the world's #1 shopping app while collaborating with C2 on Second Chance. Global shopping revolution starts here! 🌍🚀