import React, { useState, useEffect } from 'react'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { offlineService } from '../services/offlineService'

interface OfflineIndicatorProps {
  onSyncNow?: () => void
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSyncNow }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncQueue, setSyncQueue] = useState<any[]>([])
  const [storageUsage, setStorageUsage] = useState({ used: 0, available: 0 })
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load sync queue and storage info
    loadOfflineData()

    const interval = setInterval(loadOfflineData, 10000) // Update every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const loadOfflineData = async () => {
    try {
      const queue = await offlineService.getSyncQueue()
      setSyncQueue(queue)
      
      const usage = await offlineService.getStorageUsage()
      setStorageUsage(usage)
    } catch (error) {
      console.error('Error loading offline data:', error)
    }
  }

  const handleSyncNow = async () => {
    if (onSyncNow) {
      onSyncNow()
    }
    await offlineService.syncWhenOnline()
    await loadOfflineData()
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isOnline && (!syncQueue || syncQueue.length === 0)) {
    // Only show when offline or when there are items to sync
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-40 max-w-sm">
      <Card className={`shadow-lg transition-all duration-300 ${
        isOnline 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-orange-50 border-orange-200'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge 
                className={`${
                  isOnline 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white`}
              >
                {isOnline ? '🌐 Online' : '📡 Offline'}
              </Badge>
              {syncQueue && syncQueue.length > 0 && (
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  {syncQueue.length} to sync
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="h-6 w-6 p-0"
            >
              {showDetails ? '−' : '+'}
            </Button>
          </div>

          <div className="text-sm text-gray-700">
            {isOnline ? (
              syncQueue && syncQueue.length > 0 ? (
                <div className="flex items-center justify-between">
                  <span>Syncing offline data...</span>
                  <Button
                    size="sm"
                    onClick={handleSyncNow}
                    className="h-7 px-3 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Sync Now
                  </Button>
                </div>
              ) : (
                <span className="text-green-700">All data synced</span>
              )
            ) : (
              <span className="text-orange-700">Working offline mode</span>
            )}
          </div>

          {showDetails && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs">
              {syncQueue && syncQueue.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Pending sync:</p>
                  <ul className="space-y-1">
                    {syncQueue.slice(0, 5).map((item, index) => (
                      <li key={index} className="flex items-center justify-between text-gray-600">
                        <span>
                          {item.type === 'cart_item' && '🛒 Cart item'}
                          {item.type === 'route' && '🗺️ Route'}
                          {item.type === 'product_scan' && '📱 Product scan'}
                          {item.type === 'points' && '⭐ Points'}
                        </span>
                        <span className="text-gray-400">
                          {item.retry_count > 0 && `(retry ${item.retry_count})`}
                        </span>
                      </li>
                    ))}
                    {syncQueue.length > 5 && (
                      <li className="text-gray-500">
                        +{syncQueue.length - 5} more items...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {storageUsage.available > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Storage:</p>
                  <div className="text-gray-600">
                    {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.available)} used
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((storageUsage.used / storageUsage.available) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => offlineService.clearAllData()}
                  className="flex-1 h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                >
                  Clear Cache
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadOfflineData}
                  className="flex-1 h-7 text-xs"
                >
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}