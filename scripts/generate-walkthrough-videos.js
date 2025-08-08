#!/usr/bin/env node

/**
 * 🎬 CartPilot Automated Video Walkthrough Generator
 * 
 * Generates professional walkthrough videos using Playwright automation
 * Creates MP4 videos demonstrating all key features and user flows
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;

const VIDEO_CONFIG = {
  width: 1080,
  height: 1920, // Mobile portrait
  framerate: 30,
  quality: 90
};

const WALKTHROUGH_SCENARIOS = [
  {
    name: 'welcome-and-onboarding',
    title: 'Welcome to CartPilot - Getting Started',
    description: 'Complete walkthrough of user onboarding and tutorial system',
    duration: 120, // seconds
    steps: [
      'Load homepage',
      'Trigger tutorial modal',
      'Step through all tutorial pages',
      'Complete onboarding',
      'Show help button access'
    ]
  },
  {
    name: 'store-search-and-selection',
    title: 'Finding Your Perfect Store',
    description: 'Demonstrate store location and selection features',
    duration: 90,
    steps: [
      'Navigate to stores tab',
      'Use location services',
      'Search by postcode',
      'View store details',
      'Select favorite stores'
    ]
  },
  {
    name: 'smart-product-search',
    title: 'Intelligent Product Discovery',
    description: 'Showcase fuzzy search and product matching',
    duration: 75,
    steps: [
      'Navigate to search',
      'Demonstrate fuzzy matching',
      'Show dropdown suggestions',
      'Add products to cart',
      'Display product information'
    ]
  },
  {
    name: 'barcode-scanning-demo',
    title: 'Advanced Barcode Scanning',
    description: 'Camera-powered product identification',
    duration: 60,
    steps: [
      'Access barcode scanner',
      'Demonstrate camera interface',
      'Show scanning process',
      'Display product results',
      'Add scanned items'
    ]
  },
  {
    name: 'shopping-cart-and-routing',
    title: 'Smart Shopping Lists & Route Planning',
    description: 'Efficient shopping list management and optimization',
    duration: 105,
    steps: [
      'Build shopping list',
      'Add multiple items',
      'Use route planning',
      'Start shopping session',
      'Check off completed items'
    ]
  },
  {
    name: 'profile-and-rewards',
    title: 'Profile Management & Premium Features',
    description: 'User profiles, image upload, and gamification',
    duration: 90,
    steps: [
      'Sign in to account',
      'Access premium dashboard',
      'Upload profile image',
      'View points and achievements',
      'Explore rewards system'
    ]
  },
  {
    name: 'ai-store-mapping',
    title: 'Revolutionary AI Store Mapping',
    description: 'Computer vision-powered store layout creation',
    duration: 120,
    steps: [
      'Launch AI mapper',
      'Follow mapping instructions',
      'Capture store sections',
      'View AI analysis results',
      'Submit completed mapping'
    ]
  },
  {
    name: 'complete-shopping-journey',
    title: 'Complete CartPilot Experience',
    description: 'End-to-end demonstration of full shopping workflow',
    duration: 300,
    steps: [
      'Welcome and setup',
      'Find and select store',
      'Build shopping list',
      'Plan optimal route',
      'Navigate to store',
      'Complete shopping',
      'Earn rewards'
    ]
  }
];

class VideoWalkthroughGenerator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.outputDir = path.join(__dirname, '../videos');
  }

  async initialize() {
    console.log('🎬 Initializing CartPilot Video Generator...');
    
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Launch browser with video recording
    this.browser = await chromium.launch({
      headless: false, // Show browser for recording
      slowMo: 1000, // Slow down for better video
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--use-file-for-fake-video-capture=/dev/video0'
      ]
    });

    // Create mobile context
    const context = await this.browser.newContext({
      viewport: { width: VIDEO_CONFIG.width, height: VIDEO_CONFIG.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      permissions: ['geolocation', 'camera'],
      geolocation: { latitude: 51.5074, longitude: -0.1278 }, // London
      recordVideo: {
        dir: this.outputDir,
        size: { width: VIDEO_CONFIG.width, height: VIDEO_CONFIG.height }
      }
    });

    this.page = await context.newPage();

    // Set up fake media devices
    await this.page.addInitScript(() => {
      // Mock geolocation
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: {
            latitude: 51.5074,
            longitude: -0.1278,
            accuracy: 10
          }
        });
      };

      // Mock camera for barcode scanning
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Draw a fake barcode
        ctx.fillStyle = '#000';
        for (let i = 0; i < 640; i += 4) {
          if (Math.random() > 0.5) {
            ctx.fillRect(i, 200, 2, 80);
          }
        }
        
        const stream = canvas.captureStream();
        return stream;
      };
    });

    console.log('✅ Video generator initialized');
  }

  async generateWalkthrough(scenario) {
    console.log(`🎥 Recording: ${scenario.title}`);
    
    const videoPath = path.join(this.outputDir, `${scenario.name}.webm`);
    
    try {
      // Start recording
      await this.page.goto('https://cartpilot-sigma.vercel.app/', { 
        waitUntil: 'networkidle' 
      });

      // Add recording indicator
      await this.page.evaluate((title) => {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
          position: fixed;
          top: 20px;
          left: 20px;
          background: #ef4444;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          z-index: 10000;
          font-size: 14px;
        `;
        indicator.textContent = `🔴 REC: ${title}`;
        document.body.appendChild(indicator);
      }, scenario.title);

      // Execute scenario steps
      await this.executeScenarioSteps(scenario);

      // Wait for final animations
      await this.page.waitForTimeout(2000);

      console.log(`✅ Completed: ${scenario.name}`);
      
      return {
        name: scenario.name,
        title: scenario.title,
        path: videoPath,
        duration: scenario.duration
      };

    } catch (error) {
      console.error(`❌ Error recording ${scenario.name}:`, error);
      return null;
    }
  }

  async executeScenarioSteps(scenario) {
    const stepDelay = (scenario.duration * 1000) / scenario.steps.length;
    
    for (const [index, step] of scenario.steps.entries()) {
      console.log(`  📍 Step ${index + 1}/${scenario.steps.length}: ${step}`);
      
      await this.executeStep(step, scenario.name);
      await this.page.waitForTimeout(stepDelay);
    }
  }

  async executeStep(step, scenarioName) {
    switch (step.toLowerCase()) {
      case 'load homepage':
        await this.page.goto('https://cartpilot-sigma.vercel.app/');
        await this.page.waitForLoadState('networkidle');
        break;

      case 'trigger tutorial modal':
        await this.page.click('text=📚 Help');
        await this.page.waitForSelector('text=Welcome to CartPilot');
        break;

      case 'navigate to stores tab':
        await this.page.click('text=📍 Stores');
        await this.page.waitForTimeout(1000);
        break;

      case 'use location services':
        await this.page.click('text=📍 Use My Location');
        await this.page.waitForTimeout(3000);
        break;

      case 'search by postcode':
        await this.page.fill('input[placeholder*="postcode"]', 'M1 1AA');
        await this.page.click('text=🔍 Search');
        await this.page.waitForTimeout(2000);
        break;

      case 'navigate to search':
        await this.page.click('text=🧭 Navigate');
        await this.page.waitForTimeout(1000);
        break;

      case 'demonstrate fuzzy matching':
        await this.page.fill('input[placeholder*="search"]', 'chees');
        await this.page.waitForTimeout(1000);
        await this.page.fill('input[placeholder*="search"]', 'cheese');
        await this.page.waitForTimeout(1000);
        break;

      case 'access barcode scanner':
        await this.page.click('text=Add Product Location');
        await this.page.waitForTimeout(1000);
        await this.page.click('text=📷 Next: Scan Barcode');
        break;

      case 'sign in to account':
        await this.page.click('text=🔑 Sign In');
        await this.page.waitForSelector('input[type="email"]');
        break;

      case 'access premium dashboard':
        await this.page.click('text=👨‍✈️ Pilot');
        await this.page.waitForTimeout(1000);
        break;

      case 'launch ai mapper':
        await this.page.click('text=🤖 AI Map Store');
        await this.page.waitForTimeout(1000);
        break;

      // Add smooth scrolling between sections
      case 'scroll down':
        await this.page.evaluate(() => window.scrollBy(0, 300));
        break;

      case 'scroll up':
        await this.page.evaluate(() => window.scrollBy(0, -300));
        break;

      default:
        // Generic step - just wait
        await this.page.waitForTimeout(1000);
        break;
    }
  }

  async generateAllWalkthroughs() {
    const results = [];
    
    for (const scenario of WALKTHROUGH_SCENARIOS) {
      const result = await this.generateWalkthrough(scenario);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  async createVideoIndex(results) {
    const indexPath = path.join(this.outputDir, 'index.html');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>CartPilot Walkthrough Videos</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .video-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .video-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        video { width: 100%; border-radius: 4px; }
        h1 { color: #6366f1; }
        .duration { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <h1>🛒 CartPilot Walkthrough Videos</h1>
    <p>Professional demonstration videos showcasing all CartPilot features</p>
    
    <div class="video-grid">
        ${results.map(video => `
            <div class="video-card">
                <h3>${video.title}</h3>
                <video controls poster="/favicon.ico">
                    <source src="${path.basename(video.path)}" type="video/webm">
                    Your browser does not support the video tag.
                </video>
                <p class="duration">Duration: ${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}</p>
            </div>
        `).join('')}
    </div>
    
    <footer style="margin-top: 40px; color: #666; text-align: center;">
        Generated on ${new Date().toLocaleString()} by CartPilot Auto Video Generator
    </footer>
</body>
</html>
    `;
    
    await fs.writeFile(indexPath, html);
    console.log(`📄 Video index created: ${indexPath}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🧹 Cleanup completed');
  }
}

// Main execution
async function main() {
  const generator = new VideoWalkthroughGenerator();
  
  try {
    await generator.initialize();
    
    console.log('🎬 Starting video generation...');
    console.log(`📊 Will create ${WALKTHROUGH_SCENARIOS.length} walkthrough videos`);
    
    const results = await generator.generateAllWalkthroughs();
    
    await generator.createVideoIndex(results.filter(Boolean));
    
    console.log('🎉 Video generation completed!');
    console.log(`✅ Generated ${results.filter(Boolean).length} videos`);
    console.log(`📁 Videos saved to: ${generator.outputDir}`);
    
  } catch (error) {
    console.error('💥 Error during video generation:', error);
  } finally {
    await generator.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VideoWalkthroughGenerator, WALKTHROUGH_SCENARIOS };