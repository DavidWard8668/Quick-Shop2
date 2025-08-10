// 🚀 Social Shopping Service - Viral Growth Engine
// Transforming CartPilot into a social shopping platform

export interface FamilyMember {
  id: string
  email: string
  name: string
  role: 'admin' | 'member'
  avatar?: string
  joinedAt: Date
  lastActive: Date
  shoppingStats: {
    totalSavings: number
    efficiencyScore: number
    completedTrips: number
    helpfulReviews: number
  }
}

export interface SharedShoppingList {
  id: string
  familyId: string
  name: string
  createdBy: string
  collaborators: string[]
  items: SharedShoppingItem[]
  status: 'active' | 'completed' | 'archived'
  dueDate?: Date
  totalBudget?: number
  actualSpent?: number
  completedBy?: string
  completedAt?: Date
  realTimeUpdates: boolean
}

export interface SharedShoppingItem {
  id: string
  name: string
  category: string
  quantity: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  addedBy: string
  assignedTo?: string
  completed: boolean
  completedBy?: string
  notes?: string
  estimatedPrice?: number
  actualPrice?: number
  storeLocation?: string
  alternativeProducts?: string[]
  votes?: { userId: string, helpful: boolean }[]
}

export interface ShoppingChallenge {
  id: string
  title: string
  description: string
  type: 'efficiency' | 'savings' | 'community' | 'accessibility'
  duration: number // days
  startDate: Date
  endDate: Date
  participants: string[]
  prizes: string[]
  rules: string[]
  leaderboard: ChallengeParticipant[]
  isActive: boolean
}

export interface ChallengeParticipant {
  userId: string
  name: string
  score: number
  achievements: string[]
  currentRank: number
  previousRank?: number
  progress: {
    tripsCompleted: number
    timesSaved: number
    moneySaved: number
    helpfulActions: number
  }
}

export interface CommunityReview {
  id: string
  userId: string
  userName: string
  storeId: string
  productId?: string
  type: 'store_layout' | 'product_location' | 'accessibility' | 'general'
  rating: number
  title: string
  content: string
  images?: string[]
  helpfulVotes: number
  reportedCount: number
  verified: boolean
  createdAt: Date
  responses?: CommunityResponse[]
}

export interface CommunityResponse {
  id: string
  userId: string
  userName: string
  content: string
  helpful: boolean
  createdAt: Date
}

class SocialShoppingService {
  private families: Map<string, FamilyMember[]> = new Map()
  private sharedLists: Map<string, SharedShoppingList> = new Map()
  private challenges: Map<string, ShoppingChallenge> = new Map()
  private reviews: Map<string, CommunityReview[]> = new Map()
  private socket?: WebSocket

  constructor() {
    this.initializeRealTime()
    this.setupChallenges()
  }

  // 🔥 VIRAL GROWTH MECHANISMS

  async createFamily(adminId: string, familyName: string): Promise<string> {
    const familyId = `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const admin: FamilyMember = {
      id: adminId,
      email: '',
      name: 'Family Admin',
      role: 'admin',
      joinedAt: new Date(),
      lastActive: new Date(),
      shoppingStats: {
        totalSavings: 0,
        efficiencyScore: 100,
        completedTrips: 0,
        helpfulReviews: 0
      }
    }

    this.families.set(familyId, [admin])
    
    // Trigger viral invitation system
    this.sendViralInvitations(familyId, adminId)
    
    return familyId
  }

  async inviteFamilyMember(familyId: string, inviterId: string, email: string): Promise<boolean> {
    try {
      // Send viral invitation with incentives
      const invitation = {
        familyId,
        inviterName: this.getFamilyMember(familyId, inviterId)?.name,
        incentives: {
          bonusPoints: 500,
          premiumTrialDays: 30,
          exclusiveChallenges: true
        },
        personalizedMessage: `Join me on CartPilot! I've saved £${this.getTotalFamilySavings(familyId)} this month using smart shopping.`
      }

      // Simulate viral email/SMS sending
      console.log(`📧 Viral Invitation Sent:`, invitation)
      
      // Analytics tracking for viral coefficient
      this.trackViralMetrics(familyId, inviterId, 'invitation_sent')
      
