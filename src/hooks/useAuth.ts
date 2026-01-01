import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isAdmin } from '../lib/supabase-helpers';

interface UseAuthReturn {
  user: User | null;
  profile: any;
  loadingAuth: boolean;
  loggingOut: boolean;
  showAuthModal: boolean;
  userIsAdmin: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: any) => void;
  setShowAuthModal: (show: boolean) => void;
  setLoggingOut: (loggingOut: boolean) => void;
  handleLogout: () => Promise<void>;
  resetUserState: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  const resetUserState = useCallback(() => {
    setProfile(null);
    setUserIsAdmin(false);
  }, []);

  const handleLogout = useCallback(async () => {
    // Prevent double-click
    if (loggingOut) return;
    
    setLoggingOut(true);
    try {
      // Reset state first to prevent race conditions
      setUser(null);
      resetUserState();
      
      // Sign out from Supabase
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      );
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise]) as { error: any };
      
      if (error) {
        console.error('Error during signOut:', error);
        // Even if signOut fails, clear localStorage and sessionStorage
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.error('Error clearing storage:', e);
        }
      }
      
      // Force a page refresh to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Still reset state even if signOut fails
      setUser(null);
      resetUserState();
      
      // Clear storage as fallback
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
      
      // Force page reload as last resort
      window.location.href = '/';
    } finally {
      // Don't set loggingOut to false since we're reloading the page
    }
  }, [loggingOut, resetUserState]);

  // Initialize Supabase Auth
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Try to get session quickly, but don't block UI if it takes too long
    timeoutId = setTimeout(() => {
      if (mounted) {
        setLoadingAuth(false);
      }
    }, 8000); // 8 second timeout
    
    // Check initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (!mounted) return;
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setLoadingAuth(false);
          return;
        }
        
        // Update user state immediately if session exists
        setUser(session?.user ?? null);
        setLoadingAuth(false);
      })
      .catch((error) => {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('❌ Error in getSession promise:', error);
        if (mounted) {
          setLoadingAuth(false);
        }
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // Update user state
      setUser(session?.user ?? null);
      
      // If user logged out, reset state
      if (!session?.user) {
        resetUserState();
      } else {
        // Check if user is admin
        try {
          const adminStatus = await isAdmin();
          setUserIsAdmin(adminStatus);
        } catch (err) {
          console.error('Error checking admin status:', err);
        }
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [resetUserState]);

  return {
    user,
    profile,
    loadingAuth,
    loggingOut,
    showAuthModal,
    userIsAdmin,
    setUser,
    setProfile,
    setShowAuthModal,
    setLoggingOut,
    handleLogout,
    resetUserState,
  };
};

