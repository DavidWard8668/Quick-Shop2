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

// Mock WebXR API
Object.defineProperty(navigator, 'xr', {
  value: {
    isSessionSupported: vi.fn().mockResolvedValue(false)
  },
  writable: true,
  configurable: true
})

// Mock DeviceOrientationEvent
Object.defineProperty(window, 'DeviceOrientationEvent', {
  value: class MockDeviceOrientationEvent extends Event {
    alpha: number | null = null
    beta: number | null = null
    gamma: number | null = null
    
    constructor(type: string, eventInit?: any) {
      super(type, eventInit)
      if (eventInit) {
        this.alpha = eventInit.alpha || null
        this.beta = eventInit.beta || null
        this.gamma = eventInit.gamma || null
      }
    }
  },
  writable: true,
  configurable: true
})

// Mock MediaStream
global.MediaStream = vi.fn(() => ({
  getTracks: vi.fn().mockReturnValue([]),
  getVideoTracks: vi.fn().mockReturnValue([]),
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
  active: true,
  id: 'mock-stream-id'
})) as any

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue(new (global.MediaStream as any)())
  },
  writable: true,
  configurable: true
})

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted')
  },
  writable: true,
  configurable: true
})

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve({
      pushManager: {
        subscribe: vi.fn().mockResolvedValue({
          endpoint: 'mock-endpoint',
          getKey: vi.fn()
        })
      }
    }),
    register: vi.fn().mockResolvedValue({
      pushManager: {
        subscribe: vi.fn().mockResolvedValue({
          endpoint: 'mock-endpoint',
          getKey: vi.fn()
        })
      }
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  writable: true,
  configurable: true
})

// Mock Caches API
Object.defineProperty(window, 'caches', {
  value: {
    delete: vi.fn().mockResolvedValue(true),
    keys: vi.fn().mockResolvedValue(['cache1']),
    match: vi.fn().mockResolvedValue(undefined)
  },
  writable: true,
  configurable: true
})

// Mock Connection API
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  },
  writable: true,
  configurable: true
})

// Mock WebSocket
global.WebSocket = vi.fn(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.CONNECTING,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
})) as any

// Mock performance
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn().mockReturnValue(Date.now()),
    mark: vi.fn(),
    measure: vi.fn()
  },
  writable: true
})