import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { supabase } from '../supabaseClient'

interface ProfileImageUploadProps {
  currentImageUrl?: string
  userId?: string
  onImageUpdate?: (imageUrl: string) => void
  onClose?: () => void
  isOpen: boolean
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageUrl,
  userId,
  onImageUpdate,
  onClose,
  isOpen
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [step, setStep] = useState<'select' | 'camera' | 'crop'>('select')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB')
        return
      }
      
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setStep('crop')
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', // Front-facing camera for selfies
          width: { ideal: 640 },
          height: { ideal: 640 }
        }
      })
      
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setStep('camera')
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please select an image file instead.')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0)
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' })
            setSelectedImage(file)
            
            const url = URL.createObjectURL(blob)
            setPreviewUrl(url)
            setStep('crop')
            stopCamera()
          }
        }, 'image/jpeg', 0.8)
      }
    }
  }

  const uploadImage = async () => {
    if (!selectedImage || !userId) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create unique filename
      const fileExt = selectedImage.name.split('.').pop()
      const fileName = `profile-${userId}-${Date.now()}.${fileExt}`
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, selectedImage, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (error) {
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      // Update user profile with new image URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        console.warn('Could not update profile in database:', updateError)
        // Continue anyway - the image is uploaded
      }

      // Call callback with new image URL
      if (onImageUpdate) {
        onImageUpdate(publicUrl)
      }

      alert('Profile image updated successfully! 🎉')
      
      if (onClose) {
        onClose()
      }

    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveImage = async () => {
    if (!userId) return
    
    const confirmRemove = confirm('Are you sure you want to remove your profile image?')
    if (!confirmRemove) return

    try {
      // Update user profile to remove image URL
      const { error } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (error) {
        console.warn('Could not update profile in database:', error)
      }

      if (onImageUpdate) {
        onImageUpdate('')
      }

      alert('Profile image removed successfully!')
      
      if (onClose) {
        onClose()
      }

    } catch (error) {
      console.error('Error removing image:', error)
      alert('Failed to remove image. Please try again.')
    }
  }

  const reset = () => {
    setSelectedImage(null)
    setPreviewUrl('')
    setStep('select')
    stopCamera()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📸 Profile Image</span>
            <Button size="sm" variant="ghost" onClick={onClose}>✕</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'select' && (
            <div className="space-y-6">
              {/* Current image */}
              <div className="text-center">
                {currentImageUrl ? (
                  <div className="space-y-4">
                    <img
                      src={currentImageUrl}
                      alt="Current profile"
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gray-200"
                    />
                    <Badge className="bg-green-100 text-green-800">Current Profile Image</Badge>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                      <span className="text-4xl text-gray-500">👤</span>
                    </div>
                    <Badge className="bg-gray-100 text-gray-600">No Profile Image</Badge>
                  </div>
                )}
              </div>

              {/* Upload options */}
              <div className="space-y-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  📁 Choose from Files
                </Button>
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="w-full"
                >
                  📷 Take Photo
                </Button>
                {currentImageUrl && (
                  <Button
                    onClick={handleRemoveImage}
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  >
                    🗑️ Remove Image
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <p>📝 <strong>Tips:</strong></p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Square images work best (1:1 ratio)</li>
                  <li>• Maximum file size: 5MB</li>
                  <li>• Supported formats: JPG, PNG, GIF</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'camera' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Take Your Photo</h3>
                <p className="text-gray-600 text-sm">Position yourself in the frame and smile!</p>
              </div>

              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 border-4 border-white/20 m-8 rounded-full"></div>
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={capturePhoto}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  📸 Capture
                </Button>
                <Button
                  onClick={reset}
                  variant="outline"
                  className="flex-1"
                >
                  🔙 Back
                </Button>
              </div>
            </div>
          )}

          {step === 'crop' && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Preview</h3>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-48 h-48 rounded-full object-cover mx-auto border-4 border-gray-200"
                  />
                )}
              </div>

              {/* Upload progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={uploadImage}
                  disabled={isUploading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {isUploading ? 'Uploading...' : '✅ Upload Image'}
                </Button>
                <Button
                  onClick={reset}
                  variant="outline"
                  className="flex-1"
                  disabled={isUploading}
                >
                  🔄 Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}