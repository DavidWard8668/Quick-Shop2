import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'

interface Store {
  id: string
  name: string
  chain: string
  address: string
  lat: number
  lng: number
  distance?: number
}

interface ProductLocation {
  aisle: string
  section: string
}

interface Product {
  id: string
  name: string
  category: string
  location?: ProductLocation
  price?: number
  verified?: boolean
  verificationCount?: number
}

interface EnhancedProductSearchProps {
  selectedStore: Store | null
  onAddToCart?: (product: Product) => void
  cartItems?: Array<{ id: string; name: string }>
}

// Common UK grocery products database
const PRODUCT_DATABASE: Product[] = [
  // Dairy
  { id: '1', name: 'Cheddar Cheese', category: 'Dairy', location: { aisle: '3', section: 'Dairy' }, price: 2.50 },
  { id: '2', name: 'Mozzarella Cheese', category: 'Dairy', location: { aisle: '3', section: 'Dairy' }, price: 1.80 },
  { id: '3', name: 'Blue Cheese', category: 'Dairy', location: { aisle: '3', section: 'Dairy' }, price: 3.20 },
  { id: '4', name: 'Cream Cheese', category: 'Dairy', location: { aisle: '3', section: 'Dairy' }, price: 1.50 },
  { id: '5', name: 'Parmesan Cheese', category: 'Dairy', location: { aisle: '3', section: 'Dairy' }, price: 4.00 },
  { id: '6', name: 'Feta Cheese', category: 'Dairy', location: { aisle: '3', section: 'Dairy' }, price: 2.75 },
  { id: '7', name: 'Whole Milk', category: 'Dairy', location: { aisle: '3', section: 'Dairy' }, price: 1.65 },
  { id: '8', name: 'Semi-Skimmed Milk', category: 'Dairy', location: { aisle: '3', section: 'Dairy' }, price: 1.65 },
  
  // Bread & Bakery
  { id: '9', name: 'White Bread', category: 'Bakery', location: { aisle: '1', section: 'Bakery' }, price: 1.20 },
  { id: '10', name: 'Wholemeal Bread', category: 'Bakery', location: { aisle: '1', section: 'Bakery' }, price: 1.40 },
  { id: '11', name: 'Sourdough Bread', category: 'Bakery', location: { aisle: '1', section: 'Bakery' }, price: 2.50 },
  
  // Produce
  { id: '12', name: 'Bananas', category: 'Produce', location: { aisle: '2', section: 'Fruit' }, price: 0.95 },
  { id: '13', name: 'Apples', category: 'Produce', location: { aisle: '2', section: 'Fruit' }, price: 1.80 },
  { id: '14', name: 'Tomatoes', category: 'Produce', location: { aisle: '2', section: 'Vegetables' }, price: 1.50 },
  
  // Meat
  { id: '15', name: 'Chicken Breast', category: 'Meat', location: { aisle: '5', section: 'Fresh Meat' }, price: 5.50 },
  { id: '16', name: 'Minced Beef', category: 'Meat', location: { aisle: '5', section: 'Fresh Meat' }, price: 4.00 },
  
  // Pantry
  { id: '17', name: 'Rice', category: 'Pantry', location: { aisle: '7', section: 'Rice & Pasta' }, price: 2.00 },
  { id: '18', name: 'Pasta', category: 'Pantry', location: { aisle: '7', section: 'Rice & Pasta' }, price: 1.50 },
  { id: '19', name: 'Olive Oil', category: 'Pantry', location: { aisle: '8', section: 'Oils & Condiments' }, price: 4.50 },
  { id: '20', name: 'Baked Beans', category: 'Pantry', location: { aisle: '6', section: 'Tinned Goods' }, price: 0.85 },
]

// Fuzzy search function
const fuzzyMatch = (str: string, pattern: string): boolean => {
  const patternLower = pattern.toLowerCase()
  const strLower = str.toLowerCase()
  
  // Exact match
  if (strLower.includes(patternLower)) return true
  
  // Check if all characters of pattern exist in order
  let patternIdx = 0
  for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
    if (strLower[i] === patternLower[patternIdx]) {
      patternIdx++
    }
  }
  
  return patternIdx === patternLower.length
}

export const EnhancedProductSearch: React.FC<EnhancedProductSearchProps> = ({ 
  selectedStore, 
  onAddToCart,
  cartItems = []
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update suggestions when search query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const filtered = PRODUCT_DATABASE.filter(product => 
        fuzzyMatch(product.name, searchQuery) || 
        fuzzyMatch(product.category, searchQuery)
      ).slice(0, 8) // Limit to 8 suggestions
      
      setSuggestions(filtered)
      setShowDropdown(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowDropdown(false)
    }
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectSuggestion = (product: Product) => {
    setSelectedProducts([product])
    setSearchQuery(product.name)
    setShowDropdown(false)
  }

  const handleAddToCart = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product)
    }
    // Clear selection after adding
    setSelectedProducts([])
    setSearchQuery('')
  }

  const isInCart = (productName: string) => {
    return cartItems.some(item => item.name === productName)
  }

  if (!selectedStore) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">Select a Store First</h3>
          <p className="text-gray-600">
            Choose a store to start searching for products.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Smart Product Search at {selectedStore.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative" ref={dropdownRef}>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Type to search (e.g., 'cheese', 'milk', 'bread')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                className="flex-1"
              />
              <Button 
                onClick={() => {
                  if (suggestions.length > 0) {
                    setSelectedProducts(suggestions)
                  }
                }}
                disabled={suggestions.length === 0}
              >
                Search
              </Button>
            </div>
            
            {/* Dropdown suggestions */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                {suggestions.map((product) => (
                  <div
                    key={product.id}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSelectSuggestion(product)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          {product.location && (
                            <>Aisle {product.location.aisle} - {product.location.section}</>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {product.price && (
                          <span className="text-green-600 font-medium">£{product.price.toFixed(2)}</span>
                        )}
                        {isInCart(product.name) && (
                          <Badge className="bg-blue-100 text-blue-800">In Cart</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="text-sm text-gray-500 mt-2">Keep typing to see suggestions...</p>
          )}
        </CardContent>
      </Card>

      {/* Selected products */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        {product.location && (
                          <Badge variant="outline" className="text-blue-600">
                            📍 Aisle {product.location.aisle} - {product.location.section}
                          </Badge>
                        )}
                        {product.price && (
                          <span className="text-green-600 font-medium">£{product.price.toFixed(2)}</span>
                        )}
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!isInCart(product.name) ? (
                        <Button 
                          onClick={() => handleAddToCart(product)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          🛒 Add to Cart
                        </Button>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 px-4 py-2">
                          ✓ In Cart
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {searchQuery && selectedProducts.length === 0 && suggestions.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find "{searchQuery}" in our database.
            </p>
            <Button variant="outline">
              ➕ Suggest this product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}