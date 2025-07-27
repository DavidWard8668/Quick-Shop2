// src/hooks/useAuth.ts - Fixed Authentication Hook
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  level: number;
  contribution_points: number;
  total_contributions: number;
  accuracy_rating: number;
  subscription_status: 'free' | 'premium' | 'premium_earned';
  badges: string[];
  avatar_url?: string;
  created_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile load error:', error);
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          await createUserProfile(userId);
        } else {
          throw error;
        }
      } else {
        console.log('Profile loaded:', data);
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      const user = supabase.auth.getUser();
      const email = (await user).data.user?.email || '';
      
      const newProfile = {
        id: userId,
        full_name: email.split('@')[0], // Use part of email as name
        email: email,
        level: 1,
        contribution_points: 0,
        total_contributions: 0,
        accuracy_rating: 0,
        subscription_status: 'free' as const,
        badges: []
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) throw error;
      
      console.log('Profile created:', data);
      setUserProfile(data);
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthLoading(true);
      console.log('Signing in:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      console.log('Sign in successful:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Sign in failed:', error);
      return { data: null, error };
    } finally {
      setAuthLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setAuthLoading(true);
      console.log('Signing up:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0]
          }
        }
      });

      if (error) throw error;
      
      console.log('Sign up successful:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Sign up failed:', error);
      return { data: null, error };
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setAuthLoading(true);
      console.log('Signing out...');
      
      // Clear local state first
      setUser(null);
      setUserProfile(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('Sign out failed:', error);
      return { error };
    } finally {
      setAuthLoading(false);
    }
  };

  // Premium access logic
  const hasPremiumAccess = userProfile?.subscription_status === 'premium' || 
                          userProfile?.subscription_status === 'premium_earned';

  const premiumDaysRemaining = userProfile?.subscription_status === 'premium_earned' 
    ? Math.max(0, 30) // Placeholder - you'll need to calculate based on earned date
    : null;

  return {
    user,
    userProfile,
    loading,
    authLoading,
    signIn,
    signUp,
    signOut,
    hasPremiumAccess,
    premiumDaysRemaining,
    createUserProfile,
    loadUserProfile
  };
};