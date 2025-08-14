import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { BarcodeScanner } from './BarcodeScanner'

interface Store {
  id: string
  name: string
  chain: string
  address: string
}

interface AddProductLocationProps {
  selectedStore?: Store | null
  onClose?: () => void
  onSuccess?: (product: any) => void
  isOpen: boolean
}

export const AddProductLocation: React.FC<AddProductLocationProps> = ({
  selectedStore,
  onClose,
  onSuccess,
  isOpen
}) => {
  const [step, setStep] = useState<'camera_start' | 'camera_preview' | 'product' | 'barcode' | 'location' | 'photo'>('camera_start')
  const [productName, setProductName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [aisle, setAisle] = useState('')
  const [section, setSection] = useState('')
  const [notes, setNotes] = useState('')
  const [aislePhoto, setAislePhoto] = useState<string>('')
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleBarcodeScanned = (code: string, productInfo?: any) => {
    setBarcode(code)
    if (productInfo?.name) {
      setProductName(productInfo.name)
    }
    setShowBarcodeScanner(false)
    setStep('location')
  }

  // Start camera for preview
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true)
          setStep('camera_preview')
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Camera access denied. You can still add the product location manually.')
      setStep('product')
    }
  }

  // Stop camera and clean up
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setIsCameraReady(false)
  }

  // Capture photo from camera preview
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setAislePhoto(imageData)
        stopCamera()
        setStep('product')
      }
    }
  }

  // Effect to clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const handleSubmit = () => {
    if (!productName.trim() || !aisle.trim() || !section.trim()) {
      alert('Please fill in all required fields')
      return
    }

    const productData = {
      name: productName,
      barcode: barcode,
      location: {
        aisle: aisle,
        section: section
      },
      notes: notes,
      store_id: selectedStore?.id,
      store_name: selectedStore?.name,
      photo: aislePhoto,
      timestamp: new Date().toISOString()
    }

    if (onSuccess) {
      onSuccess(productData)
    }

    // Reset form
    setProductName('')
    setBarcode('')
    setAisle('')
    setSection('')
    setNotes('')
    setAislePhoto('')
    setStep('product')
    
    if (onClose) {
      onClose()
    }
  }

  const reset = () => {
    stopCamera()
    setStep('camera_start')
    setProductName('')
    setBarcode('')
    setAisle('')
    setSection('')
    setNotes('')
    setAislePhoto('')
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>➕ Add Product Location (+10 Points)</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </CardTitle>
            {selectedStore && (
              <p className="text-gray-600">Adding to: {selectedStore.name}</p>
            )}
          </CardHeader>
          <CardContent>
            {/* Progress indicator */}
            {(step !== 'camera_start' && step !== 'camera_preview') && (
              <div className="flex items-center justify-center mb-6">
                {['product', 'barcode', 'location', 'photo'].map((stepName, index) => (
                  <div key={stepName} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      step === stepName ? 'bg-emerald-500 text-white' : 
                      ['product', 'barcode', 'location', 'photo'].indexOf(step) > index ? 'bg-green-500 text-white' : 
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    {index < 3 && <div className="w-8 h-1 bg-gray-200 mx-2"></div>}
                  </div>
                ))}
              </div>
            )}

            {/* Camera Start Step */}
            {step === 'camera_start' && (
              <div className="text-center space-y-6">
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-xl font-semibold">Capture Product & Aisle</h3>
                <p className="text-gray-600 mb-6">
                  First, let's take a photo of the product and its aisle location. 
                  This helps other shoppers find the product quickly!
                </p>
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">📷 Photo Tips:</h4>
                  <ul className="text-sm text-blue-700 text-left space-y-1">
                    <li>• Include the product and aisle signage in the frame</li>
                    <li>• Make sure the aisle number/name is clearly visible</li>
                    <li>• Use good lighting for best results</li>
                    <li>• Hold your phone steady when taking the photo</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={startCamera}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    📷 Start Camera
                  </Button>
                  <Button 
                    onClick={() => setStep('product')}
                    variant="outline"
                    className="flex-1"
                  >
                    Skip Photo
                  </Button>
                </div>
              </div>
            )}

            {/* Camera Preview Step */}
            {step === 'camera_preview' && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">📷 Position Your Shot</h3>
                  <p className="text-gray-600">
                    Frame the product and aisle signage, then tap the capture button
                  </p>
                </div>
                
                {/* Camera Preview */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!isCameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                        <p>Starting camera...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Camera Controls Overlay */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="bg-white/90 hover:bg-white text-black"
                    >
                      ✕ Cancel
                    </Button>
                    <Button
                      onClick={capturePhoto}
                      disabled={!isCameraReady}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6"
                    >
                      📸 Capture
                    </Button>
                  </div>
                </div>
                
                {/* Hidden canvas for photo capture */}
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="text-center text-sm text-gray-500">
                  <p>💡 Make sure the aisle number and product are clearly visible</p>
                </div>
              </div>
            )}

            {step === 'product' && (
              <div className="space-y-4">
                {/* Show captured photo if available */}
                {aislePhoto && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">✅ Photo Captured!</h4>
                    <div className="relative">
                      <img 
                        src={aislePhoto} 
                        alt="Captured aisle photo" 
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStep('camera_start')}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-xs"
                      >
                        📷 Retake
                      </Button>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-2">Product Name *</label>
                  <Input
                    placeholder="e.g., Tesco Whole Milk"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Be specific: include brand name if visible
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setStep('barcode')}
                    disabled={!productName.trim()}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    📷 Next: Scan Barcode
                  </Button>
                  <Button 
                    onClick={() => setStep('location')}
                    disabled={!productName.trim()}
                    variant="outline"
                    className="flex-1"
                  >
                    ⏭️ Skip Barcode
                  </Button>
                </div>
                
                {!aislePhoto && (
                  <div className="text-center">
                    <Button
                      onClick={() => setStep('camera_start')}
                      variant="outline"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      📷 Take Photo of Product & Aisle
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === 'barcode' && (
              <div className="space-y-4 text-center">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-lg font-semibold mb-2">Scan Product Barcode</h3>
                <p className="text-gray-600 mb-6">
                  This helps other shoppers identify the exact product
                </p>
                {barcode && (
                  <Badge className="bg-emerald-500 text-white px-4 py-2 mb-4">
                    Barcode: {barcode}
                  </Badge>
                )}
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setShowBarcodeScanner(true)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    📷 Scan Barcode
                  </Button>
                  <Button 
                    onClick={() => setStep('location')}
                    variant="outline"
                    className="flex-1"
                  >
                    ⏭️ Skip
                  </Button>
                </div>
              </div>
            )}

            {step === 'location' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Aisle Number *</label>
                    <Input
                      placeholder="e.g., 3"
                      value={aisle}
                      onChange={(e) => setAisle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Section *</label>
                    <Input
                      placeholder="e.g., Dairy"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Additional Notes</label>
                  <Textarea
                    placeholder="e.g., Top shelf, near the butter"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={takeAislePhoto}
                    disabled={!aisle.trim() || !section.trim()}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    📸 Next: Photo
                  </Button>
                  <Button 
                    onClick={() => setStep('photo')}
                    disabled={!aisle.trim() || !section.trim()}
                    variant="outline"
                    className="flex-1"
                  >
                    ⏭️ Skip Photo
                  </Button>
                </div>
              </div>
            )}

            {step === 'photo' && (
              <div className="space-y-4">
                {aislePhoto ? (
                  <div className="text-center">
                    <img 
                      src={aislePhoto} 
                      alt="Aisle photo" 
                      className="max-w-full h-48 object-cover rounded-lg mx-auto mb-4"
                    />
                    <Badge className="bg-green-500 text-white">Photo captured!</Badge>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📸</div>
                    <p className="text-gray-600 mb-4">
                      Photo helps other shoppers find the product quickly
                    </p>
                    <Button 
                      onClick={takeAislePhoto}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      📸 Take Aisle Photo
                    </Button>
                  </div>
                )}
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Summary:</h4>
                  <p><strong>Product:</strong> {productName}</p>
                  {barcode && <p><strong>Barcode:</strong> {barcode}</p>}
                  <p><strong>Location:</strong> Aisle {aisle} - {section}</p>
                  {notes && <p><strong>Notes:</strong> {notes}</p>}
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleSubmit}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    ✅ Submit (+10 Points)
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
          </CardContent>
        </Card>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onBarcodeScanned={handleBarcodeScanned}
        onClose={() => setShowBarcodeScanner(false)}
      />
    </>
  )
}