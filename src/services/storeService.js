import { supabase } from '../supabaseClient'

export const storeService = {
  async getStores() {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  async getStoresNearLocation(lat, lng, radiusMiles = 50) {
    // For now, get all stores and filter by distance
    const { data, error } = await supabase
      .from('stores')
      .select('*')
    
    if (error) throw error
    
    // Calculate distances and filter
    const storesWithDistance = data.map(store => ({
      ...store,
      distance: calculateDistance(lat, lng, store.latitude, store.longitude)
    })).filter(store => store.distance <= radiusMiles)
    
    return storesWithDistance.sort((a, b) => a.distance - b.distance)
  }
}

// Helper function to calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}