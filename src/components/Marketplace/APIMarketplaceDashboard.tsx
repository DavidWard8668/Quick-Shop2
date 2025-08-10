// 🌐 API Marketplace Dashboard - Ecosystem Control Center
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Globe, 
  Zap, 
  TrendingUp,
  DollarSign,
  Users,
  Cpu,
  Settings,
  BarChart3,
  Plug,
  Shield,
  Rocket,
  Crown,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useAPIMarketplace, apiMarketplaceService } from '../../services/apiMarketplaceService'

interface APIMarketplaceDashboardProps {
  userId: string
}

export function APIMarketplaceDashboard({ userId }: APIMarketplaceDashboardProps) {
  const { 
    partners, 
    integrations, 
    analytics, 
    loading,
    connectPartner,
    disconnectPartner,
    makeAPICall,
    createSmartIntegration
  } = useAPIMarketplace(userId)

  const [selectedPartner, setSelectedPartner] = useState<string | null>(null)
  const [connectionCredentials, setConnectionCredentials] = useState<any>({})
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [apiCallLogs, setApiCallLogs] = useState<any[]>([])

  const handleConnectPartner = async (partnerId: string, authType: string) => {
    // Simulate different credential types
    const mockCredentials = {
      api_key: { apiKey: `ak_${partnerId}_${Date.now()}` },
      oauth2: { 
        accessToken: `at_${partnerId}_${Date.now()}`, 
        refreshToken: `rt_${partnerId}_${Date.now()}` 
      },
      bearer: { token: `Bearer ${partnerId}_${Date.now()}` }
    }

    try {
      await connectPartner(partnerId, mockCredentials[authType as keyof typeof mockCredentials])
      setShowConnectionModal(false)
      setSelectedPartner(null)
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  const handleDisconnectPartner = async (integrationId: string) => {
    if (confirm('Are you sure you want to disconnect this integration?')) {
      await disconnectPartner(integrationId)
    }
  }

  const handleTestAPICall = async (partnerId: string, endpointId: string) => {
    try {
      const result = await makeAPICall(partnerId, endpointId, { test: true, timestamp: Date.now() })
      setApiCallLogs(prev => [{
        id: Date.now(),
        partnerId,
        endpointId,
        status: 'success',
        result,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]) // Keep last 10 logs
    } catch (error) {
      setApiCallLogs(prev => [{
        id: Date.now(),
        partnerId,
        endpointId,
        status: 'error',
        error: error.message,
        timestamp: new Date()
      }, ...prev.slice(0, 9)])
    }
  }

  const createSmartFlow = async (type: 'meal_to_delivery' | 'list_to_loyalty' | 'voice_to_action') => {
    try {
      const integrationId = await createSmartIntegration(type)
      alert(`✅ Smart integration created: ${type} (${integrationId})`)
    } catch (error) {
      console.error('Smart integration failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            API Marketplace
          </h1>
          <p className="text-muted-foreground">The ecosystem that powers global shopping automation</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
            <Crown className="w-4 h-4 mr-1" />
            Ecosystem Leader
          </Badge>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Rocket className="w-4 h-4 mr-2" />
            Launch Partner Program
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardContent className="flex items-center p-6">
            <Globe className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-muted-foreground">Active Partners</div>
              <div className="text-2xl font-bold">{analytics?.totalPartners || 0}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardContent className="flex items-center p-6">
            <Plug className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-muted-foreground">Active Integrations</div>
              <div className="text-2xl font-bold">{analytics?.activeIntegrations || 0}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <CardContent className="flex items-center p-6">
            <Cpu className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-muted-foreground">API Calls Today</div>
              <div className="text-2xl font-bold">{analytics?.apiCallsToday?.toLocaleString() || 0}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
          <CardContent className="flex items-center p-6">
            <DollarSign className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-muted-foreground">Revenue Today</div>
              <div className="text-2xl font-bold">£{analytics?.revenueToday?.toFixed(2) || '0.00'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="partners" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Partners
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="w-4 h-4" />
            My Integrations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="smart-flows" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Smart Flows
          </TabsTrigger>
          <TabsTrigger value="developer" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Developer
          </TabsTrigger>
        </TabsList>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
          <div className="grid gap-4">
            {partners.map((partner) => {
              const isConnected = integrations.some(i => i.partnerId === partner.id && i.status === 'connected')
              
              return (
                <Card key={partner.id} className="overflow-hidden">
                  <CardHeader className={`${
                    partner.integrationLevel === 'enterprise' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                      : partner.integrationLevel === 'premium'
                      ? 'bg-gradient-to-r from-blue-500 to-green-500'
                      : 'bg-gradient-to-r from-gray-500 to-gray-600'
                  } text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          {partner.type === 'delivery' && '🚚'}
                          {partner.type === 'grocery' && '🛒'}
                          {partner.type === 'restaurant' && '🍽️'}
                          {partner.type === 'loyalty' && '💳'}
                          {partner.type === 'payment' && '💰'}
                          {partner.type === 'smart_home' && '🏠'}
                          {partner.type === 'ai_assistant' && '🤖'}
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {partner.name}
                            {partner.integrationLevel === 'enterprise' && <Crown className="w-4 h-4 text-yellow-300" />}
                          </CardTitle>
                          <p className="text-white/80 capitalize">{partner.type.replace('_', ' ')} • {partner.supportedRegions.length} regions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`${
                          isConnected ? 'bg-green-500' : 'bg-white/20'
                        } text-white`}>
                          {isConnected ? 'Connected' : 'Available'}
                        </Badge>
                        <Badge variant="outline" className="text-white border-white/30">
                          {partner.integrationLevel}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Available Endpoints ({partner.endpoints.length})</div>
                        <div className="space-y-1">
                          {partner.endpoints.slice(0, 3).map((endpoint) => (
                            <div key={endpoint.id} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{endpoint.purpose}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {endpoint.method}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleTestAPICall(partner.id, endpoint.id)}
                                  disabled={!isConnected}
                                >
                                  Test
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Usage Today:</span>
                            <span className="font-medium">{partner.endpoints.reduce((sum, e) => sum + e.usageCount, 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Rate Limit:</span>
                            <span className="font-medium">{partner.rateLimit.requestsPerMinute}/min</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Revenue Share:</span>
                            <span className="font-medium">{partner.revenueShare}%</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            if (isConnected) {
                              const integration = integrations.find(i => i.partnerId === partner.id)
                              if (integration) handleDisconnectPartner(integration.id)
                            } else {
                              setSelectedPartner(partner.id)
                              setShowConnectionModal(true)
                            }
                          }}
                          className={`w-full mt-3 ${
                            isConnected 
                              ? 'bg-red-500 hover:bg-red-600' 
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {isConnected ? 'Disconnect' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* My Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          {integrations.length === 0 ? (
            <Card className="text-center p-8">
              <CardContent>
                <Plug className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Integrations Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Connect to partners to unlock powerful shopping automation features.
                </p>
                <Button onClick={() => setShowConnectionModal(true)}>
                  Browse Partners
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {integrations.map((integration) => {
                const partner = partners.find(p => p.id === integration.partnerId)
                if (!partner) return null

                return (
                  <Card key={integration.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            integration.status === 'connected' ? 'bg-green-500' :
                            integration.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <div>
                            <div className="font-medium">{partner.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Last sync: {integration.lastSync.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            integration.status === 'connected' ? 'default' :
                            integration.status === 'error' ? 'destructive' : 'secondary'
                          }>
                            {integration.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisconnectPartner(integration.id)}
                          >
                            Disconnect
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Permissions:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {integration.permissions.slice(0, 3).map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sync Frequency:</span>
                          <div className="font-medium capitalize mt-1">{integration.syncFrequency}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Growth Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span>New Partners This Month</span>
                          <span className="font-bold">{analytics.growthMetrics.newPartnersThisMonth}</span>
                        </div>
                        <Progress value={75} className="mt-1" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Integration Growth Rate</span>
                          <span className="font-bold text-green-600">+{analytics.growthMetrics.integrationGrowthRate}%</span>
                        </div>
                        <Progress value={analytics.growthMetrics.integrationGrowthRate} className="mt-1" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span>API Usage Growth</span>
                          <span className="font-bold text-blue-600">+{analytics.growthMetrics.apiUsageGrowthRate}%</span>
                        </div>
                        <Progress value={analytics.growthMetrics.apiUsageGrowthRate} className="mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Partners</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topPartners.map((partner, index) => (
                        <div key={partner.partnerId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium">{partner.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{partner.usage.toLocaleString()} calls</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* API Call Logs */}
              {apiCallLogs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent API Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {apiCallLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-3">
                            {log.status === 'success' ? 
                              <CheckCircle className="w-4 h-4 text-green-500" /> :
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            }
                            <div>
                              <div className="text-sm font-medium">{log.partnerId} → {log.endpointId}</div>
                              <div className="text-xs text-muted-foreground">
                                {log.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                            {log.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Smart Flows Tab */}
        <TabsContent value="smart-flows" className="space-y-4">
          <div className="grid gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Meal-to-Delivery Pipeline</h3>
                    <p className="text-muted-foreground">Automatically order ingredients for your meal plans</p>
                  </div>
                  <Button onClick={() => createSmartFlow('meal_to_delivery')}>
                    <Zap className="w-4 h-4 mr-2" />
                    Activate
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">List-to-Loyalty Optimization</h3>
                    <p className="text-muted-foreground">Automatically find best loyalty offers for your shopping list</p>
                  </div>
                  <Button onClick={() => createSmartFlow('list_to_loyalty')}>
                    <Zap className="w-4 h-4 mr-2" />
                    Activate
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Voice-to-Action Pipeline</h3>
                    <p className="text-muted-foreground">Voice commands trigger actions across all connected services</p>
                  </div>
                  <Button onClick={() => createSmartFlow('voice_to_action')}>
                    <Zap className="w-4 h-4 mr-2" />
                    Activate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Developer Tab */}
        <TabsContent value="developer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {apiMarketplaceService.generateAPIDocumentation().endpoints}
                  </div>
                  <div className="text-sm text-muted-foreground">Available Endpoints</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {apiMarketplaceService.generateAPIDocumentation().partners}
                  </div>
                  <div className="text-sm text-muted-foreground">Partner APIs</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">4</div>
                  <div className="text-sm text-muted-foreground">Auth Methods</div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Quick Start - JavaScript SDK</h4>
                <pre className="text-sm overflow-x-auto">
                  <code>{`// Install the CartPilot API SDK
npm install @cartpilot/api-sdk

// Initialize with your API key
const cartpilot = new CartPilotAPI('your-api-key');

// Connect to a partner service
const restaurants = await cartpilot.partners.uberEats.getRestaurants({
  latitude: 51.5074,
  longitude: -0.1278
});`}</code>
                </pre>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline">View Full Documentation</Button>
                <Button variant="outline">Download SDK</Button>
                <Button variant="outline">API Reference</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connection Modal */}
      {showConnectionModal && selectedPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Connect Partner</h3>
            <p className="text-muted-foreground mb-4">
              Choose authentication method for {partners.find(p => p.id === selectedPartner)?.name}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => handleConnectPartner(selectedPartner, 'api_key')}
                className="w-full"
              >
                Connect with API Key
              </Button>
              <Button 
                onClick={() => handleConnectPartner(selectedPartner, 'oauth2')}
                variant="outline"
                className="w-full"
              >
                Connect with OAuth 2.0
              </Button>
              <Button 
                onClick={() => handleConnectPartner(selectedPartner, 'bearer')}
                variant="outline"
                className="w-full"
              >
                Connect with Bearer Token
              </Button>
            </div>
            <Button 
              onClick={() => setShowConnectionModal(false)}
              variant="ghost"
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}