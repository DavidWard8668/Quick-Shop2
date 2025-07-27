# Quick Shop - In-Store Shopping Assistant

A React-based shopping app focused on in-store grocery shopping efficiency for UK customers.

## Features

- **Product Search**: Fuzzy search with synonyms (e.g., 'milk' finds 'whole milk', 'semi skimmed milk')
- **Smart Basket**: Add/remove items with quantity management
- **Aisle Sorting**: Automatically sorts basket by aisle order to minimize walking time
- **Route Optimization**: Visual store map showing optimized shopping route
- **Local Storage**: Basket persists between sessions
- **Mobile-First**: Responsive design optimized for in-store use

## Quick Start

```bash
npm install
npm run dev
```

## Usage

1. **Search Tab**: Search for products and add them to your basket
2. **Basket Tab**: View and manage your items, sorted by aisle
3. **Route Tab**: See your optimized shopping route through the store

## UK Terminology

- Uses British terminology (basket, aisle, etc.)
- Prices in GBP (£)
- Common UK grocery items included

## Technical Stack

- React + TypeScript
- Tailwind CSS
- Context API for state management
- Local storage for persistence
- Mock data (20+ common grocery items)

## Store Layout

The app includes a mock store with 8 aisles:
- Aisle 1: Bakery
- Aisle 2: Dry Goods  
- Aisle 3: Dairy
- Aisle 4: Breakfast/Snacks
- Aisle 5: Meat & Poultry
- Aisle 6: Drinks
- Aisle 7: Fresh Produce
- Aisle 8: Household/Cleaning