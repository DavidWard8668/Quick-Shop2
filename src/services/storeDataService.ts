import { supabase } from '../supabaseClient'

export interface StoreData {
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

// Overpass API query for grocery stores
const buildOverpassQuery = (lat: number, lng: number, radius: number = 8000) => {
  return `
    [out:json][timeout:25];
    (
      node["shop"~"^(supermarket|convenience)$"](around:${radius},${lat},${lng});
      way["shop"~"^(supermarket|convenience)$"](around:${radius},${lat},${lng});
      relation["shop"~"^(supermarket|convenience)$"](around:${radius},${lat},${lng});
    );
    out center meta;
  `
}

// Fetch stores from Supabase near a location
export const fetchNearbyStoresFromDB = async (lat: number, lng: number, radiusMiles: number = 10): Promise<StoreData[]> => {
  try {
    // Convert miles to approximate degrees (1 degree ≈ 69 miles)
    const radiusDegrees = radiusMiles / 69

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .gte('lat', lat - radiusDegrees)
      .lte('lat', lat + radiusDegrees)
      .gte('lng', lng - radiusDegrees)
      .lte('lng', lng + radiusDegrees)
      .limit(100)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log(`Found ${data?.length || 0} stores in database`)

    // Calculate distances and sort
    const storesWithDistance = (data || [])
      .map(store => ({
        ...store,
        distance: calculateDistance(lat, lng, parseFloat(store.lat), parseFloat(store.lng))
      }))
      .filter(store => store.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance)

    return storesWithDistance
  } catch (error) {
    console.error('Error fetching stores from database:', error)
    return []
  }
}

// Fetch stores from OpenStreetMap and save to Supabase
export const fetchAndSaveStoresFromOSM = async (lat: number, lng: number): Promise<StoreData[]> => {
  try {
    console.log('Fetching stores from OpenStreetMap...')
    
    const query = buildOverpassQuery(lat, lng, 10000) // 10km radius
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`
    })

    if (!response.ok) {
      throw new Error('Failed to fetch from OpenStreetMap')
    }

    const data = await response.json()
    console.log(`Found ${data.elements.length} raw elements from OSM`)
    
    const stores: StoreData[] = data.elements
      .filter((element: any) => element.tags?.name) // Only stores with names
      .map((element: any) => {
        const storeLat = element.lat || element.center?.lat
        const storeLng = element.lon || element.center?.lon
        
        if (!storeLat || !storeLng) return null

        return {
          id: element.id.toString(),
          name: cleanStoreName(element.tags.name),
          chain: detectChain(element.tags.name, element.tags.brand),
          address: buildAddress(element.tags),
          postcode: element.tags['addr:postcode'],
          city: element.tags['addr:city'] || 'Unknown',
          lat: parseFloat(storeLat),
          lng: parseFloat(storeLng),
          phone: element.tags.phone,
          website: element.tags.website,
          opening_hours: element.tags.opening_hours,
          status: 'Unknown',
          amenities: extractAmenities(element.tags),
          distance: calculateDistance(lat, lng, parseFloat(storeLat), parseFloat(storeLng))
        }
      })
      .filter((store: StoreData | null): store is StoreData => store !== null)
      .filter((store: StoreData) => store.distance <= 15) // Within 15 miles
      .sort((a: StoreData, b: StoreData) => a.distance - b.distance)
      .slice(0, 30) // Limit to 30 stores

    console.log(`Processed ${stores.length} valid stores`)

    // Save to Supabase
    if (stores.length > 0) {
      await saveStoresToDB(stores)
    }

    return stores
      
  } catch (error) {
    console.error('Error fetching stores from OSM:', error)
    return []
  }
}

// Save stores to Supabase (with conflict handling)
const saveStoresToDB = async (stores: StoreData[]) => {
  try {
    console.log(`Attempting to save ${stores.length} stores to database`)
    
    // Process stores in smaller batches to avoid conflicts
    const batchSize = 10
    let savedCount = 0
    
    for (let i = 0; i < stores.length; i += batchSize) {
      const batch = stores.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('stores')
        .insert(
          batch.map(store => ({
            name: store.name,
            chain: store.chain,
            address: store.address,
            postcode: store.postcode,
            city: store.city,
            lat: store.lat,
            lng: store.lng,
            phone: store.phone,
            website: store.website,
            opening_hours: store.opening_hours,
            status: store.status || 'Unknown',
            amenities: store.amenities || []
          }))
        )
        .select()

      if (error) {
        console.warn(`Error saving batch ${i/batchSize + 1}:`, error.message)
        // Continue with next batch even if this one fails
      } else {
        savedCount += data?.length || 0
        console.log(`Saved batch ${i/batchSize + 1}: ${data?.length || 0} stores`)
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`Successfully saved ${savedCount} out of ${stores.length} stores to database`)
  } catch (error) {
    console.error('Error in saveStoresToDB:', error)
  }
}

// Search stores by postcode or location name
export const searchStoresByLocation = async (query: string): Promise<StoreData[]> => {
  try {
    // First try to geocode the query
    const location = await geocodeLocation(query)
    
    if (location) {
      // Fetch stores near the geocoded location
      return await fetchNearbyStoresFromDB(location.lat, location.lng, 20)
    } else {
      // Fallback: search by postcode or city in database
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .or(`postcode.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%`)
        .limit(20)

      if (error) throw error
      return data || []
    }
  } catch (error) {
    console.error('Error searching stores:', error)
    return []
  }
}

// Geocoding function
const geocodeLocation = async (query: string): Promise<{lat: number, lng: number} | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gb&limit=1`
    )
    const data = await response.json()
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    }
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

// Helper functions
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

const cleanStoreName = (name: string): string => {
  // Remove common store suffixes and clean up
  return name
    .replace(/\s+(Supermarket|Store|Extra|Express|Local|Metro|Superstore)$/i, '')
    .replace(/^(Tesco|ASDA|Sainsbury's|Morrisons|Aldi|Lidl|Co-op|Waitrose|Iceland|M&S)\s*/i, '')
    .trim()
}

const detectChain = (name: string, brand?: string): string => {
  const chainName = (brand || name).toLowerCase()
  
  if (chainName.includes('tesco')) return 'Tesco'
  if (chainName.includes('sainsbury')) return 'Sainsburys'
  if (chainName.includes('asda')) return 'ASDA'
  if (chainName.includes('morrisons')) return 'Morrisons'
  if (chainName.includes('aldi')) return 'Aldi'
  if (chainName.includes('lidl')) return 'Lidl'
  if (chainName.includes('waitrose')) return 'Waitrose'
  if (chainName.includes('iceland')) return 'Iceland'
  if (chainName.includes('marks & spencer') || chainName.includes('m&s')) return 'M&S'
  if (chainName.includes('co-op') || chainName.includes('coop')) return 'Co-op'
  if (chainName.includes('spar')) return 'SPAR'
  if (chainName.includes('costco')) return 'Costco'
  
  return 'Independent'
}

const buildAddress = (tags: any): string => {
  const parts = []
  if (tags['addr:housenumber'] && tags['addr:street']) {
    parts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`)
  } else if (tags['addr:street']) {
    parts.push(tags['addr:street'])
  }
  if (tags['addr:city']) parts.push(tags['addr:city'])
  return parts.join(', ') || 'Address not available'
}

const extractAmenities = (tags: any): string[] => {
  const amenities = []
  if (tags.pharmacy === 'yes') amenities.push('Pharmacy')
  if (tags.fuel === 'yes' || tags.amenity === 'fuel') amenities.push('Petrol Station')
  if (tags.cafe === 'yes' || tags.amenity === 'cafe') amenities.push('Cafe')
  if (tags.atm === 'yes') amenities.push('ATM')
  if (tags.parking === 'yes') amenities.push('Parking')
  if (tags['wheelchair'] === 'yes') amenities.push('Wheelchair Accessible')
  return amenities
}

// Get current user location
export const getCurrentLocation = (): Promise<{lat: number, lng: number}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  })
}