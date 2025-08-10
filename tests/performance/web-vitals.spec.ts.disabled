import { test, expect } from '@playwright/test';
import { mockGeolocation } from '../e2e/utils/browser-utils';

test.describe('Web Vitals Performance Testing', () => {
  test.beforeEach(async ({ page }) => {
    await mockGeolocation(page);
  });

  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'web-vitals-001' });
    
    // Navigate to the application
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("CARTPILOT")', { timeout: 10000 });
    
    // Measure Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        let metricsCollected = 0;
        const totalMetrics = 3; // LCP, FID, CLS
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
          metricsCollected++;
          if (metricsCollected === totalMetrics) resolve(vitals);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            vitals.fid = entry.processingStart - entry.startTime;
            metricsCollected++;
            if (metricsCollected === totalMetrics) resolve(vitals);
          });
        }).observe({ entryTypes: ['first-input'] });
        
        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.cls = clsValue;
          metricsCollected++;
          if (metricsCollected === totalMetrics) resolve(vitals);
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Fallback timeout
        setTimeout(() => {
          resolve(vitals);
        }, 10000);
      });
    });
    
    console.log('📊 Web Vitals:', webVitals);
    
    // Assertions based on Core Web Vitals thresholds
    if (webVitals.lcp !== undefined) {
      expect(webVitals.lcp).toBeLessThan(2500); // LCP should be under 2.5s
      console.log(`✅ LCP: ${webVitals.lcp.toFixed(0)}ms (target: <2500ms)`);
    }
    
    if (webVitals.fid !== undefined) {
      expect(webVitals.fid).toBeLessThan(100); // FID should be under 100ms
      console.log(`✅ FID: ${webVitals.fid.toFixed(0)}ms (target: <100ms)`);
    }
    
    if (webVitals.cls !== undefined) {
      expect(webVitals.cls).toBeLessThan(0.1); // CLS should be under 0.1
      console.log(`✅ CLS: ${webVitals.cls.toFixed(3)} (target: <0.1)`);
    }
  });

  test('should load critical resources quickly', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'web-vitals-002' });
    
    const startTime = Date.now();
    
    // Navigate and wait for critical elements
    await page.goto('/');
    await page.waitForSelector('h1:has-text("CARTPILOT")');
    await page.waitForSelector('button:has-text("📍 Stores")');
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Critical resources loaded in: ${loadTime}ms`);
    
    // Critical resources should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('should have acceptable JavaScript bundle size', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'web-vitals-003' });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get JavaScript bundle sizes
    const bundles = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      return entries
        .filter(entry => entry.name.endsWith('.js'))
        .map(entry => ({
          name: entry.name,
          size: entry.transferSize || entry.decodedBodySize,
          compressed: entry.encodedBodySize
        }));
    });
    
    const totalJSSize = bundles.reduce((sum, bundle) => sum + (bundle.size || 0), 0);
    const totalCompressedSize = bundles.reduce((sum, bundle) => sum + (bundle.compressed || 0), 0);
    
    console.log(`📦 Total JS bundle size: ${(totalJSSize / 1024).toFixed(1)}KB`);
    console.log(`📦 Total compressed size: ${(totalCompressedSize / 1024).toFixed(1)}KB`);
    
    // Bundle size should be reasonable for a PWA
    expect(totalJSSize).toBeLessThan(1024 * 1024); // Under 1MB uncompressed
    expect(totalCompressedSize).toBeLessThan(300 * 1024); // Under 300KB compressed
  });

  test('should have good Time to Interactive', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'web-vitals-004' });
    
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for the app to be interactive
    await page.waitForLoadState('networkidle');
    
    // Test interactivity by clicking a button
    await page.locator('button:has-text("📍 Stores")').click();
    await expect(page.locator('input[placeholder*="postcode"]')).toBeVisible();
    
    const interactiveTime = Date.now() - startTime;
    
    console.log(`🖱️ Time to Interactive: ${interactiveTime}ms`);
    
    // TTI should be under 3.5 seconds
    expect(interactiveTime).toBeLessThan(3500);
  });

  test('should maintain performance on mobile viewport', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'web-vitals-005' });
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('h1:has-text("CARTPILOT")');
    
    const mobileLoadTime = Date.now() - startTime;
    
    console.log(`📱 Mobile load time: ${mobileLoadTime}ms`);
    
    // Mobile performance should still be good
    expect(mobileLoadTime).toBeLessThan(3000);
    
    // Test mobile interaction
    await page.locator('button:has-text("📍 Stores")').click();
    await expect(page.locator('button:has-text("📍 Use My Location")')).toBeVisible();
  });

  test('should handle PWA performance metrics', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'web-vitals-006' });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for PWA features
    const pwaMetrics = await page.evaluate(() => {
      const metrics = {};
      
      // Check for service worker
      metrics.hasServiceWorker = 'serviceWorker' in navigator;
      
      // Check for manifest
      metrics.hasManifest = !!document.querySelector('link[rel="manifest"]');
      
      // Check for app shell cache
      if (metrics.hasServiceWorker) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          metrics.swRegistrations = registrations.length;
        });
      }
      
      // Check for offline capability indicators
      metrics.hasOfflineIndicators = !!document.querySelector('[data-testid*="offline"], .offline');
      
      return metrics;
    });
    
    console.log('📱 PWA Metrics:', pwaMetrics);
    
    // PWA should have basic requirements
    expect(pwaMetrics.hasServiceWorker).toBe(true);
    expect(pwaMetrics.hasManifest).toBe(true);
  });

  test('should optimize image loading', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'web-vitals-007' });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get image performance metrics
    const imageMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      const images = entries.filter(entry => 
        entry.initiatorType === 'img' || 
        entry.name.match(/\.(jpg|jpeg|png|webp|svg|ico)/)
      );
      
      return images.map(img => ({
        name: img.name,
        size: img.transferSize || img.decodedBodySize,
        loadTime: img.responseEnd - img.requestStart
      }));
    });
    
    console.log(`🖼️ Found ${imageMetrics.length} images`);
    
    // Check image optimization
    for (const image of imageMetrics) {
      console.log(`  📷 ${image.name.split('/').pop()}: ${(image.size / 1024).toFixed(1)}KB in ${image.loadTime.toFixed(0)}ms`);
      
      // Images should load reasonably fast
      expect(image.loadTime).toBeLessThan(2000);
      
      // Avoid huge images
      if (image.name.includes('icon') || image.name.includes('favicon')) {
        expect(image.size).toBeLessThan(50 * 1024); // Icons under 50KB
      } else {
        expect(image.size).toBeLessThan(500 * 1024); // Other images under 500KB
      }
    }
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Collect performance metrics for reporting
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalLoadTime: navigation.loadEventEnd - navigation.navigationStart,
        firstByte: navigation.responseStart - navigation.navigationStart
      };
    });
    
    console.log('📊 Performance Summary:', performanceMetrics);
    
    // Attach metrics to test info for reporting
    testInfo.annotations.push({
      type: 'performance-metrics',
      description: JSON.stringify(performanceMetrics)
    });
  });
});