// 🚀 Social Shopping Dashboard - Viral Growth UI
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { 
  Users, 
  Trophy, 
  Share2, 
  Target, 
  Clock, 
  PoundSterling,
  Star,
  MessageSquare,
  Plus,
  Crown,
  Zap,
  TrendingUp
} from 'lucide-react'
import { useSocialShopping, socialShoppingService } from '../../services/socialShoppingService'

interface SocialShoppingDashboardProps {
  userId: string
  familyId?: string
}

export function SocialShoppingDashboard({ userId, familyId }: SocialShoppingDashboardProps) {
  const { 
    families, 
    sharedLists, 
    challenges, 
    loading,
    createFamily,
    inviteMember,
    createSharedList,
    joinChallenge,
    submitReview
  } = useSocialShopping(userId, familyId)

  const [inviteEmail, setInviteEmail] = useState('')
  const [newListName, setNewListName] = useState('')
  const [showCreateFamily, setShowCreateFamily] = useState(false)

  const handleInviteMember = async () => {
    if (inviteEmail && familyId) {
      const success = await inviteMember(inviteEmail)
      if (success) {
        setInviteEmail('')
        // Show success notification
      }
    }
  }

  const handleCreateSharedList = async () => {
    if (newListName && familyId) {
      await createSharedList(newListName)
      setNewListName('')
    }
  }

  const handleJoinChallenge = async (challengeId: string) => {
    await joinChallenge(challengeId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Social Shopping</h1>
          <p className="text-muted-foreground">Shop together, save together, win together</p>
        </div>
        <Button 
          onClick={() => setShowCreateFamily(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Users className="w-4 h-4 mr-2" />
          Create Family
        </Button>
      </div>

      <Tabs defaultValue="family" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="family" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Family
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="lists" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Shared Lists
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Community
          </TabsTrigger>
        </TabsList>

        {/* Family Tab */}
        <TabsContent value="family" className="space-y-4">
          {families.length > 0 ? (
            <div className="grid gap-4">
              {/* Family Stats */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    Family Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">£{families.reduce((sum, member) => sum + member.shoppingStats.totalSavings, 0)}</div>
                      <div className="text-sm text-muted-foreground">Total Family Savings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{families.reduce((sum, member) => sum + member.shoppingStats.completedTrips, 0)}</div>
                      <div className="text-sm text-muted-foreground">Shopping Trips</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{Math.round(families.reduce((sum, member) => sum + member.shoppingStats.efficiencyScore, 0) / families.length)}</div>
                      <div className="text-sm text-muted-foreground">Avg Efficiency</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Family Members */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Family Members ({families.length})</CardTitle>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                    <Button onClick={handleInviteMember} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Invite
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {families.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {member.name}
                              {member.role === 'admin' && <Crown className="w-4 h-4 text-yellow-500" />}
                            </div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">£{member.shoppingStats.totalSavings}</div>
                          <div className="text-xs text-muted-foreground">{member.shoppingStats.completedTrips} trips</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="text-center p-8">
              <CardContent>
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Create Your Shopping Family</h3>
                <p className="text-muted-foreground mb-4">
                  Invite family members to share lists, compete in challenges, and save money together!
                </p>
                <Button onClick={() => setShowCreateFamily(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Family
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        {challenge.title}
                      </CardTitle>
                      <p className="text-orange-100">{challenge.description}</p>
                    </div>
                    <Badge variant="secondary" className="bg-white/20">
                      {challenge.participants.length} participants
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" />
                        {Math.ceil((challenge.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Prizes:</div>
                        {challenge.prizes.slice(0, 2).map((prize, index) => (
                          <Badge key={index} variant="outline" className="mr-2">
                            {prize}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        {challenge.leaderboard.slice(0, 3).map((participant, index) => (
                          <div key={participant.userId} className="flex items-center justify-between text-sm mb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs flex items-center justify-center font-bold">
                                {index + 1}
                              </span>
                              {participant.name}
                            </div>
                            <div className="font-medium">{participant.score}</div>
                          </div>
                        ))}
                      </div>
                      <Button 
                        onClick={() => handleJoinChallenge(challenge.id)} 
                        className="mt-2"
                        disabled={challenge.participants.includes(userId)}
                      >
                        {challenge.participants.includes(userId) ? 'Joined' : 'Join Challenge'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Shared Lists Tab */}
        <TabsContent value="lists" className="space-y-4">
          {familyId ? (
            <div className="space-y-4">
              {/* Create New List */}
              <Card>
                <CardHeader>
                  <CardTitle>Create Shared List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="List name (e.g., Weekly Groceries)"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <Button onClick={handleCreateSharedList}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Lists */}
              <div className="grid gap-4">
                {sharedLists.map((list) => (
                  <Card key={list.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Share2 className="w-5 h-5" />
                          {list.name}
                        </CardTitle>
                        <Badge variant={list.status === 'active' ? 'default' : 'secondary'}>
                          {list.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>{list.items.length} items</div>
                        <div>{list.collaborators.length} collaborators</div>
                        {list.totalBudget && (
                          <div>Budget: £{list.totalBudget}</div>
                        )}
                      </div>
                      <div className="mt-2">
                        <Progress 
                          value={(list.items.filter(item => item.completed).length / list.items.length) * 100} 
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="text-center p-8">
              <CardContent>
                <Share2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Join a Family First</h3>
                <p className="text-muted-foreground">
                  Create or join a family to start sharing shopping lists!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Community Reviews & Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Share Your Shopping Experience</h3>
                <p>Write reviews about stores, products, and shopping experiences to help the community!</p>
                <Button className="mt-4">Write Review</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}