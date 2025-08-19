import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { authService } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('AuthContext: Starting auth initialization...');
        
        // Use your authService instead of direct supabase calls
        const currentSession = await authService.getSession();
        
        if (currentSession) {
          console.log('Auth session loaded: User logged in');
          setSession(currentSession);
          setUser(currentSession.user);
        } else {
          console.log('Auth session loaded: No session');
        }

        // Set up auth listener using your authService
        const { data: { subscription } } = authService.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change:', event, session?.user?.email);
            setSession(session);
            setUser(session?.user ?? null);
          }
        );

        setLoading(false);
        console.log('AuthContext: Initialization complete');

        return () => {
          console.log('AuthContext: Cleaning up subscription');
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('AuthContext initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await authService.signIn(email, password);
      return {};
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      await authService.signUp(email, password, displayName);
      return {};
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};