import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { FloorPlan, floorPlanService } from '../services/floorPlanService'

interface FloorPlanViewerProps {
  storeId: string
  storeName: string
  cartItems?: Array<{ name: string }>
  onRouteGenerated?: (route: any[]) => void
}

export const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({
  storeId,
  storeName,
  cartItems = [],
  onRouteGenerated
}) => {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null)
  const [optimizedRoute, setOptimizedRoute] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showLabels, setShowLabels] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadFloorPlan()
  }, [storeId])

  useEffect(() => {
    if (floorPlan && cartItems.length > 0) {
      generateRoute()
    }
  }, [floorPlan, cartItems])

  useEffect(() => {
    if (floorPlan) {
      drawFloorPlan()
    }
  }, [floorPlan, optimizedRoute, selectedItem, zoom, pan, showLabels])

  const loadFloorPlan = async () => {
    try {
      setLoading(true)
      const plan = await floorPlanService.getFloorPlan(storeId)
      setFloorPlan(plan)
      
      if (plan) {
        console.log(`🏪 Loaded floor plan for ${plan.storeName}`)
      } else {
        console.log('📍 No floor plan available - using basic layout')
      }
    } catch (error) {
      console.error('Failed to load floor plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateRoute = async () => {
    if (!floorPlan || cartItems.length === 0) return

    try {
      const itemNames = cartItems.map(item => item.name)
      const route = await floorPlanService.generateOptimizedRoute(storeId, itemNames)
      setOptimizedRoute(route)
      
      if (onRouteGenerated) {
        onRouteGenerated(route)
      }
      
      console.log(`🗺️ Generated route for ${route.length} items`)
    } catch (error) {
      console.error('Failed to generate route:', error)
    }
  }

  const drawFloorPlan = () => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !floorPlan) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const containerRect = container.getBoundingClientRect()
    canvas.width = containerRect.width
    canvas.height = Math.max(400, floorPlan.layout.height * zoom)

    // Clear canvas
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Apply zoom and pan
    ctx.save()
    ctx.scale(zoom, zoom)
    ctx.translate(pan.x, pan.y)

    // Draw zones (background areas)
    floorPlan.zones.forEach(zone => {
      ctx.fillStyle = zone.color + '20' // Add transparency
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height)
      
      ctx.strokeStyle = zone.color
      ctx.lineWidth = 2
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height)

      if (showLabels) {
        ctx.fillStyle = zone.color
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(zone.name, zone.x + zone.width / 2, zone.y + 15)
      }
    })

    // Draw aisles
    floorPlan.aisles.forEach(aisle => {
      // Aisle background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(aisle.x, aisle.y, aisle.width, aisle.height)
      
      // Aisle border
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 1
      ctx.strokeRect(aisle.x, aisle.y, aisle.width, aisle.height)

      // Aisle number
      if (showLabels) {
        ctx.fillStyle = '#374151'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(
          `${aisle.number}`,
          aisle.x + aisle.width / 2,
          aisle.y - 5
        )
        
        // Aisle name
        ctx.font = '12px Arial'
        ctx.fillText(
          aisle.name,
          aisle.x + aisle.width / 2,
          aisle.y + aisle.height + 15
        )
      }

      // Draw sections within aisle
      aisle.sections.forEach(section => {
        // Section border
        ctx.strokeStyle = '#9ca3af'
        ctx.lineWidth = 1
        ctx.setLineDash([2, 2])
        ctx.strokeRect(section.x, section.y, section.width, section.height)
        ctx.setLineDash([])

        if (showLabels) {
          // Section label
          ctx.fillStyle = '#6b7280'
          ctx.font = '10px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(
            section.name,
            section.x + section.width / 2,
            section.y + section.height / 2
          )
        }
      })
    })

    // Draw fixtures
    floorPlan.fixtures.forEach(fixture => {
      const colors: Record<string, string> = {
        checkout: '#10b981',
        customer_service: '#3b82f6',
        pharmacy: '#8b5cf6',
        deli: '#f59e0b',
        bakery: '#ef4444',
        restroom: '#6b7280',
        atm: '#14b8a6'
      }
      
      ctx.fillStyle = colors[fixture.type] || '#6b7280'
      ctx.fillRect(fixture.x, fixture.y, fixture.width, fixture.height)
      
      if (showLabels) {
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(
          fixture.name,
          fixture.x + fixture.width / 2,
          fixture.y + fixture.height / 2
        )
      }
    })

    // Draw route path
    if (optimizedRoute.length > 1) {
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      
      for (let i = 0; i < optimizedRoute.length; i++) {
        const point = optimizedRoute[i]
        if (i === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw route points
    optimizedRoute.forEach((point, index) => {
      // Route point
      ctx.fillStyle = point.item === selectedItem ? '#fbbf24' : '#ef4444'
      ctx.beginPath()
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI)
      ctx.fill()
      
      // Order number
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(point.order.toString(), point.x, point.y + 4)
      
      // Item label
      if (showLabels) {
        ctx.fillStyle = '#000000'
        ctx.font = '10px Arial'
        ctx.fillText(point.item, point.x, point.y - 15)
      }
    })

    // Draw entrances and exits
    floorPlan.layout.entrances.forEach(entrance => {
      ctx.fillStyle = '#10b981'
      ctx.beginPath()
      ctx.arc(entrance.x, entrance.y, 10, 0, 2 * Math.PI)
      ctx.fill()
      
      if (showLabels) {
        ctx.fillStyle = '#000000'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('ENTER', entrance.x, entrance.y - 15)
      }
    })

    floorPlan.layout.exits.forEach(exit => {
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(exit.x, exit.y, 10, 0, 2 * Math.PI)
      ctx.fill()
      
      if (showLabels) {
        ctx.fillStyle = '#000000'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('EXIT', exit.x, exit.y - 15)
      }
    })

    ctx.restore()
  }

  const handleZoom = (factor: number) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev * factor)))
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p>Loading store layout...</p>
        </CardContent>
      </Card>
    )
  }

  if (!floorPlan) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">🏗️</div>
          <h3 className="text-lg font-semibold mb-2">Floor Plan Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            We're working with {storeName} to provide detailed store layouts.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <p className="font-semibold text-blue-800 mb-2">📧 Want to help?</p>
            <p className="text-blue-700">
              Contact us at partnerships@cartpilot.com to provide store layout data
              or become a community mapper!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            🏪 {floorPlan.storeName} Layout
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-300">
              Official Layout
            </Badge>
            <Badge variant="outline">
              v{floorPlan.version}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleZoom(1.2)}
              >
                🔍 Zoom In
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleZoom(0.8)}
              >
                🔍 Zoom Out
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
              >
                🔄 Reset View
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowLabels(!showLabels)}
              >
                {showLabels ? '🏷️ Hide Labels' : '🏷️ Show Labels'}
              </Button>
            </div>
            
            {optimizedRoute.length > 0 && (
              <Badge className="bg-blue-500 text-white">
                Route: {optimizedRoute.length} stops
              </Badge>
            )}
          </div>

          {/* Floor plan canvas */}
          <div 
            ref={containerRef}
            className="border rounded-lg overflow-hidden bg-gray-50"
            style={{ height: '500px' }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-move"
              onMouseDown={(e) => {
                // Handle panning - basic implementation
                const startX = e.clientX
                const startY = e.clientY
                
                const handleMouseMove = (e: MouseEvent) => {
                  const deltaX = (e.clientX - startX) / zoom
                  const deltaY = (e.clientY - startY) / zoom
                  setPan(prev => ({
                    x: prev.x + deltaX * 0.1,
                    y: prev.y + deltaY * 0.1
                  }))
                }
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove)
                  document.removeEventListener('mouseup', handleMouseUp)
                }
                
                document.addEventListener('mousemove', handleMouseMove)
                document.addEventListener('mouseup', handleMouseUp)
              }}
            />
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Produce</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Dairy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>Frozen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Your Route</span>
            </div>
          </div>

          {/* Route summary */}
          {optimizedRoute.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">📝 Shopping Route</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {optimizedRoute.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedItem === item.item
                        ? 'bg-yellow-100 border-yellow-300 border'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedItem(
                      selectedItem === item.item ? null : item.item
                    )}
                  >
                    <div className="font-medium">{item.order}. {item.item}</div>
                    <div className="text-gray-600">
                      Aisle {item.aisle.number} • {item.section.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={generateRoute}
              disabled={cartItems.length === 0}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              🗺️ Generate New Route
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Share functionality
                navigator.share?.({
                  title: 'CartPilot Store Layout',
                  text: `Check out the layout for ${floorPlan.storeName}!`,
                  url: window.location.href
                }).catch(() => {
                  // Fallback: copy to clipboard
                  navigator.clipboard.writeText(window.location.href)
                  alert('Link copied to clipboard!')
                })
              }}
              className="px-6"
            >
              📤 Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}