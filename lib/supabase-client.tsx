// lib/supabase-client.tsx
// Supabase Client SDK for browser (replaces Clerk completely)
// IMPORTANT: Must have "use client" directive because it uses React hooks

"use client";

import { createClient } from '@supabase/supabase-js';
import type { User, Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

// Environment variables (must be set in .env.local or Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate env vars exist
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create authenticated Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth context types
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isSignedIn: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

// Default context value
const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  isSignedIn: false,
  loading: true,
  signOut: async () => {},
};

// Context
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Custom hook for accessing auth state
export function useUser() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUser must be used within an AuthProvider');
  }
  return context;
}

// Auth Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session on mount
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('[AuthProvider] Init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[AuthProvider] Sign out error:', error);
    }
  };

  const isSignedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, session, isSignedIn, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
