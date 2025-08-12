import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock browser APIs BEFORE importing components
Object.defineProperty(global, 'Notification', {
  value: {
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted')
  },
  writable: true
})

import { CartPilot } from '../../components/CartPilot'

// Mock the services
vi.mock('../../supabaseClient', () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
  signOut: vi.fn().mockResolvedValue(undefined),
  testSupabaseConnection: vi.fn().mockResolvedValue(true),
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn()
    }
  }
}))

vi.mock('../../services/userProfileService', () => ({
  getUserProfile: vi.fn().mockResolvedValue(null),
  createUserProfile: vi.fn().mockResolvedValue(null),
  updateUserProfile: vi.fn().mockResolvedValue(null),
  addFavoriteStore: vi.fn().mockResolvedValue(undefined),
  removeFavoriteStore: vi.fn().mockResolvedValue(undefined),
  getUserFavoriteStores: vi.fn().mockResolvedValue([])
}))

vi.mock('../../services/storeDataService', () => ({
  fetchNearbyStoresFromDB: vi.fn().mockResolvedValue([]),
  getCurrentLocation: vi.fn().mockResolvedValue({ lat: 51.5074, lng: -0.1278 }),
  getLocationFromPostcode: vi.fn().mockResolvedValue({ lat: 51.5074, lng: -0.1278 }),
  fetchAndSaveStoresFromOSM: vi.fn().mockResolvedValue([])
}))

vi.mock('../../services/navigationService', () => ({
  openMapsNavigation: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../../services/gamificationService', () => ({
  awardPoints: vi.fn().mockResolvedValue(undefined),
  getUserStats: vi.fn().mockResolvedValue({ points: 100, level: 1 })
}))

describe('CartPilot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the main logo and title', () => {
    render(<CartPilot />)
    
    expect(screen.getByText('CARTPILOT')).toBeInTheDocument()
    expect(screen.getByText('Your guide to stress free shopping')).toBeInTheDocument()
  })

  it('displays navigation tabs', () => {
    render(<CartPilot />)
    
    expect(screen.getByText('📍 Stores')).toBeInTheDocument()
    expect(screen.getByText('🧭 Navigate')).toBeInTheDocument()
    expect(screen.getByText('🛒 Cart')).toBeInTheDocument()
    expect(screen.getByText('👨‍✈️ Pilot')).toBeInTheDocument()
  })

  it('starts on stores tab by default', () => {
    render(<CartPilot />)
    
    expect(screen.getByText('🔍 Find CartPilot Partner Stores')).toBeInTheDocument()
    expect(screen.getByText('📍 Use My Location')).toBeInTheDocument()
  })

  it('can switch between tabs', async () => {
    render(<CartPilot />)
    
    // Switch to cart tab
    fireEvent.click(screen.getByText('🛒 Cart'))
    
    await waitFor(() => {
      expect(screen.getByText('🛒 Smart Shopping List')).toBeInTheDocument()
    })
  })

  it('shows sign in button when not authenticated', () => {
    render(<CartPilot />)
    
    expect(screen.getByText('🔑 Sign In')).toBeInTheDocument()
  })

  it('can add items to shopping cart', async () => {
    render(<CartPilot />)
    
    // Switch to cart tab
    fireEvent.click(screen.getByText('🛒 Cart'))
    
    // Find the input and add button
    const input = screen.getByPlaceholderText('Add item to shopping list...')
    const addButton = screen.getByText('➕ Add Item')
    
    // Add an item
    fireEvent.change(input, { target: { value: 'Milk' } })
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Milk')).toBeInTheDocument()
    })
  })

  it('shows PWA install banner', () => {
    render(<CartPilot />)
    
    expect(screen.getByText('📱 Install CartPilot')).toBeInTheDocument()
    expect(screen.getByText('Get quick access from your home screen')).toBeInTheDocument()
  })

  it('can handle location search', async () => {
    const { getCurrentLocation } = await import('../../services/storeDataService')
    
    render(<CartPilot />)
    
    const locationButton = screen.getByText('📍 Use My Location')
    fireEvent.click(locationButton)
    
    await waitFor(() => {
      expect(getCurrentLocation).toHaveBeenCalled()
    })
  })
})

















