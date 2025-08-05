# 🛒 CartPilot Project Context - Complete Setup Guide

## 📋 Quick Summary
CartPilot is an intelligent in-store navigation app for UK grocery shopping, deployed at **https://cartpilot-sigma.vercel.app/**. It includes user authentication, store mapping, premium features, and automated testing/deployment workflows.

## 🔗 Key Integration Links

### Live Deployments
- **Production App**: https://cartpilot-sigma.vercel.app/
- **Vercel Dashboard**: Connected to GitHub for automatic deployments

### Development & Collaboration
- **GitHub Repository**: https://github.com/DavidWard8668/Quick-Shop2.git
- **Notion Dashboard**: https://www.notion.so/23d5f349277181739dadc6ddaaa15662
- **Notion API Integration**: Automated daily sync and reporting

### Local Directories
- **Main Project**: `C:\Users\David\Apps\Quick-Shop\`
- **Testing Framework**: `C:\Users\David\Apps\Quick-Shop\cartpilot-testing\`
- **Android Build**: `C:\Users\David\Apps\Quick-Shop\android\`
- **iOS Build**: `C:\Users\David\Apps\Quick-Shop\ios\`

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI Components
- **State Management**: React Context API + React Query
- **Mobile**: Capacitor 7.4.2 for iOS/Android apps
- **Authentication**: Supabase Auth with user profiles

### Backend & Services
- **Database**: Supabase (PostgreSQL)
- **Auth Provider**: Supabase Authentication
- **File Storage**: Supabase Storage
- **API Integration**: Custom services for store data, products, gamification

### Development Tools
- **Build System**: Vite with TypeScript
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint 9 + TypeScript ESLint
- **Package Manager**: NPM with lockfile v3

## 🚀 Quick Start Commands

```bash
# Development
cd "C:\Users\David\Apps\Quick-Shop"
npm install
npm run dev                 # Start dev server
npm run build              # Production build
npm run preview            # Preview build locally

# Testing
npm run test               # Run tests
npm run test:coverage      # Test with coverage
npm run typecheck          # TypeScript validation

# Mobile Development
npm run cap:build          # Build and sync Capacitor
npm run cap:ios           # Open iOS project
npm run cap:android       # Open Android project

# Testing Automation
cd cartpilot-testing/automation
npm install
node overnight-automation.js    # Run full automation suite
```

## 🔧 Current Development Status

### ✅ Recently Completed
- **Change Password**: Secure password change functionality with validation
- **Premium Dashboard**: Fixed grey boxes issue and improved UI
- **Authentication**: Enhanced user profile system with Supabase integration
- **Automated Testing**: Daily overnight automation with Notion sync

### 🔄 Active Issues to Address
1. **CartPilot Premium Dashboard**: Grey boxes display issue
2. **Duplicate Banners**: Remove extra "Install CartPilot" banners, keep footer only
3. **Tesco Display**: Show full shop title instead of just brand name
4. **Store Filtering**: Focus on supermarkets/express, remove independent shops
5. **Test Configuration**: Fix failing test scripts in automation suite

### 🎯 Integration Workflows

#### Automated Daily Reports
- **Schedule**: 1:00 AM daily via Windows Task Scheduler
- **Process**: Code analysis → Git status → Notion sync → Progress reports
- **Output**: `cartpilot-testing/docs/progress-reports/`
- **Notion Updates**: Automatic project status sync

#### Git Workflow
- **Main Branch**: Direct pushes with automated testing
- **Commit Style**: Conventional commits with Claude co-authoring
- **Auto-sync**: Vercel deployment on push to main

## 📁 Key File Locations

### Core Application
```
src/
├── components/           # React components
│   ├── ui/              # Radix UI components
│   ├── CartPilot.tsx    # Main app component
│   ├── UserProfile.tsx  # User authentication & profile
│   └── ChangePasswordModal.tsx  # Password management
├── contexts/            # React contexts for state
├── hooks/               # Custom React hooks (useAuth, etc.)
├── lib/                 # Utilities and services
├── services/            # API and business logic
└── types/               # TypeScript definitions
```

### Configuration Files
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite build configuration
- `tailwind.config.ts` - Tailwind CSS setup
- `capacitor.config.ts` - Mobile app configuration
- `vercel.json` - Vercel deployment settings

### Testing & Automation
```
cartpilot-testing/
├── automation/          # Automated testing scripts
├── docs/               # Progress reports and documentation
└── api-tests/          # API testing suites
```

## 🔐 Environment & Secrets

### Required Environment Variables
```bash
VITE_SUPABASE_URL=        # Supabase project URL
VITE_SUPABASE_ANON_KEY=   # Supabase anonymous key
```

### API Integrations
- **Supabase**: Database, auth, and storage
- **Notion API**: Automated reporting and project sync
- **GitHub API**: Repository integration for automation

## 🐛 Known Issues & Solutions

### Line Endings (Windows)
- **Issue**: CRLF/LF warnings in Git
- **Status**: Non-blocking, cosmetic warnings only

### Test Scripts Missing
- **Issue**: Some npm test scripts not configured
- **Impact**: Automation suite shows partial results
- **Solution**: Configure missing test commands in package.json

### Supabase Connection
- **Status**: Working correctly with user profiles table
- **Test**: Available via UserProfile component "Test Database Connection"

## 📊 Performance & Monitoring

### Automated Reporting
- **Daily Reports**: JSON format in progress-reports/
- **Metrics Tracked**: Code analysis, commit status, test results
- **Notion Integration**: Real-time project dashboard updates

### Deployment Status
- **Vercel**: Auto-deployment on git push
- **Build Status**: Monitor via Vercel dashboard
- **Performance**: Lighthouse scores tracked

## 🎯 Next Development Priorities

1. **UI Fixes**: Premium dashboard grey boxes and duplicate banners
2. **Store Data**: Improve Tesco display and filter independent shops  
3. **Testing**: Fix test automation configuration
4. **Mobile**: Ensure iOS/Android builds work correctly
5. **Performance**: Optimize bundle size and loading speeds

---

## 💡 Developer Onboarding

To pick up development on this project:

1. **Clone & Setup**: `git clone` → `npm install` → configure `.env`
2. **Review Current Issues**: Check todo list and recent commits
3. **Test Integration**: Run database test from UserProfile component
4. **Check Automation**: Review overnight-automation logs
5. **Deploy Changes**: Push to main triggers Vercel deployment

**Key Files to Understand**: 
- `src/components/CartPilot.tsx` (main app)
- `src/hooks/useAuth.ts` (authentication)
- `cartpilot-testing/automation/overnight-automation.js` (automation)

This project has active Notion, GitHub, and Vercel integrations running smoothly. The automation suite provides daily health checks and progress tracking.