// src/components/UserProfile.tsx - Fixed Authentication Check
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Trophy, 
  Star, 
  Gift, 
  TrendingUp, 
  Calendar,
  Crown,
  LogOut,
  Navigation,
  Map,
  Target,
  Database,
  AlertCircle,
  Lock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ChangePasswordModal } from './ChangePasswordModal';

interface UserProfileProps {
  onClose?: () => void;
  testMode?: boolean; // Add test mode prop
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose, testMode = false }) => {
  const { user, userProfile, signOut, hasPremiumAccess, premiumDaysRemaining } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Test Database Handler
  const handleTestDatabase = async () => {
    console.log('Testing database connection...');
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Test basic connection
      const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('id, name')
        .limit(1);
        
      if (storeError) {
        console.error('Store test failed:', storeError);
        alert('Database connection failed: ' + storeError.message);
        return;
      }
      
      // Test user profile table
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .limit(1);
        
      if (profileError) {
        console.error('Profile test failed:', profileError);
        alert('User profiles table error: ' + profileError.message);
        return;
      }
      
      // Create or get test user
      const testUserId = 'test-user-123';
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUserId)
        .single();
        
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: testUserId,
            full_name: 'Test Navigator',
            email: 'test@cartpilot.app',
            level: 5,
            contribution_points: 450,
            total_contributions: 23,
            accuracy_rating: 94,
            subscription_status: 'free',
            badges: ['first_contribution', 'store_pioneer']
          });
          
        if (insertError) {
          console.error('Failed to create test profile:', insertError);
          alert('Failed to create test profile: ' + insertError.message);
          return;
        }
      }
      
      alert('✅ Database test successful!\nStores: ' + (stores?.length || 0) + '\nProfiles: ' + (profiles?.length || 0));
      
    } catch (error) {
      console.error('Database test error:', error);
      alert('Database test failed: ' + (error as Error).message);
    }
  };

  // Show test mode interface if enabled
  if (testMode || (!user && !userProfile)) {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Database className="h-5 w-5" />
              Navigator Profile Test Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {testMode ? 'Running in test mode' : 'Please sign in to view your Navigator profile.'}
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleTestDatabase}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Test Database Connection
                </Button>
                
                {onClose && (
                  <Button 
                    onClick={onClose} 
                    variant="outline"
                    className="w-full"
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div>
                  <strong>Test Mode:</strong> This will test database connectivity and create a test user profile if needed.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state if we have user but no profile yet
  if (user && !userProfile) {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-4">Loading Navigator profile...</p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Reload Profile
              </Button>
              
              <Button 
                onClick={handleTestDatabase}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Database className="h-4 w-4 mr-2" />
                Test Database
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main profile display
  const handleSignOut = async () => {
    await signOut();
    if (onClose) onClose();
  };

  const currentLevelPoints = userProfile.contribution_points % 100;
  const progressPercentage = (currentLevelPoints / 100) * 100;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBadgeInfo = (badge: string) => {
    const badges = {
      'first_contribution': { name: 'First Navigator', icon: '🌟', color: 'bg-green-100 text-green-800' },
      'store_pioneer': { name: 'Store Pioneer', icon: '🗺️', color: 'bg-blue-100 text-blue-800' },
      'accuracy_expert': { name: 'Master Navigator', icon: '🎯', color: 'bg-purple-100 text-purple-800' },
      'community_hero': { name: 'Navigator Hero', icon: '🦸', color: 'bg-red-100 text-red-800' },
      'speed_mapper': { name: 'Speed Navigator', icon: '⚡', color: 'bg-yellow-100 text-yellow-800' }
    };
    
    return badges[badge as keyof typeof badges] || { 
      name: badge.replace(/_/g, ' '), 
      icon: '🏆', 
      color: 'bg-gray-100 text-gray-800' 
    };
  };

  const getNavigatorRank = (level: number) => {
    if (level >= 10) return { rank: 'Master Navigator', icon: '🎖️', color: 'text-purple-600' };
    if (level >= 5) return { rank: 'Expert Navigator', icon: '⭐', color: 'text-blue-600' };
    if (level >= 3) return { rank: 'Skilled Navigator', icon: '🌟', color: 'text-green-600' };
    return { rank: 'Navigator', icon: '🧭', color: 'text-orange-600' };
  };

  const navigatorRank = getNavigatorRank(userProfile.level);

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Navigator Header */}
      <Card className="border-2 border-gradient-to-r from-green-200 to-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-gradient-to-r from-green-400 to-blue-500">
                <AvatarImage src={userProfile.avatar_url} />
                <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white text-lg font-bold">
                  {getInitials(userProfile.full_name || 'Navigator')}
                </AvatarFallback>
              </Avatar>
              {/* Navigator Badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <Navigation className="h-3 w-3 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {userProfile.full_name || 'CartPilot Navigator'}
              </h2>
              <div className="flex items-center gap-1 mb-1">
                <span className={`text-sm font-medium ${navigatorRank.color}`}>
                  {navigatorRank.icon} {navigatorRank.rank}
                </span>
              </div>
              <p className="text-gray-600 text-sm">{userProfile.email}</p>
              
              {hasPremiumAccess && (
                <div className="flex items-center gap-1 mt-1">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-700">
                    Premium Navigator {userProfile.subscription_status === 'premium_earned' && `(${premiumDaysRemaining} days)`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigator Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {userProfile.total_contributions}
            </div>
            <div className="text-sm text-blue-700 flex items-center justify-center gap-1">
              <Map className="h-3 w-3" />
              Locations Mapped
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {userProfile.accuracy_rating}%
            </div>
            <div className="text-sm text-green-700 flex items-center justify-center gap-1">
              <Target className="h-3 w-3" />
              Accuracy Rate
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {userProfile.contribution_points}
            </div>
            <div className="text-sm text-purple-700 flex items-center justify-center gap-1">
              <Star className="h-3 w-3" />
              Navigator Points
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {userProfile.level}
            </div>
            <div className="text-sm text-orange-700 flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Navigator Level
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button 
          onClick={() => setShowChangePassword(true)}
          variant="outline"
          className="w-full justify-start border-green-500 text-green-600 hover:bg-green-50"
        >
          <Lock className="h-4 w-4 mr-2" />
          Change Password
        </Button>
        
        <Button 
          onClick={handleTestDatabase}
          variant="outline"
          className="w-full justify-start border-blue-500 text-blue-600 hover:bg-blue-50"
        >
          <Database className="h-4 w-4 mr-2" />
          Test Database Connection
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out Navigator
        </Button>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal 
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            console.log('Password changed successfully');
            // Could show a toast notification here
          }}
        />
      )}

      {/* Navigator Since */}
      <div className="text-center text-sm text-gray-500 pb-2">
        <div className="flex items-center justify-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>Navigator since {new Date(userProfile.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;