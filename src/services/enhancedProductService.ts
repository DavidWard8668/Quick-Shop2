import { supabase } from '../supabaseClient'
import { Product } from '../types'

export interface StoreSpecificProduct {
  id: string
  store_id: string
  product_id: string
  aisle: string
  shelf?: string
  section?: string
  price?: number
  in_stock: boolean
  user_submitted: boolean
  verification_count: number
  last_verified: string
  coordinates?: { x: number; y: number }
}

export interface UserContribution {
  id: string
  user_id: string
  store_id: string
  product_id: string
  aisle: string
  section?: string
  price?: number
  coordinates?: { x: number; y: number }
  photo_url?: string
  verified: boolean
  votes: number
  created_at: string
}

export interface OptimalRoute {
  products: StoreSpecificProduct[]
  totalDistance: number
  estimatedTime: number
  sequence: string[]
}

// Search products in a specific store
export const searchStoreProducts = async (
  storeId: string, 
  query: string
): Promise<StoreSpecificProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('store_product_locations')
      .select(`
        *,
        products(*)
      `)
      .eq('store_id', storeId)
      .ilike('products.name', `%${query}%`)
      .order('verification_count', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error searching store products:', error)
    return []
  }
}

// Get product location in specific store
export const getProductLocation = async (
  storeId: string, 
  productId: string
): Promise<StoreSpecificProduct | null> => {
  try {
    const { data, error } = await supabase
      .from('store_product_locations')
      .select('*')
      .eq('store_id', storeId)
      .eq('product_id', productId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting product location:', error)
    return null
  }
}

// Add user contribution for product location
export const addUserContribution = async (
  userId: string,
  storeId: string,
  productId: string,
  aisle: string,
  section?: string,
  price?: number,
  coordinates?: { x: number; y: number },
  photoUrl?: string
): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.id !== userId) return false

    const contributionData = {
      user_id: userId,
      store_id: storeId,
      product_id: productId,
      aisle,
      section,
      price,
      coordinates,
      photo_url: photoUrl
    }

    const { error } = await supabase
      .from('user_contributions')
      .insert(contributionData)

    if (error) throw error

    // Award points for contribution
    await awardPoints(userId, 'product_location', 10)
    
    return true
  } catch (error) {
    console.error('Error adding user contribution:', error)
    return false
  }
}

// Vote on user contribution
export const voteOnContribution = async (
  contributionId: string,
  userId: string,
  isUpvote: boolean
): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.id !== userId) return false

    const voteValue = isUpvote ? 1 : -1

    const { error } = await supabase.rpc('vote_on_contribution', {
      contribution_id: contributionId,
      vote_value: voteValue
    })

    if (error) throw error

    // Award points for verification
    await awardPoints(userId, 'verification', 5)
    
    return true
  } catch (error) {
    console.error('Error voting on contribution:', error)
    return false
  }
}

// Generate optimal shopping route
export const generateOptimalRoute = async (
  storeId: string,
  productIds: string[]
): Promise<OptimalRoute | null> => {
  try {
    const { data: locations, error } = await supabase
      .from('store_product_locations')
      .select('*')
      .eq('store_id', storeId)
      .in('product_id', productIds)

    if (error) throw error
    if (!locations || locations.length === 0) return null

    // Sort by aisle number (assuming aisle is like "Aisle 1", "Aisle 2", etc.)
    const sortedLocations = locations.sort((a, b) => {
      const aisleA = parseInt(a.aisle.replace(/\D/g, '')) || 0
      const aisleB = parseInt(b.aisle.replace(/\D/g, '')) || 0
      return aisleA - aisleB
    })

    // Calculate estimated time (2 minutes per aisle + 1 minute per product)
    const uniqueAisles = new Set(sortedLocations.map(loc => loc.aisle))
    const estimatedTime = uniqueAisles.size * 2 + sortedLocations.length * 1

    // Calculate total walking distance (rough estimate)
    const totalDistance = uniqueAisles.size * 50 // 50 meters per aisle

    return {
      products: sortedLocations,
      totalDistance,
      estimatedTime,
      sequence: sortedLocations.map(loc => loc.product_id)
    }
  } catch (error) {
    console.error('Error generating optimal route:', error)
    return null
  }
}

// Helper function to award points
const awardPoints = async (userId: string, action: string, points: number): Promise<void> => {
  try {
    // Record point transaction
    await supabase
      .from('user_point_transactions')
      .insert({
        user_id: userId,
        action,
        points
      })

    // Update user profile points
    await supabase.rpc('add_user_points', {
      user_id: userId,
      points_to_add: points
    })
  } catch (error) {
    console.error('Error awarding points:', error)
  }
}

// Get user contributions
export const getUserContributions = async (userId: string): Promise<UserContribution[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.id !== userId) return []

    const { data, error } = await supabase
      .from('user_contributions')
      .select(`
        *,
        stores(name),
        products(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user contributions:', error)
    return []
  }
}
