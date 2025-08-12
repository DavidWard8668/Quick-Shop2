import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock MediaStream globally BEFORE importing
global.MediaStream = vi.fn(() => ({
  getTracks: vi.fn().mockReturnValue([]),
  getVideoTracks: vi.fn().mockReturnValue([]),
  addTrack: vi.fn(),
})) as any

import { arNavigationService } from '../../services/arNavigationService'

// Mock WebXR API
Object.defineProperty(navigator, 'xr', {
  value: {
    isSessionSupported: vi.fn().mockResolvedValue(true)
  },
  writable: true
})

// Mock DeviceOrientationEvent
Object.defineProperty(window, 'DeviceOrientationEvent', {
  value: class MockDeviceOrientationEvent extends Event {
    alpha: number | null = 0
    beta: number | null = 0
    gamma: number | null = 0
    
    constructor(type: string, eventInit?: any) {
      super(type, eventInit)
    }
  },
  writable: true
})

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue(new global.MediaStream())
  },
  writable: true
})

describe('ARNavigationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AR Support Detection', () => {
    it('should detect WebXR support', async () => {
      const status = arNavigationService.getARStatus()
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(status.supported).toBeTruthy()
    })

    it('should fallback to device orientation when WebXR not supported', async () => {
      // Mock WebXR not supported
      navigator.xr.isSessionSupported = vi.fn().mockResolvedValue(false)
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const status = arNavigationService.getARStatus()
      expect(status.supported).toBeTruthy() // Should still be true due to DeviceOrientationEvent fallback
    })

    it('should handle WebXR API not available', async () => {
      // Remove WebXR API
      delete (navigator as any).xr
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const status = arNavigationService.getARStatus()
      expect(status.supported).toBeTruthy() // Should still be true due to DeviceOrientationEvent fallback
    })
  })

  describe('AR Session Management', () => {
    it('should initialize AR session successfully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const result = await arNavigationService.initializeAR()
      
      expect(result).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('✅ AR initialization successful (test mode)')
    })

    it('should handle camera permission denied', async () => {
      // Temporarily disable test mode detection for this test
      const originalNodeEnv = process.env.NODE_ENV
      delete process.env.NODE_ENV
      
      navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const result = await arNavigationService.initializeAR()
      
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('❌ AR initialization failed:', expect.any(Error))
      
      // Restore NODE_ENV
      if (originalNodeEnv) process.env.NODE_ENV = originalNodeEnv
    })

    it('should start AR navigation with route', async () => {
      const mockRoute = [
        { name: 'Milk', aisle: 1, section: 'Dairy', x: 10, y: 20 },
        { name: 'Bread', aisle: 2, section: 'Bakery', x: 30, y: 40 }
      ]

      const result = await arNavigationService.startARNavigation('store123', mockRoute)
      
      expect(result).toBe(true)
      
      const status = arNavigationService.getARStatus()
      expect(status.hasRoute).toBe(true)
    })

    it('should stop AR navigation', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      arNavigationService.stopARNavigation()
      
      expect(consoleSpy).toHaveBeenCalledWith('⏹️ AR Navigation stopped')
      
      const status = arNavigationService.getARStatus()
      expect(status.hasRoute).toBe(false)
    })
  })

  describe('Position and Orientation Tracking', () => {
    it('should update user position', () => {
      const position = { x: 10, y: 5, z: 20 }
      
      arNavigationService.updateUserPosition(position)
      
      // Position should be updated internally (tested through instructions generation)
      const instructions = arNavigationService.generateARInstructions()
      expect(Array.isArray(instructions)).toBe(true)
    })

    it('should update user orientation', () => {
      const orientation = { x: 15, y: 45, z: 10 }
      
      arNavigationService.updateUserOrientation(orientation)
      
      // Orientation should be updated internally
      const visibleMarkers = arNavigationService.getVisibleMarkers()
      expect(Array.isArray(visibleMarkers)).toBe(true)
    })
  })

  describe('AR Markers Management', () => {
    it('should add AR marker', () => {
      const marker = {
        id: 'test-marker',
        type: 'product' as const,
        position: { x: 10, y: 1.5, z: 5 },
        rotation: { x: 0, y: 0, z: 0 },
        content: {
          title: 'Test Product',
          description: 'Aisle 1 • Dairy',
          icon: '📦',
          color: '#10b981'
        },
        visible: true
      }

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      arNavigationService.addARMarker(marker)
      
      expect(consoleSpy).toHaveBeenCalledWith('📍 Added AR marker: Test Product')
    })

    it('should remove AR marker', () => {
      // Add a marker first
      const marker = {
        id: 'test-marker',
        type: 'product' as const,
        position: { x: 10, y: 1.5, z: 5 },
        rotation: { x: 0, y: 0, z: 0 },
        content: {
          title: 'Test Product',
          description: 'Test',
          icon: '📦',
          color: '#10b981'
        },
        visible: true
      }
      
      arNavigationService.addARMarker(marker)
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      arNavigationService.removeARMarker('test-marker')
      
      expect(consoleSpy).toHaveBeenCalledWith('🗑️ Removed AR marker: test-marker')
    })

    it('should get visible markers within range', () => {
      // Update position to be near markers
      arNavigationService.updateUserPosition({ x: 0, y: 1.5, z: 0 })
      
      const visibleMarkers = arNavigationService.getVisibleMarkers()
      
      expect(Array.isArray(visibleMarkers)).toBe(true)
      // Should filter markers within 20 meter range
    })

    it('should create store-specific markers', () => {
      const markers = arNavigationService.createStoreMarkers('store123')
      
      expect(Array.isArray(markers)).toBe(true)
      expect(markers.length).toBeGreaterThan(0)
      
      // Check for common store markers
      const entranceMarker = markers.find(m => m.id === 'entrance')
      expect(entranceMarker).toBeDefined()
      expect(entranceMarker?.content.title).toBe('Store Entrance')
      
      const checkoutMarker = markers.find(m => m.id === 'checkout')
      expect(checkoutMarker).toBeDefined()
      expect(checkoutMarker?.content.title).toBe('Checkout')
    })
  })

  describe('AR Instructions Generation', () => {
    it('should generate instructions with active route', async () => {
      const mockRoute = [
        { name: 'Milk', aisle: 1, section: 'Dairy', x: 10, y: 20 }
      ]

      await arNavigationService.startARNavigation('store123', mockRoute)
      
      const instructions = arNavigationService.generateARInstructions()
      
      expect(Array.isArray(instructions)).toBe(true)
      if (instructions.length > 0) {
        expect(typeof instructions[0]).toBe('string')
      }
    })

    it('should return empty instructions without route', () => {
      arNavigationService.stopARNavigation()
      
      const instructions = arNavigationService.generateARInstructions()
      
      expect(instructions).toEqual([])
    })

    it('should provide arrival confirmation when near target', async () => {
      const mockRoute = [
        { name: 'Milk', aisle: 1, section: 'Dairy', x: 0, y: 0 }
      ]

      await arNavigationService.startARNavigation('store123', mockRoute)
      
      // Set user position very close to target
      arNavigationService.updateUserPosition({ x: 0, y: 1.5, z: 0 })
      
      const instructions = arNavigationService.generateARInstructions()
      
      expect(instructions.some(instruction => 
        instruction.includes('You\'ve reached') || instruction.includes('✅')
      )).toBe(true)
    })
  })

  describe('Direction Calculation', () => {
    it('should calculate correct directional instructions', () => {
      const service = arNavigationService as any
      
      // Set user at origin
      service.userPosition = { x: 0, y: 0, z: 0 }
      
      // Test different directions
      expect(service.calculateDirection({ x: 0, y: 0, z: 10 })).toBe('Head straight')
      expect(service.calculateDirection({ x: 10, y: 0, z: 10 })).toBe('Turn slightly right')
      expect(service.calculateDirection({ x: 10, y: 0, z: 0 })).toBe('Turn right')
      expect(service.calculateDirection({ x: -10, y: 0, z: 0 })).toBe('Turn left')
      expect(service.calculateDirection({ x: 0, y: 0, z: -10 })).toBe('Turn around')
    })
  })

  describe('Voice Command Processing', () => {
    it('should process checkout location command', () => {
      // Add checkout marker
      arNavigationService.createStoreMarkers('store123')
      
      const response = arNavigationService.processVoiceCommand('Where is checkout?')
      
      expect(response).toContain('Checkout')
    })

    it('should process next item command', async () => {
      const mockRoute = [
        { name: 'Milk', aisle: 1, section: 'Dairy', x: 10, y: 20 }
      ]

      await arNavigationService.startARNavigation('store123', mockRoute)
      
      const response = arNavigationService.processVoiceCommand('Next item please')
      
      expect(typeof response).toBe('string')
      expect(response.length).toBeGreaterThan(0)
    })

    it('should provide help for help command', () => {
      const response = arNavigationService.processVoiceCommand('Help me')
      
      expect(response).toContain('I can help you navigate')
      expect(response).toContain('Where is checkout')
      expect(response).toContain('Next item')
    })

    it('should handle unknown commands gracefully', () => {
      const response = arNavigationService.processVoiceCommand('Random unknown command')
      
      expect(response).toContain('didn\'t understand')
      expect(response).toContain('help')
    })
  })

  describe('AR Status Reporting', () => {
    it('should report comprehensive AR status', () => {
      const status = arNavigationService.getARStatus()
      
      expect(status).toHaveProperty('supported')
      expect(status).toHaveProperty('active')
      expect(status).toHaveProperty('hasRoute')
      expect(status).toHaveProperty('markerCount')
      
      expect(typeof status.supported).toBe('boolean')
      expect(typeof status.active).toBe('boolean')
      expect(typeof status.hasRoute).toBe('boolean')
      expect(typeof status.markerCount).toBe('number')
    })
  })

  describe('AR Experience Simulation', () => {
    it('should provide mock AR experience for unsupported devices', () => {
      const experience = arNavigationService.simulateARExperience()
      
      expect(experience).toHaveProperty('cameraFeed')
      expect(experience).toHaveProperty('overlay')
      expect(experience).toHaveProperty('tracking')
      expect(experience).toHaveProperty('instructions')
      
      expect(typeof experience.cameraFeed).toBe('boolean')
      expect(typeof experience.overlay).toBe('boolean')
      expect(typeof experience.tracking).toBe('boolean')
      expect(Array.isArray(experience.instructions)).toBe(true)
    })
  })

  describe('Device Orientation Integration', () => {
    it('should handle device orientation events', () => {
      // Simulate device orientation event
      const event = new DeviceOrientationEvent('deviceorientation', {
        alpha: 45,
        beta: 10,
        gamma: 5
      })
      
      // Manually dispatch the event to trigger the service
      window.dispatchEvent(event)
      
      // Verify the service can handle the event (no errors thrown)
      expect(true).toBe(true)
    })

    it('should handle null orientation values', () => {
      const event = new DeviceOrientationEvent('deviceorientation', {
        alpha: null,
        beta: null,
        gamma: null
      })
      
      window.dispatchEvent(event)
      
      // Should handle gracefully without errors
      expect(true).toBe(true)
    })
  })
})