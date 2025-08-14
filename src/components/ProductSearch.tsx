import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'

interface Store {
  id: string
  name: string
  chain: string
  address: string
  postcode?: string
  city?: string
  lat: number
  lng: number
  phone?: string
  website?: string
  opening_hours?: string
  status?: string
  amenities?: string[]
  distance?: number
}

interface ProductLocation {
  aisle: string
  section: string
}

interface SearchResult {
  id: string
  name: string
  location: ProductLocation
  price: number
  verified: boolean
  verificationCount: number
  category?: string
  brand?: string
  fuzzyScore?: number
}

// Comprehensive UK grocery product database for fuzzy matching
const UK_PRODUCTS_DATABASE = [
  // Dairy & Eggs
  { id: 'milk-whole', name: 'Whole Milk', category: 'Dairy & Eggs', brand: 'Various', keywords: ['milk', 'whole milk', '3.25%', 'full milk'] },
  { id: 'milk-semi', name: 'Semi-Skimmed Milk', category: 'Dairy & Eggs', brand: 'Various', keywords: ['milk', 'semi skimmed', '2%', 'semi milk'] },
  { id: 'milk-skimmed', name: 'Skimmed Milk', category: 'Dairy & Eggs', brand: 'Various', keywords: ['milk', 'skimmed', 'fat free', '0%'] },
  { id: 'butter', name: 'Butter', category: 'Dairy & Eggs', brand: 'Various', keywords: ['butter', 'unsalted', 'salted'] },
  { id: 'cheese-cheddar', name: 'Cheddar Cheese', category: 'Dairy & Eggs', brand: 'Various', keywords: ['cheese', 'cheddar', 'mature', 'mild'] },
  { id: 'eggs-free-range', name: 'Free Range Eggs', category: 'Dairy & Eggs', brand: 'Various', keywords: ['eggs', 'free range', 'large', 'medium'] },
  { id: 'yoghurt-natural', name: 'Natural Yoghurt', category: 'Dairy & Eggs', brand: 'Various', keywords: ['yoghurt', 'yogurt', 'natural', 'plain'] },
  
  // Bread & Bakery
  { id: 'bread-white', name: 'White Bread', category: 'Bakery', brand: 'Various', keywords: ['bread', 'white', 'sliced', 'loaf'] },
  { id: 'bread-brown', name: 'Brown Bread', category: 'Bakery', brand: 'Various', keywords: ['bread', 'brown', 'wholemeal', 'whole wheat'] },
  { id: 'bread-seeded', name: 'Seeded Bread', category: 'Bakery', brand: 'Various', keywords: ['bread', 'seeded', 'multigrain', 'granary'] },
  { id: 'croissants', name: 'Croissants', category: 'Bakery', brand: 'Various', keywords: ['croissant', 'pastry', 'buttery'] },
  
  // Fresh Produce
  { id: 'bananas', name: 'Bananas', category: 'Fresh Produce', brand: 'Various', keywords: ['banana', 'bananas', 'yellow', 'ripe'] },
  { id: 'apples-red', name: 'Red Apples', category: 'Fresh Produce', brand: 'Various', keywords: ['apple', 'apples', 'red', 'gala', 'royal gala'] },
  { id: 'apples-green', name: 'Green Apples', category: 'Fresh Produce', brand: 'Various', keywords: ['apple', 'apples', 'green', 'granny smith'] },
  { id: 'carrots', name: 'Carrots', category: 'Fresh Produce', brand: 'Various', keywords: ['carrot', 'carrots', 'orange'] },
  { id: 'potatoes', name: 'Potatoes', category: 'Fresh Produce', brand: 'Various', keywords: ['potato', 'potatoes', 'maris piper', 'king edward'] },
  { id: 'onions-brown', name: 'Brown Onions', category: 'Fresh Produce', brand: 'Various', keywords: ['onion', 'onions', 'brown', 'cooking'] },
  { id: 'tomatoes', name: 'Tomatoes', category: 'Fresh Produce', brand: 'Various', keywords: ['tomato', 'tomatoes', 'cherry', 'beef'] },
  
  // Meat & Fish
  { id: 'chicken-breast', name: 'Chicken Breast', category: 'Meat & Fish', brand: 'Various', keywords: ['chicken', 'breast', 'fillet', 'skinless'] },
  { id: 'beef-mince', name: 'Beef Mince', category: 'Meat & Fish', brand: 'Various', keywords: ['beef', 'mince', 'ground beef', 'lean'] },
  { id: 'salmon-fillet', name: 'Salmon Fillet', category: 'Meat & Fish', brand: 'Various', keywords: ['salmon', 'fillet', 'fish', 'fresh'] },
  { id: 'bacon', name: 'Back Bacon', category: 'Meat & Fish', brand: 'Various', keywords: ['bacon', 'back bacon', 'streaky', 'smoked'] },
  
  // Frozen Foods
  { id: 'peas-frozen', name: 'Frozen Peas', category: 'Frozen Foods', brand: 'Various', keywords: ['peas', 'frozen peas', 'garden peas'] },
  { id: 'chips-frozen', name: 'Frozen Chips', category: 'Frozen Foods', brand: 'Various', keywords: ['chips', 'frozen chips', 'oven chips', 'fries'] },
  { id: 'pizza-frozen', name: 'Frozen Pizza', category: 'Frozen Foods', brand: 'Various', keywords: ['pizza', 'frozen pizza', 'margherita', 'pepperoni'] },
  
  // Cereals & Breakfast
  { id: 'cornflakes', name: 'Cornflakes', category: 'Cereals', brand: 'Kelloggs', keywords: ['cornflakes', 'cereal', 'kelloggs', 'corn flakes'] },
  { id: 'porridge-oats', name: 'Porridge Oats', category: 'Cereals', brand: 'Various', keywords: ['oats', 'porridge', 'rolled oats', 'jumbo oats'] },
  { id: 'weetabix', name: 'Weetabix', category: 'Cereals', brand: 'Weetabix', keywords: ['weetabix', 'wheat', 'biscuit', 'cereal'] },
  
  // Drinks
  { id: 'orange-juice', name: 'Orange Juice', category: 'Drinks', brand: 'Various', keywords: ['orange juice', 'juice', 'fresh orange', 'pulp free'] },
  { id: 'tea-bags', name: 'Tea Bags', category: 'Drinks', brand: 'Various', keywords: ['tea', 'tea bags', 'english breakfast', 'pg tips', 'tetley'] },
  { id: 'coffee-instant', name: 'Instant Coffee', category: 'Drinks', brand: 'Various', keywords: ['coffee', 'instant coffee', 'nescafe', 'kenco'] },
  { id: 'water-bottled', name: 'Bottled Water', category: 'Drinks', brand: 'Various', keywords: ['water', 'bottled water', 'still water', 'sparkling'] },
  
  // Household
  { id: 'toilet-paper', name: 'Toilet Paper', category: 'Household', brand: 'Various', keywords: ['toilet paper', 'loo roll', 'toilet tissue', 'andrex'] },
  { id: 'washing-powder', name: 'Washing Powder', category: 'Household', brand: 'Various', keywords: ['washing powder', 'detergent', 'persil', 'ariel'] },
  { id: 'bin-bags', name: 'Bin Bags', category: 'Household', brand: 'Various', keywords: ['bin bags', 'refuse bags', 'garbage bags', 'black bags'] },
  
  // Canned & Jarred
  { id: 'beans-baked', name: 'Baked Beans', category: 'Canned Foods', brand: 'Various', keywords: ['baked beans', 'beans', 'heinz', 'tomato sauce'] },
  { id: 'tomatoes-canned', name: 'Canned Tomatoes', category: 'Canned Foods', brand: 'Various', keywords: ['canned tomatoes', 'chopped tomatoes', 'tinned tomatoes'] },
  { id: 'tuna-canned', name: 'Canned Tuna', category: 'Canned Foods', brand: 'Various', keywords: ['tuna', 'canned tuna', 'tinned tuna', 'john west'] },
]

