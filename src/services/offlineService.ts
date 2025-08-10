// Offline Service - Advanced PWA capabilities
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface CartPilotDB extends DBSchema {
  stores: {
    key: string
    value: {
      id: string
      name: string
      address: string
      location: { lat: number; lng: number }
      cached_at: number
    }
  }
  products: {
    key: string
    value: {
      barcode: string
      name: string
      brand?: string
      category?: string
      description?: string
      image?: string
      price?: number
      cached_at: number
    }
  }
  cartItems: {
    key: string
    value: {
      id: string
      name: string
      completed: boolean
      category?: string
      brand?: string
      offline_created: boolean
      sync_pending: boolean
      created_at: number
    }
  }
  routes: {
    key: string
    value: {
      store_id: string
      items: Array<{
        name: string
        aisle: number
        section: string
        completed: boolean
      }>
      created_at: number
    }
  }
  syncQueue: {
    key: number
    value: {
      id: number
      type: 'cart_item' | 'route' | 'product_scan' | 'points'
      data: any
      created_at: number
      retry_count: number
    }
  }
}

class OfflineService {
  private db: IDBPDatabase<CartPilotDB> | null = null

  async init(): Promise<void> {
    try {
      this.db = await openDB<CartPilotDB>('CartPilotDB', 3, {
        upgrade(db, oldVersion) {
          console.log('🔄 Upgrading offline database from version', oldVersion)
          
          // Create stores table
          if (!db.objectStoreNames.contains('stores')) {
            db.createObjectStore('stores', { keyPath: 'id' })
          }
          
          // Create products table  
          if (!db.objectStoreNames.contains('products')) {
            db.createObjectStore('products', { keyPath: 'barcode' })
          }
          
          // Create cart items table
          if (!db.objectStoreNames.contains('cartItems')) {
            db.createObjectStore('cartItems', { keyPath: 'id' })
          }
          
          // Create routes table
          if (!db.objectStoreNames.contains('routes')) {
            db.createObjectStore('routes', { keyPath: 'store_id' })
          }
          
          // Create sync queue
          if (!db.objectStoreNames.contains('syncQueue')) {
            db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
          }
        }
      })
      
      console.log('✅ Offline database initialized')
      await this.cleanOldData()
    } catch (error) {
      console.error('❌ Failed to initialize offline database:', error)
    }
  }

  // Clean data older than 7 days
  async cleanOldData(): Promise<void> {
    if (!this.db) return
    
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    
    try {
      // Clean old stores
      const stores = await this.db.getAll('stores')
      for (const store of stores) {
        if (store.cached_at < weekAgo) {
          await this.db.delete('stores', store.id)
        }
      }
      
      // Clean old products
      const products = await this.db.getAll('products')
      for (const product of products) {
        if (product.cached_at < weekAgo) {
          await this.db.delete('products', product.barcode)
        }
      }
      
      console.log('🧹 Cleaned old offline data')
    } catch (error) {
      console.error('Error cleaning old data:', error)
    }
  }

  // Store operations
  async cacheStores(stores: any[]): Promise<void> {
    if (!this.db) return
    
    const tx = this.db.transaction('stores', 'readwrite')
    const now = Date.now()
    
    for (const store of stores) {
      await tx.store.put({
        ...store,
        cached_at: now
      })
    }
    
    await tx.done
    console.log(`📦 Cached ${stores.length} stores offline`)
  }

  async getCachedStores(): Promise<any[]> {
    if (!this.db) return []
    return await this.db.getAll('stores')
  }

  // Product operations
  async cacheProduct(product: any): Promise<void> {
    if (!this.db) return
    
    await this.db.put('products', {
      ...product,
      cached_at: Date.now()
    })
    
    console.log('📦 Cached product offline:', product.name)
  }

  async getCachedProduct(barcode: string): Promise<any | null> {
    if (!this.db) return null
    return await this.db.get('products', barcode)
  }

