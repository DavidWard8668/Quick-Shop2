import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library'
import { offlineService } from '../services/offlineService'

interface ProductInfo {
  name: string
  brand?: string
  category?: string
  description?: string
  image?: string
  barcode: string
  price?: number
  currency?: string
}

interface BarcodeScannerProps {
  onBarcodeScanned?: (barcode: string, productInfo?: ProductInfo) => void
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
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null)
  const [error, setError] = useState<string>('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanningRef = useRef<boolean>(false)

  // Product lookup function using multiple APIs with offline support
  const lookupProduct = async (barcode: string): Promise<ProductInfo> => {
    setIsLookingUp(true)
    
    try {
      // Check offline cache first
      const cachedProduct = await offlineService.getCachedProduct(barcode)
      if (cachedProduct) {
        console.log('📦 Using cached product:', cachedProduct.name)
        return cachedProduct
      }

      // If offline, return basic info
      if (!offlineService.isOnline()) {
        const offlineProduct = {
          name: `Product ${barcode.slice(-4)}`,
          barcode: barcode,
          brand: 'Unknown (Offline)',
          category: 'Scanned Offline',
          description: 'Added while offline - will sync details when online'
        }
        await offlineService.cacheProduct(offlineProduct)
        return offlineProduct
      }

      // Try OpenFoodFacts API first (free, comprehensive)
      const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
      if (offResponse.ok) {
        const offData = await offResponse.json()
        if (offData.status === 1 && offData.product) {
          const product = offData.product
          const productInfo = {
            name: product.product_name || product.product_name_en || 'Unknown Product',
            brand: product.brands,
            category: product.categories,
            description: product.generic_name || product.generic_name_en,
            image: product.image_url,
            barcode: barcode,
            price: undefined
          }
          
          // Cache for offline use
          await offlineService.cacheProduct(productInfo)
          return productInfo
        }
      }

      // Fallback to basic product info
      const fallbackProduct = {
        name: `Product ${barcode}`,
        barcode: barcode,
        brand: 'Unknown',
        category: 'General',
        description: `Barcode: ${barcode}`
      }
      
      await offlineService.cacheProduct(fallbackProduct)
      return fallbackProduct

    } catch (error) {
      console.error('Product lookup error:', error)
      return {
        name: `Product ${barcode}`,
        barcode: barcode,
        brand: 'Unknown',
        category: 'General'
      }
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleBarcodeDetected = async (barcode: string) => {
    if (!barcode || scannedCode === barcode) return
    
    console.log('🎯 Barcode detected:', barcode)
    setScannedCode(barcode)
    
    // Stop scanning temporarily
    stopScanning()
    
    // Lookup product info
    const info = await lookupProduct(barcode)
    setProductInfo(info)
    
    // Notify parent component
    if (onBarcodeScanned) {
      onBarcodeScanned(barcode, info)
    }
  }

  const startCamera = async () => {
    try {
      setError('')
      setCameraReady(false)
      
      // Check if browser supports camera access
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device or browser')
      }

      // Simple camera request with better error handling
      console.log('🎥 Requesting camera access...')
      
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }

      try {
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream
        
        // Set video source
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            setCameraReady(true)
            setHasPermission(true)
            console.log('✅ Camera ready')
            
            // Start barcode scanning after camera is ready
            startBarcodeScanning()
          }
        }
      } catch (permissionError: any) {
        console.error('Camera error:', permissionError)
        
        // Handle specific errors
        if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
          setError('Camera permission denied. Please allow camera access and try again.')
        } else if (permissionError.name === 'NotFoundError' || permissionError.name === 'DevicesNotFoundError') {
          setError('No camera found. Please check your camera connection.')
        } else if (permissionError.name === 'NotReadableError' || permissionError.name === 'TrackStartError') {
          setError('Camera is already in use by another application.')
        } else if (permissionError.name === 'OverconstrainedError' || permissionError.name === 'ConstraintNotSatisfiedError') {
          // Try with simpler constraints
          console.log('Trying with basic constraints...')
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          streamRef.current = basicStream
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play()
              setCameraReady(true)
              setHasPermission(true)
              startBarcodeScanning()
            }
          }
        } else {
          setError(`Camera error: ${permissionError.message || 'Unknown error'}`)
        }
        
        setHasPermission(false)
        setCameraReady(false)
      }
    } catch (error: any) {
      console.error('Failed to start camera:', error)
      setError(`Failed to start camera: ${error.message || 'Unknown error'}`)
      setHasPermission(false)
      setCameraReady(false)
    }
  }

  const startBarcodeScanning = async () => {
    if (!cameraReady || !videoRef.current) {
      console.log('Camera not ready for scanning')
      return
    }

    try {
      setIsScanning(true)
      scanningRef.current = true
      
      // Initialize barcode reader
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader()
      }

      // Start continuous scanning
      console.log('🔍 Starting barcode scanning...')
      
      const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices()
      const selectedDevice = videoDevices[0] // Use first available device
      
      await codeReaderRef.current.decodeFromVideoDevice(
        selectedDevice?.deviceId,
        videoRef.current,
        (result, error) => {
          if (result && scanningRef.current) {
            const barcode = result.getText()
            console.log('✅ Barcode scanned:', barcode)
            handleBarcodeDetected(barcode)
          }
          // Ignore common scanning errors
          if (error && !(error instanceof NotFoundException) && 
              !(error instanceof ChecksumException) && 
              !(error instanceof FormatException)) {
            console.debug('Scanning error:', error)
          }
        }
      )
    } catch (error) {
      console.error('Failed to start barcode scanning:', error)
      setError('Failed to start barcode scanner. Please try again.')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    console.log('🛑 Stopping camera...')
    scanningRef.current = false
    setIsScanning(false)
    
    // Stop barcode reader
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
    
    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setCameraReady(false)
  }

  // Start camera when component opens
  useEffect(() => {
    if (isOpen && !isScanning) {
      startCamera()
    }
    
    return () => {
      stopScanning()
    }
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Barcode Scanner</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              stopScanning()
              onClose?.()
            }}
          >
            ✕
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera View */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              muted
            />
            
            {/* Scanning overlay */}
            {isScanning && cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-green-500 w-64 h-64 opacity-50">
                  <div className="border-t-4 border-green-500 w-full animate-pulse"></div>
                </div>
              </div>
            )}
            
            {/* Status badges */}
            <div className="absolute top-2 left-2 flex gap-2">
              {hasPermission === false && (
                <Badge variant="destructive">No Camera Access</Badge>
              )}
              {isScanning && <Badge variant="default">Scanning...</Badge>}
              {isLookingUp && <Badge variant="secondary">Looking up product...</Badge>}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={startCamera}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Product info */}
          {productInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Product Found!</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {productInfo.name}</p>
                {productInfo.brand && <p><strong>Brand:</strong> {productInfo.brand}</p>}
                {productInfo.category && <p><strong>Category:</strong> {productInfo.category}</p>}
                <p><strong>Barcode:</strong> {productInfo.barcode}</p>
              </div>
              <Button 
                size="sm" 
                className="mt-3"
                onClick={() => {
                  setProductInfo(null)
                  setScannedCode('')
                  startCamera()
                }}
              >
                Scan Another
              </Button>
            </div>
          )}

          {/* Instructions */}
          {!error && !productInfo && (
            <div className="text-center text-sm text-gray-600">
              <p>Position the barcode within the frame</p>
              <p>The scanner will automatically detect it</p>
            </div>
          )}

          {/* Manual barcode entry */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">Can't scan? Enter barcode manually:</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter barcode number"
                className="flex-1 px-3 py-2 border rounded-md"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    handleBarcodeDetected(e.currentTarget.value)
                  }
                }}
              />
              <Button
                size="sm"
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.querySelector('input')
                  if (input?.value) {
                    handleBarcodeDetected(input.value)
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BarcodeScanner