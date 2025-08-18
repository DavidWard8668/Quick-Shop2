import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { ProductSearch } from './ProductSearch'
import { AllergenChecker } from "./AllergenChecker";
import { AuthModal } from "./AuthModal";
import LoadingSpinner from "./LoadingSpinner";
import { BugReporter } from "./BugReporter";
import { UserTutorial } from "./UserTutorial";
import { AddProductLocation } from "./AddProductLocation";
import { AIStoreMapper } from "./AIStoreMapper";
import { BarcodeScanner } from "./BarcodeScanner";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { GamificationDisplay } from "./GamificationDisplay";
// TODO: Implement these components for enhanced functionality
// import { ShoppingRouteBuilder } from "./ShoppingRouteBuilder";
// import { SmartSuggestions } from "./SmartSuggestions";
import { getCurrentUser, signOut, testSupabaseConnection, supabase } from "../supabaseClient";
import { User } from '@supabase/supabase-js';
import { fetchNearbyStoresFromDB, getCurrentLocation, getLocationFromPostcode, StoreData } from '../services/storeDataService'
import AutoRepairInjector from '../utils/autoRepairInjector'

// Mock implementations for removed advanced features
const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return error ? null : data
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

const createUserProfile = async (userId: string, profileData: any): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ 
        id: userId, 
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    return error ? null : data
  } catch (error) {
    console.error('Error creating user profile:', error)
    return null
  }
}

const getUserFavoriteStores = async (userId: string): Promise<{store_id: string, store?: StoreData}[]> => {
  try {
    const { data, error } = await supabase
      .from('user_favorite_stores')
      .select('store_id')
      .eq('user_id', userId)
    return error ? [] : data || []
  } catch (error) {
    console.error('Error getting favorite stores:', error)
    return []
  }
}

const addFavoriteStore = async (userId: string, storeId: string): Promise<void> => {
  try {
    await supabase
      .from('user_favorite_stores')
      .insert({ user_id: userId, store_id: storeId })
  } catch (error) {
    console.error('Error adding favorite store:', error)
  }
}

const removeFavoriteStore = async (userId: string, storeId: string): Promise<void> => {
  try {
    await supabase
      .from('user_favorite_stores')
      .delete()
      .eq('user_id', userId)
      .eq('store_id', storeId)
  } catch (error) {
    console.error('Error removing favorite store:', error)
  }
}

const openMapsNavigation = async (destination: { lat: string, lng: string, name: string, address: string }) => {
  const lat = parseFloat(destination.lat)
  const lng = parseFloat(destination.lng)
  
  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid coordinates for navigation')
  }
  
  // Try different navigation apps
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  const appleMapsUrl = `maps://maps.google.com/maps?daddr=${lat},${lng}&amp;ll=`
  
  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  
  if (isIOS) {
    window.open(appleMapsUrl, '_blank')
  } else {
    window.open(googleMapsUrl, '_blank')
  }
}

// Using StoreData type from storeDataService instead of duplicate interface

