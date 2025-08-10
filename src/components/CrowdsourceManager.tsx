import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { floorPlanService } from '../services/floorPlanService'
import { notificationService } from '../services/notificationService'

interface CrowdsourceManagerProps {
  isOpen: boolean
  onClose: () => void
  storeId: string
  storeName: string
  userId?: string
  userEmail?: string
}

interface CrowdsourcedUpdate {
  id: string
  type: 'product_location' | 'aisle_change' | 'new_section' | 'price_update' | 'availability'
  productName: string
  currentLocation?: { aisle: number; section: string }
  newLocation?: { aisle: number; section: string }
  description: string
  confidence: number
  submittedBy: string
  submittedAt: number
  verified: boolean
  verifications: number
  rejections: number
}

export const CrowdsourceManager: React.FC<CrowdsourceManagerProps> = ({
  isOpen,
  onClose,
  storeId,
  storeName,
  userId,
  userEmail
}) => {
  const [updates, setUpdates] = useState<CrowdsourcedUpdate[]>([])
  const [selectedTab, setSelectedTab] = useState<'submit' | 'verify' | 'history'>('submit')
  const [loading, setLoading] = useState(false)

  // Submit new update form
  const [updateType, setUpdateType] = useState<'product_location' | 'aisle_change' | 'new_section' | 'price_update' | 'availability'>('product_location')
  const [productName, setProductName] = useState('')
  const [currentAisle, setCurrentAisle] = useState('')
  const [currentSection, setCurrentSection] = useState('')
  const [newAisle, setNewAisle] = useState('')
  const [newSection, setNewSection] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadCrowdsourcedData()
    }
  }, [isOpen, storeId])

  const loadCrowdsourcedData = async () => {
    setLoading(true)
    try {
      // Simulate loading crowdsourced data
      const mockUpdates: CrowdsourcedUpdate[] = [
        {
          id: '1',
          type: 'product_location',
          productName: 'Organic Milk',
          currentLocation: { aisle: 2, section: 'Dairy' },
          newLocation: { aisle: 3, section: 'Organic Dairy' },
          description: 'Moved to new organic section',
          confidence: 0.8,
          submittedBy: 'user123',
          submittedAt: Date.now() - 3600000,
          verified: false,
          verifications: 2,
          rejections: 0
        },
        {
          id: '2',
          type: 'aisle_change',
          productName: 'Breakfast Cereal',
          currentLocation: { aisle: 5, section: 'Breakfast' },
          newLocation: { aisle: 6, section: 'Breakfast' },
          description: 'Entire breakfast section moved to aisle 6',
          confidence: 0.9,
          submittedBy: 'mapper456',
          submittedAt: Date.now() - 7200000,
          verified: true,
          verifications: 5,
          rejections: 0
        }
      ]
      setUpdates(mockUpdates)
    } catch (error) {
      console.error('Failed to load crowdsourced data:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitUpdate = async () => {
    if (!productName.trim() || !description.trim()) {
      alert('Please fill in all required fields')
      return
    }

    const newUpdate: CrowdsourcedUpdate = {
      id: Date.now().toString(),
      type: updateType,
      productName: productName.trim(),
      currentLocation: currentAisle && currentSection ? 
        { aisle: parseInt(currentAisle), section: currentSection } : undefined,
      newLocation: newAisle && newSection ? 
        { aisle: parseInt(newAisle), section: newSection } : undefined,
      description: description.trim(),
      confidence: 0.6, // Initial confidence for new submissions
      submittedBy: userId || 'anonymous',
      submittedAt: Date.now(),
      verified: false,
      verifications: 0,
      rejections: 0
    }

    try {
      // Add to floor plan service
      await floorPlanService.addProductLocation(
        storeId,
        productName,
        parseInt(newAisle),
        newSection,
        userId || 'anonymous'
      )

      // Add to local state
      setUpdates(prev => [newUpdate, ...prev])

      // Send notification if enabled
      if (notificationService.getSettings().enabled) {
        await notificationService.showNotification({
          title: '📍 Update Submitted!',
          body: `Thanks for helping map ${productName} at ${storeName}`,
          tag: 'crowdsource-submitted',
          data: { type: 'crowdsource', update: newUpdate }
        })
      }

      // Clear form
      setProductName('')
      setCurrentAisle('')
      setCurrentSection('')
      setNewAisle('')
      setNewSection('')
      setDescription('')
      
      // Switch to history tab
      setSelectedTab('history')
      
      alert('✅ Update submitted successfully! Thank you for contributing.')
    } catch (error) {
      console.error('Failed to submit update:', error)
      alert('❌ Failed to submit update. Please try again.')
    }
  }

  const verifyUpdate = async (updateId: string, isVerification: boolean) => {
    setUpdates(prev => prev.map(update => {
      if (update.id === updateId) {
        return {
          ...update,
          verifications: isVerification ? update.verifications + 1 : update.verifications,
          rejections: !isVerification ? update.rejections + 1 : update.rejections,
          verified: update.verifications + (isVerification ? 1 : 0) >= 3 // Verify after 3 confirmations
        }
      }
      return update
    }))

    const update = updates.find(u => u.id === updateId)
    if (update && isVerification) {
      // Award points for verification
      console.log(`+2 points for verifying ${update.productName}`)
      
      if (notificationService.getSettings().points) {
        await notificationService.notifyPointsEarned(2, 'verifying crowdsourced data')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              👥 Community Mapping
              <Badge variant="outline">{storeName}</Badge>
            </span>
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
        <CardContent className="space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Tab Navigation */}
          <div className="flex border-b">
            <Button
              variant={selectedTab === 'submit' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('submit')}
              className="rounded-none border-b-2 border-transparent"
            >
              ➕ Submit Update
            </Button>
            <Button
              variant={selectedTab === 'verify' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('verify')}
              className="rounded-none border-b-2 border-transparent"
            >
              ✅ Verify Updates
            </Button>
            <Button
              variant={selectedTab === 'history' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('history')}
              className="rounded-none border-b-2 border-transparent"
            >
              📜 History
            </Button>
          </div>

          {/* Submit Update Tab */}
          {selectedTab === 'submit' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">🏆 Help Build Better Maps!</h3>
                <p className="text-sm text-blue-700">
                  Earn points by reporting product locations, store changes, and helping other shoppers. 
                  All submissions are verified by the community.
                </p>
              </div>

              <div className="grid gap-4">
                {/* Update Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Update Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'product_location', label: '📍 Product Location', desc: 'Report where to find a product' },
                      { value: 'aisle_change', label: '🔄 Aisle Change', desc: 'Section moved to different aisle' },
                      { value: 'new_section', label: '✨ New Section', desc: 'New product section added' },
                      { value: 'availability', label: '📦 Availability', desc: 'Product in/out of stock' }
                    ].map(type => (
                      <Button
                        key={type.value}
                        variant={updateType === type.value ? 'default' : 'outline'}
                        onClick={() => setUpdateType(type.value as any)}
                        className="flex flex-col items-start p-4 h-auto"
                      >
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-600">{type.desc}</div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">Product Name *</label>
                  <Input
                    placeholder="e.g., Organic Milk, Hovis Bread"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>

                {/* Current Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Aisle (if known)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 3"
                      value={currentAisle}
                      onChange={(e) => setCurrentAisle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Section (if known)</label>
                    <Input
                      placeholder="e.g., Dairy, Bakery"
                      value={currentSection}
                      onChange={(e) => setCurrentSection(e.target.value)}
                    />
                  </div>
                </div>

                {/* New Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Correct Aisle *</label>
                    <Input
                      type="number"
                      placeholder="e.g., 5"
                      value={newAisle}
                      onChange={(e) => setNewAisle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Correct Section *</label>
                    <Input
                      placeholder="e.g., Organic Foods"
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <Textarea
                    placeholder="Describe the change or location details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={submitUpdate}
                  disabled={!productName.trim() || !newAisle || !newSection.trim() || !description.trim()}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  📤 Submit Update (+5 Points)
                </Button>
              </div>
            </div>
          )}

          {/* Verify Updates Tab */}
          {selectedTab === 'verify' && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">🔍 Help Verify Updates</h3>
                <p className="text-sm text-green-700">
                  Review community submissions and earn +2 points for each verification. 
                  Updates need 3 verifications to be confirmed.
                </p>
              </div>

              <div className="space-y-4">
                {updates.filter(update => !update.verified).map(update => (
                  <Card key={update.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-lg">{update.productName}</div>
                          <div className="text-sm text-gray-600">
                            {update.type === 'product_location' && '📍 Product Location Update'}
                            {update.type === 'aisle_change' && '🔄 Aisle Change'}
                            {update.type === 'new_section' && '✨ New Section'}
                            {update.type === 'availability' && '📦 Availability Update'}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {update.verifications}/3 verified
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        {update.currentLocation && (
                          <div>
                            <div className="font-medium text-gray-600">Current:</div>
                            <div>Aisle {update.currentLocation.aisle} • {update.currentLocation.section}</div>
                          </div>
                        )}
                        {update.newLocation && (
                          <div>
                            <div className="font-medium text-gray-600">Reported:</div>
                            <div>Aisle {update.newLocation.aisle} • {update.newLocation.section}</div>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="font-medium text-gray-600 text-sm mb-1">Description:</div>
                        <p className="text-sm">{update.description}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          By {update.submittedBy} • {new Date(update.submittedAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => verifyUpdate(update.id, false)}
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            ❌ Incorrect
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => verifyUpdate(update.id, true)}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            ✅ Correct (+2 pts)
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {updates.filter(update => !update.verified).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">🎉</div>
                    <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                    <p>No pending updates to verify right now.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {selectedTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">📊 Your Contributions</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {updates.filter(u => u.submittedBy === userId).length}
                    </div>
                    <div className="text-sm text-gray-600">Submitted</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {updates.filter(u => u.verified).length}
                    </div>
                    <div className="text-sm text-gray-600">Verified</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {updates.filter(u => u.submittedBy === userId).length * 5 + updates.length * 2}
                    </div>
                    <div className="text-sm text-gray-600">Points Earned</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {updates.map(update => (
                  <Card key={update.id} className={`border ${update.verified ? 'bg-green-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{update.productName}</div>
                          <div className="text-sm text-gray-600 mb-2">
                            {update.newLocation && 
                              `Aisle ${update.newLocation.aisle} • ${update.newLocation.section}`
                            }
                          </div>
                          <p className="text-sm text-gray-700">{update.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {update.verified ? (
                            <Badge className="bg-green-500 text-white">✅ Verified</Badge>
                          ) : (
                            <Badge variant="outline">{update.verifications}/3 votes</Badge>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(update.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}