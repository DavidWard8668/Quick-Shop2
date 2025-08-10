import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { arNavigationService, ARMarker } from '../services/arNavigationService'

interface ARNavigatorProps {
  isOpen: boolean
  onClose: () => void
  storeId: string
  storeName: string
  route?: any[]
}

export const ARNavigator: React.FC<ARNavigatorProps> = ({
  isOpen,
  onClose,
  storeId,
  storeName,
  route = []
}) => {
  const [arStatus, setArStatus] = useState(arNavigationService.getARStatus())
  const [arInstructions, setArInstructions] = useState<string[]>([])
  const [visibleMarkers, setVisibleMarkers] = useState<ARMarker[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (isOpen && route.length > 0) {
      startARNavigation()
    } else if (!isOpen) {
      stopARNavigation()
    }

    return () => {
      stopARNavigation()
    }
  }, [isOpen, route])

  useEffect(() => {
    // Update AR status and instructions every second
    const interval = setInterval(() => {
      setArStatus(arNavigationService.getARStatus())
      setArInstructions(arNavigationService.generateARInstructions())
      setVisibleMarkers(arNavigationService.getVisibleMarkers())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const startARNavigation = async () => {
    try {
      // Start camera feed
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      setCameraStream(stream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Initialize AR service
      const success = await arNavigationService.startARNavigation(storeId, route)
      if (success) {
        // Create store markers
        arNavigationService.createStoreMarkers(storeId)
        console.log('🎯 AR Navigation started successfully')
      }
    } catch (error) {
      console.error('Failed to start AR navigation:', error)
      // Fallback to non-camera mode
      setArStatus({ ...arStatus, supported: false })
    }
  }

  const stopARNavigation = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    arNavigationService.stopARNavigation()
    setArInstructions([])
    setVisibleMarkers([])
  }

  const drawAROverlay = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Match canvas size to video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw AR markers
    visibleMarkers.forEach((marker, index) => {
      const x = canvas.width * 0.5 + (index * 100) - (visibleMarkers.length * 50)
      const y = canvas.height * 0.3

      // Marker background
      ctx.fillStyle = marker.content.color + '90'
      ctx.fillRect(x - 50, y - 30, 100, 60)

      // Marker border
      ctx.strokeStyle = marker.content.color
      ctx.lineWidth = 2
      ctx.strokeRect(x - 50, y - 30, 100, 60)

      // Marker icon
      ctx.font = '24px Arial'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(marker.content.icon, x, y - 5)

      // Marker title
      ctx.font = 'bold 12px Arial'
      ctx.fillText(marker.content.title, x, y + 15)

      // Distance
      if (marker.distance) {
        ctx.font = '10px Arial'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(`${marker.distance.toFixed(1)}m`, x, y + 28)
      }
    })

    // Draw compass
    if (arInstructions.length > 0) {
      const compassX = canvas.width - 80
      const compassY = 80

      // Compass background
      ctx.fillStyle = '#000000aa'
      ctx.beginPath()
      ctx.arc(compassX, compassY, 40, 0, 2 * Math.PI)
      ctx.fill()

      // Compass border
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // North indicator
      ctx.fillStyle = '#ff0000'
      ctx.beginPath()
      ctx.moveTo(compassX, compassY - 35)
      ctx.lineTo(compassX - 5, compassY - 25)
      ctx.lineTo(compassX + 5, compassY - 25)
      ctx.closePath()
      ctx.fill()

      // Direction arrow (simplified)
      ctx.fillStyle = '#00ff00'
      ctx.beginPath()
      ctx.moveTo(compassX, compassY - 30)
      ctx.lineTo(compassX - 8, compassY + 20)
      ctx.lineTo(compassX, compassY + 15)
      ctx.lineTo(compassX + 8, compassY + 20)
      ctx.closePath()
      ctx.fill()
    }
  }

  useEffect(() => {
    if (videoRef.current && canvasRef.current && visibleMarkers.length > 0) {
      const interval = setInterval(drawAROverlay, 100) // 10 FPS overlay
      return () => clearInterval(interval)
    }
  }, [visibleMarkers])

  const handleVoiceCommand = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice commands not supported in this browser')
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsRecording(true)
      console.log('🎤 Voice recording started')
    }

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript
      console.log('🎤 Voice command:', command)
      
      const response = arNavigationService.processVoiceCommand(command)
      
      // Text-to-speech response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(response)
        speechSynthesis.speak(utterance)
      }
      
      // Show visual response
      alert(`🤖 CartPilot: ${response}`)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
      console.log('🎤 Voice recording ended')
    }

    try {
      recognition.start()
    } catch (error) {
      console.error('Failed to start voice recognition:', error)
      setIsRecording(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 text-white">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">🎯 AR Navigation</h2>
          <Badge className="bg-blue-500 text-white">
            {storeName}
          </Badge>
          {arStatus.active && (
            <Badge className="bg-green-500 text-white">
              Active
            </Badge>
          )}
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          className="text-white hover:bg-white/20"
        >
          ✕ Close
        </Button>
      </div>

      {/* AR View */}
      <div className="flex-1 relative">
        {cameraStream ? (
          <>
            {/* Camera feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* AR overlay canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
          </>
        ) : (
          // Fallback view when no camera
          <div className="flex items-center justify-center h-full bg-gray-900 text-white">
            <div className="text-center space-y-4">
              <div className="text-6xl">📱</div>
              <h3 className="text-xl font-semibold">AR Mode</h3>
              <p className="text-gray-300">
                {arStatus.supported 
                  ? 'Camera not available - using instruction mode' 
                  : 'AR not supported on this device'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions Overlay */}
      {arInstructions.length > 0 && (
        <div className="absolute top-20 left-4 right-4">
          <Card className="bg-black/80 text-white border-gray-600">
            <CardContent className="p-4">
              <div className="space-y-2">
                {arInstructions.map((instruction, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{instruction}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 bg-black/80 space-y-3">
        {/* Voice control */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleVoiceCommand}
            disabled={isRecording}
            className={`flex-1 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            {isRecording ? '🎤 Listening...' : '🎤 Voice Command'}
          </Button>
          
          <Button
            onClick={() => {
              const instructions = arNavigationService.generateARInstructions()
              if (instructions.length > 0 && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(instructions[0])
                speechSynthesis.speak(utterance)
              }
            }}
            variant="outline"
            className="text-white border-white hover:bg-white/20"
          >
            🔊 Repeat
          </Button>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span>Route: {route.length} items</span>
          <span>Markers: {visibleMarkers.length} visible</span>
          <span>
            Status: {arStatus.active ? '🟢 Active' : '🟡 Standby'}
          </span>
        </div>

        {/* Navigation hints */}
        <div className="text-xs text-gray-400 text-center">
          💡 Try voice commands: "Where is checkout?" • "Next item please" • "Help"
        </div>
      </div>
    </div>
  )
}