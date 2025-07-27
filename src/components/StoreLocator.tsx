import React from 'react';
import { MapPin, Navigation, Clock, Star } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
  rating?: number;
  isOpen?: boolean;
  openUntil?: string;
}

interface StoreListProps {
  stores: Store[];
  onStoreSelect: (store: Store) => void;
  onNavigateToStore: (store: Store) => void;
  selectedStoreId?: string;
}

const StoreList: React.FC<StoreListProps> = ({ 
  stores, 
  onStoreSelect, 
  onNavigateToStore, 
  selectedStoreId 
}) => {
  const handleNavigate = (store: Store, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Check if we have coordinates
    if (!store.latitude || !store.longitude) {
      console.error('Store coordinates missing for navigation');
      return;
    }

    // Try multiple navigation methods for better compatibility
    const latitude = store.latitude;
    const longitude = store.longitude;
    const address = encodeURIComponent(store.address);
    
    // Primary: Try opening native maps app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let mapUrl = '';
    
    if (isIOS) {
      // iOS: Try Apple Maps first, fallback to Google Maps
      mapUrl = `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
    } else if (isAndroid) {
      // Android: Try Google Maps intent, fallback to web
      mapUrl = `google.navigation:q=${latitude},${longitude}`;
    } else {
      // Desktop/other: Use Google Maps web
      mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    }

    // Try to open the native app
    const link = document.createElement('a');
    link.href = mapUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // For mobile, try the app-specific URL first
    if (isIOS || isAndroid) {
      // Create invisible link and try to open
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Fallback to web version after short delay if app doesn't open
      setTimeout(() => {
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      }, 2000);
    } else {
      // Desktop: Open directly
      link.click();
    }
    
    // Call the callback to update app state
    onNavigateToStore(store);
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <div className="space-y-3">
      {stores.map((store) => (
        <div
          key={store.id}
          className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedStoreId === store.id 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onStoreSelect(store)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Store Header */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {store.name}
                </h3>
                {store.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{store.rating}</span>
                  </div>
                )}
              </div>

              {/* Store Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{store.address}</span>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">
                    {formatDistance(store.distance)} away
                  </span>
                  
                  {store.isOpen !== undefined && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span className={`font-medium ${
                        store.isOpen ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {store.isOpen ? 'Open' : 'Closed'}
                      </span>
                      {store.isOpen && store.openUntil && (
                        <span className="text-gray-500">
                          until {store.openUntil}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Button */}
            <button
              onClick={(e) => handleNavigate(store, e)}
              className="ml-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex-shrink-0"
              type="button"
            >
              <Navigation className="h-4 w-4" />
              <span className="font-medium">Navigate</span>
            </button>
          </div>

          {/* Selection Indicator */}
          {selectedStoreId === store.id && (
            <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">
                ✓ Selected for shopping
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StoreList;