// navigationService.ts - Navigation utilities for CartPilot

interface NavigationDestination {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

/**
 * Opens maps navigation to a specific destination
 * Supports Google Maps on mobile and web fallbacks
 */
export const openMapsNavigation = async (destination: NavigationDestination): Promise<void> => {
  const { lat, lng, name, address } = destination;
  
  try {
    // Check if we're on mobile for better integration
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Build the destination query
    const query = encodeURIComponent(address || name);
    const coords = `${lat},${lng}`;
    
    if (isMobile) {
      // Try to open native maps apps first
      
      // iOS - Apple Maps
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        const appleMapUrl = `maps://?daddr=${coords}&q=${query}`;
        window.open(appleMapUrl, '_system');
        return;
      }
      
      // Android - Try Google Maps app first
      if (/Android/i.test(navigator.userAgent)) {
        const googleMapsApp = `geo:${coords}?q=${coords}(${query})`;
        window.open(googleMapsApp, '_system');
        return;
      }
    }
    
    // Web fallback - Google Maps
    const googleMapsWeb = `https://www.google.com/maps/dir/?api=1&destination=${coords}&destination_place_id=${query}`;
    window.open(googleMapsWeb, '_blank');
    
  } catch (error) {
    console.error('Error opening navigation:', error);
    
    // Ultimate fallback - basic Google Maps link
    const fallbackUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${name} ${address || ''}`)}/@${lat},${lng},15z`;
    window.open(fallbackUrl, '_blank');
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Get estimated travel time using basic calculation
 * Returns time in minutes
 */
export const estimateTravelTime = (
  distanceInMiles: number, 
  mode: 'driving' | 'walking' | 'transit' = 'driving'
): number => {
  const speeds = {
    driving: 25, // mph average in city
    walking: 3,  // mph
    transit: 15  // mph average including stops
  };
  
  const hours = distanceInMiles / speeds[mode];
  return Math.round(hours * 60); // Convert to minutes
};

/**
 * Check if navigation is available on this device
 */
export const isNavigationAvailable = (): boolean => {
  return 'geolocation' in navigator;
};