import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UseAuthReturn {
  user: User | null;
  profile: any;
  loadingAuth: boolean;
  loggingOut: boolean;
  showAuthModal: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: any) => void;
  setShowAuthModal: (show: boolean) => void;
  setLoggingOut: (loggingOut: boolean) => void;
  handleLogout: () => Promise<void>;
  resetUserState: () => void;
}

export const useAuth = (): UseAuthReturn => {
  // Check if we just logged out - if so, start with loadingAuth=false
  const justLoggedOut = typeof window !== 'undefined' && localStorage.getItem('just_logged_out') === 'true';
  if (justLoggedOut && typeof window !== 'undefined') {
    localStorage.removeItem('just_logged_out');
  }

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(!justLoggedOut);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const resetUserState = useCallback(() => {
    setProfile(null);
  }, []);

  const handleLogout = useCallback(async () => {
    // Prevent double-click
    if (loggingOut) return;
    
    setLoggingOut(true);
    try {
      // Reset state first to prevent race conditions
      setUser(null);
      resetUserState();
      
      // Sign out from Supabase with timeout
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 3000)
      );
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise]) as { error: any };
      
      if (error) {
        console.error('Error during signOut:', error);
        // Even if signOut fails, clear storage
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.error('Error clearing storage:', e);
        }
      }
      
      // Set flag in localStorage to indicate we just logged out
      localStorage.setItem('just_logged_out', 'true');
      
      // Force immediate reload (no delay)
      window.location.reload();
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Still reset state even if signOut fails
      setUser(null);
      resetUserState();
      
      // Set flag in localStorage
      try {
        localStorage.setItem('just_logged_out', 'true');
      } catch (e) {
        console.error('Error setting logout flag:', e);
      }
      
      // Clear storage as fallback
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
      
      // Force page reload as last resort
      window.location.href = '/';
    }
  }, [loggingOut, resetUserState]);

  // Initialize Supabase Auth: כניסה מקישור אימייל – Supabase redirect (כפתור) או token_hash (קישור גיבוי)
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    let tokenHash = params?.get('token_hash');
    const otpType = params?.get('type');

    // Decode token_hash in case email client double-encoded the URL
    if (tokenHash) {
      try {
        tokenHash = decodeURIComponent(tokenHash);
      } catch {
        /* keep original */
      }
    }

    const initAuth = async () => {
      // Handle email verification via query params (token_hash) – same flow as Supabase direct, but link points to our app
      if (tokenHash && otpType && typeof window !== 'undefined') {
        const verifyType = otpType as 'magiclink' | 'email' | 'signup' | 'recovery';
        const typesToTry: Array<'email' | 'signup' | 'magiclink' | 'recovery'> =
          verifyType === 'signup' ? ['email', 'signup'] : verifyType === 'email' ? ['email', 'signup'] : [verifyType];
        try {
          let data: { session?: any } | null = null;
          let error: { message?: string } | null = null;
          for (const t of typesToTry) {
            const res = await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: t });
            data = res.data;
            error = res.error;
            if (!error) break;
          }
          if (!error && data?.session) {
            // Explicitly set session so it persists before reload (critical for backup/cross-tab)
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
            const cleanParams = new URLSearchParams(window.location.search);
            cleanParams.delete('token_hash');
            cleanParams.delete('type');
            const qs = cleanParams.toString();
            const cleanUrl = window.location.origin + (window.location.pathname || '/') + (qs ? '?' + qs : '') + (window.location.hash || '');
            await new Promise((r) => setTimeout(r, 1200));
            window.location.replace(cleanUrl);
            return;
          }
          if (error) console.warn('verifyOtp failed:', error.message);
        } catch (e) {
          console.warn('verifyOtp from email link failed:', e);
        }
      }

      // CANONICAL: Hash from Supabase redirect after /auth/v1/verify. Must call setSession – SDK does not auto-process.
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        if (accessToken && refreshToken && (type === 'signup' || type === 'email' || type === 'recovery')) {
          try {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            const cleanParams = new URLSearchParams(window.location.search);
            const qs = cleanParams.toString();
            const cleanUrl = window.location.origin + (window.location.pathname || '/') + (qs ? '?' + qs : '');
            await new Promise((r) => setTimeout(r, 800));
            window.location.replace(cleanUrl);
            return;
          } catch (e) {
            console.warn('Error processing email verification hash:', e);
          }
        }
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (timeoutId) clearTimeout(timeoutId);
      if (!mounted) return;
      if (error) {
        console.error('❌ Error getting session:', error);
        setLoadingAuth(false);
        return;
      }
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    };

    timeoutId = setTimeout(() => {
      if (mounted) setLoadingAuth(false);
    }, 5000);

    initAuth().catch((err) => {
      if (timeoutId) clearTimeout(timeoutId);
      console.error('❌ Error in initAuth:', err);
      if (mounted) setLoadingAuth(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // Update user state
      setUser(session?.user ?? null);
      
      // If user logged out, reset state
      if (!session?.user) {
        resetUserState();
        setLoadingAuth(false);
        setLoggingOut(false);
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
    setUser,
    setProfile,
    setShowAuthModal,
    setLoggingOut,
    handleLogout,
    resetUserState,
  };
};

