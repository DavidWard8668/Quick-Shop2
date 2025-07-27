import { supabase } from '../supabaseClient'

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
  created_at: string
}

export interface ProductLocation {
  id: string
  store_id: string
  product_id: string
  aisle?: string
  shelf?: string
  section?: string
  coordinates?: { x: number, y: number }
  last_verified: string
  product?: Product
}

export interface ShoppingList {
  id: string
  user_id: string
  name: string
  target_store_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ShoppingListItem {
  id: string
  shopping_list_id: string
  product_id?: string
  custom_item_name?: string
  quantity: number
  is_completed: boolean
  notes?: string
  created_at: string
  product?: Product
  location?: ProductLocation
}

// Search products by name or barcode
export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%,barcode.eq.${query}`)
      .limit(20)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}

// Get product by barcode
export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  } catch (error) {
    console.error('Error fetching product by barcode:', error)
    return null
  }
}

// Add new product (from barcode scan or manual entry)
export const addProduct = async (productData: Omit<Product, 'id' | 'created_at'>): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding product:', error)
    return null
  }
}

// Get product location in specific store
export const getProductLocation = async (storeId: string, productId: string): Promise<ProductLocation | null> => {
  try {
    const { data, error } = await supabase
      .from('store_product_locations')
      .select(`
        *,
        product:products(*)
      `)
      .eq('store_id', storeId)
      .eq('product_id', productId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  } catch (error) {
    console.error('Error fetching product location:', error)
    return null
  }
}

// Add/update product location in store
export const updateProductLocation = async (
  storeId: string, 
  productId: string, 
  location: Partial<ProductLocation>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('store_product_locations')
      .upsert({
        store_id: storeId,
        product_id: productId,
        ...location,
        last_verified: new Date().toISOString()
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating product location:', error)
    return false
  }
}

// Get user's shopping lists
export const getUserShoppingLists = async (userId: string): Promise<ShoppingList[]> => {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !session.user || session.user.id !== userId) {
      console.log('User not authenticated for shopping lists, returning empty array')
      return []
    }
    
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching shopping lists:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Error fetching shopping lists:', error)
    return []
  }
}

// Create new shopping list
export const createShoppingList = async (userId: string, name: string, targetStoreId?: string): Promise<ShoppingList | null> => {
  try {
    // Deactivate other lists if this is being set as active
    const { data, error } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: userId,
        name,
        target_store_id: targetStoreId,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    // Deactivate other lists
    await supabase
      .from('shopping_lists')
      .update({ is_active: false })
      .eq('user_id', userId)
      .neq('id', data.id)

    return data
  } catch (error) {
    console.error('Error creating shopping list:', error)
    return null
  }
}

// Get shopping list items with product details and locations
export const getShoppingListItems = async (listId: string, storeId?: string): Promise<ShoppingListItem[]> => {
  try {
    let query = supabase
      .from('shopping_list_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('shopping_list_id', listId)
      .order('created_at')

    const { data, error } = await query

    if (error) throw error

    // If store is specified, get product locations
    if (storeId && data) {
      const itemsWithLocations = await Promise.all(
        data.map(async (item) => {
          if (item.product_id) {
            const location = await getProductLocation(storeId, item.product_id)
            return { ...item, location }
          }
          return item
        })
      )
      return itemsWithLocations
    }

    return data || []
  } catch (error) {
    console.error('Error fetching shopping list items:', error)
    return []
  }
}

// Add item to shopping list
export const addShoppingListItem = async (
  listId: string, 
  item: Omit<ShoppingListItem, 'id' | 'shopping_list_id' | 'created_at'>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('shopping_list_items')
      .insert({
        shopping_list_id: listId,
        ...item
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error adding shopping list item:', error)
    return false
  }
}

// Update shopping list item (mark as completed, change quantity, etc.)
export const updateShoppingListItem = async (
  itemId: string, 
  updates: Partial<ShoppingListItem>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('shopping_list_items')
      .update(updates)
      .eq('id', itemId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating shopping list item:', error)
    return false
  }
}

// Scan barcode and get product info (with external API fallback)
export const scanBarcode = async (barcode: string): Promise<Product | null> => {
  try {
    // First check our database
    let product = await getProductByBarcode(barcode)
    
    if (!product) {
      // Fallback to external API (OpenFoodFacts)
      product = await fetchProductFromExternalAPI(barcode)
      
      if (product) {
        // Save to our database for future use
        await addProduct(product)
      }
    }
    
    return product
  } catch (error) {
    console.error('Error scanning barcode:', error)
    return null
  }
}

// Fetch product data from OpenFoodFacts API
const fetchProductFromExternalAPI = async (barcode: string): Promise<Product | null> => {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await response.json()
    
    if (data.status === 1 && data.product) {
      const product = data.product
      return {
        barcode,
        name: product.product_name || 'Unknown Product',
        brand: product.brands?.split(',')[0]?.trim(),
        category: product.categories?.split(',')[0]?.trim(),
        description: product.ingredients_text,
        image_url: product.image_url,
        allergens: product.allergens_tags?.map((tag: string) => tag.replace('en:', '')) || [],
        nutritional_info: {
          energy: product.nutriments?.energy,
          fat: product.nutriments?.fat,
          carbohydrates: product.nutriments?.carbohydrates,
          protein: product.nutriments?.protein,
          salt: product.nutriments?.salt
        }
      } as Omit<Product, 'id' | 'created_at'>
    }
    
    return null
  } catch (error) {
    console.error('Error fetching from external API:', error)
    return null
  }
}

// Generate optimized shopping route for a store
export const generateShoppingRoute = async (storeId: string, itemIds: string[]): Promise<ShoppingListItem[]> => {
  try {
    const items = await Promise.all(
      itemIds.map(async (itemId) => {
        const { data, error } = await supabase
          .from('shopping_list_items')
          .select(`
            *,
            product:products(*)
          `)
          .eq('id', itemId)
          .single()

        if (error) throw error

        // Get product location
        if (data.product_id) {
          const location = await getProductLocation(storeId, data.product_id)
          return { ...data, location }
        }

        return data
      })
    )

    // Sort by aisle/section for optimal route
    return items.sort((a, b) => {
      const aAisle = a.location?.aisle || 'ZZZ'
      const bAisle = b.location?.aisle || 'ZZZ'
      return aAisle.localeCompare(bAisle)
    })
  } catch (error) {
    console.error('Error generating shopping route:', error)
    return []
  }
}