      return true
    } catch (error) {
      console.error('Failed to send family invitation:', error)
      return false
    }
  }

  async createSharedList(familyId: string, name: string, createdBy: string): Promise<SharedShoppingList> {
    const list: SharedShoppingList = {
      id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      familyId,
      name,
      createdBy,
      collaborators: [createdBy],
      items: [],
      status: 'active',
      realTimeUpdates: true
    }

    this.sharedLists.set(list.id, list)
    
    // Real-time notification to all family members
    this.broadcastToFamily(familyId, 'shared_list_created', list)
    
    return list
  }

  async addItemToSharedList(listId: string, item: Omit<SharedShoppingItem, 'id'>, userId: string): Promise<boolean> {
    try {
      const list = this.sharedLists.get(listId)
      if (!list) return false

      const newItem: SharedShoppingItem = {
        ...item,
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      list.items.push(newItem)
      
      // Real-time update to all collaborators
      this.broadcastToFamily(list.familyId, 'list_item_added', {
        listId,
        item: newItem,
        addedBy: userId
      })

      // Gamification points
      this.awardPoints(userId, 'item_added', 10)
      
      return true
    } catch (error) {
      console.error('Failed to add item to shared list:', error)
      return false
    }
  }

  // 🏆 SOCIAL CHALLENGES & GAMIFICATION

  setupChallenges(): void {
    const challenges: ShoppingChallenge[] = [
      {
        id: 'efficiency_master',
        title: 'Efficiency Master',
        description: 'Complete 5 shopping trips under 30 minutes each',
        type: 'efficiency',
        duration: 7,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        participants: [],
        prizes: ['Premium Upgrade', 'Exclusive Badge', '£50 Store Voucher'],
        rules: [
          'Must complete entire shopping list',
          'Time measured from store entry to checkout',
          'Minimum 10 items per trip'
        ],
        leaderboard: [],
        isActive: true
      },
      {
        id: 'money_saver',
        title: 'Ultimate Money Saver',
        description: 'Save £100+ using CartPilot deals this month',
        type: 'savings',
        duration: 30,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        participants: [],
        prizes: ['£200 Cash Back', 'Yearly Premium', 'Savings Champion Badge'],
        rules: [
          'Savings verified through receipt scanning',
          'Must use CartPilot deal alerts',
          'Minimum 20 shopping trips'
        ],
        leaderboard: [],
        isActive: true
      },
      {
        id: 'community_helper',
        title: 'Community Helper',
        description: 'Write 25 helpful store/product reviews',
        type: 'community',
        duration: 14,
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        participants: [],
        prizes: ['Community Badge', 'Premium Features', 'Featured Reviewer Status'],
        rules: [
          'Reviews must be detailed and helpful',
          'Minimum 4-star average helpfulness rating',
          'Cover at least 10 different stores'
        ],
        leaderboard: [],
        isActive: true
      }
    ]

    challenges.forEach(challenge => {
      this.challenges.set(challenge.id, challenge)
    })
  }

  async joinChallenge(challengeId: string, userId: string): Promise<boolean> {
    try {
      const challenge = this.challenges.get(challengeId)
      if (!challenge || !challenge.isActive) return false

      if (!challenge.participants.includes(userId)) {
        challenge.participants.push(userId)
        
        // Add to leaderboard
        challenge.leaderboard.push({
          userId,
          name: 'User', // Get from user service
          score: 0,
          achievements: [],
          currentRank: challenge.leaderboard.length + 1,
          progress: {
            tripsCompleted: 0,
            timesSaved: 0,
            moneySaved: 0,
            helpfulActions: 0
          }
        })

        // Viral sharing opportunity
        this.triggerChallengeShare(userId, challengeId)
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to join challenge:', error)
      return false
    }
  }

  // 🌟 COMMUNITY REVIEWS & SOCIAL PROOF

  async submitReview(review: Omit<CommunityReview, 'id' | 'createdAt' | 'helpfulVotes' | 'reportedCount' | 'verified' | 'responses'>): Promise<string> {
    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newReview: CommunityReview = {
      ...review,
      id: reviewId,
      createdAt: new Date(),
      helpfulVotes: 0,
      reportedCount: 0,
      verified: false,
      responses: []
    }

    const storeReviews = this.reviews.get(review.storeId) || []
    storeReviews.push(newReview)
    this.reviews.set(review.storeId, storeReviews)

    // Award points for community contribution
    this.awardPoints(review.userId, 'review_submitted', 50)
    
    // Challenge progress
    this.updateChallengeProgress(review.userId, 'community_helper', 'helpfulActions', 1)
    
    return reviewId
  }

  async voteOnReview(reviewId: string, userId: string, helpful: boolean): Promise<boolean> {
    try {
      for (const [storeId, reviews] of this.reviews.entries()) {
        const review = reviews.find(r => r.id === reviewId)
        if (review) {
          if (helpful) {
            review.helpfulVotes++
          } else {
            review.reportedCount++
          }
          
          // Award points to review author for helpful votes
          if (helpful) {
            this.awardPoints(review.userId, 'helpful_vote_received', 5)
          }
          
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Failed to vote on review:', error)
      return false
    }
  }

  // 🔥 VIRAL MECHANICS & GROWTH HACKING

  private sendViralInvitations(familyId: string, inviterId: string): void {
    // Implement viral invitation system with incentives
    const viralMessage = {
      template: 'family_invitation',
      data: {
        inviterStats: this.getFamilyMemberStats(familyId, inviterId),
        familyBenefits: this.getFamilyBenefits(familyId),
        exclusiveOffers: this.getViralIncentives()
      }
    }
    
    console.log('🔥 Viral Invitation System Activated:', viralMessage)
  }

  private triggerChallengeShare(userId: string, challengeId: string): void {
    // Social sharing with personalized content
    const shareContent = {
      message: `Just joined the ${challengeId} challenge on CartPilot! Who wants to compete with me? 🛒🏆`,
      incentives: {
        referralBonus: '£10 credit for both users',
        challengeBonus: '2x points for invited friends'
      }
    }
    
    console.log('📱 Challenge Share Triggered:', shareContent)
  }

  private broadcastToFamily(familyId: string, event: string, data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'family_broadcast',
        familyId,
        event,
        data,
        timestamp: new Date().toISOString()
      }))
    }
  }

  private awardPoints(userId: string, action: string, points: number): void {
    // Gamification system
    console.log(`🏆 Points Awarded: ${userId} +${points} for ${action}`)
    
    // Trigger achievement notifications
    this.checkAchievements(userId)
  }

  private updateChallengeProgress(userId: string, challengeId: string, metric: keyof ChallengeParticipant['progress'], value: number): void {
    const challenge = this.challenges.get(challengeId)
    if (!challenge) return

    const participant = challenge.leaderboard.find(p => p.userId === userId)
    if (participant) {
      participant.progress[metric] += value
      participant.score = this.calculateChallengeScore(participant.progress, challengeId)
      
      // Update rankings
      challenge.leaderboard.sort((a, b) => b.score - a.score)
      challenge.leaderboard.forEach((p, index) => {
        p.previousRank = p.currentRank
        p.currentRank = index + 1
      })
      
      // Viral sharing for achievements
      if (participant.currentRank <= 3) {
        this.triggerAchievementShare(userId, challengeId, participant.currentRank)
      }
    }
  }

  private calculateChallengeScore(progress: ChallengeParticipant['progress'], challengeId: string): number {
    // Different scoring algorithms for different challenge types
    switch (challengeId) {
      case 'efficiency_master':
        return progress.tripsCompleted * 100 + progress.timesSaved * 10
      case 'money_saver':
        return progress.moneySaved
      case 'community_helper':
        return progress.helpfulActions * 25
      default:
        return 0
    }
  }

  private triggerAchievementShare(userId: string, challengeId: string, rank: number): void {
    const shareContent = {
      message: `🏆 Just reached #${rank} in the ${challengeId} challenge on CartPilot! Join me and let's dominate shopping together!`,
      incentives: {
        joinBonus: 'Start with 500 bonus points',
        competitionMode: 'Direct challenge mode available'
      }
    }
    
    console.log('🎉 Achievement Share:', shareContent)
  }

  private checkAchievements(userId: string): void {
    // Achievement system for viral growth
    const achievements = [
      'First Shared List',
      'Family Organizer',
      'Deal Hunter',
      'Time Saver',
      'Community Helper',
      'Challenge Champion'
    ]
    
    console.log(`🎯 Checking achievements for user: ${userId}`)
  }

  private initializeRealTime(): void {
    try {
      this.socket = new WebSocket('ws://localhost:3333/social')
      
      this.socket.onopen = () => {
        console.log('🔗 Social Shopping WebSocket Connected')
      }
      
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleRealTimeMessage(message)
        } catch (error) {
          console.warn('Failed to parse WebSocket message:', error)
        }
      }
      
      this.socket.onerror = (error) => {
        console.log('🔗 Social Shopping WebSocket error, falling back to offline mode')
        this.socket = undefined
      }
      
      this.socket.onclose = () => {
        console.log('🔗 Social Shopping WebSocket closed, using offline mode')
        this.socket = undefined
        // Don't try to reconnect to avoid constant failures
      }
    } catch (error) {
      console.log('🔗 Social Shopping WebSocket not available, using offline mode')
      this.socket = undefined
    }
  }

  private handleRealTimeMessage(message: any): void {
    switch (message.type) {
      case 'list_updated':
        window.dispatchEvent(new CustomEvent('sharedListUpdated', { detail: message.data }))
        break
      case 'challenge_update':
        window.dispatchEvent(new CustomEvent('challengeUpdated', { detail: message.data }))
        break
      case 'family_notification':
        window.dispatchEvent(new CustomEvent('familyNotification', { detail: message.data }))
        break
    }
  }

  // Utility methods
  private getFamilyMember(familyId: string, userId: string): FamilyMember | undefined {
    const family = this.families.get(familyId)
    return family?.find(member => member.id === userId)
  }

  private getFamilyMemberStats(familyId: string, userId: string) {
    const member = this.getFamilyMember(familyId, userId)
    return member?.shoppingStats || {}
  }

  private getTotalFamilySavings(familyId: string): number {
    const family = this.families.get(familyId)
    return family?.reduce((total, member) => total + member.shoppingStats.totalSavings, 0) || 0
  }

  private getFamilyBenefits(familyId: string): string[] {
    return [
      'Shared shopping lists with real-time sync',
      'Family challenges and competitions',
      'Collaborative meal planning',
      'Group discounts and deals',
      'Shared premium features'
    ]
  }

  private getViralIncentives(): any {
    return {
      newUserBonus: '£10 credit',
      premiumTrial: '30 days free',
      familyDiscount: '50% off family plan',
      exclusiveChallenges: 'Early access to new challenges'
    }
  }

  // Public API methods
  getFamilies(): Map<string, FamilyMember[]> {
    return this.families
  }

  getSharedLists(familyId: string): SharedShoppingList[] {
    return Array.from(this.sharedLists.values()).filter(list => list.familyId === familyId)
  }

  getActiveChallenges(): ShoppingChallenge[] {
    return Array.from(this.challenges.values()).filter(challenge => challenge.isActive)
  }

  getCommunityReviews(storeId: string): CommunityReview[] {
    return this.reviews.get(storeId) || []
  }
}

