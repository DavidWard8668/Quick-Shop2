import React, { useState, useEffect } from 'react'
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
}

interface ProductSearchProps {
  selectedStore: Store | null
  onSearch: (query: string) => void
  searchResults?: SearchResult[]
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ 
  selectedStore, 
  onSearch, 
  searchResults = [] // Default to empty array
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
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
          <CardTitle>Search Products in {selectedStore.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
              Search
            </Button>
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