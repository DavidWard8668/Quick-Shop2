import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

interface BarcodeScannerProps {
  onBarcodeScanned?: (barcode: string, productInfo?: any) => void
  onClose?: () => void
  isOpen: boolean
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onBarcodeScanned, 
  onClose, 
  isOpen 
}) => {
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scannedCode, setScannedCode] = useState<string>('')
  const [error, setError] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      setError('')
      setIsScanning(true)
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      setHasPermission(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Camera access denied or not available')
      setHasPermission(false)
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const handleManualEntry = () => {
    const barcode = prompt('Enter barcode manually:')
    if (barcode) {
      handleBarcodeDetected(barcode)
    }
  }

  const handleBarcodeDetected = async (barcode: string) => {
    setScannedCode(barcode)
    stopCamera()
    
    // Mock product lookup (in real app, this would call a barcode API)
    const mockProduct = {
      name: 'Unknown Product',
      brand: 'Generic',
      category: 'Unknown',
      barcode: barcode
    }
    
    if (onBarcodeScanned) {
      onBarcodeScanned(barcode, mockProduct)
    }
  }

  const handleTakePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        
        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        
        // For now, simulate barcode detection
        setTimeout(() => {
          const mockBarcode = Math.random().toString().substring(2, 15)
          handleBarcodeDetected(mockBarcode)
        }, 1000)
      }
    }
  }

  useEffect(() => {
    if (isOpen && !isScanning) {
      // Auto-start camera when opened
      startCamera()
    }
    
    return () => {
      stopCamera()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full bg-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📷 Barcode Scanner</span>
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
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          {scannedCode ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold mb-2">Barcode Scanned!</h3>
              <Badge className="bg-emerald-500 text-white px-4 py-2 text-lg">
                {scannedCode}
              </Badge>
              <p className="text-gray-600 mt-4">Product information captured</p>
            </div>
          ) : isScanning ? (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 border-2 border-white/50 m-8 rounded-lg"></div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <p className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                    Position barcode in the frame
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleTakePhoto}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  📸 Scan Now
                </Button>
                <Button 
                  onClick={handleManualEntry}
                  variant="outline"
                  className="flex-1"
                >
                  ⌨️ Manual Entry
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📷</div>
              <h3 className="text-lg font-semibold mb-2">Camera Access</h3>
              <p className="text-gray-600 mb-6">
                We need camera access to scan barcodes
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={startCamera}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  📷 Start Camera
                </Button>
                <Button 
                  onClick={handleManualEntry}
                  variant="outline"
                  className="w-full"
                >
                  ⌨️ Enter Barcode Manually
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}