// Store Coordinate Correction Script
// Fixes known incorrect store locations based on user reports

// Correct coordinates for known problem stores
const STORE_CORRECTIONS = {
  'ASDA Leith': {
    lat: 55.9726, // Correct latitude for Edinburgh Leith area
    lng: -3.1683, // Correct longitude for Edinburgh Leith area  
    address: 'The Foot of the Walk, Leith, Edinburgh EH6 8RQ',
    postcode: 'EH6 8RQ',
    chain: 'ASDA'
  },
  'ASDA Leith Superstore': {
    lat: 55.9726,
    lng: -3.1683,
    address: 'The Foot of the Walk, Leith, Edinburgh EH6 8RQ', 
    postcode: 'EH6 8RQ',
    chain: 'ASDA'
  }
}

// Edinburgh area bounds for validation
const EDINBURGH_BOUNDS = {
  north: 55.999,
  south: 55.890,
  east: -3.100,
  west: -3.300
}

// Function to check if coordinates are plausible for Edinburgh
function validateEdinburghCoordinates(lat, lng, storeName) {
  if (storeName.toLowerCase().includes('edinburgh') || 
      storeName.toLowerCase().includes('leith') ||
      storeName.toLowerCase().includes('eh6') ||
      storeName.toLowerCase().includes('eh1')) {
    
    if (lat < EDINBURGH_BOUNDS.south || lat > EDINBURGH_BOUNDS.north ||
        lng < EDINBURGH_BOUNDS.west || lng > EDINBURGH_BOUNDS.east) {
      return false
    }
  }
  return true
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STORE_CORRECTIONS,
    validateEdinburghCoordinates,
    EDINBURGH_BOUNDS
  }
}

console.log('📍 Store coordinate corrections available:')
Object.keys(STORE_CORRECTIONS).forEach(storeName => {
  const store = STORE_CORRECTIONS[storeName]
  console.log(`${storeName}: ${store.lat}, ${store.lng}`)
})