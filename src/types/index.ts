export interface Store {
  id: string
  name: string
  chain?: string
  address: string
  postcode: string
  latitude: number
  longitude: number
  distance?: number
  opening_hours?: string
  phone?: string
  status?: 'open' | 'closed' | 'unknown'
}

export interface UserProfile {
  id: string
  nickname?: string
  preferred_name?: string
  email?: string
  avatar_url?: string
  dietary_restrictions?: string[]
  favorite_store_chains?: string[]
  points?: number
  total_contributions?: number
  membership_level?: string
  premium_expires_at?: string
  allergen_preferences?: string[]
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: string
  barcode?: string
  name: string
  brand?: string
  category?: string
  description?: string
  image_url?: string
  allergens?: string[]
  nutritional_info?: any
  created_at?: string
}

export interface ShoppingList {
  id: string
  user_id: string
  name: string
  target_store_id?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface ShoppingListItem {
  id: string
  shopping_list_id: string
  product_id?: string
  custom_item_name?: string
  quantity?: number
  is_completed?: boolean
  notes?: string
  created_at?: string
}