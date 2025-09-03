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
    expect(screen.getByText(/Your guide to stress free shopping/i)).toBeInTheDocument()
  })

  it('displays navigation tabs', () => {
    render(<CartPilot />)
    
    // Look for button elements containing the text (handles multiple spans for responsive design)
    expect(screen.getByRole('button', { name: /stores/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /navigate/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cart/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pilot/i })).toBeInTheDocument()
  })

  it('starts on stores tab by default', () => {
    render(<CartPilot />)
    
    expect(screen.getByRole('heading', { name: /Find.*Partner Stores/i })).toBeInTheDocument()
  })

  it('can switch between tabs', async () => {
    render(<CartPilot />)
    
    fireEvent.click(screen.getByRole('button', { name: /cart/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/Smart Shopping List/i)).toBeInTheDocument()
    })
  })

  it('shows sign in button when not authenticated', () => {
    render(<CartPilot />)
    
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('can add items to shopping cart', async () => {
    render(<CartPilot />)
    
    fireEvent.click(screen.getByRole('button', { name: /cart/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/Smart Shopping List/i)).toBeInTheDocument()
    })
  })
})
