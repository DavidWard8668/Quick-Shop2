import { supabase } from '../supabaseClient'
import { Product } from '../types'

export interface AllergenInfo {
  name: string
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening'
  description: string
  commonNames: string[]
  icon: string
  color: string
}

export interface ProductAllergenCheck {
  product: Product
  safeForUser: boolean
  detectedAllergens: string[]
  warningLevel: 'none' | 'mild' | 'moderate' | 'severe' | 'life_threatening'
  alternatives?: Product[]
}

export interface AllergenReport {
  id: string
  user_id: string
  product_id: string
  barcode: string
  reported_allergens: string[]
  description: string
  verified: boolean
  created_at: string
}

// Comprehensive allergen database
export const ALLERGEN_DATABASE: { [key: string]: AllergenInfo } = {
  milk: {
    name: 'Milk/Dairy',
    severity: 'moderate',
    description: 'Contains lactose and milk proteins',
    commonNames: ['milk', 'dairy', 'lactose', 'casein', 'whey', 'butter', 'cream', 'cheese'],
    icon: '🥛',
    color: 'blue'
  },
  eggs: {
    name: 'Eggs',
    severity: 'severe',
    description: 'Contains egg proteins',
    commonNames: ['egg', 'albumin', 'lecithin', 'lysozyme', 'ovalbumin'],
    icon: '🥚',
    color: 'yellow'
  },
  fish: {
    name: 'Fish',
    severity: 'severe',
    description: 'Contains fish proteins',
    commonNames: ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine'],
    icon: '🐟',
    color: 'cyan'
  },
  shellfish: {
    name: 'Shellfish',
    severity: 'life_threatening',
    description: 'Contains crustacean and mollusk proteins',
    commonNames: ['crab', 'lobster', 'shrimp', 'prawn', 'scallop', 'mussel', 'oyster'],
    icon: '🦐',
    color: 'red'
  },
  tree_nuts: {
    name: 'Tree Nuts',
    severity: 'life_threatening',
    description: 'Contains tree nut proteins',
    commonNames: ['almond', 'walnut', 'cashew', 'pistachio', 'pecan', 'hazelnut', 'brazil nut'],
    icon: '🌰',
    color: 'brown'
  },
  peanuts: {
    name: 'Peanuts',
    severity: 'life_threatening',
    description: 'Contains peanut proteins',
    commonNames: ['peanut', 'groundnut', 'arachis'],
    icon: '🥜',
    color: 'orange'
  },
  wheat: {
    name: 'Wheat/Gluten',
    severity: 'moderate',
    description: 'Contains gluten proteins',
    commonNames: ['wheat', 'gluten', 'flour', 'barley', 'rye', 'oats', 'malt'],
    icon: '🌾',
    color: 'amber'
  },
  soy: {
    name: 'Soy',
    severity: 'moderate',
    description: 'Contains soy proteins',
    commonNames: ['soy', 'soya', 'soybean', 'lecithin', 'tofu', 'tempeh'],
    icon: '🫘',
    color: 'green'
  },
  sesame: {
    name: 'Sesame',
    severity: 'severe',
    description: 'Contains sesame proteins',
    commonNames: ['sesame', 'tahini', 'hummus'],
    icon: '🌱',
    color: 'gray'
  }
}

// Get user allergen preferences
export const getUserAllergenPreferences = async (userId: string): Promise<string[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.id !== userId) return []

    const { data, error } = await supabase
      .from('user_profiles')
      .select('allergen_preferences')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data?.allergen_preferences || []
  } catch (error) {
    console.error('Error getting user allergen preferences:', error)
    return []
  }
}

// Update user allergen preferences
export const updateUserAllergenPreferences = async (
  userId: string, 
  allergens: string[]
): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.id !== userId) return false

    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        allergen_preferences: allergens,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating allergen preferences:', error)
    return false
  }
}

// Check product for allergens via barcode scanning
export const checkProductAllergens = async (
  barcode: string,
  userAllergens: string[]
): Promise<ProductAllergenCheck | null> => {
  try {
    // First check our database
    let product = await getProductByBarcode(barcode)
    
    // If not in our database, try OpenFoodFacts API
    if (!product) {
      product = await fetchProductFromOpenFoodFacts(barcode)
      if (product) {
        await saveProductToDatabase(product)
      }
    }

    if (!product) return null

    const detectedAllergens = analyzeProductForAllergens(product, userAllergens)
    const warningLevel = calculateWarningLevel(detectedAllergens)
    const safeForUser = detectedAllergens.length === 0

    let alternatives: Product[] = []
    if (!safeForUser) {
      alternatives = await findSafeAlternatives(product, userAllergens)
    }

    return {
      product,
      safeForUser,
      detectedAllergens,
      warningLevel,
      alternatives
    }
  } catch (error) {
    console.error('Error checking product allergens:', error)
    return null
  }
}

// Get product from database by barcode
const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .single()

    if (error) return null
    return data
  } catch (error) {
    return null
  }
}

