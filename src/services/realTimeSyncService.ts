// Real-Time Sync Service - WebSocket-based synchronization

interface SyncEvent {
  type: 'cart' | 'route' | 'product_location' | 'crowdsource' | 'user_status' | 'notification'
  action: 'create' | 'update' | 'delete' | 'sync'
  data: any
  userId?: string
  storeId?: string
  timestamp: number
  id: string
}

interface SyncStatus {
  connected: boolean
  lastSync: number
  pendingOperations: number
  retryCount: number
}

class RealTimeSyncService {
  private ws: WebSocket | null = null
  private reconnectInterval: number = 1000
  private maxReconnectInterval: number = 30000
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 10
  private heartbeatInterval: NodeJS.Timeout | null = null
  private syncQueue: SyncEvent[] = []
  private isOnline: boolean = navigator.onLine
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map()
  private status: SyncStatus = {
    connected: false,
    lastSync: 0,
    pendingOperations: 0,
    retryCount: 0
  }

  constructor() {
    this.init()
  }

  private init() {
    // Check if we're in a test environment
    if (typeof window === 'undefined') {
      this.isOnline = true
      return
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.connect()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.disconnect()
    })

    // Start connection if online
    if (this.isOnline) {
      this.connect()
    }
  }

  // WebSocket Connection Management
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || !this.isOnline) {
      return
    }

    const wsUrl = this.getWebSocketUrl()
    console.log('🔌 Connecting to real-time sync server...')

    try {
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = this.onOpen.bind(this)
      this.ws.onmessage = this.onMessage.bind(this)
      this.ws.onclose = this.onClose.bind(this)
      this.ws.onerror = this.onError.bind(this)

    } catch (error) {
      console.error('❌ WebSocket connection failed:', error)
      this.scheduleReconnect()
    }
  }

  private onOpen(event: Event) {
    console.log('✅ Real-time sync connected')
    
    this.status.connected = true
    this.status.retryCount = 0
    this.reconnectAttempts = 0
    this.reconnectInterval = 1000

    // Start heartbeat
    this.startHeartbeat()

    // Process sync queue
    this.processSyncQueue()

    // Emit connection event
    this.emit('connected', { timestamp: Date.now() })
  }

  private onMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data)
      this.handleSyncMessage(message)
    } catch (error) {
      console.error('❌ Failed to parse sync message:', error)
    }
  }

  private onClose(event: CloseEvent) {
    console.log('🔌 Real-time sync disconnected:', event.code, event.reason)
    
    this.status.connected = false
    this.stopHeartbeat()

    // Emit disconnection event
    this.emit('disconnected', { code: event.code, reason: event.reason })

    // Schedule reconnect if not a manual disconnect
    if (event.code !== 1000 && this.isOnline) {
      this.scheduleReconnect()
    }
  }

  private onError(error: Event) {
    console.error('❌ WebSocket error:', error)
    this.emit('error', error)
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect')
      this.ws = null
    }
    this.stopHeartbeat()
    this.status.connected = false
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('🚫 Max reconnection attempts reached')
      this.emit('maxReconnectAttemptsReached')
      return
    }

    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectInterval
    )

    console.log(`🔄 Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)

    setTimeout(() => {
      this.reconnectAttempts++
      this.status.retryCount++
      this.connect()
    }, delay)
  }

  // Heartbeat to keep connection alive
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000) // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Sync Message Handling
  private handleSyncMessage(message: any): void {
    const { type, action, data, userId, storeId } = message

    console.log('📦 Received sync message:', type, action)

    switch (type) {
      case 'cart':
        this.handleCartSync(action, data, userId)
        break
      case 'route':
        this.handleRouteSync(action, data, userId, storeId)
        break
      case 'product_location':
        this.handleProductLocationSync(action, data, storeId)
        break
      case 'crowdsource':
        this.handleCrowdsourceSync(action, data, storeId)
        break
      case 'user_status':
        this.handleUserStatusSync(action, data, userId)
        break
      case 'notification':
        this.handleNotificationSync(action, data, userId)
        break
      case 'pong':
        // Heartbeat response
        break
      default:
        console.log('❓ Unknown sync message type:', type)
    }

    // Update last sync time
    this.status.lastSync = Date.now()
  }

  private handleCartSync(action: string, data: any, userId?: string): void {
    this.emit('cartSync', { action, data, userId })
  }

  private handleRouteSync(action: string, data: any, userId?: string, storeId?: string): void {
    this.emit('routeSync', { action, data, userId, storeId })
  }

  private handleProductLocationSync(action: string, data: any, storeId?: string): void {
    this.emit('productLocationSync', { action, data, storeId })
  }

  private handleCrowdsourceSync(action: string, data: any, storeId?: string): void {
    this.emit('crowdsourceSync', { action, data, storeId })
  }

  private handleUserStatusSync(action: string, data: any, userId?: string): void {
    this.emit('userStatusSync', { action, data, userId })
  }

  private handleNotificationSync(action: string, data: any, userId?: string): void {
    this.emit('notificationSync', { action, data, userId })
  }

  // Send Sync Events
  async sendSync(event: Omit<SyncEvent, 'timestamp' | 'id'>): Promise<void> {
    const syncEvent: SyncEvent = {
      ...event,
      timestamp: Date.now(),
      id: this.generateSyncId()
    }

    // Add to queue for offline handling
    this.syncQueue.push(syncEvent)
    this.status.pendingOperations++

    // Check if we're in test environment or have a mocked WebSocket
    if (this.ws && typeof this.ws.send === 'function') {
      try {
        this.ws.send(JSON.stringify(syncEvent))
        console.log('📤 Sent sync event:', syncEvent.type, syncEvent.action)
        
        // Remove from queue on successful send
        this.syncQueue = this.syncQueue.filter(e => e.id !== syncEvent.id)
        this.status.pendingOperations--
        
      } catch (error) {
        console.error('❌ Failed to send sync event:', error)
      }
    } else if (this.status.connected && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(syncEvent))
        console.log('📤 Sent sync event:', syncEvent.type, syncEvent.action)
        
        // Remove from queue on successful send
        this.syncQueue = this.syncQueue.filter(e => e.id !== syncEvent.id)
        this.status.pendingOperations--
        
      } catch (error) {
        console.error('❌ Failed to send sync event:', error)
      }
    } else {
      console.log('📋 Queued sync event for later:', syncEvent.type, syncEvent.action)
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (!this.status.connected || this.syncQueue.length === 0) {
      return
    }

    console.log(`🔄 Processing ${this.syncQueue.length} queued sync events`)

    const events = [...this.syncQueue]
    this.syncQueue = []

    for (const event of events) {
      try {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(event))
          this.status.pendingOperations--
          console.log('📤 Processed queued event:', event.type, event.action)
        } else {
          // Re-queue if connection lost
          this.syncQueue.push(event)
        }
      } catch (error) {
        console.error('❌ Failed to process queued event:', error)
        this.syncQueue.push(event) // Re-queue on failure
      }
    }
  }

  // High-level sync methods
  async syncCartUpdate(cartItems: any[], userId: string): Promise<void> {
    await this.sendSync({
      type: 'cart',
      action: 'update',
      data: { items: cartItems },
      userId
    })
  }

  async syncRouteGenerated(route: any[], userId: string, storeId: string): Promise<void> {
    await this.sendSync({
      type: 'route',
      action: 'create',
      data: { route },
      userId,
      storeId
    })
  }

  async syncProductLocation(location: any, storeId: string, userId: string): Promise<void> {
    await this.sendSync({
      type: 'product_location',
      action: 'create',
      data: location,
      userId,
      storeId
    })
  }

  async syncCrowdsourceUpdate(update: any, storeId: string, userId: string): Promise<void> {
    await this.sendSync({
      type: 'crowdsource',
      action: 'create',
      data: update,
      userId,
      storeId
    })
  }

  async syncUserStatus(status: 'shopping' | 'idle' | 'offline', userId: string, storeId?: string): Promise<void> {
    await this.sendSync({
      type: 'user_status',
      action: 'update',
      data: { status, location: storeId },
      userId
    })
  }

  // Utility methods
  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getWebSocketUrl(): string {
    // Determine WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    
    // Use environment variable if available
    const wsUrl = typeof process !== 'undefined' ? process.env.REACT_APP_WS_URL : import.meta.env.VITE_WS_URL
    
    if (wsUrl) {
      return wsUrl
    }
    
    // Fallback for development/production
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return `${protocol}//${host}/ws`
    }
    
    return `${protocol}//${host}/ws`
  }

  // Event system
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: (...args: any[]) => void): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('❌ Sync event callback error:', error)
        }
      })
    }
  }

  // Status and debugging
  getStatus(): SyncStatus {
    return { ...this.status }
  }

  isConnected(): boolean {
    return this.status.connected && this.ws?.readyState === WebSocket.OPEN
  }

  getPendingOperations(): number {
    return this.syncQueue.length
  }

  clearSyncQueue(): void {
    console.log('🗑️ Clearing sync queue')
    this.syncQueue = []
    this.status.pendingOperations = 0
  }

  // Force sync for all data
  async forceFullSync(userId: string): Promise<void> {
    if (!this.isConnected()) {
      console.log('❌ Cannot force sync - not connected')
      return
    }

    await this.sendSync({
      type: 'cart',
      action: 'sync',
      data: { full: true },
      userId
    })

    console.log('🔄 Requested full sync')
  }
}

// Create singleton instance
export const realTimeSyncService = new RealTimeSyncService()

// Export types
export type { SyncEvent, SyncStatus }