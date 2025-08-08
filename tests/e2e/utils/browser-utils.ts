import { Browser, BrowserContext, Page } from '@playwright/test';

export async function clearBrowserCache(browser: Browser) {
  const context = await browser.newContext();
  await context.clearCookies();
  await context.clearPermissions();
  await context.close();
}

export async function setupMobileContext(browser: Browser, device?: string) {
  const contextOptions: any = {
    // Mobile viewport
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    
    // Enable touch events
    hasTouch: true,
    isMobile: true,
    
    // Set locale for UK testing
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    
    // Permissions for location and camera (for barcode scanning)
    permissions: ['geolocation', 'camera'],
    
    // Geolocation for London, UK (for testing store finder)
    geolocation: { latitude: 51.5074, longitude: -0.1278 },
    
    // Reduce motion for more stable tests
    reducedMotion: 'reduce',
  };

  // Device-specific configurations
  if (device === 'android') {
    contextOptions.userAgent = 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';
  } else if (device === 'tablet') {
    contextOptions.viewport = { width: 768, height: 1024 };
    contextOptions.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
  }

  return await browser.newContext(contextOptions);
}

export async function waitForNetworkIdle(page: Page, timeout: number = 30000) {
  await page.waitForLoadState('networkidle', { timeout });
}

export async function takeScreenshotOnFailure(page: Page, testName: string, step: string) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${testName}-${step}-${timestamp}.png`;
    await page.screenshot({
      path: `test-results/screenshots/${filename}`,
      fullPage: true
    });
    console.log(`📸 Screenshot saved: ${filename}`);
  } catch (error) {
    console.warn('Could not take screenshot:', error);
  }
}

export async function mockGeolocation(page: Page, latitude: number = 51.5074, longitude: number = -0.1278) {
  await page.addInitScript(`
    // Mock geolocation API
    navigator.geolocation = {
      getCurrentPosition: (success, error) => {
        setTimeout(() => {
          success({
            coords: {
              latitude: ${latitude},
              longitude: ${longitude},
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          });
        }, 100);
      },
      watchPosition: (success, error) => {
        return setTimeout(() => {
          success({
            coords: {
              latitude: ${latitude},
              longitude: ${longitude},
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          });
        }, 100);
      },
      clearWatch: () => {}
    };

    // Mock permissions API
    navigator.permissions = navigator.permissions || {};
    navigator.permissions.query = navigator.permissions.query || function(params) {
      return Promise.resolve({
        state: params.name === 'geolocation' ? 'granted' : 'denied',
        onchange: null
      });
    };
  `);
}

export async function mockBarcodeScanner(page: Page) {
  await page.addInitScript(`
    // Mock barcode scanner functionality
    window.mockBarcodeResult = null;
    
    // Mock getUserMedia for camera access
    navigator.mediaDevices = navigator.mediaDevices || {};
    navigator.mediaDevices.getUserMedia = function(constraints) {
      // Simulate camera access for barcode scanning
      if (constraints.video) {
        return Promise.resolve({
          getVideoTracks: () => [{
            stop: () => {},
            getSettings: () => ({ width: 640, height: 480 })
          }]
        });
      }
      return Promise.reject(new Error('No video requested'));
    };
    
    // Mock barcode detection
    window.BarcodeDetector = function() {
      return {
        detect: () => {
          if (window.mockBarcodeResult) {
            return Promise.resolve([{
              rawValue: window.mockBarcodeResult,
              format: 'ean_13',
              cornerPoints: []
            }]);
          }
          return Promise.resolve([]);
        }
      };
    };
  `);
}

export async function simulateMobileGestures(page: Page) {
  // Add touch gesture simulation helpers
  await page.addInitScript(`
    window.simulateSwipe = async function(element, direction) {
      const rect = element.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;
      
      let endX = startX;
      let endY = startY;
      
      switch (direction) {
        case 'left':
          endX = startX - 100;
          break;
        case 'right':
          endX = startX + 100;
          break;
        case 'up':
          endY = startY - 100;
          break;
        case 'down':
          endY = startY + 100;
          break;
      }
      
      // Dispatch touch events
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: startX, clientY: startY }],
        bubbles: true
      });
      
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: endX, clientY: endY }],
        bubbles: true
      });
      
      const touchEnd = new TouchEvent('touchend', {
        touches: [],
        bubbles: true
      });
      
      element.dispatchEvent(touchStart);
      await new Promise(resolve => setTimeout(resolve, 50));
      element.dispatchEvent(touchMove);
      await new Promise(resolve => setTimeout(resolve, 50));
      element.dispatchEvent(touchEnd);
    };
  `);
}

export async function waitForToast(page: Page, expectedText?: string, timeout: number = 5000) {
  const toastLocator = page.locator('[data-testid="toast"], .toast, [role="status"]');
  
  await toastLocator.first().waitFor({ timeout });
  
  if (expectedText) {
    await toastLocator.filter({ hasText: expectedText }).first().waitFor({ timeout });
  }
  
  return toastLocator.first();
}

export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function setLocalStorageItem(page: Page, key: string, value: string) {
  await page.evaluate(([key, value]) => {
    localStorage.setItem(key, value);
  }, [key, value]);
}

export async function installPWA(page: Page) {
  // Simulate PWA installation prompt
  await page.evaluate(() => {
    // Trigger beforeinstallprompt event
    const event = new Event('beforeinstallprompt');
    (event as any).prompt = () => Promise.resolve();
    (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(event);
  });
}