import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { checkProductAllergens, getUserAllergenPreferences, ALLERGEN_DATABASE } from '../services/allergenService'

interface AllergenCheckerProps {
  userId?: string
}

export const AllergenChecker: React.FC<AllergenCheckerProps> = ({ userId }) => {
  const [barcode, setBarcode] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<{
    product: {
      name: string
      brand: string
      category: string
    }
    warningLevel: string
    safeForUser: boolean
    detectedAllergens?: string[]
    alternatives?: Array<{
      id: string
      name: string
      brand: string
    }>
  } | null>(null)
  const [userAllergens, setUserAllergens] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load user allergen preferences
  useEffect(() => {
    if (userId) {
      loadUserAllergens()
    }
  }, [userId])

  const loadUserAllergens = async () => {
    try {
      if (!userId) return
      const allergens = await getUserAllergenPreferences(userId)
      setUserAllergens(allergens || []) // Ensure it's always an array
    } catch (error) {
      console.error('Error loading user allergens:', error)
      setUserAllergens([]) // Fallback to empty array
    }
  }

  const handleCheck = async () => {
    if (!barcode.trim()) {
      setError('Please enter a barcode')
      return
    }

    setIsChecking(true)
    setError(null)
    setResult(null)

    try {
      const checkResult = await checkProductAllergens(barcode.trim(), userAllergens || [])
      
      if (checkResult) {
        setResult(checkResult)
      } else {
        setError('Product not found. Try scanning the barcode or entering it manually.')
      }
    } catch (error) {
      console.error('Error checking allergens:', error)
      setError('Failed to check allergens. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheck()
    }
  }

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'life_threatening': return 'bg-red-500'
      case 'severe': return 'bg-orange-500'
      case 'moderate': return 'bg-yellow-500'
      case 'mild': return 'bg-blue-500'
      default: return 'bg-green-500'
    }
  }

  const getWarningText = (level: string) => {
    switch (level) {
      case 'life_threatening': return '⚠️ DANGER - Life Threatening'
      case 'severe': return '⚠️ SEVERE Warning'
      case 'moderate': return '⚠️ MODERATE Warning'
      case 'mild': return '⚠️ MILD Warning'
      default: return '✅ Safe for you'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Allergen Checker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Scan or Enter Barcode
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter product barcode..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={handleCheck} 
                  disabled={isChecking || !barcode.trim()}
                >
                  {isChecking ? 'Checking...' : 'Check'}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Your Allergen Alerts:
              </label>
              {!userId ? (
                <p className="text-gray-500 text-sm">Sign in to set your allergen preferences</p>
              ) : userAllergens.length === 0 ? (
                <p className="text-gray-500 text-sm">No allergen preferences set</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userAllergens.map((allergen) => {
                    const allergenInfo = ALLERGEN_DATABASE[allergen]
                    return (
                      <Badge key={allergen} variant="outline" className="flex items-center gap-1">
                        {allergenInfo?.icon} {allergenInfo?.name || allergen}
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600 mb-2">Quick test with sample barcodes:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBarcode('1234567890123')}
                >
                  🍌 Bananas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBarcode('2345678901234')}
                >
                  🥛 Milk
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBarcode('3456789012345')}
                >
                  🍞 Bread
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBarcode('5678901234567')}
                >
                  🥜 Peanut Butter
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  🏷️
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{result.product.name}</h3>
                  <p className="text-gray-600">{result.product.brand}</p>
                  <p className="text-sm text-gray-500">{result.product.category}</p>
                </div>
              </div>

              <div className={`p-4 rounded-lg text-white ${getWarningColor(result.warningLevel)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">
                    {getWarningText(result.warningLevel)}
                  </span>
                  {result.safeForUser && <span className="text-2xl">✅</span>}
                </div>
              </div>

              {result.detectedAllergens && result.detectedAllergens.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600">⚠️ Contains allergens you're sensitive to:</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.detectedAllergens.map((allergen: string) => {
                      const allergenInfo = ALLERGEN_DATABASE[allergen]
                      return (
                        <Badge key={allergen} variant="destructive" className="flex items-center gap-1">
                          {allergenInfo?.icon} {allergenInfo?.name || allergen}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              {result.alternatives && result.alternatives.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✅ Safe alternatives:</h4>
                  <div className="space-y-2">
                    {result.alternatives.map((alt) => (
                      <div key={alt.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-medium">{alt.name}</div>
                        <div className="text-sm text-gray-600">{alt.brand}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}