import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { ProductSearch } from './ProductSearch'
import { AllergenChecker } from "./AllergenChecker";
import { GamificationDisplay } from "./GamificationDisplay";
import { AuthModal } from "./AuthModal";
import { ShoppingRouteBuilder } from "./ShoppingRouteBuilder";
import { SmartSuggestions } from "./SmartSuggestions";
import { getCurrentUser, signOut, testSupabaseConnection, supabase } from "../supabaseClient";
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  addFavoriteStore,
  removeFavoriteStore,
  getUserFavoriteStores
} from '../services/userProfileService'
import { fetchNearbyStoresFromDB, getCurrentLocation, getLocationFromPostcode, StoreData, fetchAndSaveStoresFromOSM } from '../services/storeDataService'
import { openMapsNavigation } from '../services/navigationService'
import { awardPoints, getUserStats } from '../services/gamificationService'

// Using StoreData type from storeDataService instead of duplicate interface

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
  const [stores, setStores] = useState<StoreData[]>([])
  const [favoriteStores, setFavoriteStores] = useState<any[]>([])
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [postcodeSearch, setPostcodeSearch] = useState('')
  
  // Auth state
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // Shopping cart state
  const [cartItems, setCartItems] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [itemInput, setItemInput] = useState('')
  
  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(true)

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
      
      // If no stores found, automatically fetch from OpenStreetMap
      if (foundStores.length === 0) {
        console.log('🌍 No stores in database, fetching fresh data from OpenStreetMap...')
        const freshStores = await fetchAndSaveStoresFromOSM(latitude, longitude)
        
        if (freshStores.length > 0) {
          console.log(`✅ Fetched ${freshStores.length} fresh stores from OpenStreetMap`)
          setStores(freshStores)
          return
        } else {
          console.log('❌ No stores found from OpenStreetMap either')
          setStores([])
          return
        }
      }
      
      // Calculate distances and filter to only truly nearby stores
      const storesWithDistance = foundStores
        .map((store: any) => {
          const storeLat = parseFloat(store.lat)
          const storeLng = parseFloat(store.lng)
          
          // Validate store coordinates
          if (isNaN(storeLat) || isNaN(storeLng) || (storeLat === 0 && storeLng === 0)) {
            console.warn(`❌ Invalid coordinates for store ${store.name}: lat=${store.lat}, lng=${store.lng}`)
            return {
              ...store,
              distance: 999, // Mark as very far for invalid coordinates
              lat: storeLat,
              lng: storeLng
            }
          }

          const calculatedDistance = calculateDistance(latitude, longitude, storeLat, storeLng)
          
          
          return {
            ...store,
            distance: calculatedDistance,
            lat: storeLat,
            lng: storeLng
          }
        })
        .filter((store: StoreData) => store.distance! <= 20) // Only show stores within 20 miles
        .sort((a: Store, b: Store) => a.distance! - b.distance!) // Sort by distance
      
      console.log('Final result:', storesWithDistance.length, 'stores')
      setStores(storesWithDistance)
      
      // Only update location if it's actually different
      if (!currentLocation || 
          Math.abs(currentLocation.lat - latitude) > 0.001 || 
          Math.abs(currentLocation.lng - longitude) > 0.001) {
        setCurrentLocation({ lat: latitude, lng: longitude })
      }
    } catch (error) {
      console.error('Error getting location or searching stores:', error)
    }
  }

  // Get user's current location
  const getCurrentUserLocation = async () => {
    try {
      setIsSearching(true)
      
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser')
      }
      
      // Check if location permission was denied
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({name: 'geolocation'})
        if (permission.state === 'denied') {
          throw new Error('Location access denied. Please enable location access in your browser settings.')
        }
      }
      
      const location = await getCurrentLocation()
      console.log(`🌍 GPS Location obtained:`, location)
      setCurrentLocation(location)
      await handleLocationSearch(location.lat, location.lng)
    } catch (error) {
      console.error('Failed to get location:', error)
      
      let errorMessage = 'Unable to get your location. '
      if (error.message.includes('denied')) {
        errorMessage += 'Please enable location access in your browser settings and try again.'
      } else if (error.message.includes('not supported')) {
        errorMessage += 'Your browser does not support location services.'
      } else {
        errorMessage += 'Please enter your postcode instead.'
      }
      
      alert(errorMessage)
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
      
      // Don't automatically load location - let user choose
      console.log('🏴󠁧󠁢󠁳󠁣󠁴󠁿 App initialized. Use location buttons to find stores.')
      
    } catch (error) {
      console.error('Error initializing app:', error)
    }
  }

  // Handle store selection
  const handleStoreSelect = useCallback((store: StoreData) => {
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

  // Handle postcode search
  const handlePostcodeSearch = async () => {
    if (!postcodeSearch.trim()) return
    
    setIsSearching(true)
    try {
      console.log(`🔍 Searching for postcode: ${postcodeSearch}`)
      const location = await getLocationFromPostcode(postcodeSearch.trim())
      
      if (location) {
        console.log(`✅ Found location for ${postcodeSearch}:`, location)
        console.log(`🔍 Searching for stores near ${postcodeSearch} at coordinates:`, location.lat, location.lng)
        await handleLocationSearch(location.lat, location.lng)
      } else {
        alert('Unable to find that postcode. Please check the spelling and try again.')
      }
    } catch (error) {
      console.error('Error searching postcode:', error)
      alert('Error searching for postcode. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // Toggle favorite store
  const toggleFavoriteStore = async (store: StoreData, isFavorite: boolean) => {
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

  // Handle navigation to store
  const handleNavigateToStore = async (store: StoreData) => {
    try {
      const destination = {
        lat: store.lat,
        lng: store.lng,
        name: store.name,
        address: store.address
      }
      
      await openMapsNavigation(destination)
      
      // Award points for navigation
      if (user) {
        await awardPoints(user.id, 'navigation_started')
      }
    } catch (error) {
      console.error('Error opening navigation:', error)
      alert('Unable to open navigation. Please check your device settings.')
    }
  }

  // Handle add product location
  const handleAddProductLocation = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    if (!selectedStore) {
      alert('Please select a store first.')
      return
    }

    // For now, show a simple prompt for product location
    const productName = prompt('Enter product name:')
    const aisleLocation = prompt('Enter aisle/section (e.g., Aisle 3 - Dairy):')
    
    if (productName && aisleLocation) {
      try {
        // Award points for contributing product location
        await awardPoints(user.id, 'product_location_added', 10)
        
        alert(`Thanks for adding "${productName}" in "${aisleLocation}" at ${selectedStore.name}! You earned 10 points! 🎉`)
        
        // Refresh user stats
        const stats = await getUserStats(user.id)
        setUserStats(stats)
      } catch (error) {
        console.error('Error adding product location:', error)
        alert('Thanks for the contribution! (Note: Points system temporarily unavailable)')
      }
    }
  }

  // Handle PWA install
  const handlePWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowInstallBanner(false)
      }
      setDeferredPrompt(null)
    } else {
      // Fallback instructions
      alert('To install CartPilot:\n\n• Chrome/Edge: Click the install icon in the address bar\n• Safari: Tap Share → Add to Home Screen\n• Firefox: Add to Home Screen from the menu')
    }
  }

  const handleInstallLater = () => {
    setShowInstallBanner(false)
  }

  // Handle adding items to cart
  const handleAddItem = (itemName: string) => {
    if (itemName.trim()) {
      const newItem = {
        id: Date.now().toString(),
        name: itemName,
        completed: false,
        addedAt: new Date().toISOString()
      }
      setCartItems(prev => [...prev, newItem])
      setItemInput('')
    }
  }

  // Handle removing items from cart
  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
  }

  // Handle toggling item completion
  const handleToggleItem = (itemId: string) => {
    setCartItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ))
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
    
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Store count badge
  const storeCount = stores.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 via-orange-400 to-green-500 flex items-center justify-center shadow-lg relative overflow-hidden">
              {/* Custom CartPilot Icon */}
              <svg viewBox="0 0 100 100" className="w-10 h-10 text-white">
                {/* Shopping Cart */}
                <path 
                  d="M20 25 L35 25 L40 60 L70 60 L75 40 L30 40" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                {/* Cart Grid */}
                <line x1="40" y1="35" x2="70" y2="35" stroke="currentColor" strokeWidth="2"/>
                <line x1="40" y1="45" x2="70" y2="45" stroke="currentColor" strokeWidth="2"/>
                <line x1="40" y1="55" x2="70" y2="55" stroke="currentColor" strokeWidth="2"/>
                <line x1="50" y1="30" x2="50" y2="60" stroke="currentColor" strokeWidth="2"/>
                <line x1="60" y1="30" x2="60" y2="60" stroke="currentColor" strokeWidth="2"/>
                {/* Wheels */}
                <circle cx="45" cy="75" r="4" fill="currentColor"/>
                <circle cx="65" cy="75" r="4" fill="currentColor"/>
                {/* Navigation Arrow */}
                <path 
                  d="M75 15 L85 25 L75 35 M85 25 L60 25" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  opacity="0.8"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">CARTPILOT</h1>
              <p className="text-purple-200 text-sm">🚀 VERCEL SYNC TEST v1.0.1</p>
            </div>
          </div>
          
          {/* Welcome & Sign Out Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-white font-medium">Welcome, Navigator</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 font-semibold rounded-lg shadow-lg"
              >
                🔑 Sign In
              </Button>
            )}
          </div>
        </div>


        {/* Navigation Tabs */}
        <div className="flex justify-center gap-3 mb-8">
          <Button
            onClick={() => setActiveTab('stores')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
              activeTab === 'stores' 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' 
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
            }`}
          >
            📍 Stores
            {storeCount > 0 && (
              <Badge className="bg-white/20 text-white ml-1">
                {storeCount}
              </Badge>
            )}
          </Button>
          <Button
            onClick={() => setActiveTab('navigate')}
            disabled={!selectedStore}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
              activeTab === 'navigate' 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' 
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/30 disabled:opacity-50'
            }`}
          >
            🧭 Navigate
          </Button>
          <Button
            onClick={() => setActiveTab('cart')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
              activeTab === 'cart' 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' 
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
            }`}
          >
            🛒 Cart
          </Button>
          <Button
            onClick={() => setActiveTab('pilot')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
              activeTab === 'pilot' 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' 
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
            }`}
          >
            👨‍✈️ Pilot
            {user && <Badge className="bg-orange-500 text-white ml-1">Premium</Badge>}
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'stores' && (
          <div>
            {/* Main Search Card */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl mb-6">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  🔍 Find CartPilot Partner Stores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3 flex-wrap">
                    <Button
                      onClick={getCurrentUserLocation}
                      disabled={isSearching}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
                    >
                      📍 {isSearching ? 'Locating...' : 'Use My Location'}
                    </Button>
                    <Button
                      onClick={handleRefreshStores}
                      disabled={isSearching}
                      className="bg-white/20 hover:bg-white/30 text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-semibold"
                    >
                      🔄 Refresh
                    </Button>
                  </div>
                  
                  {/* Postcode Search */}
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      placeholder="Enter your postcode (e.g., M1 1AA)"
                      value={postcodeSearch}
                      onChange={(e) => setPostcodeSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handlePostcodeSearch()}
                      className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3"
                    />
                    <Button
                      onClick={handlePostcodeSearch}
                      disabled={isSearching || !postcodeSearch.trim()}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
                    >
                      🔍 Search
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isSearching && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Searching for nearby stores...</p>
              </div>
            )}

            {stores.length === 0 && !isSearching ? (
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl text-center py-12">
                <CardContent>
                  <div className="text-6xl mb-4">🏪</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">No stores found nearby</h3>
                  <p className="text-gray-600 mb-4">
                    We couldn't find any partner stores in your area yet.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Try using GPS location or enter a complete postcode (e.g., EH6 5AB, M1 1AA)
                    </p>
                  </div>
                  <Button 
                    onClick={getCurrentUserLocation}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
                  >
                    📍 Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {stores.map((store) => {
                  const isFavorite = favoriteStores.some(fav => fav.store_id === store.id)
                  
                  return (
                    <Card key={store.id} className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-gray-800">{store.name}</h3>
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">{store.chain}</Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleFavoriteStore(store, isFavorite)}
                                className="p-1 h-8 w-8 hover:bg-gray-100"
                              >
                                {isFavorite ? '❤️' : '🤍'}
                              </Button>
                            </div>
                            <p className="text-gray-600 mb-1 font-medium">{store.address}</p>
                            <p className="text-gray-500 text-sm">{store.postcode}</p>
                            <div className="text-xs text-gray-400 mt-1">
                              📍 {store.lat?.toFixed(6)}, {store.lng?.toFixed(6)}
                            </div>
                          </div>
                          {store.distance && (
                            <Badge className="bg-emerald-500 text-white px-3 py-1 rounded-full font-bold shadow-lg">
                              {store.distance.toFixed(1)} miles
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => handleNavigateToStore(store)}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold shadow-lg"
                          >
                            🧭 Navigate Here
                          </Button>
                          <Button 
                            onClick={() => handleStoreSelect(store)}
                            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 py-3 rounded-lg font-semibold"
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

                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl">
                  <CardContent className="p-6">
                    <Button 
                      onClick={handleAddProductLocation}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold shadow-lg"
                    >
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
          <div className="space-y-6">
            {/* AI Smart Suggestions - Temporarily disabled for debugging */}
            {/* <SmartSuggestions
              userId={user?.id}
              currentLocation={currentLocation}
              nearbyStores={stores.map(store => store.name)}
              currentList={cartItems.map(item => item.name)}
              onAddItem={handleAddItem}
            /> */}

            {/* Shopping List */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  🛒 Smart Shopping List
                  {cartItems.length > 0 && (
                    <Badge className="bg-emerald-500 text-white ml-2">{cartItems.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      placeholder="Add item to shopping list..."
                      value={itemInput}
                      onChange={(e) => setItemInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddItem(itemInput)}
                      className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3"
                    />
                    <Button 
                      onClick={() => handleAddItem(itemInput)}
                      disabled={!itemInput.trim()}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50"
                    >
                      ➕ Add Item
                    </Button>
                  </div>
                  
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📝</div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-800">Your shopping list is empty</h3>
                      <p className="text-gray-600">Add items above or use AI suggestions to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cartItems.map((item) => (
                        <div 
                          key={item.id} 
                          className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                            item.completed 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={item.completed}
                              onChange={() => handleToggleItem(item.id)}
                              className="w-5 h-5 text-emerald-500 rounded" 
                            />
                            <span className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                              {item.name}
                            </span>
                            {item.completed && <span className="text-green-600 text-sm">✓ Got it!</span>}
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {cartItems.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>
                          {cartItems.filter(item => item.completed).length} of {cartItems.length} items completed
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCartItems(prev => prev.filter(item => !item.completed))}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Clear Completed
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {selectedStore && cartItems.length > 0 && (
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold shadow-lg">
                      🗺 Plan Optimal Route
                    </Button>
                    <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold shadow-lg">
                      🧭 Start Shopping at {selectedStore.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'pilot' && (
          <div>
            {user ? (
              <div className="space-y-6">
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      👨‍✈️ CartPilot Premium Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GamificationDisplay 
                      userId={user.id} 
                      userStats={userStats}
                    />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl text-center py-12">
                <CardContent>
                  <div className="text-6xl mb-4">👨‍✈️</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Sign In Required</h3>
                  <p className="text-gray-600 mb-6">
                    Sign in to access your Premium CartPilot dashboard with points, achievements, and rewards.
                  </p>
                  <Button 
                    onClick={() => setShowAuthModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
                  >
                    🔑 Sign In to Access Premium
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Allergen Checker Section - Always visible at bottom */}
        {activeTab === 'navigate' && (
          <div className="mt-8">
            <AllergenChecker userId={user?.id} />
          </div>
        )}
        
        
        {/* PWA Install Banner */}
        {showInstallBanner && (
          <div className="mt-12 mb-6">
            <Card className="bg-blue-600/90 backdrop-blur-sm shadow-xl rounded-2xl text-white">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">📱 Install CartPilot</h3>
                <p className="text-blue-100 mb-4">Get quick access from your home screen</p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={handlePWAInstall}
                    className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-2 font-semibold rounded-lg"
                  >
                    Install
                  </Button>
                  <Button 
                    onClick={handleInstallLater}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-6 py-2 font-semibold rounded-lg"
                  >
                    Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user) => {
            setUser(user)
            setShowAuthModal(false)
            loadUserData()
          }}
        />
      )}
    </div>
  )
}