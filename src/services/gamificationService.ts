import { supabase } from '../supabaseClient'

export interface UserStats {
  points: number
  contributions: number
  membershipLevel: 'free' | 'bronze' | 'silver' | 'gold' | 'platinum'
  premiumExpiresAt?: string
  rank?: number
  nextLevelPoints?: number
  achievements?: Achievement[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  points: number
  unlocked: boolean
  unlockedAt?: string
}

export interface LeaderboardEntry {
  user_id: string
  nickname: string
  points: number
  contributions: number
  rank: number
}

export interface PointTransaction {
  id: string
  action: string
  points: number
  timestamp: string
}

// Membership level thresholds
const MEMBERSHIP_LEVELS = {
  free: { min: 0, max: 99, name: 'Explorer' },
  bronze: { min: 100, max: 499, name: 'Navigator' },
  silver: { min: 500, max: 1499, name: 'Pilot' },
  gold: { min: 1500, max: 4999, name: 'Captain' },
  platinum: { min: 5000, max: Infinity, name: 'Admiral' }
}

// Point values for different actions
export const POINT_VALUES = {
  product_location: 10,
  verification: 5,
  photo_upload: 15,
  route_submission: 20,
  daily_login: 2,
  first_contribution: 25,
  store_review: 8,
  allergen_report: 12
}

// Get user stats and progress
export const getUserStats = async (userId: string): Promise<UserStats | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.id !== userId) return null

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('points, total_contributions, membership_level, premium_expires_at')
      .eq('id', userId)
      .single()

    if (error) throw error

    const points = profile?.points || 0
    const contributions = profile?.total_contributions || 0
    const membershipLevel = calculateMembershipLevel(points)
    const nextLevelPoints = getNextLevelPoints(points)
    const rank = await getUserRank(userId)
    const achievements = await getUserAchievements(userId)

    return {
      points,
      contributions,
      membershipLevel,
      premiumExpiresAt: profile?.premium_expires_at,
      rank,
      nextLevelPoints,
      achievements
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return null
  }
}

// Calculate membership level based on points
const calculateMembershipLevel = (points: number): UserStats['membershipLevel'] => {
  if (points >= MEMBERSHIP_LEVELS.platinum.min) return 'platinum'
  if (points >= MEMBERSHIP_LEVELS.gold.min) return 'gold'
  if (points >= MEMBERSHIP_LEVELS.silver.min) return 'silver'
  if (points >= MEMBERSHIP_LEVELS.bronze.min) return 'bronze'
  return 'free'
}

// Get points needed for next level
const getNextLevelPoints = (currentPoints: number): number => {
  if (currentPoints < MEMBERSHIP_LEVELS.bronze.min) {
    return MEMBERSHIP_LEVELS.bronze.min - currentPoints
  }
  if (currentPoints < MEMBERSHIP_LEVELS.silver.min) {
    return MEMBERSHIP_LEVELS.silver.min - currentPoints
  }
  if (currentPoints < MEMBERSHIP_LEVELS.gold.min) {
    return MEMBERSHIP_LEVELS.gold.min - currentPoints
  }
  if (currentPoints < MEMBERSHIP_LEVELS.platinum.min) {
    return MEMBERSHIP_LEVELS.platinum.min - currentPoints
  }
  return 0 // Already at max level
}

// Award points to user
export const awardPoints = async (
  userId: string, 
  action: keyof typeof POINT_VALUES, 
  customPoints?: number
): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.id !== userId) return false

    const points = customPoints || POINT_VALUES[action] || 0

    // Record transaction
    const { error: transactionError } = await supabase
      .from('user_point_transactions')
      .insert({
        user_id: userId,
        action,
        points
      })

    if (transactionError) throw transactionError

    // Update user profile
    const { error: updateError } = await supabase.rpc('add_user_points', {
      user_id: userId,
      points_to_add: points
    })

    if (updateError) throw updateError

    // Check for new achievements
    await checkAchievements(userId)

    return true
  } catch (error) {
    console.error('Error awarding points:', error)
    return false
  }
}

// Get leaderboard
export const getLeaderboard = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, nickname, preferred_name, points, total_contributions')
      .order('points', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data?.map((user, index) => ({
      user_id: user.id,
      nickname: user.nickname || user.preferred_name || 'Anonymous',
      points: user.points || 0,
      contributions: user.total_contributions || 0,
      rank: index + 1
    })) || []
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    return []
  }
}

// Get user rank
const getUserRank = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('points')
      .eq('id', userId)
      .single()

    if (error) throw error

    const userPoints = data?.points || 0

    const { count, error: countError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gt('points', userPoints)

    if (countError) throw countError

    return (count || 0) + 1
  } catch (error) {
    console.error('Error getting user rank:', error)
    return 0
  }
}

// Get user point transactions history
export const getPointHistory = async (userId: string): Promise<PointTransaction[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.id !== userId) return []

    const { data, error } = await supabase
      .from('user_point_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(50)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting point history:', error)
    return []
  }
}

// Award daily login bonus
export const awardDailyLoginBonus = async (userId: string): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.id !== userId) return false

    const today = new Date().toDateString()

    // Check if already awarded today
    const { data: existingBonus } = await supabase
      .from('user_point_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('action', 'daily_login')
      .gte('timestamp', new Date(today).toISOString())

    if (existingBonus && existingBonus.length > 0) {
      return false // Already awarded today
    }

    return await awardPoints(userId, 'daily_login')
  } catch (error) {
    console.error('Error awarding daily login bonus:', error)
    return false
  }
}

// Check and unlock achievements
const checkAchievements = async (userId: string): Promise<void> => {
  try {
    const stats = await getUserStats(userId)
    if (!stats) return

    const newAchievements = []

    // First contribution achievement
    if (stats.contributions >= 1) {
      newAchievements.push({
        id: 'first_contribution',
        name: 'First Steps',
        description: 'Made your first contribution',
        icon: '🎯',
        points: 25
      })
    }

    // Point milestones
    if (stats.points >= 100) {
      newAchievements.push({
        id: 'navigator',
        name: 'Navigator',
        description: 'Reached 100 points',
        icon: '🧭',
        points: 0
      })
    }

    if (stats.points >= 500) {
      newAchievements.push({
        id: 'pilot',
        name: 'Pilot',
        description: 'Reached 500 points',
        icon: '✈️',
        points: 0
      })
    }

    // TODO: Store achievements in database
    // For now, we'll just log them
    if (newAchievements.length > 0) {
      console.log('New achievements unlocked:', newAchievements)
    }
  } catch (error) {
    console.error('Error checking achievements:', error)
  }
}

// Get user achievements (placeholder - implement database storage)
const getUserAchievements = async (userId: string): Promise<Achievement[]> => {
  // Placeholder implementation
  return []
}

// Premium membership management
export const grantPremiumAccess = async (
  userId: string, 
  durationDays: number
): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.id !== userId) return false

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    const { error } = await supabase
      .from('user_profiles')
      .update({
        membership_level: 'premium',
        premium_expires_at: expiresAt.toISOString()
      })
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error granting premium access:', error)
    return false
  }
}

// Check if user has premium access
export const hasPremiumAccess = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('premium_expires_at')
      .eq('id', userId)
      .single()

    if (error) throw error

    if (!data?.premium_expires_at) return false

    const expiresAt = new Date(data.premium_expires_at)
    return expiresAt > new Date()
  } catch (error) {
    console.error('Error checking premium access:', error)
    return false
  }
}
