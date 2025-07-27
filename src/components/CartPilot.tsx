import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { ProductSearch } from './ProductSearch'
import { AllergenChecker } from "./AllergenChecker";
import { GamificationDisplay } from "./GamificationDisplay";
import { getCurrentUser, signOut, testSupabaseConnection } from "../supabaseClient";
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  addFavoriteStore,
  removeFavoriteStore,
  getUserFavoriteStores
} from '../services/userProfileService'
import { fetchNearbyStoresFromDB, getCurrentLocation } from '../services/storeDataService'
import { awardPoints, getUserStats } from '../services/gamificationService'

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

interface UserProfile {
  id: string
  nickname?: string
  preferred_name?: string
  email?: string
  avatar_url?: string
  dietary_restrictions?: string[]
  favorite_store_chains?: string[]
  created_at: string
  updated_at: string
}

export const CartPilot: React.FC = () => {
  // Core state
  const [activeTab, setActiveTab] = useState<'stores' | 'navigate' | 'cart' | 'pilot'>('stores')
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<any>(null)
  
  // Store state
  const [stores, setStores] = useState<Store[]>([])
  const [favoriteStores, setFavoriteStores] = useState<any[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Advanced features initialization
  const initializeAdvancedFeatures = async () => {
    try {
      if (!user) return
      
      // Award daily login bonus
      await awardPoints(user.id, 'daily_login')
      
      // Get user stats
      const stats = await getUserStats(user.id)
      setUserStats(stats)
      
      console.log('✅ Advanced features initialized')
    } catch (error) {
      console.error('Error initializing advanced features:', error)
    }
  }

  // Load user data
  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        console.log('User authenticated, loading profile and advanced features...')
        
        // Get or create user profile
        let profile = await getUserProfile(currentUser.id)
        if (!profile) {
          profile = await createUserProfile(currentUser.id, {
            email: currentUser.email,
            preferred_name: currentUser.user_metadata?.full_name || 'User'
          })
        }
        setUserProfile(profile)
        
        // Load favorite stores
        const favorites = await getUserFavoriteStores(currentUser.id)
        setFavoriteStores(favorites)
        
        // Initialize advanced features
        await initializeAdvancedFeatures()
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  // Handle location search
  const handleLocationSearch = async (latitude: number, longitude: number) => {
    try {
      console.log('Searching for stores near', latitude, longitude)
      
      // Get stores from database with larger radius for rural areas
      const foundStores = await fetchNearbyStoresFromDB(latitude, longitude, 25) // 25 mile radius
      
      // Calculate distances and filter to only truly nearby stores
      const storesWithDistance = foundStores
        .map((store: any) => ({
          ...store,
          distance: calculateDistance(latitude, longitude, parseFloat(store.lat), parseFloat(store.lng))
        }))
        .filter((store: Store) => store.distance! <= 20) // Only show stores within 20 miles
        .sort((a: Store, b: Store) => a.distance! - b.distance!) // Sort by distance
      
      console.log('Final result:', storesWithDistance.length, 'stores')
      setStores(storesWithDistance)
      setCurrentLocation({ lat: latitude, lng: longitude })
    } catch (error) {
      console.error('Error getting location or searching stores:', error)
    }
  }

  // Get user's current location
  const getCurrentUserLocation = async () => {
    try {
      setIsSearching(true)
      const location = await getCurrentLocation()
      await handleLocationSearch(location.lat, location.lng)
    } catch (error) {
      console.error('Failed to get location:', error)
      alert('Unable to get your location. Please check your browser settings and try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // Initialize app
  const initializeApp = async () => {
    try {
      // Test Supabase connection
      await testSupabaseConnection()
      
      // Load user data
      await loadUserData()
      
      // Try to get user location and search for stores
      try {
        const location = await getCurrentLocation()
        await handleLocationSearch(location.lat, location.lng)
      } catch (locationError) {
        console.log('Location access denied or unavailable')
      }
    } catch (error) {
      console.error('Error initializing app:', error)
    }
  }

  // Handle store selection
  const handleStoreSelect = useCallback((store: Store) => {
    setSelectedStore(store)
    if (activeTab !== 'navigate') {
      setActiveTab('navigate')
    }
  }, [activeTab])

  // Handle product search
  const handleProductSearch = useCallback(async (query: string) => {
    if (!selectedStore || !query.trim()) {
      setSearchResults([])
      return
    }

    setSearchQuery(query)
    
    // Mock search results with product locations
    const mockResults = [
      {
        id: '1',
        name: `${query} - Brand A`,
        location: { aisle: 'Aisle 3', section: 'Dairy' },
        price: 2.50,
        verified: true,
        verificationCount: 5
      },
      {
        id: '2', 
        name: `${query} - Brand B`,
        location: { aisle: 'Aisle 3', section: 'Dairy' },
        price: 2.75,
        verified: true,
        verificationCount: 3
      }
    ]
    
    setSearchResults(mockResults)
  }, [selectedStore])

  // Handle refresh stores
  const handleRefreshStores = async () => {
    if (currentLocation) {
      setIsSearching(true)
      await handleLocationSearch(currentLocation.lat, currentLocation.lng)
      setIsSearching(false)
    } else {
      await getCurrentUserLocation()
    }
  }

  // Toggle favorite store
  const toggleFavoriteStore = async (store: Store, isFavorite: boolean) => {
    if (!user) return
    
    try {
      if (isFavorite) {
        await removeFavoriteStore(user.id, store.id)
        setFavoriteStores(prev => prev.filter(fav => fav.store_id !== store.id))
      } else {
        await addFavoriteStore(user.id, store.id)
        setFavoriteStores(prev => [...prev, { store_id: store.id, store }])
      }
    } catch (error) {
      console.error('Error toggling favorite store:', error)
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      setUserProfile(null)
      setUserStats(null)
      setFavoriteStores([])
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Initialize on mount
  useEffect(() => {
    initializeApp()
  }, [])

  // Store count badge
  const storeCount = stores.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-orange-400 flex items-center justify-center text-3xl">
            🛒
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">CartPilot</h1>
          <p className="text-gray-600">Navigate. Discover. Shop Smarter.</p>
        </div>

        {/* User Info */}
        {user && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {userProfile?.preferred_name?.[0] || user.email?.[0] || 'U'}
              </div>
              <span className="font-medium">{userProfile?.preferred_name || user.email}</span>
            </div>
            {userStats && (
              <>
                <Badge variant="outline" className="text-yellow-600">
                  ⭐ {userStats.points}
                </Badge>
                <Badge variant="outline" className="text-purple-600">
                  🎯 {userStats.membershipLevel}
                </Badge>
              </>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700"
            >
              Sign Out
            </Button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={activeTab === 'stores' ? 'default' : 'outline'}
            onClick={() => setActiveTab('stores')}
            className="flex items-center gap-2"
          >
            🏪 Stores
            {storeCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {storeCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'navigate' ? 'default' : 'outline'}
            onClick={() => setActiveTab('navigate')}
            className="flex items-center gap-2"
            disabled={!selectedStore}
          >
            🧭 Navigate
            {selectedStore && <Badge variant="secondary">Co-op</Badge>}
          </Button>
          <Button
            variant={activeTab === 'cart' ? 'default' : 'outline'}
            onClick={() => setActiveTab('cart')}
            className="flex items-center gap-2"
          >
            🛒 Cart
          </Button>
          <Button
            variant={activeTab === 'pilot' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pilot')}
            className="flex items-center gap-2"
          >
            👨‍✈️ Pilot
            {userStats?.points > 0 && (
              <Badge variant="secondary">{userStats.points}</Badge>
            )}
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'stores' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Nearby Stores</h2>
              <div className="flex gap-2">
                <Button
                  onClick={getCurrentUserLocation}
                  disabled={isSearching}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  📍 {isSearching ? 'Locating...' : 'Use My Location'}
                </Button>
                <Button
                  onClick={handleRefreshStores}
                  disabled={isSearching}
                  variant="outline"
                >
                  🔄 Refresh
                </Button>
              </div>
            </div>

            {isSearching && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Searching for nearby stores...</p>
              </div>
            )}

            {stores.length === 0 && !isSearching ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-6xl mb-4">🏪</div>
                  <h3 className="text-xl font-semibold mb-2">No stores found</h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any stores in your area. Try refreshing or check your location settings.
                  </p>
                  <Button onClick={getCurrentUserLocation}>
                    📍 Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {stores.map((store) => {
                  const isFavorite = favoriteStores.some(fav => fav.store_id === store.id)
                  
                  return (
                    <Card key={store.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold">{store.name}</h3>
                              <Badge variant="outline">{store.chain}</Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleFavoriteStore(store, isFavorite)}
                                className="p-1 h-8 w-8"
                              >
                                {isFavorite ? '❤️' : '🤍'}
                              </Button>
                            </div>
                            <p className="text-gray-600 mb-1">{store.address}</p>
                            <p className="text-gray-500 text-sm">{store.postcode}</p>
                            {store.distance && (
                              <p className="text-blue-600 text-sm font-medium mt-2">
                                📍 {store.distance.toFixed(1)} miles away
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleStoreSelect(store)}
                            className="flex-1"
                          >
                            🧭 Get Directions
                          </Button>
                          <Button 
                            onClick={() => handleStoreSelect(store)}
                            variant="outline"
                            className="flex-1"
                          >
                            🛒 Shop Here
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'navigate' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              🧭 Smart Navigation
            </h2>
            
            {selectedStore ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Store</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <select 
                      className="w-full p-3 border rounded-lg"
                      value={selectedStore.id}
                      onChange={(e) => {
                        const store = stores.find(s => s.id === e.target.value)
                        if (store) setSelectedStore(store)
                      }}
                    >
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>
                          {store.name} - {store.address}
                        </option>
                      ))}
                    </select>
                  </CardContent>
                </Card>

                <ProductSearch 
                  selectedStore={selectedStore}
                  onSearch={handleProductSearch}
                  searchResults={searchResults}
                />

                <Card>
                  <CardContent className="p-6">
                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-3">
                      ➕ Add Product Location (+10 Points)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-6xl mb-4">🧭</div>
                  <h3 className="text-xl font-semibold mb-2">Select a Store First</h3>
                  <p className="text-gray-600 mb-6">
                    Choose a store from the Stores tab to start navigating and finding products.
                  </p>
                  <Button onClick={() => setActiveTab('stores')}>
                    🏪 Browse Stores
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'cart' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Shopping Lists</h2>
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-semibold mb-2">Shopping list management coming soon!</h3>
                <p className="text-gray-600">
                  Create and manage your shopping lists, organize by store, and get optimal routes.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'pilot' && user && (
          <GamificationDisplay 
            userId={user.id} 
            userStats={userStats}
          />
        )}

        {/* Allergen Checker Section - Always visible at bottom */}
        {activeTab === 'navigate' && (
          <div className="mt-8">
            <AllergenChecker userId={user?.id} />
          </div>
        )}
      </div>
    </div>
  )
}