export const socialShoppingService = new SocialShoppingService()

// React hook for social shopping features
export function useSocialShopping(userId: string, familyId?: string) {
  const [families, setFamilies] = useState<FamilyMember[]>([])
  const [sharedLists, setSharedLists] = useState<SharedShoppingList[]>([])
  const [challenges, setChallenges] = useState<ShoppingChallenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSocialData = async () => {
      setLoading(true)
      
      if (familyId) {
        const familyMembers = socialShoppingService.getFamilies().get(familyId) || []
        const lists = socialShoppingService.getSharedLists(familyId)
        setFamilies(familyMembers)
        setSharedLists(lists)
      }
      
      const activeChallenges = socialShoppingService.getActiveChallenges()
      setChallenges(activeChallenges)
      
      setLoading(false)
    }

    loadSocialData()
    
    // Real-time updates
    const handleListUpdate = (event: any) => {
      if (familyId) {
        const lists = socialShoppingService.getSharedLists(familyId)
        setSharedLists(lists)
      }
    }
    
    const handleChallengeUpdate = (event: any) => {
      const activeChallenges = socialShoppingService.getActiveChallenges()
      setChallenges(activeChallenges)
    }

    window.addEventListener('sharedListUpdated', handleListUpdate)
    window.addEventListener('challengeUpdated', handleChallengeUpdate)
    
    return () => {
      window.removeEventListener('sharedListUpdated', handleListUpdate)
      window.removeEventListener('challengeUpdated', handleChallengeUpdate)
    }
  }, [userId, familyId])

  return {
    families,
    sharedLists,
    challenges,
    loading,
    createFamily: (name: string) => socialShoppingService.createFamily(userId, name),
    inviteMember: (email: string) => familyId ? socialShoppingService.inviteFamilyMember(familyId, userId, email) : Promise.resolve(false),
    createSharedList: (name: string) => familyId ? socialShoppingService.createSharedList(familyId, name, userId) : Promise.resolve(null),
    joinChallenge: (challengeId: string) => socialShoppingService.joinChallenge(challengeId, userId),
    submitReview: (review: any) => socialShoppingService.submitReview({ ...review, userId })
  }
}

console.log('🚀 Social Shopping Service: VIRAL GROWTH ENGINE ACTIVATED!')