// PWA install prompt event type
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
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
  const [activeTab, setActiveTab] = useState<'stores' | 'navigate' | 'cart' | 'map' | 'pilot'>('stores')
  
  // Debug logging for activeTab changes
  React.useEffect(() => {
    console.log('🔄 activeTab changed to:', activeTab)
  }, [activeTab])
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<{
    points: number
    contributions: number
    rank: number
    nextLevelPoints: number
    level: number
    accuracy: number
    totalShopping: number
    membershipLevel?: string
  } | null>(null)
  
  // Route planning state
  const [plannedRoute, setPlannedRoute] = useState<Array<{
    name: string
    aisle: number
    section: string
    completed: boolean
  }>>([])
  const [routeGenerated, setRouteGenerated] = useState(false)
  
  // Barcode scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  
  
  // Store state
  const [stores, setStores] = useState<StoreData[]>([])
  const [favoriteStores, setFavoriteStores] = useState<{store_id: string, store?: StoreData}[]>([])
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    id: string
    name: string
    location: { aisle: string, section: string }
    price: number
    verified: boolean
    verificationCount: number
  }[]>([])
  const [postcodeSearch, setPostcodeSearch] = useState('')
  
  // Auth state
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showAIMapper, setShowAIMapper] = useState(false)
  
  // Shopping cart state
  const [cartItems, setCartItems] = useState<{
    id: string
    name: string
    completed: boolean
    addedAt: string
  }[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [itemInput, setItemInput] = useState('')
  
  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(true)
  const [isIOS, setIsIOS] = useState(false)

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

  // Basic features initialization
  const initializeBasicFeatures = async () => {
    try {
      if (!user) return
      
      console.log('✅ Basic features initialized')
    } catch (error) {
      console.error('Error initializing basic features:', error)
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
        
        // Initialize basic features
        await initializeBasicFeatures()
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
      
      // If no stores found in database, show message to user
      if (foundStores.length === 0) {
        console.log('🌍 No stores found in database')
        setStores([])
        return
      }
      
      // Calculate distances and filter to only truly nearby stores
      const storesWithDistance = foundStores
        .map((store: StoreData) => {
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
        .sort((a: StoreData, b: StoreData) => a.distance! - b.distance!) // Sort by distance
      
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

    setShowAddProductModal(true)
  }

  // Handle product location success
  const handleProductLocationSuccess = async (productData: any) => {
    try {
      alert(`Thanks for adding "${productData.name}" in "Aisle ${productData.location.aisle} - ${productData.location.section}"!`)
      
      // TODO: Save to database
      console.log('Product location data:', productData)
      
    } catch (error) {
      console.error('Error adding product location:', error)
      alert('Thanks for the contribution!')
    }
  }

  // Handle plan optimal route
  const handlePlanOptimalRoute = () => {
    if (!selectedStore || cartItems.length === 0) return
    
    // Create mock route optimization
    const routeItems = cartItems.map(item => ({
      name: item.name,
      aisle: Math.floor(Math.random() * 10) + 1, // Mock aisle number
      section: ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry'][Math.floor(Math.random() * 6)],
      completed: false
    })).sort((a, b) => a.aisle - b.aisle) // Sort by aisle

    setPlannedRoute(routeItems)
    setRouteGenerated(true)
    setActiveTab('map') // Switch to map tab to show the route
  }

  // Handle barcode scanning
  const handleBarcodeScanned = async (barcode: string, productInfo: any) => {
    console.log('📱 Barcode scanned:', barcode, productInfo)
    
    // Add scanned product to cart
    const newItem = {
      id: Date.now().toString(),
      name: productInfo.name || 'Scanned Product',
      completed: false,
      addedAt: new Date().toISOString()
    }
    
    setCartItems(prev => [...prev, newItem])
    setIsScannerOpen(false)
    
    alert(`✅ Added "${newItem.name}" to your cart!`)
  }

  // Handle start shopping
  const handleStartShopping = () => {
    if (!selectedStore || cartItems.length === 0) return
    
    const confirmStart = confirm(`Ready to start shopping at ${selectedStore.name}?\n\nYour ${cartItems.length} items are ready!\n\nTip: Use the checkboxes to mark items as you find them.`)
    
    if (confirmStart) {
      alert('🛒 Happy shopping! Mark off items as you find them. CartPilot is here to help! 🎉')
    }
  }

  // Handle AI store mapping
  const handleAIStoreMapping = (store?: any) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    setSelectedStore(store || selectedStore)
    setShowAIMapper(true)
  }

  // Handle store mapping completion
  const handleStoreMappingComplete = async (mappingData: any) => {
    try {
      alert(`🎉 Store mapping complete!\n\nThank you for helping build the most accurate store maps!`)
      
      // TODO: Save mapping data to database
      console.log('Store mapping data:', mappingData)
      
    } catch (error) {
      console.error('Error processing store mapping:', error)
      alert('Thanks for the mapping contribution!')
    }
  }

  // Handle PWA install
  const handlePWAInstall = async () => {
    if (isIOS) {
      // iOS specific instructions
      alert('To install CartPilot on iOS:\n\n1. Tap the Share button (box with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right corner\n\nNote: You must be using Safari browser on iOS')
    } else if (deferredPrompt) {
      // Chrome/Edge/Android
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowInstallBanner(false)
      }
      setDeferredPrompt(null)
    } else {
      // Other browsers fallback
      alert('To install CartPilot:\n\n• Chrome/Edge: Click the install icon in the address bar\n• Firefox: Add to Home Screen from the menu\n• Safari on Mac: Not supported - use Chrome or Edge')
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
      const updatedItems = [...cartItems, newItem]
      setCartItems(updatedItems)
      setItemInput('')
    }
  }

  // Handle removing items from cart
  const handleRemoveItem = (itemId: string) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId)
    setCartItems(updatedItems)
  }

  // Handle toggling item completion
  const handleToggleItem = (itemId: string) => {
    const updatedItems = cartItems.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    setCartItems(updatedItems)
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
    
    // Check for first-time user tutorial (enabled for E2E testing)
    const tutorialCompleted = localStorage.getItem('cartpilot-tutorial-completed')
    const tutorialSkipped = localStorage.getItem('cartpilot-tutorial-skipped')
    
    // Auto-show tutorial for new users (needed for E2E tests)
    if (!tutorialCompleted && !tutorialSkipped) {
      setTimeout(() => setShowTutorial(true), 1000) // Show after 1 second
    }
    
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)
    
    // Listen for PWA install prompt (not supported on iOS)
    if (!isIOSDevice) {
      const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
        e.preventDefault()
        setDeferredPrompt(e)
      }
      
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }
  }, [])

  // Store count badge
  const storeCount = stores.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 overflow-x-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        {/* Mobile-First Header Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          {/* Logo Section */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-3 sm:gap-4">
              <img 
                src="/favicon.ico" 
                alt="CartPilot Logo" 
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shadow-lg"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">CARTPILOT</h1>
                <div className="flex items-center gap-1 sm:gap-2">
                  <p className="text-purple-200 text-xs sm:text-sm hidden sm:block">Your guide to stress free shopping</p>
                  <p className="text-purple-200 text-xs sm:hidden">Smart shopping guide</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowTutorial(true)}
                    className="text-purple-200 hover:text-white hover:bg-white/10 h-5 sm:h-6 px-1 sm:px-2 text-xs"
                  >
                    📚 Help
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Mobile Sign In Button */}
            {!user && (
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 font-semibold rounded-lg shadow-lg sm:hidden"
              >
                🔑 Sign In
              </Button>
            )}
          </div>
          
          {/* Desktop Welcome & Sign Out Section */}
          <div className="hidden sm:flex sm:items-center gap-4">
            {user ? (
              <>
                <span className="text-white font-medium text-sm lg:text-base">
                  Welcome, {userProfile?.preferred_name || userProfile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Navigator'}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowChangePasswordModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600"
                  >
                    Change Password
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
                  >
                    Sign Out
                  </Button>
                </div>
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

          {/* Mobile User Menu */}
          {user && (
            <div className="flex sm:hidden items-center justify-between w-full pt-2 border-t border-white/20">
              <span className="text-white font-medium text-sm">
                Welcome, {userProfile?.preferred_name || userProfile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Navigator'}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowChangePasswordModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600 text-xs px-2"
                >
                  Password
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 text-xs px-2"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>


        {/* Navigation Tabs */}
        <div className="flex justify-center gap-1 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto px-2">
          <Button
            onClick={() => setActiveTab('stores')}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-200 text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'stores' 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' 
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
            }`}
          >
            <span className="text-sm sm:text-base">📍</span>
            <span className="hidden xs:inline sm:inline">Stores</span>
            <span className="xs:hidden sm:hidden">Stores</span>
            {storeCount > 0 && (
              <Badge className="bg-white/20 text-white ml-1 text-xs">
                {storeCount}
              </Badge>
            )}
          </Button>
          <Button
            onClick={() => setActiveTab('navigate')}
            disabled={!selectedStore}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-200 text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'navigate' 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' 
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/30 disabled:opacity-50'
            }`}
          >
            <span className="text-sm sm:text-base">🧭</span>
            <span className="hidden sm:inline">Navigate</span>
            <span className="sm:hidden">Nav</span>
          </Button>
          <Button
            onClick={() => setActiveTab('cart')}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-200 text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'cart' 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' 
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
            }`}
          >
            <span className="text-sm sm:text-base">🛒</span>
            <span>Cart</span>
          </Button>
          <Button
            onClick={() => setActiveTab('map')}
            disabled={!selectedStore || cartItems.length === 0}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-200 text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'map' 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' 
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/30 disabled:opacity-50'
            }`}
          >
            <span className="text-sm sm:text-base">🗺️</span>
            <span className="hidden sm:inline">Map</span>
            <span className="sm:hidden">Map</span>
            {routeGenerated && <Badge className="bg-blue-500 text-white ml-1 text-xs hidden sm:inline">Route Ready</Badge>}
            {routeGenerated && <Badge className="bg-blue-500 text-white ml-1 text-xs sm:hidden">✓</Badge>}
          </Button>
          <Button
            onClick={() => setActiveTab('pilot')}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-200 text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'pilot' 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' 
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
            }`}
          >
            <span className="text-sm sm:text-base">👨‍✈️</span>
            <span className="hidden sm:inline">Pilot</span>
            <span className="sm:hidden">Pilot</span>
            {user && <Badge className="bg-orange-500 text-white ml-1 text-xs hidden sm:inline">Premium</Badge>}
            {user && <Badge className="bg-orange-500 text-white ml-1 text-xs sm:hidden">✓</Badge>}
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
              <LoadingSpinner 
                message="Searching for nearby stores..."
                size="lg"
                className="py-8"
              />
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
                              <h3 className="text-xl font-bold text-gray-800">
                                {store.name || store.chain || 'Store'}
                              </h3>
                              {store.chain && store.name !== store.chain && (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">{store.chain}</Badge>
                              )}
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
                        
                        <div className="space-y-2">
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
                          <Button 
                            onClick={() => handleAIStoreMapping(store)}
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-semibold shadow-lg text-sm"
                          >
                            🤖 AI Map Store
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
                  onAddToCart={(product) => handleAddItem(product.name)}
                  cartItems={cartItems}
                />

                {/* Barcode Scanner Card */}
                <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                        📱
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Barcode Scanner</h3>
                        <p className="text-white/80 text-sm">Scan products instantly with your camera</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setIsScannerOpen(true)}
                      className="w-full bg-white text-blue-600 hover:bg-gray-100 py-3 rounded-lg font-semibold shadow-lg transition-all"
                    >
                      📷 Open Barcode Scanner
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl">
                  <CardContent className="p-6 space-y-3">
                    <Button 
                      onClick={handleAddProductLocation}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold shadow-lg"
                    >
                      ➕ Add Product Location
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
            
            {/* Shopping Actions */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button 
                    onClick={handleAddProductLocation}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold shadow-lg"
                  >
                    ➕ Add Product Location
                  </Button>
                  
                  {selectedStore && cartItems.length > 0 && (
                    <div className="flex gap-3">
                      <Button 
                        onClick={handlePlanOptimalRoute}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg"
                      >
                        🗺 Plan Optimal Route
                      </Button>
                      <Button 
                        onClick={handleStartShopping}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold shadow-lg"
                      >
                        🧭 Start Shopping at {selectedStore?.name || 'Store'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'pilot' && (
          <div>
            {user ? (
              <div className="space-y-6">
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        👨‍✈️ CartPilot Premium Dashboard
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GamificationDisplay 
                      userId={user.id} 
                      userStats={userStats}
                      userProfile={userProfile}
                      onStatsUpdate={(stats) => setUserStats(stats)}
                      onProfileUpdate={(profile) => setUserProfile(profile)}
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


        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                🗺️ Store Navigation Map
              </h2>
              {selectedStore && (
                <p className="text-white/80 text-lg">
                  Optimal shopping route for <span className="font-semibold">{selectedStore.name}</span>
                </p>
              )}
            </div>

            {!routeGenerated ? (
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl">
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      🗺️
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">No Route Planned Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Generate an optimal shopping route to see your path through the store
                    </p>
                  </div>
                  <div className="space-y-3 text-left bg-blue-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-blue-800">📋 To create a route:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Add items to your cart</li>
                      <li>• Go to the Cart tab</li>
                      <li>• Click "🗺 Plan Optimal Route"</li>
                      <li>• Return here to see your map!</li>
                    </ul>
                  </div>
                  <Button
                    onClick={() => setActiveTab('cart')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3"
                  >
                    Go to Cart
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Route Overview Card */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        🎯 Your Optimal Route
                      </span>
                      <Button
                        onClick={handlePlanOptimalRoute}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        🔄 Regenerate
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-emerald-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-emerald-600">{plannedRoute.length}</div>
                          <div className="text-sm text-emerald-700">Items</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.max(...plannedRoute.map(item => item.aisle), 0)}
                          </div>
                          <div className="text-sm text-blue-700">Max Aisle</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {plannedRoute.filter(item => item.completed).length}
                          </div>
                          <div className="text-sm text-purple-700">Collected</div>
                        </div>
                      </div>

                      {/* Visual Store Map */}
                      <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h4 className="font-semibold text-gray-800 mb-4 text-center">🏪 Store Layout</h4>
                        <div className="space-y-2">
                          {Array.from(new Set(plannedRoute.map(item => item.aisle)))
                            .sort((a, b) => a - b)
                            .map(aisleNum => {
                              const aisleItems = plannedRoute.filter(item => item.aisle === aisleNum)
                              return (
                                <div key={aisleNum} className="flex items-center gap-4 p-3 bg-white rounded-lg border">
                                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600">
                                    {aisleNum}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-800">Aisle {aisleNum}</div>
                                    <div className="text-sm text-gray-600">
                                      {aisleItems.map(item => item.section).join(', ')}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {aisleItems.map((item, idx) => (
                                        <span
                                          key={idx}
                                          className={`px-2 py-1 rounded-full text-xs ${
                                            item.completed 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-gray-100 text-gray-700'
                                          }`}
                                        >
                                          {item.completed ? '✅' : '📦'} {item.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>

                      {/* Route List */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          📝 Shopping Checklist
                          <Badge variant="outline" className="ml-auto">
                            {plannedRoute.filter(item => item.completed).length}/{plannedRoute.length}
                          </Badge>
                        </h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {plannedRoute.map((item, index) => (
                            <div
                              key={index}
                              className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                                item.completed 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Button
                                  size="sm"
                                  variant={item.completed ? "default" : "outline"}
                                  className={`w-8 h-8 p-0 ${
                                    item.completed 
                                      ? 'bg-green-500 hover:bg-green-600' 
                                      : 'hover:bg-emerald-50'
                                  }`}
                                  onClick={() => {
                                    setPlannedRoute(prev => 
                                      prev.map((routeItem, idx) => 
                                        idx === index 
                                          ? { ...routeItem, completed: !routeItem.completed }
                                          : routeItem
                                      )
                                    )
                                  }}
                                >
                                  {item.completed ? '✅' : index + 1}
                                </Button>
                                <div className="flex-1">
                                  <div className={`font-medium ${item.completed ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                                    {item.name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Aisle {item.aisle} • {item.section}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex gap-3">
                          <Button
                            onClick={() => alert('AR Navigation coming soon! Use the route checklist above to navigate through the store.')}
                            disabled={plannedRoute.length === 0}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                          >
                            🥽 AR Navigation (Coming Soon)
                          </Button>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => {
                              setPlannedRoute(prev => prev.map(item => ({ ...item, completed: true })))
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            ✅ Mark All Complete
                          </Button>
                          <Button
                            onClick={() => {
                              setPlannedRoute([])
                              setRouteGenerated(false)
                              setActiveTab('cart')
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            🔄 New Route
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Allergen Checker Section - Always visible at bottom */}
        {activeTab === 'navigate' && (
          <div className="mt-8">
            <AllergenChecker userId={user?.id} />
          </div>
        )}
        
        
        {/* PWA Install Banner - Footer Only */}
        {showInstallBanner && (
          <div className="mt-8 mb-4">
            <Card className="bg-blue-600/90 backdrop-blur-sm shadow-xl rounded-2xl text-white">
              <CardContent className="p-4 text-center">
                <h3 className="text-lg font-bold mb-2">📱 Install CartPilot</h3>
                <p className="text-blue-100 text-sm mb-3">Get quick access from your home screen</p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={handlePWAInstall}
                    size="sm"
                    className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 font-semibold rounded-lg"
                  >
                    Install
                  </Button>
                  <Button 
                    onClick={handleInstallLater}
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-4 py-2 font-semibold rounded-lg"
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
      
      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal 
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={() => {
            alert('Password changed successfully!')
          }}
        />
      )}
      
      {/* Add Product Location Modal */}
      <AddProductLocation
        isOpen={showAddProductModal}
        selectedStore={selectedStore}
        onClose={() => setShowAddProductModal(false)}
        onSuccess={handleProductLocationSuccess}
      />

      {/* User Tutorial */}
      <UserTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => setShowTutorial(false)}
      />

      {/* AI Store Mapper */}
      <AIStoreMapper
        isOpen={showAIMapper}
        storeId={selectedStore?.id}
        storeName={selectedStore?.name}
        onClose={() => setShowAIMapper(false)}
        onMappingComplete={handleStoreMappingComplete}
      />

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Bug Reporter Button - v5.0 */}
      <BugReporter 
        userEmail={user?.email} 
        userId={user?.id}
      />

    </div>
  )
}