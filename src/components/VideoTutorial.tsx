import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { X, Play, Pause, Maximize2, Volume2 } from 'lucide-react'

interface VideoTutorialProps {
  isOpen: boolean
  onClose: () => void
}

export const VideoTutorial: React.FC<VideoTutorialProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  if (!isOpen) return null

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleFullscreen = () => {
    if (videoRef.current && !isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
      setIsFullscreen(true)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-2xl">
            🎬 CartPilot Video Tutorial
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              poster="/videos/cartpilot-poster.jpg"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src="/videos/cartpilot-tutorial.mp4" type="video/mp4" />
              <source src="/videos/cartpilot-tutorial.webm" type="video/webm" />
              Your browser does not support the video tag.
            </video>
            
            {/* Custom controls overlay (optional) */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleFullscreen}
                  className="text-white hover:bg-white/20 ml-auto"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                
                <Volume2 className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-emerald-800">
              📚 What You'll Learn:
            </h3>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>• Find stores using GPS or postcode search</li>
              <li>• Search products with AI-powered matching</li>
              <li>• Build and manage shopping lists</li>
              <li>• Generate optimal shopping routes</li>
              <li>• Use barcode scanner for quick product lookup</li>
              <li>• Track allergens and dietary restrictions</li>
              <li>• Earn points and unlock achievements</li>
            </ul>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => {
                handlePlayPause()
              }}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isPlaying ? '⏸️ Pause Tutorial' : '▶️ Watch Tutorial'}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}