// Fetch product from OpenFoodFacts API
const fetchProductFromOpenFoodFacts = async (barcode: string): Promise<Product | null> => {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await response.json()

    if (data.status === 0 || !data.product) return null

    const product = data.product
    
    return {
      id: '', // Will be generated when saved
      barcode,
      name: product.product_name || 'Unknown Product',
      brand: product.brands || '',
      category: product.categories || '',
      description: product.ingredients_text || '',
      image_url: product.image_url || '',
      allergens: extractAllergensFromOpenFoodFacts(product),
      nutritional_info: {
        energy: product.nutriments?.energy_100g,
        fat: product.nutriments?.fat_100g,
        saturated_fat: product.nutriments?.saturated_fat_100g,
        carbohydrates: product.nutriments?.carbohydrates_100g,
        sugars: product.nutriments?.sugars_100g,
        fiber: product.nutriments?.fiber_100g,
        proteins: product.nutriments?.proteins_100g,
        salt: product.nutriments?.salt_100g
      }
    }
  } catch (error) {
    console.error('Error fetching from OpenFoodFacts:', error)
    return null
  }
}

// Extract allergens from OpenFoodFacts data
const extractAllergensFromOpenFoodFacts = (product: any): string[] => {
  const allergens: string[] = []
  
  // Check allergens field
  if (product.allergens) {
    const allergenText = product.allergens.toLowerCase()
    Object.keys(ALLERGEN_DATABASE).forEach(allergen => {
      const allergenInfo = ALLERGEN_DATABASE[allergen]
      if (allergenInfo.commonNames.some(name => allergenText.includes(name))) {
        allergens.push(allergen)
      }
    })
  }

  // Check ingredients
  if (product.ingredients_text) {
    const ingredientsText = product.ingredients_text.toLowerCase()
    Object.keys(ALLERGEN_DATABASE).forEach(allergen => {
      const allergenInfo = ALLERGEN_DATABASE[allergen]
      if (allergenInfo.commonNames.some(name => ingredientsText.includes(name))) {
        if (!allergens.includes(allergen)) {
          allergens.push(allergen)
        }
      }
    })
  }

  return allergens
}

// Save product to our database
const saveProductToDatabase = async (product: Product): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        category: product.category,
        description: product.description,
        image_url: product.image_url,
        allergens: product.allergens,
        nutritional_info: product.nutritional_info
      })
      .select('id')
      .single()

    if (error) throw error
    return data?.id || null
  } catch (error) {
    console.error('Error saving product to database:', error)
    return null
  }
}

// Analyze product for specific user allergens
const analyzeProductForAllergens = (product: Product, userAllergens: string[]): string[] => {
  const detectedAllergens: string[] = []
  
  userAllergens.forEach(userAllergen => {
    if (product.allergens?.includes(userAllergen)) {
      detectedAllergens.push(userAllergen)
    }
  })

  return detectedAllergens
}

// Calculate warning level based on detected allergens
const calculateWarningLevel = (detectedAllergens: string[]): ProductAllergenCheck['warningLevel'] => {
  if (detectedAllergens.length === 0) return 'none'
  
  let maxSeverity: AllergenInfo['severity'] = 'mild'
  
  detectedAllergens.forEach(allergen => {
    const allergenInfo = ALLERGEN_DATABASE[allergen]
    if (allergenInfo && allergenInfo.severity === 'life_threatening') {
      maxSeverity = 'life_threatening'
    } else if (allergenInfo && allergenInfo.severity === 'severe' && maxSeverity !== 'life_threatening') {
      maxSeverity = 'severe'
    } else if (allergenInfo && allergenInfo.severity === 'moderate' && maxSeverity === 'mild') {
      maxSeverity = 'moderate'
    }
  })

  return maxSeverity
}

// Find safe alternatives for a product
const findSafeAlternatives = async (
  product: Product, 
  userAllergens: string[]
): Promise<Product[]> => {
  try {
    if (!product.category) return []

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('category', `%${product.category}%`)
      .neq('id', product.id)
      .limit(5)

    if (error) throw error
    
    // Filter out products that contain user allergens
    const safeProducts = (data || []).filter(p => {
      const productAllergens = p.allergens || []
      return !userAllergens.some(allergen => productAllergens.includes(allergen))
    })

    return safeProducts
  } catch (error) {
    console.error('Error finding safe alternatives:', error)
    return []
  }
}

// Report allergen issue with a product
export const reportAllergenIssue = async (
  userId: string,
  productId: string,
  barcode: string,
  reportedAllergens: string[],
  description: string
): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.id !== userId) return false

    // Create allergen_reports table if it doesn't exist (you'd need to add this to your schema)
    const { error } = await supabase
      .from('allergen_reports')
      .insert({
        user_id: userId,
        product_id: productId,
        barcode,
        reported_allergens: reportedAllergens,
        description,
        verified: false
      })

    if (error) {
      // If table doesn't exist, log to console for now
      console.log('Allergen report (table not yet created):', {
        userId,
        productId,
        barcode,
        reportedAllergens,
        description
      })
      return true
    }

    // Award points for reporting
    // await awardPoints(userId, 'allergen_report', 12)

    return true
  } catch (error) {
    console.error('Error reporting allergen issue:', error)
    return false
  }
}

// Get allergen statistics for admin dashboard
export const getAllergenStatistics = async (): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('allergens')

    if (error) throw error

    const allergenCounts: { [key: string]: number } = {}
    
    data?.forEach(product => {
      product.allergens?.forEach((allergen: string) => {
        allergenCounts[allergen] = (allergenCounts[allergen] || 0) + 1
      })
    })

    return allergenCounts
  } catch (error) {
    console.error('Error getting allergen statistics:', error)
    return {}
  }
}
