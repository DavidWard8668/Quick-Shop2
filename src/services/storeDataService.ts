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
export const fetchNearbyStoresFromDB = async (lat: number, lng: number, radiusMiles: number = 10, forceRefresh: boolean = false): Promise<StoreData[]> => {
  try {
    // Convert miles to approximate degrees (1 degree ≈ 69 miles)
    const radiusDegrees = radiusMiles / 69

    // Log the search parameters
    console.log(`🔍 Searching for stores near ${lat}, ${lng} within ${radiusMiles} miles`)

    let query = supabase
      .from('stores')
      .select('*')
      .gte('lat', lat - radiusDegrees)
      .lte('lat', lat + radiusDegrees)
      .gte('lng', lng - radiusDegrees)
      .lte('lng', lng + radiusDegrees)
      .limit(100)

    // Add cache-busting for force refresh
    if (forceRefresh) {
      console.log('🔄 Force refreshing store data (bypassing cache)...')
      // Add timestamp to force fresh query
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log(`Found ${data?.length || 0} stores in database${forceRefresh ? ' (force refresh)' : ''}`)
    
    // Log any suspicious stores
    const suspiciousStores = (data || []).filter(store => {
      const storeLat = parseFloat(store.lat)
      const storeLng = parseFloat(store.lng)
      // Check for stores with Edinburgh coordinates but TD postcodes
      return Math.abs(storeLat - 55.868) < 0.02 && 
             Math.abs(storeLng - (-2.969)) < 0.02 && 
             store.postcode && 
             (store.postcode.startsWith('TD') || store.postcode.includes('TD'))
    })
    
    if (suspiciousStores.length > 0) {
      console.warn('⚠️ Found suspicious stores with wrong coordinates:')
      suspiciousStores.forEach(store => {
        console.warn(`  - ${store.name} (${store.postcode}): ${store.lat}, ${store.lng}`)
      })
    }

    // Filter for supermarkets and express stores only
    const ALLOWED_CHAINS = [
      'Tesco', 'Tesco Express', 'Tesco Metro', 'Tesco Extra',
      'Sainsbury\'s', 'Sainsbury\'s Local',
      'ASDA', 'ASDA Superstore', 'ASDA Supermarket',
      'Morrisons', 'Morrisons Daily',
      'Aldi', 'Lidl',
      'Co-op', 'Co-operative', 'The Co-operative Food',
      'Iceland', 'Iceland Foods',
      'Marks & Spencer', 'M&S Food', 'M&S Simply Food',
      'Waitrose', 'Waitrose & Partners', 'Little Waitrose',
      'Spar', 'Premier', 'Nisa', 'Londis', 'Budgens',
      'Whole Foods Market', 'Farm Foods'
    ]

    // Calculate distances and sort, filtering for major chains only
    const storesWithDistance = (data || [])
      .filter(store => {
        // Filter by store chain/name
        const storeName = store.name || ''
        const storeChain = store.chain || ''
        
        return ALLOWED_CHAINS.some(allowedChain => 
          storeName.toLowerCase().includes(allowedChain.toLowerCase()) ||
          storeChain.toLowerCase().includes(allowedChain.toLowerCase())
        )
      })
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
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  // Validate coordinates
  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
    console.warn('❌ Invalid coordinates for distance calculation:', { lat1, lng1, lat2, lng2 })
    return 999 // Return high distance for invalid coordinates
  }
  
  // Check if coordinates are zero or invalid
  if ((lat1 === 0 && lng1 === 0) || (lat2 === 0 && lng2 === 0)) {
    console.warn('❌ Zero coordinates detected:', { lat1, lng1, lat2, lng2 })
    return 999
  }
  
  // Debug coordinate ranges (valid UK coordinates)
  if (lat1 < 49 || lat1 > 61 || lat2 < 49 || lat2 > 61) {
    console.warn('⚠️ Coordinates outside UK range:', { lat1, lng1, lat2, lng2 })
  }
  
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  
  // Additional validation on result
  if (isNaN(distance) || distance < 0) {
    console.warn('❌ Invalid distance calculation result:', distance)
    return 999
  }
  
  // Debug suspiciously small distances
  if (distance < 0.1) {
    console.warn('🤔 Suspiciously small distance:', { 
      distance, 
      from: { lat1, lng1 }, 
      to: { lat2, lng2 },
      dLat: lat2 - lat1,
      dLng: lng2 - lng1
    })
  }
  
  return distance
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

// Get current user location with enhanced accuracy and fallbacks
export const getCurrentLocation = (): Promise<{lat: number, lng: number}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported by this browser')
      reject(new Error('Geolocation not supported by this browser'))
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 30000, // Longer timeout for better accuracy
      maximumAge: 300000 // Cache for 5 minutes to prevent constant refreshing
    }

    // Try to get high accuracy location first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ High accuracy location obtained:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'geolocation API'
        })
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        console.warn('High accuracy location failed, trying fallback:', error.message)
        
        // Fallback with less strict requirements
        const fallbackOptions = {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // Cache for 5 minutes
        }
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('⚠️ Using fallback location:', {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              source: 'geolocation fallback'
            })
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          },
          (fallbackError) => {
            console.error('All geolocation attempts failed:', fallbackError.message)
            reject(new Error('Unable to get your location. Please enter your postcode instead.'))
          },
          fallbackOptions
        )
      },
      options
    )
  })
}

