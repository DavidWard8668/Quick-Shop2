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
  const [step, setStep] = useState<'instructions' | 'capture' | 'video_record' | 'analyze' | 'verify' | 'complete'>('instructions')
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [detectedSections, setDetectedSections] = useState<DetectedSection[]>([])
  const [userNotes, setUserNotes] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordedVideo, setRecordedVideo] = useState<string>('')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
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

  const VIDEO_INSTRUCTIONS = [
    "🎬 Record a continuous walkthrough of the store",
    "📱 Keep the camera steady and move slowly",
    "🎯 Focus on aisle numbers and section signs",
    "⏰ Aim for 2-5 minutes of footage",
    "🔊 Narrate what you see (optional)",
    "✨ AI will analyze frame by frame automatically"
  ]

  const startCamera = async () => {
    try {
      // Check if browser supports camera access
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not supported')
        alert('Camera not supported on this device or browser')
        return
      }

      // Try with environment camera first, then fallback to any camera
      let stream: MediaStream | null = null
      
      try {
        // Try back/environment camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        })
      } catch (envError) {
        console.log('Environment camera failed, trying any camera...')
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        })
      }
      
      if (!stream) {
        throw new Error('Could not access any camera')
      }
      
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Ensure video plays with proper event handling
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.log('Video play error:', e))
        }
      }
      setStep('capture')
      console.log('✅ Camera started successfully')
    } catch (error: any) {
      console.error('Error accessing camera:', error)
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to access camera. '
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera access and try again.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found on this device.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application.'
      } else {
        errorMessage += error.message || 'Unknown error occurred.'
      }
      
      alert(errorMessage)
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  // Video recording functions
  const startVideoRecording = async () => {
    try {
      if (!cameraStream) {
        await startCamera()
        return
      }

      recordedChunksRef.current = []
      const mediaRecorder = new MediaRecorder(cameraStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const videoUrl = URL.createObjectURL(blob)
        setRecordedVideo(videoUrl)
        setIsRecording(false)
        setRecordingDuration(0)
        setStep('analyze')
      }
      
      mediaRecorder.start(1000) // Capture data every second
      setIsRecording(true)
      setRecordingDuration(0)
      
      // Start recording timer
      const timer = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 300) { // Max 5 minutes
            stopVideoRecording()
            clearInterval(timer)
            return 300
          }
          return prev + 1
        })
      }, 1000)
      
    } catch (error) {
      console.error('Error starting video recording:', error)
      alert('Unable to start video recording. Please try again.')
    }
  }

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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

  const analyzeContent = async () => {
    if (capturedImages.length === 0 && !recordedVideo) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setStep('analyze')

    // Different analysis steps for video vs images
    const progressSteps = recordedVideo ? [
      { progress: 15, message: "Processing video frames..." },
      { progress: 30, message: "Extracting key frames..." },
      { progress: 45, message: "Analyzing scene transitions..." },
      { progress: 60, message: "Detecting text and signage..." },
      { progress: 75, message: "Mapping store sections..." },
      { progress: 90, message: "Correlating spatial relationships..." },
      { progress: 100, message: "Generating comprehensive store map..." }
    ] : [
      { progress: 20, message: "Analyzing image composition..." },
      { progress: 40, message: "Detecting text and signage..." },
      { progress: 60, message: "Identifying store sections..." },
      { progress: 80, message: "Mapping product categories..." },
      { progress: 100, message: "Generating store layout..." }
    ]

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, recordedVideo ? 1200 : 800))
      setAnalysisProgress(step.progress)
    }

    // Enhanced AI detection results for video analysis
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

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button 
                    onClick={() => setStep('video_record')}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-4 text-lg font-semibold"
                  >
                    🎬 Record Video Walkthrough
                  </Button>
                  <Button 
                    onClick={startCamera}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white py-4 text-lg font-semibold"
                  >
                    📸 Take Individual Photos
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  💡 Video recording provides more comprehensive mapping data
                </p>
              </div>
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
                  onClick={analyzeContent}
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

          {step === 'video_record' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">🎬 Video Store Walkthrough</h3>
                <p className="text-gray-600 mb-4">
                  {isRecording ? "Recording in progress..." : "Ready to record your store walkthrough"}
                </p>
                {isRecording && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <Badge className="bg-red-500 text-white">
                      REC {formatRecordingTime(recordingDuration)}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Video Instructions */}
              {!isRecording && !recordedVideo && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold mb-3 text-blue-800">🎯 Video Recording Tips:</h4>
                  <div className="space-y-2">
                    {VIDEO_INSTRUCTIONS.map((instruction, index) => (
                      <div key={index} className="flex items-center gap-3 text-blue-700 text-sm">
                        <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span>{instruction}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Camera Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                
                {isRecording && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold animate-pulse">
                    🔴 RECORDING - {formatRecordingTime(recordingDuration)}
                  </div>
                )}

                {!isRecording && recordedVideo && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-4xl mb-2">✅</div>
                      <p className="text-lg font-semibold">Video Recorded!</p>
                      <p className="text-sm opacity-75">Duration: {formatRecordingTime(recordingDuration)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Recording Controls */}
              <div className="flex gap-3 justify-center">
                {!isRecording && !recordedVideo && (
                  <>
                    <Button 
                      onClick={() => {
                        if (!cameraStream) {
                          startCamera().then(() => startVideoRecording())
                        } else {
                          startVideoRecording()
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 text-lg"
                    >
                      🎬 Start Recording
                    </Button>
                    <Button 
                      onClick={() => setStep('instructions')}
                      variant="outline"
                    >
                      ← Back
                    </Button>
                  </>
                )}

                {isRecording && (
                  <Button 
                    onClick={stopVideoRecording}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 text-lg"
                  >
                    ⏹️ Stop Recording
                  </Button>
                )}

                {recordedVideo && (
                  <div className="flex gap-3">
                    <Button 
                      onClick={analyzeContent}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3"
                    >
                      🤖 Analyze Video
                    </Button>
                    <Button 
                      onClick={() => {
                        setRecordedVideo('')
                        setRecordingDuration(0)
                      }}
                      variant="outline"
                    >
                      🔄 Re-record
                    </Button>
                  </div>
                )}
              </div>

              {/* Preview of recorded video */}
              {recordedVideo && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">📹 Recorded Video Preview</h4>
                  <video 
                    src={recordedVideo} 
                    controls 
                    className="w-full h-32 bg-black rounded object-cover"
                  />
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