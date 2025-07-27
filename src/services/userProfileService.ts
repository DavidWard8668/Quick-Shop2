import { supabase } from '../supabaseClient'

export interface UserProfile {
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

export interface FavoriteStore {
  id: string
  user_id: string
  store_id: string
  nickname?: string
  notes?: string
  created_at: string
  store?: any // Store details will be joined
}

// Get or create user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create one
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        return await createUserProfile(userId, {
          email: userData.user.email,
          preferred_name: userData.user.user_metadata?.full_name || 'User'
        })
      }
    }

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

// Create user profile
export const createUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        ...profileData
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating user profile:', error)
    return null
  }
}

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating user profile:', error)
    return null
  }
}

// Add store to favorites
export const addFavoriteStore = async (userId: string, storeId: string, nickname?: string, notes?: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_favorite_stores')
      .insert({
        user_id: userId,
        store_id: storeId,
        nickname,
        notes
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error adding favorite store:', error)
    return false
  }
}

// Remove store from favorites
export const removeFavoriteStore = async (userId: string, storeId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_favorite_stores')
      .delete()
      .eq('user_id', userId)
      .eq('store_id', storeId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error removing favorite store:', error)
    return false
  }
}

// Get user's favorite stores
export const getUserFavoriteStores = async (userId: string): Promise<FavoriteStore[]> => {
  try {
    const { data, error } = await supabase
      .from('user_favorite_stores')
      .select(`
        *,
        store:stores(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching favorite stores:', error)
    return []
  }
}

// Check if store is favorited
export const isStoreFavorited = async (userId: string, storeId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_favorite_stores')
      .select('id')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .single()

    return !error && !!data
  } catch (error) {
    return false
  }
}