interface ProductSearchProps {
  selectedStore: Store | null
  onSearch: (query: string) => void
  searchResults?: SearchResult[]
}

// Fuzzy string matching function
const fuzzyMatch = (query: string, target: string): number => {
  if (query === target) return 1
  if (!query || !target) return 0
  
  const queryLower = query.toLowerCase()
  const targetLower = target.toLowerCase()
  
  // Exact match gets highest score
  if (targetLower === queryLower) return 1
  
  // Starts with match gets high score
  if (targetLower.startsWith(queryLower)) return 0.9
  
  // Contains match gets medium score
  if (targetLower.includes(queryLower)) return 0.7
  
  // Calculate Levenshtein distance for fuzzy matching
  const matrix = Array(query.length + 1).fill(null).map(() => Array(target.length + 1).fill(null))
  
  for (let i = 0; i <= query.length; i++) matrix[i][0] = i
  for (let j = 0; j <= target.length; j++) matrix[0][j] = j
  
  for (let i = 1; i <= query.length; i++) {
    for (let j = 1; j <= target.length; j++) {
      const cost = queryLower[i - 1] === targetLower[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }
  
  const distance = matrix[query.length][target.length]
  const maxLength = Math.max(query.length, target.length)
  return Math.max(0, (maxLength - distance) / maxLength)
}

// Generate mock location data based on category
const generateMockLocation = (category: string) => {
  const locationMap: { [key: string]: { aisle: string; section: string } } = {
    'Dairy & Eggs': { aisle: 'Aisle 3', section: 'Dairy' },
    'Bakery': { aisle: 'Aisle 1', section: 'Fresh Bakery' },
    'Fresh Produce': { aisle: 'Aisle 2', section: 'Fruit & Vegetables' },
    'Meat & Fish': { aisle: 'Aisle 4', section: 'Fresh Meat & Fish' },
    'Frozen Foods': { aisle: 'Aisle 8', section: 'Frozen' },
    'Cereals': { aisle: 'Aisle 5', section: 'Breakfast Cereals' },
    'Drinks': { aisle: 'Aisle 6', section: 'Soft Drinks' },
    'Household': { aisle: 'Aisle 9', section: 'Household' },
    'Canned Foods': { aisle: 'Aisle 7', section: 'Tinned Foods' },
  }
  return locationMap[category] || { aisle: 'Aisle 10', section: 'General' }
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ 
  selectedStore, 
  onSearch, 
  searchResults = [] // Default to empty array
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  // Real-time fuzzy search with debouncing
  const performFuzzySearch = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const results: SearchResult[] = []
    
    UK_PRODUCTS_DATABASE.forEach(product => {
      let bestScore = 0
      
      // Check product name
      const nameScore = fuzzyMatch(query, product.name)
      bestScore = Math.max(bestScore, nameScore)
      
      // Check keywords
      product.keywords.forEach(keyword => {
        const keywordScore = fuzzyMatch(query, keyword)
        bestScore = Math.max(bestScore, keywordScore * 0.9) // Slightly lower score for keywords
      })
      
      // Check category
      const categoryScore = fuzzyMatch(query, product.category)
      bestScore = Math.max(bestScore, categoryScore * 0.8)
      
      // Only include results with decent scores
      if (bestScore > 0.3) {
        const location = generateMockLocation(product.category)
        results.push({
          id: product.id,
          name: product.name,
          location: location,
          price: Math.random() * 8 + 1, // Random price between £1-9
          verified: Math.random() > 0.3,
          verificationCount: Math.floor(Math.random() * 20) + 1,
          category: product.category,
          brand: product.brand,
          fuzzyScore: bestScore
        })
      }
    })
    
    // Sort by fuzzy score (highest first)
    results.sort((a, b) => (b.fuzzyScore || 0) - (a.fuzzyScore || 0))
    
    // Limit to top 8 suggestions
    setSuggestions(results.slice(0, 8))
    setShowSuggestions(true)
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (!isTyping) return
    
    const timeoutId = setTimeout(() => {
      performFuzzySearch(searchQuery)
      setIsTyping(false)
    }, 300) // 300ms debounce
    
    return () => clearTimeout(timeoutId)
  }, [searchQuery, isTyping, performFuzzySearch])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
      setShowSuggestions(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setIsTyping(true)
    
    if (!value.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: SearchResult) => {
    setSearchQuery(suggestion.name)
    setShowSuggestions(false)
    onSearch(suggestion.name)
  }

  const handleAddToCart = (suggestion: SearchResult) => {
    // This could be expanded to actually add to cart
    console.log('Adding to cart:', suggestion.name)
    alert(`Added "${suggestion.name}" to your shopping list!`)
  }

  if (!selectedStore) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="text-6xl mb-4">🧭</div>
          <h3 className="text-xl font-semibold mb-2">Select a Store First</h3>
          <p className="text-gray-600">
            Choose a store to start searching for products and their locations.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Search Products in {selectedStore.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Start typing to see suggestions... (e.g., 'milk', 'brea', 'chees')"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow clicking suggestions
                  className="flex-1"
                />
                {isTyping && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
              <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
                🔍 Search
              </Button>
            </div>
            
            {/* Real-time Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                <div className="p-2 bg-gray-50 border-b">
                  <p className="text-sm text-gray-600 font-medium">💡 Smart Suggestions</p>
                </div>
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-center justify-between"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{suggestion.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.category}
                        </Badge>
                        {suggestion.fuzzyScore && suggestion.fuzzyScore > 0.8 && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            ⭐ Best Match
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <span>📍 {suggestion.location.aisle} - {suggestion.location.section}</span>
                        <span>•</span>
                        <span className="text-green-600 font-medium">£{suggestion.price.toFixed(2)}</span>
                        {suggestion.verified && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">✓ Verified</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToCart(suggestion)
                        }}
                        className="text-xs px-2 py-1"
                      >
                        + Add
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="p-2 bg-gray-50 text-center">
                  <p className="text-xs text-gray-500">
                    💡 Try typing partial words like "chees" for "cheese" or "brea" for "bread"
                  </p>
                </div>
              </div>
            )}

            {/* AI Suggestion Tips */}
            {searchQuery.length === 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">🧠 AI-Powered Search Tips:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Type partial words: "mil" finds "milk", "chees" finds "cheese"</li>
                  <li>• Try common misspellings: "brod" finds "bread", "tomatoe" finds "tomato"</li>
                  <li>• Search by category: "dairy", "frozen", "household"</li>
                  <li>• Use alternative names: "loo roll" finds "toilet paper"</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {searchResults && searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Found {searchResults.length} products:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <h4 className="font-semibold">{result.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">📍 {result.location.aisle} - {result.location.section}</Badge>
                      <span className="text-green-600 font-medium">£{result.price}</span>
                      {result.verified && (
                        <Badge variant="outline" className="text-green-600">
                          ✓ Verified by {result.verificationCount} users
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      📍 Navigate
                    </Button>
                    <Button size="sm" variant="outline">
                      🛠️ Update
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {searchQuery && searchResults && searchResults.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find "{searchQuery}" in {selectedStore.name}.
            </p>
            <Button variant="outline">
              ➕ Add this product to help others
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}