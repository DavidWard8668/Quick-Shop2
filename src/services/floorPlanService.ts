// Real Floor Plans Service - Store Partnership Integration
export interface FloorPlan {
  storeId: string
  storeName: string
  layout: {
    width: number
    height: number
    scale: number // pixels per meter
    entrances: Array<{ x: number; y: number; name: string }>
    exits: Array<{ x: number; y: number; name: string }>
  }
  aisles: Array<{
    id: string
    number: number
    name: string
    x: number
    y: number
    width: number
    height: number
    sections: Array<{
      id: string
      name: string
      category: string
      x: number
      y: number
      width: number
      height: number
      products: string[]
    }>
  }>
  fixtures: Array<{
    id: string
    type: 'checkout' | 'customer_service' | 'pharmacy' | 'deli' | 'bakery' | 'restroom' | 'atm'
    name: string
    x: number
    y: number
    width: number
    height: number
  }>
  zones: Array<{
    id: string
    name: string
    category: 'produce' | 'dairy' | 'meat' | 'frozen' | 'bakery' | 'deli' | 'pharmacy' | 'checkout'
    x: number
    y: number
    width: number
    height: number
    color: string
  }>
  lastUpdated: number
  version: string
  crowdsourced: boolean
}

export interface ProductLocation {
  productName: string
  barcode?: string
  aisleId: string
  sectionId: string
  x?: number
  y?: number
  confidence: number // 0-1, crowdsourced reliability
  reportedBy: string
  reportedAt: number
  verified: boolean
}

class FloorPlanService {
  private floorPlans: Map<string, FloorPlan> = new Map()
  private productLocations: Map<string, ProductLocation[]> = new Map()

