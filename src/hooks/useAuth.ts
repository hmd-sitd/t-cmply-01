// src/hooks/useAuth.ts - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Session found' : 'No session');
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out - clearing state');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        await loadUserData(session.user.id);
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        await loadUserData(session.user.id);
      } else if (!session) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (authId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error) throw error;

      setUser(data);
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Initiating logout...');
      
      // Clear Supabase auth session
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase signOut error:', error);
        // Continue anyway to clear local state
      }
      
      // Force clear local state
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('✅ Logout complete');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force clear state even on error
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
  };
}