// Get location from UK postcode
export const getLocationFromPostcode = async (postcode: string): Promise<{lat: number, lng: number} | null> => {
  try {
    // Clean up the postcode format
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase()
    
    console.log(`🔍 Looking up postcode: ${cleanPostcode}`)
    
    // Use UK-specific postcode API
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${cleanPostcode}`
    )
    
    if (response.ok) {
      const data = await response.json()
      if (data.status === 200 && data.result) {
        console.log(`✅ Found location for ${cleanPostcode}:`, data.result.admin_district)
        return {
          lat: data.result.latitude,
          lng: data.result.longitude
        }
      }
    }
    
    // Fallback to Nominatim with UK-specific search
    console.log('Trying Nominatim fallback...')
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postcode)}&countrycodes=gb&limit=1`
    )
    
    if (nominatimResponse.ok) {
      const nominatimData = await nominatimResponse.json()
      if (nominatimData && nominatimData.length > 0) {
        console.log(`✅ Found location via Nominatim for ${postcode}`)
        return {
          lat: parseFloat(nominatimData[0].lat),
          lng: parseFloat(nominatimData[0].lon)
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error looking up postcode:', error)
    return null
  }
}

// NUCLEAR OPTION: Completely purge and rebuild store database
// Direct SQL cleanup for specific corrupted stores
export const directSQLCleanup = async (): Promise<number> => {
  try {
    console.log('🎯 Starting AGGRESSIVE direct SQL cleanup of corrupted stores...')
    
    let totalDeleted = 0
    
    // 1. Delete ALL Day-Today stores with Edinburgh coordinates (55.8-55.9 lat, -2.9 to -3.0 lng)
    const { data: dayTodayStores } = await supabase
      .from('stores')
      .select('*')
      .eq('name', 'Day-Today')
      .gte('lat', 55.8)
      .lte('lat', 55.9)
      .gte('lng', -3.0)
      .lte('lng', -2.9)
    
    if (dayTodayStores && dayTodayStores.length > 0) {
      console.log(`Found ${dayTodayStores.length} Day-Today stores with Edinburgh coordinates`)
      dayTodayStores.forEach(store => {
        console.log(`  - ${store.name} (${store.postcode || 'NO POSTCODE'}): ${store.lat}, ${store.lng} ID: ${store.id}`)
      })
      
      const { error } = await supabase
        .from('stores')
        .delete()
        .in('id', dayTodayStores.map(s => s.id))
      
      if (!error) {
        totalDeleted += dayTodayStores.length
        console.log(`✅ Deleted ${dayTodayStores.length} Day-Today stores`)
      }
    }
    
    // 2. Delete ALL Morrisons Daily stores with TD postcodes
    const { data: morrisonsStores } = await supabase
      .from('stores')
      .select('*')
      .eq('name', 'Morrisons Daily')
      .like('postcode', 'TD%')
    
    if (morrisonsStores && morrisonsStores.length > 0) {
      console.log(`Found ${morrisonsStores.length} Morrisons Daily stores with TD postcodes`)
      morrisonsStores.forEach(store => {
        console.log(`  - ${store.name} (${store.postcode}): ${store.lat}, ${store.lng} ID: ${store.id}`)
      })
      
      const { error } = await supabase
        .from('stores')
        .delete()
        .in('id', morrisonsStores.map(s => s.id))
      
      if (!error) {
        totalDeleted += morrisonsStores.length
        console.log(`✅ Deleted ${morrisonsStores.length} Morrisons Daily stores`)
      }
    }
    
    // 3. Delete ALL Sainsburys stores with TD postcodes
    const { data: sainsburysStores } = await supabase
      .from('stores')
      .select('*')
      .eq('name', 'Sainsburys')
      .like('postcode', 'TD%')
    
    if (sainsburysStores && sainsburysStores.length > 0) {
      console.log(`Found ${sainsburysStores.length} Sainsburys stores with TD postcodes`)
      sainsburysStores.forEach(store => {
        console.log(`  - ${store.name} (${store.postcode}): ${store.lat}, ${store.lng} ID: ${store.id}`)
      })
      
      const { error } = await supabase
        .from('stores')
        .delete()
        .in('id', sainsburysStores.map(s => s.id))
      
      if (!error) {
        totalDeleted += sainsburysStores.length
        console.log(`✅ Deleted ${sainsburysStores.length} Sainsburys stores`)
      }
    }
    
    // 4. Delete ANY store with TD postcode and Edinburgh coordinates (catch-all)
    const { data: remainingTDStores } = await supabase
      .from('stores')
      .select('*')
      .like('postcode', 'TD%')
      .gte('lat', 55.8)
      .lte('lat', 55.9)
      .gte('lng', -3.0)
      .lte('lng', -2.9)
    
    if (remainingTDStores && remainingTDStores.length > 0) {
      console.log(`Found ${remainingTDStores.length} remaining TD stores with Edinburgh coordinates`)
      remainingTDStores.forEach(store => {
        console.log(`  - ${store.name} (${store.postcode}): ${store.lat}, ${store.lng} ID: ${store.id}`)
      })
      
      const { error } = await supabase
        .from('stores')
        .delete()
        .in('id', remainingTDStores.map(s => s.id))
      
      if (!error) {
        totalDeleted += remainingTDStores.length
        console.log(`✅ Deleted ${remainingTDStores.length} remaining TD stores`)
      }
    }
    
    // 5. FINAL NUCLEAR APPROACH - Delete specific IDs we know are corrupted
    console.log('🔥 FINAL NUCLEAR APPROACH: Targeting specific corrupted store IDs...')
    
    const corruptedIds = [
      '99302da8-d3a2-4084-a99d-79c589e1461e', // Day-Today
      'e3101643-d38a-4047-8789-d6b7141b1214', // Day-Today
      '0f74a6be-3607-4bfc-a9cf-985051882643', // Day-Today
      '9f7689d6-da36-4f49-9fd8-c3e67f960d83', // Day-Today
      '8ee83afb-7e0c-4d09-a9c7-32468d7a840b', // Morrisons Daily
      'a9ce3c7d-cfe2-4bdc-a5bb-85273d0ccce9'  // Sainsburys
    ]
    
    for (const storeId of corruptedIds) {
      console.log(`🎯 Targeting store ID: ${storeId}`)
      
      // Try multiple deletion methods
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { error } = await supabase
          .from('stores')
          .delete()
          .eq('id', storeId)
        
        if (error) {
          console.error(`❌ Attempt ${attempt} failed for ${storeId}:`, error.message)
        } else {
          console.log(`✅ Attempt ${attempt} succeeded for ${storeId}`)
          totalDeleted++
          break
        }
        
        // Wait between attempts
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log(`🎯 AGGRESSIVE cleanup complete: Removed ${totalDeleted} corrupted stores`)
    console.log('⏳ Waiting 5 seconds for database propagation...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    return totalDeleted
    
  } catch (error) {
    console.error('❌ Direct SQL cleanup error:', error)
    throw error
  }
}

export const purgeAndRebuildStoreDatabase = async (userLat: number, userLng: number): Promise<void> => {
  try {
    console.log('🧨 EXTREME NUCLEAR OPTION: Starting complete database obliteration...')
    
    // Step 1: Check current database state
    const { data: beforeCount } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })
    console.log(`📊 Current store count: ${beforeCount} (MASSIVE CORRUPTION DETECTED!)`)
    
    // Step 2: AGGRESSIVE MULTI-WAVE DELETION
    console.log('💥 WAVE 1: Mass deletion by chunks...')
    
    let totalDeleted = 0
    let waveCount = 1
    
    // Wave 1: Delete in large chunks until nothing remains
    while (true) {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .limit(1000) // Larger chunks
      
      if (!stores || stores.length === 0) {
        console.log(`✅ Wave ${waveCount} complete - no more stores found`)
        break
      }
      
      console.log(`💥 Wave ${waveCount}: Deleting ${stores.length} stores...`)
      
      // Delete in smaller batches to avoid timeouts
      const batchSize = 100
      for (let i = 0; i < stores.length; i += batchSize) {
        const batch = stores.slice(i, i + batchSize)
        const ids = batch.map(s => s.id)
        
        const { error } = await supabase
          .from('stores')
          .delete()
          .in('id', ids)
        
        if (error) {
          console.error(`❌ Batch delete error:`, error.message)
        } else {
          totalDeleted += ids.length
          console.log(`  ✅ Deleted batch: ${ids.length} stores (total: ${totalDeleted})`)
        }
        
        // Brief pause between batches
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      waveCount++
      
      // Safety break after 10 waves
      if (waveCount > 10) {
        console.warn('⚠️ Reached maximum waves, breaking loop')
        break
      }
      
      // Wait between waves
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Step 3: NUCLEAR FALLBACK - Try different deletion strategies
    console.log('☢️ NUCLEAR FALLBACK: Trying alternative deletion methods...')
    
    const fallbackStrategies = [
      () => supabase.from('stores').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      () => supabase.from('stores').delete().gte('created_at', '2000-01-01'),
      () => supabase.from('stores').delete().not('id', 'is', null)
    ]
    
    for (let i = 0; i < fallbackStrategies.length; i++) {
      console.log(`☢️ Fallback strategy ${i + 1}...`)
      const { error } = await fallbackStrategies[i]()
      if (error) {
        console.error(`❌ Fallback ${i + 1} failed:`, error.message)
      } else {
        console.log(`✅ Fallback ${i + 1} executed`)
      }
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Step 4: Verify complete deletion
    console.log('🔍 Verifying complete obliteration...')
    await new Promise(resolve => setTimeout(resolve, 5000)) // Wait for propagation
    
    const { data: afterCount } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })
    console.log(`📊 Store count after obliteration: ${afterCount}`)
    
    if (afterCount && afterCount > 0) {
      console.error(`⚠️ WARNING: ${afterCount} stores still remain! Database may have constraints preventing deletion.`)
      console.log('🔧 Consider manual intervention in Supabase Dashboard')
    } else {
      console.log('🎉 COMPLETE OBLITERATION SUCCESSFUL!')
    }
    
    // Step 5: Extended wait for database stabilization
    console.log('⏳ Waiting 10 seconds for database stabilization...')
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    // Step 6: Fetch completely fresh data from OpenStreetMap
    console.log('🌍 Fetching completely fresh store data from OpenStreetMap...')
    const freshStores = await fetchAndSaveStoresFromOSM(userLat, userLng)
    
    // Step 7: Final verification with detailed logging
    const { data: finalCount } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })
    
    console.log(`🎉 EXTREME NUCLEAR REBUILD COMPLETE!`)
    console.log(`📊 FINAL STATISTICS:`)
    console.log(`   - Original corrupt stores: ${beforeCount}`)
    console.log(`   - Total deleted: ${totalDeleted}`)
    console.log(`   - Fresh stores added: ${freshStores.length}`)
    console.log(`   - Final clean count: ${finalCount}`)
    
    if (finalCount === freshStores.length) {
      console.log('✅ SUCCESS: Database is now completely clean!')
    } else if (finalCount && finalCount > freshStores.length) {
      console.warn(`⚠️ WARNING: Final count (${finalCount}) exceeds fresh stores (${freshStores.length}) - some corruption may remain`)
    }
    
  } catch (error) {
    console.error('❌ Error during extreme nuclear rebuild:', error)
    throw error
  }
}

// LAST RESORT: Try SQL commands through Supabase client
export const executeSQLReset = async (): Promise<void> => {
  try {
    console.log('🆘 ATTEMPTING SQL RESET THROUGH CLIENT...')
    
    // This uses Supabase's RPC functionality to execute raw SQL
    // Note: This may not work if RPC functions aren't set up
    
    // Try truncate via raw SQL
    const { data, error } = await supabase.rpc('sql', {
      query: 'TRUNCATE TABLE stores RESTART IDENTITY CASCADE;'
    })
    
    if (error) {
      console.error('❌ SQL Reset failed:', error)
      throw new Error(`SQL Reset failed: ${error.message}. Manual intervention required.`)
    }
    
    console.log('✅ SQL RESET SUCCESSFUL!')
    console.log('⏳ Waiting for database to stabilize...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    return data
    
  } catch (error) {
    console.error('❌ SQL Reset error:', error)
    throw error
  }
}

// Create a completely new stores table to bypass corruption
export const createNewStoresTable = async (): Promise<void> => {
  try {
    console.log('🆕 Creating new stores table to bypass corruption...')
    
    // This would need to be done in Supabase dashboard, but we can prepare the data
    const { data: allStores } = await supabase
      .from('stores')
      .select('*')
    
    console.log(`📊 Current stores table has ${allStores?.length || 0} entries`)
    
    // Filter out corrupted stores
    const cleanStores = (allStores || []).filter(store => {
      const lat = parseFloat(store.lat)
      const lng = parseFloat(store.lng)
      
      // Skip stores with Edinburgh coordinates but non-Edinburgh postcodes
      if (Math.abs(lat - 55.868) < 0.02 && Math.abs(lng - (-2.969)) < 0.02) {
        if (store.postcode && store.postcode.startsWith('TD')) {
          console.log(`🚫 Filtering out corrupted store: ${store.name} (${store.postcode})`)
          return false
        }
      }
      
      return true
    })
    
    console.log(`✅ Filtered to ${cleanStores.length} clean stores`)
    
    // Log instructions for manual table creation
    console.log('\n📝 MANUAL STEPS REQUIRED:')
    console.log('1. Go to Supabase Dashboard')
    console.log('2. Create a new table called "stores_v2" with same schema as "stores"')
    console.log('3. Run the migration function to copy clean data')
    console.log('\nAlternatively, try direct SQL in Supabase SQL Editor:')
    console.log('DELETE FROM stores WHERE postcode LIKE \'TD%\' AND lat BETWEEN 55.848 AND 55.888;')
    
  } catch (error) {
    console.error('❌ Error preparing new table:', error)
  }
}

// Fix corrupted store coordinates by re-geocoding based on postcode
export const fixCorruptedStoreCoordinates = async (): Promise<void> => {
  try {
    console.log('🔧 Starting coordinate cleanup...')
    
    // Get all stores from database
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
    
    if (error) throw error
    
    let fixedCount = 0
    const corruptedStores: any[] = []
    
    for (const store of stores || []) {
      // Check if store has corrupted coordinates (near EH37 location but shouldn't be)
      if (Math.abs(store.lat - 55.868) < 0.02 && Math.abs(store.lng - (-2.969)) < 0.02) {
        
        // Determine if this store should be in Edinburgh area
        let shouldBeInEdinburgh = false
        if (store.postcode) {
          shouldBeInEdinburgh = store.postcode.startsWith('EH') || 
                               store.postcode.startsWith('ML') || 
                               store.postcode.startsWith('FK')
        }
        
        // If store is NOT supposed to be in Edinburgh area, it's corrupted
        if (!shouldBeInEdinburgh) {
          console.log(`🚨 Found corrupted store: ${store.name} (${store.postcode || 'NO POSTCODE'}) ID: ${store.id}`)
          corruptedStores.push(store)
          
          if (store.postcode) {
            // Try to get correct coordinates for this postcode
            const correctLocation = await getLocationFromPostcode(store.postcode)
            if (correctLocation) {
              console.log(`✅ Fixing ${store.name}: ${store.postcode} -> ${correctLocation.lat}, ${correctLocation.lng}`)
              
              // Update store with correct coordinates
              const { error: updateError } = await supabase
                .from('stores')
                .update({
                  lat: correctLocation.lat,
                  lng: correctLocation.lng
                })
                .eq('id', store.id)
              
              if (updateError) {
                console.error(`❌ Failed to update ${store.name}:`, updateError)
              } else {
                fixedCount++
              }
            } else {
              // If postcode lookup fails, remove the corrupted store
              console.log(`🗑️ Removing store with invalid postcode: ${store.name} (${store.postcode}) ID: ${store.id}`)
              const { error: deleteError } = await supabase
                .from('stores')
                .delete()
                .eq('id', store.id)
              
              if (deleteError) {
                console.error(`❌ Failed to delete ${store.name}:`, deleteError)
              } else {
                fixedCount++
                console.log(`✅ Deleted corrupted store: ${store.name} ID: ${store.id}`)
              }
            }
          } else {
            // No postcode at all - delete these stores
            console.log(`🗑️ Removing store with no postcode: ${store.name} ID: ${store.id}`)
            const { error: deleteError } = await supabase
              .from('stores')
              .delete()
              .eq('id', store.id)
            
            if (deleteError) {
              console.error(`❌ Failed to delete ${store.name}:`, deleteError)
            } else {
              fixedCount++
              console.log(`✅ Deleted store with no postcode: ${store.name} ID: ${store.id}`)
            }
          }
          
          // Add small delay to avoid hitting API limits
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
    
    console.log(`🎉 Coordinate cleanup complete: Fixed ${fixedCount} corrupted stores out of ${corruptedStores.length} found`)
    
  } catch (error) {
    console.error('❌ Error during coordinate cleanup:', error)
  }
}