  // Mock real floor plan data for major UK supermarkets
  private mockFloorPlans: FloorPlan[] = [
    {
      storeId: 'tesco-manchester-arndale',
      storeName: 'Tesco Manchester Arndale',
      layout: {
        width: 800,
        height: 600,
        scale: 10, // 10 pixels per meter
        entrances: [{ x: 400, y: 10, name: 'Main Entrance' }],
        exits: [
          { x: 400, y: 10, name: 'Main Exit' },
          { x: 780, y: 300, name: 'Side Exit' }
        ]
      },
      aisles: [
        {
          id: 'aisle-1',
          number: 1,
          name: 'Fresh Produce',
          x: 50,
          y: 50,
          width: 200,
          height: 60,
          sections: [
            {
              id: 'fruit',
              name: 'Fresh Fruit',
              category: 'produce',
              x: 50,
              y: 50,
              width: 90,
              height: 60,
              products: ['Apples', 'Bananas', 'Oranges', 'Grapes']
            },
            {
              id: 'vegetables',
              name: 'Vegetables',
              category: 'produce',
              x: 150,
              y: 50,
              width: 90,
              height: 60,
              products: ['Carrots', 'Potatoes', 'Onions', 'Tomatoes']
            }
          ]
        },
        {
          id: 'aisle-2',
          number: 2,
          name: 'Dairy & Chilled',
          x: 50,
          y: 150,
          width: 200,
          height: 60,
          sections: [
            {
              id: 'milk-cream',
              name: 'Milk & Cream',
              category: 'dairy',
              x: 50,
              y: 150,
              width: 90,
              height: 60,
              products: ['Milk', 'Cream', 'Yogurt', 'Butter']
            },
            {
              id: 'cheese',
              name: 'Cheese',
              category: 'dairy',
              x: 150,
              y: 150,
              width: 90,
              height: 60,
              products: ['Cheddar', 'Mozzarella', 'Parmesan', 'Brie']
            }
          ]
        },
        {
          id: 'aisle-3',
          number: 3,
          name: 'Meat & Poultry',
          x: 50,
          y: 250,
          width: 200,
          height: 60,
          sections: [
            {
              id: 'fresh-meat',
              name: 'Fresh Meat',
              category: 'meat',
              x: 50,
              y: 250,
              width: 90,
              height: 60,
              products: ['Chicken Breast', 'Beef Mince', 'Pork Chops', 'Lamb']
            },
            {
              id: 'processed-meat',
              name: 'Processed Meat',
              category: 'meat',
              x: 150,
              y: 250,
              width: 90,
              height: 60,
              products: ['Bacon', 'Ham', 'Sausages', 'Deli Meat']
            }
          ]
        },
        {
          id: 'aisle-4',
          number: 4,
          name: 'Frozen Foods',
          x: 350,
          y: 50,
          width: 200,
          height: 60,
          sections: [
            {
              id: 'frozen-veg',
              name: 'Frozen Vegetables',
              category: 'frozen',
              x: 350,
              y: 50,
              width: 90,
              height: 60,
              products: ['Frozen Peas', 'Frozen Carrots', 'Frozen Broccoli']
            },
            {
              id: 'ice-cream',
              name: 'Ice Cream',
              category: 'frozen',
              x: 450,
              y: 50,
              width: 90,
              height: 60,
              products: ['Vanilla Ice Cream', 'Chocolate Ice Cream', 'Ben & Jerry\'s']
            }
          ]
        },
        {
          id: 'aisle-5',
          number: 5,
          name: 'Bakery',
          x: 350,
          y: 150,
          width: 200,
          height: 60,
          sections: [
            {
              id: 'fresh-bread',
              name: 'Fresh Bread',
              category: 'bakery',
              x: 350,
              y: 150,
              width: 90,
              height: 60,
              products: ['White Bread', 'Brown Bread', 'Croissants', 'Bagels']
            },
            {
              id: 'cakes-pastries',
              name: 'Cakes & Pastries',
              category: 'bakery',
              x: 450,
              y: 150,
              width: 90,
              height: 60,
              products: ['Birthday Cake', 'Donuts', 'Muffins', 'Danish']
            }
          ]
        },
        {
          id: 'aisle-6',
          number: 6,
          name: 'Pantry Essentials',
          x: 350,
          y: 250,
          width: 200,
          height: 60,
          sections: [
            {
              id: 'canned-goods',
              name: 'Canned Goods',
              category: 'pantry',
              x: 350,
              y: 250,
              width: 90,
              height: 60,
              products: ['Baked Beans', 'Tomatoes', 'Tuna', 'Soup']
            },
            {
              id: 'pasta-rice',
              name: 'Pasta & Rice',
              category: 'pantry',
              x: 450,
              y: 250,
              width: 90,
              height: 60,
              products: ['Spaghetti', 'Rice', 'Couscous', 'Quinoa']
            }
          ]
        }
      ],
      fixtures: [
        {
          id: 'checkout-main',
          type: 'checkout',
          name: 'Main Checkout',
          x: 300,
          y: 450,
          width: 200,
          height: 50
        },
        {
          id: 'customer-service',
          type: 'customer_service',
          name: 'Customer Service',
          x: 50,
          y: 450,
          width: 100,
          height: 50
        },
        {
          id: 'pharmacy',
          type: 'pharmacy',
          name: 'Pharmacy',
          x: 600,
          y: 50,
          width: 150,
          height: 100
        }
      ],
      zones: [
        {
          id: 'produce-zone',
          name: 'Fresh Produce',
          category: 'produce',
          x: 30,
          y: 30,
          width: 240,
          height: 100,
          color: '#10B981'
        },
        {
          id: 'dairy-zone',
          name: 'Dairy & Chilled',
          category: 'dairy',
          x: 30,
          y: 130,
          width: 240,
          height: 100,
          color: '#3B82F6'
        },
        {
          id: 'frozen-zone',
          name: 'Frozen',
          category: 'frozen',
          x: 330,
          y: 30,
          width: 240,
          height: 100,
          color: '#8B5CF6'
        }
      ],
      lastUpdated: Date.now(),
      version: '1.0',
      crowdsourced: false
    }
  ]

  async init(): Promise<void> {
    // Load mock floor plans
    for (const plan of this.mockFloorPlans) {
      this.floorPlans.set(plan.storeId, plan)
    }
    console.log('🏪 Floor plan service initialized with', this.mockFloorPlans.length, 'store layouts')
  }

  // Get floor plan for a specific store
  async getFloorPlan(storeId: string): Promise<FloorPlan | null> {
    // Check cache first
    const cached = this.floorPlans.get(storeId)
    if (cached) {
      return cached
    }

    // In a real implementation, this would fetch from your API
    // For now, return null if not in mock data
    return null
  }

  // Get all available floor plans
  async getAllFloorPlans(): Promise<FloorPlan[]> {
    return Array.from(this.floorPlans.values())
  }

