import React, { useState, useEffect } from 'react'

interface UserStats {
  points: number
  contributions: number
  rank: number
  nextLevelPoints: number
  level: number
  accuracy: number
  totalShopping: number
  membershipLevel?: string
}

interface UserProfile {
  nickname?: string
  preferred_name?: string
  level?: string
}

interface GamificationDisplayProps {
  userStats: UserStats | null
  userProfile: UserProfile | null
  onStatsUpdate: (stats: UserStats) => void
  userId: string
}

// Mock data for demonstration
const MOCK_LEADERBOARD = [
  { user_id: '1', nickname: 'ShopMaster', points: 2450, contributions: 89, rank: 1 },
  { user_id: '2', nickname: 'GroceryGuru', points: 1980, contributions: 76, rank: 2 },
  { user_id: '3', nickname: 'AisleFinder', points: 1650, contributions: 52, rank: 3 },
  { user_id: '4', nickname: 'CartPilot', points: 1200, contributions: 38, rank: 4 },
  { user_id: '5', nickname: 'StoreExplorer', points: 950, contributions: 31, rank: 5 }
]

const MOCK_POINT_HISTORY = [
  { id: '1', action: 'product_location', points: 10, timestamp: new Date().toISOString() },
  { id: '2', action: 'verification', points: 5, timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', action: 'daily_login', points: 2, timestamp: new Date(Date.now() - 172800000).toISOString() },
  { id: '4', action: 'photo_upload', points: 15, timestamp: new Date(Date.now() - 259200000).toISOString() }
]

export const GamificationDisplay: React.FC<GamificationDisplayProps> = ({
  userStats,
  userProfile,
  onStatsUpdate,
  userId
}) => {
  const [leaderboard, setLeaderboard] = useState<Array<{
    user_id: string
    nickname: string
    points: number
    contributions: number
    rank: number
  }>>(MOCK_LEADERBOARD)
  const [pointHistory, setPointHistory] = useState<Array<{
    id: string
    action: string
    points: number
    timestamp: string
  }>>(MOCK_POINT_HISTORY)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // Fallback stats if userStats is not provided
  const stats = userStats || {
    points: 125,
    contributions: 8,
    rank: 4,
    nextLevelPoints: 75,
    level: 2,
    accuracy: 94,
    totalShopping: 23
  }

  const profile = userProfile || {
    preferred_name: 'Navigator',
    level: 'bronze'
  }

  const getMembershipIcon = (level: string) => {
    switch (level) {
      case 'free': return '🎯'
      case 'bronze': return '🧭'
      case 'silver': return '✈️'
      case 'gold': return '👨‍✈️'
      case 'platinum': return '⚓'
      default: return '🎯'
    }
  }

  const getMembershipName = (level: string) => {
    switch (level) {
      case 'free': return 'Explorer'
      case 'bronze': return 'Navigator'
      case 'silver': return 'Pilot'
      case 'gold': return 'Captain'
      case 'platinum': return 'Admiral'
      default: return 'Explorer'
    }
  }


  return (
    <div className="space-y-6">
      {/* User Stats Card */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              {getMembershipIcon(stats.membershipLevel || profile.level)} {getMembershipName(stats.membershipLevel || profile.level)}
            </h2>
            <p className="opacity-90">
              {profile?.nickname || profile?.preferred_name || 'Pilot'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.points}</div>
            <div className="text-sm opacity-90">Points</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold">{stats.contributions}</div>
            <div className="text-sm opacity-90">Contributions</div>
          </div>
          <div>
            <div className="text-xl font-bold">#{stats.rank || '?'}</div>
            <div className="text-sm opacity-90">Global Rank</div>
          </div>
          <div>
            <div className="text-xl font-bold">{stats.nextLevelPoints || 0}</div>
            <div className="text-sm opacity-90">To Next Level</div>
          </div>
        </div>

        {/* Progress bar to next level */}
        {stats.nextLevelPoints > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress to next level</span>
              <span>{stats.points} / {stats.points + stats.nextLevelPoints}</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${(stats.points / (stats.points + stats.nextLevelPoints)) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Earn More Points</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Add Product Location</div>
                <div className="text-sm text-gray-600">Help others find products</div>
              </div>
              <span className="text-green-600 font-bold">+10</span>
            </div>
          </div>
          <div className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Verify Location</div>
                <div className="text-sm text-gray-600">Confirm product locations</div>
              </div>
              <span className="text-green-600 font-bold">+5</span>
            </div>
          </div>
          <div className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Upload Photo</div>
                <div className="text-sm text-gray-600">Add product photos</div>
              </div>
              <span className="text-green-600 font-bold">+15</span>
            </div>
          </div>
          <div className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Submit Route</div>
                <div className="text-sm text-gray-600">Share optimal routes</div>
              </div>
              <span className="text-green-600 font-bold">+20</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard & History Toggle */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowLeaderboard(true)}
          className={`flex-1 py-3 rounded-lg font-medium ${
            showLeaderboard 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          🏆 Leaderboard
        </button>
        <button
          onClick={() => setShowLeaderboard(false)}
          className={`flex-1 py-3 rounded-lg font-medium ${
            !showLeaderboard 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          📊 My Activity
        </button>
      </div>

      {/* Content based on toggle */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {showLeaderboard ? (
          <>
            <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Top Contributors</h3>
            <div className="space-y-3">
              {leaderboard.map((user, index) => (
                <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                    }`}>
                      {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{user.nickname}</div>
                      <div className="text-sm text-gray-600">{user.contributions} contributions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{user.points}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Recent Activity</h3>
            <div className="space-y-3">
              {pointHistory.length > 0 ? (
                pointHistory.slice(0, 10).map((transaction, index) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <div className="font-medium capitalize">
                        {transaction.action.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`font-bold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.points > 0 ? '+' : ''}{transaction.points}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🚀</div>
                  <p>Start contributing to earn your first points!</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}