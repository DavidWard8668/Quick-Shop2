import React from 'react'
import { Store } from '../types'
import { navigateToStore } from '../utils/navigation'

interface StoreSearchProps {
  stores: Store[]
  loading: boolean
  onRefresh: () => void
  onStoreSelect: (store: Store) => void
  favoriteStores: any[]
  onFavoriteToggle: (store: Store) => void
  user: any
  onAuthRequest: () => void
}

export const StoreSearch: React.FC<StoreSearchProps> = ({
  stores,
  loading,
  onRefresh,
  onStoreSelect,
  favoriteStores,
  onFavoriteToggle,
  user,
  onAuthRequest
}) => {
  const isFavorite = (storeId: string) => {
    return favoriteStores.some(fav => fav.store_id === storeId)
  }

  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Nearby Stores</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
        >
          {loading ? 'Searching...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : stores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map(store => (
            <div key={store.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{store.name}</h3>
                  {store.chain && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {store.chain}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => user ? onFavoriteToggle(store) : onAuthRequest()}
                  className={`text-xl ${isFavorite(store.id) ? 'text-red-500' : 'text-gray-300'} hover:text-red-500`}
                >
                  ❤️
                </button>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                <p>{store.address}</p>
                <p>{store.postcode}</p>
                {store.distance && (
                  <p className="font-medium text-blue-600">
                    📍 {store.distance.toFixed(1)} miles away
                  </p>
                )}
                {store.opening_hours && (
                  <p className="text-green-600">🕐 {store.opening_hours}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigateToStore(store)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  🗺️ Get Directions
                </button>
                <button
                  onClick={() => onStoreSelect(store)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  🛒 Shop Here
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No stores found</h3>
          <p className="text-gray-600 mb-6">
            We couldn't find any stores in your area. Try refreshing or check your location settings.
          </p>
          <button
            onClick={onRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}