import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library'

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
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanningRef = useRef<boolean>(false)

  // Product lookup function using multiple APIs
  const lookupProduct = async (barcode: string): Promise<ProductInfo> => {
    setIsLookingUp(true)
    
    try {
      // Try OpenFoodFacts API first (free, comprehensive)
      const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
      if (offResponse.ok) {
        const offData = await offResponse.json()
        if (offData.status === 1 && offData.product) {
          const product = offData.product
          return {
            name: product.product_name || product.product_name_en || 'Unknown Product',
            brand: product.brands,
            category: product.categories,
            description: product.generic_name || product.generic_name_en,
            image: product.image_url,
            barcode: barcode,
            price: undefined // OpenFoodFacts doesn't have price info
          }
        }
      }

      // Fallback to UPC Database API
      try {
        const upcResponse = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`)
        if (upcResponse.ok) {
          const upcData = await upcResponse.json()
          if (upcData.items && upcData.items.length > 0) {
            const item = upcData.items[0]
            return {
              name: item.title || 'Unknown Product',
              brand: item.brand,
              category: item.category,
              description: item.description,
              image: item.images?.[0],
              barcode: barcode,
              price: undefined
            }
          }
        }
      } catch (upcError) {
        console.log('UPC API failed, using fallback')
      }

      // Final fallback - return basic info
      return {
        name: 'Product Found',
        barcode: barcode,
        brand: 'Unknown Brand',
        category: 'Scanned Product'
      }
    } catch (error) {
      console.error('Product lookup failed:', error)
      return {
        name: 'Scanned Product',
        barcode: barcode,
        brand: 'Unknown'
      }
    } finally {
      setIsLookingUp(false)
    }
  }

  const startCamera = async () => {
    try {
      setError('')
      setIsScanning(true)
      scanningRef.current = true
      
      // Initialize barcode reader
      codeReaderRef.current = new BrowserMultiFormatReader()
      
      // Request camera permission and start scanning
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices()
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      ) || videoInputDevices[videoInputDevices.length - 1] // Default to last camera (usually back)
      
      if (videoRef.current) {
        setHasPermission(true)
        
        // Start continuous scanning
        codeReaderRef.current.decodeFromVideoDevice(
          backCamera?.deviceId,
          videoRef.current,
          (result, error) => {
            if (result && scanningRef.current) {
              const barcode = result.getText()
              console.log('✅ Barcode detected:', barcode)
              handleBarcodeDetected(barcode)
              scanningRef.current = false // Stop scanning after first successful scan
            }
            if (error && !(error instanceof NotFoundException)) {
              console.error('Scanning error:', error)
            }
          }
        )
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Camera access denied or not available. Please allow camera permissions.')
      setHasPermission(false)
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    scanningRef.current = false
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const handleManualEntry = () => {
    const barcode = prompt('Enter barcode manually (12-13 digits):')
    if (barcode && /^\d{12,13}$/.test(barcode)) {
      handleBarcodeDetected(barcode)
    } else if (barcode) {
      setError('Please enter a valid 12 or 13 digit barcode')
    }
  }

  const handleBarcodeDetected = async (barcode: string) => {
    setScannedCode(barcode)
    stopCamera()
    
    try {
      // Look up product information
      const product = await lookupProduct(barcode)
      setProductInfo(product)
      
      // Notify parent component
      if (onBarcodeScanned) {
        onBarcodeScanned(barcode, product)
      }
    } catch (error) {
      console.error('Error processing barcode:', error)
      setError('Failed to look up product information')
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
            <div className="text-center py-6">
              {isLookingUp ? (
                <div className="space-y-4">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold mb-2">Looking up product...</h3>
                  <div className="animate-spin mx-auto w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                  <Badge className="bg-blue-500 text-white px-4 py-2">
                    {scannedCode}
                  </Badge>
                </div>
              ) : productInfo ? (
                <div className="space-y-4">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-emerald-600 mb-2">Product Found!</h3>
                  
                  {productInfo.image && (
                    <div className="mx-auto w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={productInfo.image} 
                        alt={productInfo.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjY0IiB5PSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTNBRiIgZm9udC1zaXplPSIxNCI+UHJvZHVjdDwvdGV4dD4KPC9zdmc+';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="text-left space-y-2">
                    <div>
                      <h4 className="font-bold text-lg text-gray-800">{productInfo.name}</h4>
                      {productInfo.brand && (
                        <p className="text-gray-600">{productInfo.brand}</p>
                      )}
                    </div>
                    
                    {productInfo.category && (
                      <div className="flex flex-wrap gap-1">
                        {productInfo.category.split(',').slice(0, 3).map((cat, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {cat.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {productInfo.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {productInfo.description}
                      </p>
                    )}
                    
                    <div className="pt-2">
                      <Badge className="bg-emerald-500 text-white">
                        📊 {scannedCode}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={() => {
                        setScannedCode('')
                        setProductInfo(null)
                        setError('')
                        startCamera()
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      🔄 Scan Another
                    </Button>
                    <Button 
                      onClick={onClose}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      ✅ Done
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : isScanning ? (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-72 object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                {/* Scanning overlay with animated scanner line */}
                <div className="absolute inset-0 border-2 border-emerald-400/60 m-8 rounded-lg">
                  <div className="absolute inset-0 bg-emerald-400/10 rounded-lg">
                    <div className="w-full h-0.5 bg-emerald-400 animate-pulse absolute top-1/2 transform -translate-y-1/2"></div>
                  </div>
                </div>
                
                {/* Corner indicators */}
                <div className="absolute top-10 left-10 w-6 h-6 border-l-4 border-t-4 border-emerald-400"></div>
                <div className="absolute top-10 right-10 w-6 h-6 border-r-4 border-t-4 border-emerald-400"></div>
                <div className="absolute bottom-10 left-10 w-6 h-6 border-l-4 border-b-4 border-emerald-400"></div>
                <div className="absolute bottom-10 right-10 w-6 h-6 border-r-4 border-b-4 border-emerald-400"></div>
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    Scanning automatically...
                  </div>
                </div>
              </div>
              
              <div className="text-center space-y-3">
                <p className="text-gray-600 text-sm">
                  📱 <strong>Position barcode in the viewfinder</strong><br/>
                  Scanning will happen automatically when detected
                </p>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={stopCamera}
                    variant="outline"
                    className="flex-1"
                  >
                    ⏹️ Stop Camera
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