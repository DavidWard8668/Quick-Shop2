import { describe, it, expect, vi, beforeEach } from 'vitest'
import { openMapsNavigation, calculateDistance, estimateTravelTime, isNavigationAvailable } from '../../services/navigationService'

// Mock window.open
const mockWindowOpen = vi.fn()
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true
})

describe('navigationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      writable: true
    })
  })

  describe('openMapsNavigation', () => {
    it('opens Google Maps for desktop', async () => {
      const destination = {
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test Store',
        address: '123 Test Street'
      }

      await openMapsNavigation(destination)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('google.com/maps'),
        '_blank'
      )
    })

    it('opens Apple Maps on iOS', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      })

      const destination = {
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test Store'
      }

      await openMapsNavigation(destination)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('maps://'),
        '_system'
      )
    })

    it('opens Google Maps on Android', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)',
        writable: true
      })

      const destination = {
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test Store'
      }

      await openMapsNavigation(destination)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('geo:'),
        '_system'
      )
    })

    it('falls back to Google Maps on error', async () => {
      mockWindowOpen.mockImplementationOnce(() => {
        throw new Error('Navigation failed')
      })

      const destination = {
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test Store',
        address: '123 Test Street'
      }

      await openMapsNavigation(destination)

      // Should call twice - once for primary attempt, once for fallback
      expect(mockWindowOpen).toHaveBeenCalledTimes(2)
      expect(mockWindowOpen).toHaveBeenLastCalledWith(
        expect.stringContaining('google.com/maps/search'),
        '_blank'
      )
    })
  })

  describe('calculateDistance', () => {
    it('calculates distance between two points correctly', () => {
      // Distance between London and Birmingham (approximately 100 miles)
      const london = { lat: 51.5074, lng: -0.1278 }
      const birmingham = { lat: 52.4862, lng: -1.8904 }
      
      const distance = calculateDistance(london.lat, london.lng, birmingham.lat, birmingham.lng)
      
      // Should be approximately 100 miles (allowing for some variance)
      expect(distance).toBeGreaterThan(90)
      expect(distance).toBeLessThan(110)
    })

    it('returns 0 for same location', () => {
      const distance = calculateDistance(51.5074, -0.1278, 51.5074, -0.1278)
      expect(distance).toBe(0)
    })
  })

  describe('estimateTravelTime', () => {
    it('estimates driving time correctly', () => {
      const time = estimateTravelTime(25, 'driving') // 25 miles at 25mph average
      expect(time).toBe(60) // Should be 1 hour = 60 minutes
    })

    it('estimates walking time correctly', () => {
      const time = estimateTravelTime(3, 'walking') // 3 miles at 3mph
      expect(time).toBe(60) // Should be 1 hour = 60 minutes
    })

    it('estimates transit time correctly', () => {
      const time = estimateTravelTime(15, 'transit') // 15 miles at 15mph
      expect(time).toBe(60) // Should be 1 hour = 60 minutes
    })

    it('defaults to driving mode', () => {
      const time = estimateTravelTime(25) // No mode specified
      expect(time).toBe(60) // Should use driving (25mph)
    })
  })

  describe('isNavigationAvailable', () => {
    it('returns true when geolocation is available', () => {
      // geolocation is already mocked in setup.ts
      expect(isNavigationAvailable()).toBe(true)
    })

    it('returns false when geolocation is not available', () => {
      // Temporarily mock navigator without geolocation
      const originalNavigator = global.navigator
      // @ts-ignore
      delete global.navigator
      global.navigator = {} as Navigator
      
      expect(isNavigationAvailable()).toBe(false)
      
      // Restore original navigator
      global.navigator = originalNavigator
    })
  })
})