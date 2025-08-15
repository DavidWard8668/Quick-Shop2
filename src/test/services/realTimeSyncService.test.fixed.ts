import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock WebSocket before importing the service
class MockWebSocket {
  public readyState = WebSocket.CONNECTING
  public onopen: ((event: Event) => void) | null = null
  public onclose: ((event: CloseEvent) => void) | null = null  
  public onmessage: ((event: MessageEvent) => void) | null = null
  public onerror: ((event: Event) => void) | null = null
  public sendMock = vi.fn()

  constructor(public url: string) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  send(data: string) {
    this.sendMock(data)
  }

  close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000, reason: reason || 'Manual close' }))
    }
  }
}

global.WebSocket = MockWebSocket as any
global.WebSocket.CONNECTING = 0
global.WebSocket.OPEN = 1
global.WebSocket.CLOSING = 2
global.WebSocket.CLOSED = 3

// Now import the service
import { realTimeSyncService } from '../../services/realTimeSyncService'

describe('RealTimeSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
  })

  afterEach(() => {
    realTimeSyncService.disconnect()
  })

  describe('Connection Management', () => {
    it('should connect when online', async () => {
      await realTimeSyncService.connect()
      
      // Wait for mock WebSocket to open and onOpen to be called
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // The service should be connected now
      expect(realTimeSyncService.isConnected()).toBe(true)
    })

    it('should not connect when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      await realTimeSyncService.connect()
      
      expect(realTimeSyncService.isConnected()).toBe(false)
    })

    it('should disconnect cleanly', async () => {
      await realTimeSyncService.connect()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      realTimeSyncService.disconnect()
      
      expect(realTimeSyncService.isConnected()).toBe(false)
    })
  })

  describe('Event System', () => {
    it('should register and trigger event listeners', async () => {
      const mockCallback = vi.fn()
      
      realTimeSyncService.on('connected', mockCallback)
      await realTimeSyncService.connect()
      
      // Wait for connection event
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(mockCallback).toHaveBeenCalled()
    })

    it('should remove event listeners', () => {
      const mockCallback = vi.fn()
      
      realTimeSyncService.on('connected', mockCallback)
      realTimeSyncService.off('connected', mockCallback)
      
      realTimeSyncService.connect()
      
      setTimeout(() => {
        expect(mockCallback).not.toHaveBeenCalled()
      }, 100)
    })
  })

  describe('Sync Operations', () => {
    it('should sync cart updates', async () => {
      await realTimeSyncService.connect()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const cartItems = [
        { id: '1', name: 'Milk', completed: false },
        { id: '2', name: 'Bread', completed: true }
      ]
      
      // The sync should either send via WebSocket or queue it
      await realTimeSyncService.syncCartUpdate(cartItems, 'user123')
      
      // Check that either the WebSocket sent it or it was queued
      const service = realTimeSyncService as any
      if (service.ws && service.ws.sendMock) {
        expect(service.ws.sendMock).toHaveBeenCalled()
      } else {
        expect(realTimeSyncService.getPendingOperations()).toBeGreaterThan(0)
      }
    })

    it('should sync route generation', async () => {
      await realTimeSyncService.connect()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const route = [
        { name: 'Milk', aisle: 1, section: 'Dairy' },
        { name: 'Bread', aisle: 2, section: 'Bakery' }
      ]
      
      await realTimeSyncService.syncRouteGenerated(route, 'user123', 'store456')
      
      // Check that either the WebSocket sent it or it was queued
      const service = realTimeSyncService as any
      if (service.ws && service.ws.sendMock) {
        expect(service.ws.sendMock).toHaveBeenCalled()
      } else {
        expect(realTimeSyncService.getPendingOperations()).toBeGreaterThan(0)
      }
    })

    it('should queue sync events when disconnected', async () => {
      const cartItems = [{ id: '1', name: 'Test', completed: false }]
      
      await realTimeSyncService.syncCartUpdate(cartItems, 'user123')
      
      expect(realTimeSyncService.getPendingOperations()).toBeGreaterThan(0)
    })
  })

  describe('Status Tracking', () => {
    it('should report correct connection status', () => {
      const status = realTimeSyncService.getStatus()
      
      expect(status).toHaveProperty('connected')
      expect(status).toHaveProperty('lastSync')
      expect(status).toHaveProperty('pendingOperations')
      expect(status).toHaveProperty('retryCount')
    })

    it('should track pending operations', async () => {
      const initialPending = realTimeSyncService.getPendingOperations()
      
      await realTimeSyncService.syncCartUpdate([], 'user123')
      
      expect(realTimeSyncService.getPendingOperations()).toBe(initialPending + 1)
    })

    it('should clear sync queue', () => {
      realTimeSyncService.syncCartUpdate([], 'user123')
      
      expect(realTimeSyncService.getPendingOperations()).toBeGreaterThan(0)
      
      realTimeSyncService.clearSyncQueue()
      
      expect(realTimeSyncService.getPendingOperations()).toBe(0)
    })
  })

  describe('Message Handling', () => {
    it('should handle cart sync messages', async () => {
      const mockCallback = vi.fn()
      
      realTimeSyncService.on('cartSync', mockCallback)
      
      await realTimeSyncService.connect()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const mockMessage = {
        type: 'cart',
        action: 'update',
        data: { items: [] },
        userId: 'user123'
      }
      
      const service = realTimeSyncService as any
      service.handleSyncMessage(mockMessage)
      
      expect(mockCallback).toHaveBeenCalledWith({
        action: 'update',
        data: { items: [] },
        userId: 'user123'
      })
    })

    it('should handle unknown message types gracefully', async () => {
      await realTimeSyncService.connect()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const mockMessage = {
        type: 'unknown',
        action: 'test',
        data: {}
      }
      
      expect(() => {
        const service = realTimeSyncService as any
        service.handleSyncMessage(mockMessage)
      }).not.toThrow()
    })
  })

  describe('Utility Functions', () => {
    it('should generate unique sync IDs', () => {
      const service = realTimeSyncService as any
      const id1 = service.generateSyncId()
      const id2 = service.generateSyncId()
      
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^sync_\d+_[a-z0-9]+$/)
    })

    it('should determine correct WebSocket URL'
