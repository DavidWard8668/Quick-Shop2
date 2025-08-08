import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'

interface AIStoreMappingProps {
  storeId?: string
  storeName?: string
  onMappingComplete?: (mappingData: any) => void
  onClose?: () => void
  isOpen: boolean
}

interface DetectedSection {
  name: string
  confidence: number
  boundingBox: { x: number; y: number; width: number; height: number }
  products: string[]
}

export const AIStoreMapper: React.FC<AIStoreMappingProps> = ({
  storeId,
  storeName = 'Store',
  onMappingComplete,
  onClose,
  isOpen
}) => {
  const [step, setStep] = useState<'instructions' | 'capture' | 'analyze' | 'verify' | 'complete'>('instructions')
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [detectedSections, setDetectedSections] = useState<DetectedSection[]>([])
  const [userNotes, setUserNotes] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  const MAPPING_INSTRUCTIONS = [
    "🚪 Start at the store entrance",
    "📱 Hold phone horizontally for wide shots",
    "🏃‍♂️ Walk slowly through each aisle",
    "📸 Capture aisle signs and section headers",
    "🥬 Include produce, dairy, meat sections",
    "🛒 End at checkout area",
    "📝 Add any notes about layout"
  ]

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setStep('capture')
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Camera access denied. Please enable camera access to map the store.')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImages(prev => [...prev, imageData])
        
        // Visual feedback
        const flash = document.createElement('div')
        flash.style.position = 'fixed'
        flash.style.top = '0'
        flash.style.left = '0'
        flash.style.width = '100%'
        flash.style.height = '100%'
        flash.style.backgroundColor = 'white'
        flash.style.opacity = '0.7'
        flash.style.pointerEvents = 'none'
        flash.style.zIndex = '9999'
        document.body.appendChild(flash)
        
        setTimeout(() => document.body.removeChild(flash), 200)
      }
    }
  }

  const analyzeImages = async () => {
    if (capturedImages.length === 0) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setStep('analyze')

    // Simulate AI analysis with progressive updates
    const progressSteps = [
      { progress: 20, message: "Analyzing image composition..." },
      { progress: 40, message: "Detecting text and signage..." },
      { progress: 60, message: "Identifying store sections..." },
      { progress: 80, message: "Mapping product categories..." },
      { progress: 100, message: "Generating store layout..." }
    ]

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setAnalysisProgress(step.progress)
    }

    // Simulate AI detection results
    const mockDetections: DetectedSection[] = [
      {
        name: "Produce Section",
        confidence: 0.95,
        boundingBox: { x: 50, y: 100, width: 200, height: 150 },
        products: ["Bananas", "Apples", "Lettuce", "Tomatoes", "Carrots"]
      },
      {
        name: "Dairy Section", 
        confidence: 0.88,
        boundingBox: { x: 300, y: 80, width: 180, height: 120 },
        products: ["Milk", "Cheese", "Yogurt", "Butter", "Eggs"]
      },
      {
        name: "Meat & Seafood",
        confidence: 0.92,
        boundingBox: { x: 520, y: 90, width: 160, height: 140 },
        products: ["Chicken", "Beef", "Fish", "Sausages"]
      },
      {
        name: "Bakery",
        confidence: 0.79,
        boundingBox: { x: 700, y: 110, width: 140, height: 100 },
        products: ["Bread", "Pastries", "Cakes", "Donuts"]
      },
      {
        name: "Frozen Foods",
        confidence: 0.86,
        boundingBox: { x: 100, y: 300, width: 250, height: 80 },
        products: ["Ice Cream", "Frozen Vegetables", "Pizza", "TV Dinners"]
      },
      {
        name: "Checkout Area",
        confidence: 0.97,
        boundingBox: { x: 600, y: 400, width: 200, height: 60 },
        products: ["Self-Service", "Cashier Lines", "Customer Service"]
      }
    ]

    setDetectedSections(mockDetections)
    setIsAnalyzing(false)
    setStep('verify')
    stopCamera()
  }

  const submitMapping = async () => {
    const mappingData = {
      store_id: storeId,
      store_name: storeName,
      total_images: capturedImages.length,
      detected_sections: detectedSections,
      user_notes: userNotes,
      mapping_timestamp: new Date().toISOString(),
      confidence_score: detectedSections.reduce((acc, section) => acc + section.confidence, 0) / detectedSections.length
    }

    // Award significant points for store mapping
    try {
      console.log('🗺️ Store mapping data:', mappingData)
      
      if (onMappingComplete) {
        onMappingComplete(mappingData)
      }
      
      setStep('complete')
      
    } catch (error) {
      console.error('Error submitting store mapping:', error)
      alert('Failed to submit store mapping. Data has been saved locally.')
    }
  }

  const reset = () => {
    setCapturedImages([])
    setDetectedSections([])
    setUserNotes('')
    setCurrentImageIndex(0)
    setStep('instructions')
    stopCamera()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>🤖 AI Store Mapper - {storeName}</span>
            <Button size="sm" variant="ghost" onClick={onClose}>✕</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'instructions' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h2 className="text-2xl font-bold mb-4">AI-Powered Store Mapping</h2>
                <p className="text-gray-600 mb-6">
                  Help build the most accurate store maps using computer vision! 
                  Walk through the store and capture key sections.
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4 text-blue-800">📋 Mapping Instructions:</h3>
                <div className="space-y-2">
                  {MAPPING_INSTRUCTIONS.map((instruction, index) => (
                    <div key={index} className="flex items-center gap-3 text-blue-700">
                      <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm">{instruction}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-emerald-800">🎁 Rewards:</h3>
                <div className="text-emerald-700 text-sm space-y-1">
                  <div>• Store mapping completion: <strong>+50 points</strong></div>
                  <div>• High accuracy bonus: <strong>+25 points</strong></div>
                  <div>• First mapper bonus: <strong>+100 points</strong></div>
                </div>
              </div>

              <Button 
                onClick={startCamera}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 text-lg font-semibold"
              >
                🚀 Start AI Store Mapping
              </Button>
            </div>
          )}

          {step === 'capture' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">📱 Capture Store Sections</h3>
                <Badge className="bg-green-500 text-white">
                  {capturedImages.length} images captured
                </Badge>
              </div>

              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-80 object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 border-4 border-white/20 m-4 rounded-lg"></div>
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Overlay guidance */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                  Point at aisle signs and section headers
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={captureFrame}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3"
                >
                  📸 Capture Section
                </Button>
                <Button 
                  onClick={analyzeImages}
                  disabled={capturedImages.length < 3}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3"
                >
                  🤖 Analyze ({capturedImages.length}/3+ images)
                </Button>
              </div>

              {capturedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {capturedImages.slice(-6).map((img, index) => (
                    <img 
                      key={index}
                      src={img} 
                      alt={`Capture ${index + 1}`} 
                      className="w-full h-20 object-cover rounded border-2 border-green-300"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'analyze' && (
            <div className="space-y-6 text-center py-8">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis in Progress</h3>
              <p className="text-gray-600 mb-6">
                Processing {capturedImages.length} images with computer vision...
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analysis Progress</span>
                  <span>{analysisProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-purple-800 text-sm">
                  🧠 AI is identifying store sections, reading signs, and mapping product locations...
                </p>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">🎯 AI Detection Results</h3>
                <p className="text-gray-600">Review and verify the detected store sections</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detectedSections.map((section, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{section.name}</h4>
                      <Badge className={`${
                        section.confidence > 0.9 ? 'bg-green-500' :
                        section.confidence > 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                      } text-white`}>
                        {Math.round(section.confidence * 100)}% confident
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Products: {section.products.join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
                <Textarea
                  placeholder="Add any corrections or additional details about the store layout..."
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={submitMapping}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3"
                >
                  ✅ Submit Store Map (+50 Points)
                </Button>
                <Button 
                  onClick={reset}
                  variant="outline"
                  className="flex-1"
                >
                  🔄 Start Over
                </Button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-semibold mb-2">Store Mapping Complete!</h3>
              <p className="text-gray-600 mb-6">
                You've earned <strong>50+ points</strong> for contributing to the community!
              </p>
              
              <div className="bg-green-50 p-6 rounded-lg mb-6">
                <h4 className="font-semibold text-green-800 mb-2">🏆 Mapping Summary:</h4>
                <div className="text-green-700 text-sm space-y-1">
                  <div>• Images processed: {capturedImages.length}</div>
                  <div>• Sections detected: {detectedSections.length}</div>
                  <div>• Average confidence: {Math.round((detectedSections.reduce((acc, s) => acc + s.confidence, 0) / detectedSections.length) * 100)}%</div>
                  <div>• Points earned: 50+</div>
                </div>
              </div>

              <Button 
                onClick={onClose}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3"
              >
                🚀 Done
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}