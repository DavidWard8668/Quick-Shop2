import React, { useState, useEffect } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { realTimeSyncService } from '../services/realTimeSyncService'

export const RealTimeSyncIndicator: React.FC = () => {
  const [isConnected, setIsConnected] = useState(() => {
    try {
      return realTimeSyncService.isConnected()
    } catch {
      return false
    }
  })
  const [lastSync, setLastSync] = useState<number>(0)
  const [pendingOps, setPendingOps] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Update status periodically
    const updateStatus = () => {
      try {
        const status = realTimeSyncService.getStatus()
        if (status) {
          setIsConnected(status.connected)
          setLastSync(status.lastSync)
          setPendingOps(status.pendingOperations)
          setRetryCount(status.retryCount)
        }
      } catch (error) {
        // Handle case where service is not available (e.g., in tests)
        console.debug('RealTimeSyncService not available:', error)
      }
    }

    // Initial update
    updateStatus()

    // Set up interval
    const interval = setInterval(updateStatus, 1000)

    // Listen for sync events
    const handleConnected = () => {
      setIsConnected(true)
      updateStatus()
    }

    const handleDisconnected = () => {
      setIsConnected(false)
      updateStatus()
    }

    const handleSync = () => {
      updateStatus()
    }

    try {
      realTimeSyncService.on('connected', handleConnected)
      realTimeSyncService.on('disconnected', handleDisconnected)
      realTimeSyncService.on('cartSync', handleSync)
      realTimeSyncService.on('routeSync', handleSync)
      realTimeSyncService.on('productLocationSync', handleSync)
      realTimeSyncService.on('crowdsourceSync', handleSync)
    } catch (error) {
      console.debug('Could not set up realTimeSyncService event listeners:', error)
    }

    return () => {
      clearInterval(interval)
      try {
        realTimeSyncService.off('connected', handleConnected)
        realTimeSyncService.off('disconnected', handleDisconnected)
        realTimeSyncService.off('cartSync', handleSync)
        realTimeSyncService.off('routeSync', handleSync)
        realTimeSyncService.off('productLocationSync', handleSync)
        realTimeSyncService.off('crowdsourceSync', handleSync)
      } catch (error) {
        console.debug('Could not remove realTimeSyncService event listeners:', error)
      }
    }
  }, [])

  const getStatusIcon = () => {
    if (isConnected) return '🟢'
    if (retryCount > 0) return '🟡'
    return '🔴'
  }

  const getStatusText = () => {
    if (isConnected) return 'Synced'
    if (retryCount > 0) return 'Reconnecting...'
    return 'Offline'
  }

  const getStatusColor = () => {
    if (isConnected) return 'bg-green-500'
    if (retryCount > 0) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  const getLastSyncText = () => {
    if (!lastSync) return 'Never'
    
    const timeDiff = Date.now() - lastSync
    const seconds = Math.floor(timeDiff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    if (seconds > 30) return `${seconds}s ago`
    return 'Just now'
  }

  const handleForceSync = async () => {
    // This would need user context - simplified for now
    await realTimeSyncService.forceFullSync('current-user')
  }

  const handleReconnect = () => {
    realTimeSyncService.disconnect()
    setTimeout(() => {
      realTimeSyncService.connect()
    }, 1000)
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Main sync indicator */}
      <div 
        className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg border cursor-pointer transition-all hover:shadow-xl"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
        <span className="text-xs font-medium text-gray-700">{getStatusText()}</span>
        {pendingOps > 0 && (
          <Badge variant="outline" className="text-xs px-1 py-0 h-4">
            {pendingOps}
          </Badge>
        )}
      </div>

      {/* Detailed sync panel */}
      {showDetails && (
        <div className="absolute bottom-12 right-0 mb-2">
          <Card className="w-80 bg-white/95 backdrop-blur-sm shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  {getStatusIcon()} Real-time Sync
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDetails(false)}
                  className="h-6 w-6 p-0"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-3 text-sm">
                {/* Connection Status */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {/* Last Sync */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Sync:</span>
                  <span className="font-medium">{getLastSyncText()}</span>
                </div>

                {/* Pending Operations */}
                {pendingOps > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-medium text-blue-600">{pendingOps} operations</span>
                  </div>
                )}

                {/* Retry Count */}
                {retryCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retries:</span>
                    <span className="font-medium text-yellow-600">{retryCount}</span>
                  </div>
                )}

                {/* Sync Features */}
                <div className="border-t pt-3">
                  <div className="text-xs text-gray-500 mb-2">Real-time sync for:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Shopping Lists</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Routes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Locations</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Community Data</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-3 space-y-2">
                  {isConnected ? (
                    <Button
                      size="sm"
                      onClick={handleForceSync}
                      className="w-full text-xs"
                      variant="outline"
                    >
                      🔄 Force Full Sync
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleReconnect}
                      className="w-full text-xs"
                    >
                      🔌 Reconnect
                    </Button>
                  )}
                  
                  <div className="text-xs text-gray-500 text-center">
                    {isConnected ? (
                      '✅ Your data is automatically synced'
                    ) : (
                      '📱 Working offline - will sync when connected'
                    )}
                  </div>
                </div>

                {/* Connection Quality Indicator */}
                {isConnected && (
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Connection:</span>
                      <div className="flex items-center gap-1">
                        <div className="flex space-x-1">
                          <div className="w-1 h-3 bg-green-500 rounded"></div>
                          <div className="w-1 h-2 bg-green-500 rounded"></div>
                          <div className="w-1 h-4 bg-green-500 rounded"></div>
                        </div>
                        <span className="ml-1 text-green-600 font-medium">Strong</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Offline Queue Info */}
                {!isConnected && pendingOps > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    <div className="text-xs text-yellow-800">
                      <strong>📋 {pendingOps} changes queued</strong>
                      <br />
                      Will sync automatically when online
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}