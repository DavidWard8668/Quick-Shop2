// src/components/StoreLocator.tsx - Fixed Loading Issues
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Phone, Navigation, Search, Target, Loader2 } from 'lucide-react';
import { postcodeService } from '@/lib/postcodeService';

interface Store {
  id: string;
  name: string;
  chain: string;
  address: string;
  postcode: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  total_aisles: number;
  mapping_status: string;
  opening_hours?: any;
}

const StoreLocator: React.FC = () => {
  const [postcode, setPostcode] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // Separate initial load state
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [searchMessage, setSearchMessage] = useState('');

  // Load initial stores on component mount
  useEffect(() => {
    loadInitialStores();
  }, []);

  const loadInitialStores = async () => {
    try {
      console.log('Loading initial stores...');
      setInitialLoading(true);
      const { supabase } = await import('@/lib/supabase');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');
        
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Loaded stores:', data?.length || 0);
      setStores(data || []);
      setSearchMessage(`Loaded ${data?.length || 0} stores. Enter your postcode to find nearby stores.`);
    } catch (error) {
      console.error('Error loading stores:', error);
      setSearchMessage('Error loading stores. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!postcode.trim()) {
      setSearchMessage('Please enter a valid UK postcode');
      return;
    }

    setLoading(true);
    setSearchMessage('Validating postcode and finding nearby stores...');

    try {
      console.log('Searching for postcode:', postcode);
      
      // Validate postcode and get coordinates
      const location = await postcodeService.validateAndGetLocation(postcode);
      
      if (!location) {
        setSearchMessage('Invalid postcode. Please check and try again.');
        setLoading(false);
        return;
      }

      console.log('Location found:', location);
      setUserLocation({ lat: location.latitude, lon: location.longitude });
      
      // Find nearby stores
      const nearbyStores = await postcodeService.findNearbyStores(
        location.latitude, 
        location.longitude, 
        20 // 20 mile radius
      );

      console.log('Nearby stores found:', nearbyStores.length);
      setStores(nearbyStores);
      
      if (nearbyStores.length > 0) {
        setSearchMessage(
          `Found ${nearbyStores.length} stores near ${location.postcode} (${location.district})`
        );
      } else {
        setSearchMessage(`No stores found within 20 miles of ${location.postcode}`);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchMessage('Error searching for stores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setPostcode('');
    setUserLocation(null);
    loadInitialStores();
  };

  const getChainColor = (chain: string) => {
    const colors: { [key: string]: string } = {
      'Tesco': 'bg-blue-100 text-blue-800 border-blue-200',
      'ASDA': 'bg-green-100 text-green-800 border-green-200',
      'Aldi': 'bg-orange-100 text-orange-800 border-orange-200',
      'Sainsburys': 'bg-red-100 text-red-800 border-red-200',
      'Morrisons': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Lidl': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[chain] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getMappingStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMappingStatusText = (status: string) => {
    switch (status) {
      case 'complete': return 'Fully Mapped';
      case 'partial': return 'Partially Mapped';
      default: return 'Needs Mapping';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Show loading state only during initial load
  if (initialLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading CartPilot stores...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Target className="h-5 w-5" />
            Find CartPilot Partner Stores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Enter UK postcode (e.g. M1 1AA, SW1A 1AA)"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  className="pl-10 text-lg"
                  disabled={loading} // Only disable during active search, not initial load
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={loading || !postcode.trim()}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {loading ? 'Searching...' : 'Search'}
              </Button>
              {userLocation && (
                <Button 
                  onClick={handleClearSearch}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  Show All
                </Button>
              )}
            </div>
            
            {searchMessage && (
              <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg border border-blue-200">
                {searchMessage}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Store List */}
      <div className="space-y-4">
        {stores.length === 0 && !loading && !initialLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
              <p className="text-gray-600">Enter your postcode above to find nearby CartPilot partner stores.</p>
            </CardContent>
          </Card>
        ) : (
          stores.map((store) => (
            <Card 
              key={store.id} 
              className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-xl text-gray-900">{store.name}</h3>
                      <Badge className={`${getChainColor(store.chain)} border font-medium`}>
                        {store.chain}
                      </Badge>
                      <Badge className={`${getMappingStatusColor(store.mapping_status)} border font-medium`}>
                        {getMappingStatusText(store.mapping_status)}
                      </Badge>
                    </div>
                    <p className="text-gray-700 font-medium">{store.address}</p>
                    <p className="text-gray-600">{store.postcode}</p>
                  </div>
                  <div className="text-right">
                    {store.distance !== null && store.distance !== undefined ? (
                      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-3 py-1 rounded-full">
                        <span className="font-bold">{postcodeService.formatDistance(store.distance)}</span>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">Distance unknown</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Open 24 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{store.phone || 'Phone not available'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{store.total_aisles} aisles</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50"
                    onClick={() => setSelectedStore(store)}
                  >
                    <Navigation className="h-4 w-4" />
                    Get Directions
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    onClick={() => setSelectedStore(store)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Navigate Here
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Loading State for Search */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Finding nearby stores...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StoreLocator;