  // Find product location in a store
  async findProductInStore(storeId: string, productName: string): Promise<{
    aisle: any
    section: any
    x?: number
    y?: number
    confidence: number
  } | null> {
    const floorPlan = await this.getFloorPlan(storeId)
    if (!floorPlan) return null

    // Search through all aisles and sections
    for (const aisle of floorPlan.aisles) {
      for (const section of aisle.sections) {
        // Check if product is in this section
        const productMatch = section.products.find(p => 
          p.toLowerCase().includes(productName.toLowerCase()) ||
          productName.toLowerCase().includes(p.toLowerCase())
        )
        
        if (productMatch) {
          return {
            aisle,
            section,
            x: section.x + section.width / 2,
            y: section.y + section.height / 2,
            confidence: 0.8 // High confidence for official floor plans
          }
        }
      }
    }

    return null
  }

  // Generate optimized route through store
  async generateOptimizedRoute(storeId: string, items: string[]): Promise<Array<{
    item: string
    aisle: any
    section: any
    x: number
    y: number
    order: number
  }>> {
    const floorPlan = await this.getFloorPlan(storeId)
    if (!floorPlan) return []

    const route = []
    let order = 1

    // Find location for each item
    for (const item of items) {
      const location = await this.findProductInStore(storeId, item)
      if (location) {
        route.push({
          item,
          aisle: location.aisle,
          section: location.section,
          x: location.x || 0,
          y: location.y || 0,
          order: order++
        })
      }
    }

    // Sort by aisle number for optimal path
    route.sort((a, b) => a.aisle.number - b.aisle.number)
    
    // Update order after sorting
    route.forEach((item, index) => {
      item.order = index + 1
    })

    return route
  }

  // Add crowdsourced product location
  async addProductLocation(
    storeId: string,
    productName: string,
    aisleNumber: number,
    sectionName: string,
    reportedBy: string
  ): Promise<boolean> {
    const location: ProductLocation = {
      productName,
      aisleId: `aisle-${aisleNumber}`,
      sectionId: sectionName.toLowerCase().replace(/\s+/g, '-'),
      confidence: 0.6, // Lower confidence for crowdsourced
      reportedBy,
      reportedAt: Date.now(),
      verified: false
    }

    // Add to product locations
    const storeLocations = this.productLocations.get(storeId) || []
    storeLocations.push(location)
    this.productLocations.set(storeId, storeLocations)

    console.log(`📍 Added crowdsourced location for ${productName} at ${storeId}`)
    return true
  }

  // Get crowdsourced product locations
  async getCrowdsourcedLocations(storeId: string): Promise<ProductLocation[]> {
    return this.productLocations.get(storeId) || []
  }

  // Verify a crowdsourced location
  async verifyLocation(storeId: string, locationId: string, verifiedBy: string): Promise<boolean> {
    const locations = this.productLocations.get(storeId) || []
    const location = locations.find(l => l.reportedBy === locationId)
    
    if (location) {
      location.verified = true
      location.confidence = Math.min(location.confidence + 0.2, 1.0)
      console.log(`✅ Location verified for ${location.productName}`)
      return true
    }
    
    return false
  }

  // Get store statistics
  async getStoreStats(storeId: string): Promise<{
    totalProducts: number
    crowdsourcedLocations: number
    verifiedLocations: number
    completeness: number
  }> {
    const floorPlan = await this.getFloorPlan(storeId)
    const crowdsourced = await this.getCrowdsourcedLocations(storeId)
    
    if (!floorPlan) {
      return {
        totalProducts: 0,
        crowdsourcedLocations: 0,
        verifiedLocations: 0,
        completeness: 0
      }
    }

    const totalProducts = floorPlan.aisles.reduce(
      (total, aisle) => total + aisle.sections.reduce(
        (sectionTotal, section) => sectionTotal + section.products.length, 0
      ), 0
    )
    
    const verifiedLocations = crowdsourced.filter(l => l.verified).length

    return {
      totalProducts,
      crowdsourcedLocations: crowdsourced.length,
      verifiedLocations,
      completeness: totalProducts > 0 ? (totalProducts + verifiedLocations) / (totalProducts * 1.5) : 0
    }
  }

  // Search stores by features
  async searchStoresByFeatures(features: string[]): Promise<FloorPlan[]> {
    const plans = await this.getAllFloorPlans()
    
    return plans.filter(plan => {
      const storeFeatures = plan.fixtures.map(f => f.type).concat(
        plan.zones.map(z => z.category)
      )
      
      return features.every(feature => 
        storeFeatures.includes(feature as any)
      )
    })
  }
}

// Create singleton instance
export const floorPlanService = new FloorPlanService()

// Initialize when the module loads
floorPlanService.init()