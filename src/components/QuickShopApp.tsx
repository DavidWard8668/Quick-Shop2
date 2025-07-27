import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, MapPin, User, Star, Navigation, CheckCircle, Phone, Clock, Globe, Plus, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Store {
  id: string;
  name: string;
  chain: string;
  address: string;
  postcode: string;
  latitude: number;
  longitude: number;
  opening_hours: any;
  store_type: string;
  size_category: string;
  phone?: string;
  website?: string;
}

interface UserProfile {
  user_id: string;
  email: string;
  display_name: string;
  points: number;
  locations_mapped: number;
  accuracy_rate: number;
  navigator_level: number;
  created_at: string;
}

const CartPilot: React.FC = () => {
  // State Management
  const [activeTab, setActiveTab] = useState<'stores' | 'navigate' | 'cart' | 'pilot'>('stores');
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authData, setAuthData] = useState({ email: '', password: '' });
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [currentProduct, setCurrentProduct] = useState('');
  const [authError, setAuthError] = useState('');

  // Authentication Functions
  const handleAuth = async () => {
    setAuthError('');
    setIsLoading(true);

    try {
      let result;
      if (authMode === 'signup') {
        result = await supabase.auth.signUp({
          email: authData.email,
          password: authData.password,
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email: authData.email,
          password: authData.password,
        });
      }

      if (result.error) {
        setAuthError(result.error.message);
      } else {
        setShowAuthModal(false);
        setAuthData({ email: '', password: '' });
        if (result.data.user) {
          await loadUserProfile(result.data.user.id);
        }
      }
    } catch (error: any) {
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const createUserProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userId,
          email: email,
          display_name: email.split('@')[0],
          points: 0,
          locations_mapped: 0,
          accuracy_rate: 0,
          navigator_level: 1
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        await createUserProfile(userId, user?.email || '');
      } else if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Navigation Functions
  const handleGetDirections = (store: Store) => {
    const address = encodeURIComponent(`${store.address}, ${store.postcode}`);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleNavigateHere = (store: Store) => {
    const address = encodeURIComponent(`${store.address}, ${store.postcode}`);
    
    // Try to open in native maps app first, fallback to Google Maps
    const appleMapsUrl = `http://maps.apple.com/?daddr=${address}`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    
    // Detect if on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.open(appleMapsUrl, '_blank');
    } else {
      window.open(googleMapsUrl, '_blank');
    }
  };

  // Store Functions
  const searchStores = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .or(`postcode.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) {
        console.error('Search error:', error);
      } else {
        setStores(data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showAllStores = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .limit(20);

      if (error) {
        console.error('Error fetching stores:', error);
      } else {
        setStores(data || []);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  // Cart Functions
  const addToCart = () => {
    if (currentProduct.trim()) {
      setCartItems([...cartItems, currentProduct.trim()]);
      setCurrentProduct('');
    }
  };

  const removeFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Auth state listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Load initial data
  useEffect(() => {
    showAllStores();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">CartPilot</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-white">Welcome, {userProfile?.display_name || 'Navigator'}</span>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-1">
            {[
              { id: 'stores', label: 'Stores', icon: MapPin },
              { id: 'navigate', label: 'Navigate', icon: Navigation },
              { id: 'cart', label: 'Cart', icon: ShoppingCart },
              { id: 'pilot', label: 'Pilot', icon: User }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-green-500 text-white border-b-2 border-green-400'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {id === 'pilot' && (
                  <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                    Premium
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          
          {/* Stores Tab */}
          {activeTab === 'stores' && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-6 w-6 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">Find CartPilot Partner Stores</h2>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Enter postcode or location"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchStores()}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button
                    onClick={searchStores}
                    disabled={isLoading}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Search
                  </button>
                  <button
                    onClick={showAllStores}
                    className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Show All
                  </button>
                </div>

                {stores.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                    <p className="text-blue-200 text-sm">
                      Found {stores.length} stores near {searchQuery || 'you'} (Midlothian)
                    </p>
                  </div>
                )}
              </div>

              {/* Store Results */}
              <div className="space-y-4">
                {stores.map((store) => (
                  <div key={store.id} className="bg-white/5 rounded-lg p-6 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{store.name}</h3>
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
                            {store.chain}
                          </span>
                          {store.store_type && (
                            <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded">
                              Needs Mapping
                            </span>
                          )}
                        </div>
                        
                        <p className="text-white/70 mb-2">{store.address}</p>
                        <p className="text-white/70 mb-4">{store.postcode}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Open 24 hours</span>
                          </div>
                          {store.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span>{store.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>aisles</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {calculateDistance(55.9533, -3.1883, store.latitude, store.longitude)} miles
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => handleGetDirections(store)}
                        className="px-4 py-2 bg-white border border-green-500 text-green-500 rounded-md hover:bg-green-50 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Get Directions
                      </button>
                      
                      <button 
                        onClick={() => handleNavigateHere(store)}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <Navigation className="h-4 w-4" />
                        Navigate Here
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigate Tab */}
          {activeTab === 'navigate' && (
            <div className="space-y-6">
              <div className="text-center">
                <Navigation className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Navigate Store</h2>
                <p className="text-white/70">Find products quickly with aisle navigation</p>
              </div>

              {selectedStore ? (
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Shopping at {selectedStore.name}
                  </h3>
                  
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search for products (e.g., cheese, bread, milk)"
                      value={currentProduct}
                      onChange={(e) => setCurrentProduct(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addToCart()}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {currentProduct && (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-white font-medium">Cheddar Cheese</h4>
                          <p className="text-white/60 text-sm">Aisle 3 • Dairy • £2.75</p>
                        </div>
                        <button
                          onClick={addToCart}
                          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                    <p className="text-blue-200 text-sm flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Become a Store Navigator: Help others by reporting product locations to earn points!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/60">Select a store from the Stores tab to start navigating</p>
                </div>
              )}
            </div>
          )}

          {/* Cart Tab */}
          {activeTab === 'cart' && (
            <div className="space-y-6">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Shopping Cart</h2>
                <p className="text-white/70">Organize your shopping list</p>
              </div>

              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Add item to cart"
                    value={currentProduct}
                    onChange={(e) => setCurrentProduct(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToCart()}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={addToCart}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>

                {cartItems.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-white font-medium mb-3">Cart Items ({cartItems.length})</h3>
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-white">{item}</span>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/60">Your cart is empty</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pilot Tab */}
          {activeTab === 'pilot' && (
            <div className="space-y-6">
              {user ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <User className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Navigator Profile</h2>
                    <p className="text-white/70">Track your contribution to the CartPilot community</p>
                  </div>

                  {userProfile && (
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-green-500 p-3 rounded-full">
                          <User className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">{userProfile.display_name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">Navigator</span>
                            <span className="text-white/60">{userProfile.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-300">{userProfile.locations_mapped}</div>
                          <div className="text-blue-200 text-sm">Locations Mapped</div>
                        </div>
                        <div className="bg-green-500/20 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-300">{userProfile.accuracy_rate}%</div>
                          <div className="text-green-200 text-sm">Accuracy Rate</div>
                        </div>
                        <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-300">{userProfile.points}</div>
                          <div className="text-purple-200 text-sm">Navigator Points</div>
                        </div>
                        <div className="bg-orange-500/20 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-orange-300">{userProfile.navigator_level}</div>
                          <div className="text-orange-200 text-sm">Navigator Level</div>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-white/60 text-sm mb-4">
                          Navigator since {new Date(userProfile.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="h-16 w-16 text-white/40 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Join CartPilot Navigator</h2>
                  <p className="text-white/70 mb-6">Sign in to track your contributions and earn rewards</p>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Sign In to Get Started
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-green-500" />
                <h2 className="text-xl font-semibold">Join CartPilot Navigator Community</h2>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-blue-600">
                <Star className="h-5 w-5" />
                <span>Earn free premium months by mapping stores!</span>
              </div>
              <div className="flex items-center gap-3 text-purple-600">
                <Star className="h-5 w-5" />
                <span>First store navigator gets 2 FREE months!</span>
              </div>
              <div className="flex items-center gap-3 text-orange-600">
                <Star className="h-5 w-5" />
                <span>Build reputation and earn Navigator badges!</span>
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  authMode === 'signin'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  authMode === 'signup'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Become Navigator
              </button>
            </div>

            <h3 className="text-lg font-semibold text-center mb-4">
              {authMode === 'signin' ? 'Welcome Back, Navigator!' : 'Join CartPilot Navigator Community!'}
            </h3>
            <p className="text-gray-600 text-center mb-6">
              {authMode === 'signin' 
                ? 'Sign in to continue earning points and mapping stores'
                : 'Sign up to start earning points and mapping stores'
              }
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={authData.email}
                  onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="davidward8668@gmail.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="warrior8668"
                  required
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-md">
                  <p className="text-red-700 text-sm">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md hover:from-green-600 hover:to-blue-600 disabled:opacity-50 transition-colors font-medium"
              >
                {isLoading ? 'Processing...' : (authMode === 'signin' ? 'Sign In to Navigate' : 'Become Navigator')}
              </button>
            </form>

            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
              <p className="text-yellow-800 text-sm">
                <strong>Test Account:</strong> Email is pre-filled for testing. Use any password to sign in.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPilot;
