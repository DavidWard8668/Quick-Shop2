import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { notificationService } from '../services/notificationService'

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState(notificationService.getSettings())
  const [testingSent, setTestingSent] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSettings(notificationService.getSettings())
    }
  }, [isOpen])

  const handlePermissionRequest = async () => {
    const granted = await notificationService.requestPermission()
    setSettings(prev => ({
      ...prev,
      permission: Notification.permission,
      enabled: granted
    }))
  }

  const handleSettingToggle = (setting: 'enabled' | 'reminders' | 'deals' | 'points', value: boolean) => {
    const updated = { ...settings, [setting]: value }
    setSettings(updated)
    notificationService.updateSettings({ [setting]: value })
  }

  const handleTestNotification = async () => {
    await notificationService.showNotification({
      title: '🎉 CartPilot Test',
      body: 'Notifications are working perfectly! You\'re all set.',
      tag: 'test-notification',
      data: { type: 'test' }
    })
    setTestingSent(true)
    setTimeout(() => setTestingSent(false), 3000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full bg-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              🔔 Notification Settings
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">Permission Status</span>
              <Badge 
                className={
                  settings.permission === 'granted' 
                    ? 'bg-green-500 text-white' 
                    : settings.permission === 'denied'
                    ? 'bg-red-500 text-white'
                    : 'bg-yellow-500 text-white'
                }
              >
                {settings.permission === 'granted' && '✅ Granted'}
                {settings.permission === 'denied' && '❌ Denied'}
                {settings.permission === 'default' && '⏳ Not Set'}
              </Badge>
            </div>
            
            {settings.permission !== 'granted' && (
              <Button
                onClick={handlePermissionRequest}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                disabled={settings.permission === 'denied'}
              >
                {settings.permission === 'denied' 
                  ? '🔒 Permission Denied (Check Browser Settings)'
                  : '🔔 Enable Notifications'
                }
              </Button>
            )}
          </div>

          {/* Settings toggles */}
          {settings.permission === 'granted' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">Enable Notifications</div>
                  <div className="text-sm text-gray-600">Master switch for all notifications</div>
                </div>
                <Button
                  size="sm"
                  variant={settings.enabled ? "default" : "outline"}
                  onClick={() => handleSettingToggle('enabled', !settings.enabled)}
                  className={settings.enabled ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                >
                  {settings.enabled ? 'ON' : 'OFF'}
                </Button>
              </div>

              {settings.enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">Shopping Reminders</div>
                      <div className="text-sm text-gray-600">Cart reminders and optimal shopping times</div>
                    </div>
                    <Button
                      size="sm"
                      variant={settings.reminders ? "default" : "outline"}
                      onClick={() => handleSettingToggle('reminders', !settings.reminders)}
                      className={settings.reminders ? "bg-purple-500 hover:bg-purple-600 text-white" : ""}
                    >
                      {settings.reminders ? 'ON' : 'OFF'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">Deal Alerts</div>
                      <div className="text-sm text-gray-600">Discounts and special offers</div>
                    </div>
                    <Button
                      size="sm"
                      variant={settings.deals ? "default" : "outline"}
                      onClick={() => handleSettingToggle('deals', !settings.deals)}
                      className={settings.deals ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                    >
                      {settings.deals ? 'ON' : 'OFF'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">Points & Achievements</div>
                      <div className="text-sm text-gray-600">Level ups and points earned</div>
                    </div>
                    <Button
                      size="sm"
                      variant={settings.points ? "default" : "outline"}
                      onClick={() => handleSettingToggle('points', !settings.points)}
                      className={settings.points ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
                    >
                      {settings.points ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Test notification */}
          {settings.enabled && (
            <div className="pt-4 border-t space-y-3">
              <div className="text-sm font-medium text-gray-800">Test Notifications</div>
              <Button
                onClick={handleTestNotification}
                disabled={testingSent}
                variant="outline"
                className="w-full"
              >
                {testingSent ? '✅ Test Sent!' : '🧪 Send Test Notification'}
              </Button>
            </div>
          )}

          {/* Info section */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="font-semibold text-blue-800">💡 Smart Notifications Include:</div>
            <ul className="text-blue-700 space-y-1">
              <li>• 🛒 Cart reminders (1 hour after adding items)</li>
              <li>• 🔥 Real-time deal alerts for your items</li>
              <li>• 🗺️ Route ready notifications</li>
              <li>• ⭐ Points and achievement updates</li>
              <li>• 🔄 Offline sync confirmations</li>
              <li>• ⏰ Optimal shopping time suggestions</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => notificationService.clearNotifications()}
              variant="outline"
              className="flex-1 text-gray-600"
            >
              🧹 Clear All
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              ✅ Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}