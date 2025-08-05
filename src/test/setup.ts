import '@testing-library/jest-dom'

// Mock navigator.geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn().mockImplementation((success) => 
      success({
        coords: {
          latitude: 51.5074,
          longitude: -0.1278
        }
      })
    ),
    watchPosition: vi.fn(),
    clearWatch: vi.fn()
  }
})

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn()
})

// Mock window.open
Object.defineProperty(window, 'open', {
  value: vi.fn()
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
})

// Mock fetch
global.fetch = vi.fn()

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}