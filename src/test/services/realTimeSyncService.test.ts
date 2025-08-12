import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { realTimeSyncService } from '../../services/realTimeSyncService'

// Mock WebSocket
class MockWebSocket {
  public readyState = WebSocket.CONNECTING
  public onopen: ((event: Event) => void) | null = null
  public onclose: ((event: CloseEvent) => void) | null = null  
  public onmessage: ((event: MessageEvent) => void) | null = null
  public onerror: ((event: Event) => void) | null = null

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  send(data: string) {
    // Mock send functionality
    console.log('MockWebSocket.send:', data)
  }

  close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000, reason: reason || 'Manual close' }))
    }
  }
}

// Setup WebSocket mock
global.WebSocket = MockWebSocket as any

describe('RealTimeSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset navigator.onLine to true
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
      
      // Wait for connection to establish (mock WebSocket opens after 10ms)
      await new Promise(resolve => setTimeout(resolve, 50))
      
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
      await new Promise(resolve => setTimeout(resolve, 50))
      
      realTimeSyncService.disconnect()
      
      expect(realTimeSyncService.isConnected()).toBe(false)
    })
  })

  describe('Event System', () => {
    it('should register and trigger event listeners', () => {
      const mockCallback = vi.fn()
      
      realTimeSyncService.on('connected', mockCallback)
      realTimeSyncService.connect()
      
      // Wait for connection event
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalled()
      }, 50)
    })

    it('should remove event listeners', () => {
      const mockCallback = vi.fn()
      
      realTimeSyncService.on('connected', mockCallback)
      realTimeSyncService.off('connected', mockCallback)
      
      realTimeSyncService.connect()
      
      setTimeout(() => {
        expect(mockCallback).not.toHaveBeenCalled()
      }, 50)
    })
  })

  describe('Sync Operations', () => {
    it('should sync cart updates', async () => {
      const mockSend = vi.spyOn(MockWebSocket.prototype, 'send')
      
      await realTimeSyncService.connect()
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const cartItems = [
        { id: '1', name: 'Milk', completed: false },
        { id: '2', name: 'Bread', completed: true }
      ]
      
      await realTimeSyncService.syncCartUpdate(cartItems, 'user123')
      
      expect(mockSend).toHaveBeenCalled()
      const sentData = JSON.parse(mockSend.mock.calls[0][0])
      expect(sentData.type).toBe('cart')
      expect(sentData.action).toBe('update')
      expect(sentData.userId).toBe('user123')
    })

    it('should sync route generation', async () => {
      const mockSend = vi.spyOn(MockWebSocket.prototype, 'send')
      
      await realTimeSyncService.connect()
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const route = [
        { name: 'Milk', aisle: 1, section: 'Dairy' },
        { name: 'Bread', aisle: 2, section: 'Bakery' }
      ]
      
      await realTimeSyncService.syncRouteGenerated(route, 'user123', 'store456')
      
      expect(mockSend).toHaveBeenCalled()
      const sentData = JSON.parse(mockSend.mock.calls[0][0])
      expect(sentData.type).toBe('route')
      expect(sentData.action).toBe('create')
      expect(sentData.userId).toBe('user123')
      expect(sentData.storeId).toBe('store456')
    })

    it('should queue sync events when disconnected', async () => {
      // Don't connect, just try to sync
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
      
      // Queue an operation without connecting
      await realTimeSyncService.syncCartUpdate([], 'user123')
      
      expect(realTimeSyncService.getPendingOperations()).toBe(initialPending + 1)
    })

    it('should clear sync queue', () => {
      // Add some operations
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
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Simulate receiving a message
      const mockMessage = {
        type: 'cart',
        action: 'update',
        data: { items: [] },
        userId: 'user123'
      }
      
      // Access the private method via prototype
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
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Simulate receiving an unknown message
      const mockMessage = {
        type: 'unknown',
        action: 'test',
        data: {}
      }
      
      // Should not throw error
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

    it('should determine correct WebSocket URL', () => {
      const service = realTimeSyncService as any
      const url = service.getWebSocketUrl()
      
      expect(typeof url).toBe('string')
      expect(url).toMatch(/^wss?:\/\//)
    })
  })
})