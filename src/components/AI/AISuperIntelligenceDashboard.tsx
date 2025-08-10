// 🧠 AI SuperIntelligence Dashboard - Next-Gen Shopping AI UI
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Brain, 
  Mic, 
  Camera, 
  Zap,
  TrendingUp,
  ShoppingCart,
  Clock,
  PoundSterling,
  Star,
  Eye,
  Bot,
  Sparkles,
  Target,
  ChefHat
} from 'lucide-react'
import { useAISuperIntelligence, aiSuperIntelligenceService } from '../../services/aiSuperIntelligenceService'

interface AISuperIntelligenceDashboardProps {
  userId: string
}

export function AISuperIntelligenceDashboard({ userId }: AISuperIntelligenceDashboardProps) {
  const { 
    predictiveList, 
    smartDeals, 
    voiceReady, 
    loading,
    generatePredictiveList,
    findSmartDeals,
    processVoiceCommand,
    analyzeShelf
  } = useAISuperIntelligence(userId)

  const [isListening, setIsListening] = useState(false)
  const [voiceResponse, setVoiceResponse] = useState<string>('')
  const [cameraActive, setCameraActive] = useState(false)
  const [confidenceScore, setConfidenceScore] = useState(87)

  const handleVoiceCommand = async () => {
    if (!voiceReady) return
    
    setIsListening(true)
    try {
      // Simulate voice command processing
      const command = await processVoiceCommand('Find organic tomatoes under three pounds')
      setVoiceResponse(command.response)
    } catch (error) {
      console.error('Voice command failed:', error)
    } finally {
      setIsListening(false)
    }
  }

  const handleGeneratePredictiveList = async () => {
    await generatePredictiveList()
  }

  const handleFindSmartDeals = async () => {
    await findSmartDeals()
  }

  const handleCameraAnalysis = async () => {
    setCameraActive(true)
    try {
      // Simulate camera analysis
      setTimeout(() => {
        setCameraActive(false)
      }, 3000)
    } catch (error) {
      console.error('Camera analysis failed:', error)
      setCameraActive(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI SuperIntelligence
          </h1>
          <p className="text-muted-foreground">Your personal shopping AI assistant</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 dark:text-green-300">AI Active</span>
          </div>
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            {confidenceScore}% Confidence
          </Badge>
        </div>
      </div>

      {/* AI Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <CardContent className="flex items-center p-6">
            <Brain className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-muted-foreground">Neural Network</div>
              <div className="text-lg font-bold">Active</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardContent className="flex items-center p-6">
            <Zap className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-muted-foreground">Processing Speed</div>
              <div className="text-lg font-bold">0.3s</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
          <CardContent className="flex items-center p-6">
            <Target className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-muted-foreground">Accuracy</div>
              <div className="text-lg font-bold">96.4%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predictive" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Voice AI
          </TabsTrigger>
          <TabsTrigger value="vision" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Computer Vision
          </TabsTrigger>
          <TabsTrigger value="deals" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Smart Deals
          </TabsTrigger>
        </TabsList>

        {/* Predictive Shopping Tab */}
        <TabsContent value="predictive" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Predictive Shopping List
              </CardTitle>
              <Button onClick={handleGeneratePredictiveList} disabled={loading}>
                {loading ? 'Generating...' : 'Generate List'}
              </Button>
            </CardHeader>
            <CardContent>
              {predictiveList ? (
                <div className="space-y-4">
                  {/* List Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{predictiveList.items.length}</div>
                      <div className="text-sm text-muted-foreground">Predicted Items</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="text-lg font-bold text-green-600">£{predictiveList.estimatedTotal.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Est. Total</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">{predictiveList.estimatedTime}m</div>
                      <div className="text-sm text-muted-foreground">Est. Time</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">{Math.round(predictiveList.confidence * 100)}%</div>
                      <div className="text-sm text-muted-foreground">Confidence</div>
                    </div>
                  </div>

                  {/* Predicted Items */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">AI-Predicted Items</h4>
                    {predictiveList.items.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400"></div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Qty: {item.predictedQuantity} • 
                              <Badge variant="outline" className="ml-1">
                                {Math.round(item.probability * 100)}% likely
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">£{item.estimatedPrice.toFixed(2)}</div>
                          <Badge variant={item.urgency === 'high' ? 'destructive' : item.urgency === 'medium' ? 'default' : 'secondary'} className="text-xs">
                            {item.urgency}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Meal Plan Suggestions */}
                  {predictiveList.mealPlanSuggestions && predictiveList.mealPlanSuggestions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <ChefHat className="w-4 h-4" />
                        AI Meal Suggestions
                      </h4>
                      {predictiveList.mealPlanSuggestions.slice(0, 2).map((meal) => (
                        <div key={meal.id} className="p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 rounded-lg">
                          <div className="font-medium">{meal.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {meal.prepTime}min • {meal.servings} servings • Health Score: {meal.healthScore}/10
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8">
                  <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">AI Learning in Progress</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate your first predictive shopping list based on your purchase history and preferences.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice AI Tab */}
        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Voice AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-8">
                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                  isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                }`}>
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-semibold">
                    {isListening ? 'Listening...' : 'Voice AI Ready'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {voiceReady ? 'Say something like "Find organic tomatoes under £3"' : 'Voice recognition not available'}
                  </div>
                </div>
                <Button 
                  onClick={handleVoiceCommand} 
                  disabled={!voiceReady || isListening}
                  className="mt-4"
                  size="lg"
                >
                  {isListening ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Listening...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Voice Command
                    </>
                  )}
                </Button>
              </div>

              {voiceResponse && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">AI Response:</span>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300">{voiceResponse}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Navigation Commands</div>
                  <div className="text-muted-foreground">"Navigate to dairy section"</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Product Search</div>
                  <div className="text-muted-foreground">"Find gluten-free bread"</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Deal Hunting</div>
                  <div className="text-muted-foreground">"What deals are on chicken?"</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">List Management</div>
                  <div className="text-muted-foreground">"Add milk to my list"</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Computer Vision Tab */}
        <TabsContent value="vision" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Computer Vision Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                  cameraActive ? 'bg-green-500 animate-pulse' : 'bg-purple-500'
                }`}>
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-semibold">
                    {cameraActive ? 'Analyzing Shelf...' : 'Computer Vision Ready'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Point your camera at any shelf to instantly identify products and compare prices
                  </div>
                </div>
                <Button 
                  onClick={handleCameraAnalysis} 
                  disabled={cameraActive}
                  className="mt-4"
                  size="lg"
                >
                  {cameraActive ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera Analysis
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Eye className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                  <div className="font-medium">Product Recognition</div>
                  <div className="text-sm text-muted-foreground">Instant barcode & label reading</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <PoundSterling className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <div className="font-medium">Price Comparison</div>
                  <div className="text-sm text-muted-foreground">Real-time price checking</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Star className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                  <div className="font-medium">Quality Analysis</div>
                  <div className="text-sm text-muted-foreground">Health & sustainability scores</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI-Curated Smart Deals
              </CardTitle>
              <Button onClick={handleFindSmartDeals} disabled={loading}>
                {loading ? 'Finding...' : 'Find Deals'}
              </Button>
            </CardHeader>
            <CardContent>
              {smartDeals.length > 0 ? (
                <div className="space-y-3">
                  {smartDeals.slice(0, 5).map((deal) => (
                    <div key={deal.id} className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{deal.productName}</div>
                          <div className="text-sm text-muted-foreground">{deal.storeName} • {deal.location}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {deal.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="line-through text-muted-foreground">£{deal.originalPrice.toFixed(2)}</span>
                            <span className="text-lg font-bold text-green-600">£{deal.salePrice.toFixed(2)}</span>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {deal.discountPercent}% OFF
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={deal.personalizedScore * 100} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          AI Match: {Math.round(deal.personalizedScore * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8">
                  <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">AI Deal Detection</h3>
                  <p className="text-muted-foreground mb-4">
                    Let our AI find personalized deals based on your shopping patterns and preferences.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}