  // Cart operations
  async cacheCartItems(items: any[]): Promise<void> {
    if (!this.db) return
    
    const tx = this.db.transaction('cartItems', 'readwrite')
    
    for (const item of items) {
      await tx.store.put({
        ...item,
        offline_created: false,
        sync_pending: false,
        created_at: Date.now()
      })
    }
    
    await tx.done
    console.log(`📦 Cached ${items.length} cart items offline`)
  }

  async addOfflineCartItem(item: any): Promise<void> {
    if (!this.db) return
    
    await this.db.put('cartItems', {
      ...item,
      offline_created: true,
      sync_pending: true,
      created_at: Date.now()
    })
    
    // Add to sync queue
    await this.addToSyncQueue('cart_item', item)
    console.log('📦 Added cart item offline:', item.name)
  }

  async getCachedCartItems(): Promise<any[]> {
    if (!this.db) return []
    return await this.db.getAll('cartItems')
  }

  // Route operations
  async cacheRoute(storeId: string, route: any[]): Promise<void> {
    if (!this.db) return
    
    await this.db.put('routes', {
      store_id: storeId,
      items: route,
      created_at: Date.now()
    })
    
    console.log('📦 Cached route offline for store:', storeId)
  }

  async getCachedRoute(storeId: string): Promise<any[] | null> {
    if (!this.db) return null
    const route = await this.db.get('routes', storeId)
    return route?.items || null
  }

  // Sync queue operations
  async addToSyncQueue(type: 'cart_item' | 'route' | 'product_scan' | 'points', data: any): Promise<void> {
    if (!this.db) return
    
    await this.db.add('syncQueue', {
      type,
      data,
      created_at: Date.now(),
      retry_count: 0
    })
    
    console.log('🔄 Added to sync queue:', type)
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) return []
    return await this.db.getAll('syncQueue')
  }

  async removeSyncItem(id: number): Promise<void> {
    if (!this.db) return
    await this.db.delete('syncQueue', id)
  }

  async incrementRetryCount(id: number): Promise<void> {
    if (!this.db) return
    
    const item = await this.db.get('syncQueue', id)
    if (item) {
      item.retry_count++
      await this.db.put('syncQueue', item)
    }
  }

  // Network status
  isOnline(): boolean {
    return navigator.onLine
  }

  // Sync with server when online
  async syncWhenOnline(): Promise<void> {
    if (!this.isOnline()) {
      console.log('📡 Offline - sync will happen when online')
      return
    }

    const queue = await this.getSyncQueue()
    console.log(`🔄 Syncing ${queue.length} items...`)
    
    for (const item of queue) {
      try {
        await this.syncItem(item)
        await this.removeSyncItem(item.id)
        console.log('✅ Synced:', item.type)
      } catch (error) {
        console.error('❌ Sync failed:', error)
        await this.incrementRetryCount(item.id)
        
        // Remove items that failed too many times
        if (item.retry_count > 5) {
          await this.removeSyncItem(item.id)
          console.log('🗑️ Removed failed sync item after 5 retries')
        }
      }
    }
  }

  private async syncItem(item: any): Promise<void> {
    // This would sync with your backend API
    // For now, we'll simulate the sync
    await new Promise(resolve => setTimeout(resolve, 100))
    console.log('🔄 Synced item:', item.type)
  }

  // Clear all offline data
  async clearAllData(): Promise<void> {
    if (!this.db) return
    
    const stores = ['stores', 'products', 'cartItems', 'routes', 'syncQueue']
    for (const store of stores) {
      await this.db.clear(store as any)
    }
    
    console.log('🧹 Cleared all offline data')
  }

  // Get storage usage
  async getStorageUsage(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0
      }
    }
    
    return { used: 0, available: 0 }
  }
}

// Create singleton instance
export const offlineService = new OfflineService()

// Initialize when the module loads
offlineService.init()

// Sync when coming back online
window.addEventListener('online', () => {
  console.log('🌐 Back online - starting sync...')
  offlineService.syncWhenOnline()
})

window.addEventListener('offline', () => {
  console.log('📡 Gone offline - caching mode active')
})