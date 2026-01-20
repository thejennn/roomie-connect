// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'landlord' | 'tenant';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  walletBalance: number; // for landlords (mock)
  aiTokens: number; // for tenants (mock)
  signUp: (email: string, password: string, role?: UserRole, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deductWallet: (amount: number) => boolean;
  topUpWallet: (amount: number) => void;
  useAiToken: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock economy state
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [aiTokens, setAiTokens] = useState<number>(0);

  useEffect(() => {
    // Keep original supabase listener but prefer mock-first on demo logins
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // check existing session (non-demo)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => data.subscription?.unsubscribe();
  }, []);

  const DEMO_ACCOUNT_ROLE: Record<string, UserRole> = {
    'admin@demo.com': 'admin',
    'admin.demo@gmail.com': 'admin',
    'admin@gmail.com': 'admin',            // optional alias
    'landlord@demo.com': 'landlord',
    'landlord.demo@gmail.com': 'landlord',
    'landlord@gmail.com': 'landlord',
    'tenant@demo.com': 'tenant',
    'tenant.demo@gmail.com': 'tenant',
    'tenant@gmail.com': 'tenant',
  };

  // Mock helper to seed demo accounts locally
  const seedDemoAccount = (email: string) => {
    const roleFor = DEMO_ACCOUNT_ROLE[email];
    if (!roleFor) return;

    setRole(roleFor);
    if (roleFor === 'landlord') {
      setWalletBalance(5000000);
      setAiTokens(0);
      setUser({
        id: 'demo-landlord',
        aud: 'demo',
        created_at: new Date().toISOString(),
        email,
      } as unknown as User);
      setSession(null);
      setLoading(false);
      return;
    }

    if (roleFor === 'tenant') {
      setWalletBalance(0);
      setAiTokens(20);
      setUser({
        id: 'demo-tenant',
        aud: 'demo',
        created_at: new Date().toISOString(),
        email,
      } as unknown as User);
      setSession(null);
      setLoading(false);
      return;
    }

    if (roleFor === 'admin') {
      setWalletBalance(0);
      setAiTokens(0);
      setUser({
        id: 'demo-admin',
        aud: 'demo',
        created_at: new Date().toISOString(),
        email,
      } as unknown as User);
      setSession(null);
      setLoading(false);
      return;
    }
  };

  const signUp = async (email: string, password: string, roleArg?: UserRole, metadata?: Record<string, unknown>) => {
    // For mock-first flow, if demo emails used, seed locally
    if (['landlord@demo.com', 'tenant@demo.com', 'admin@demo.com'].includes(email)) {
      seedDemoAccount(email);
      return { error: null };
    }

    // Fallback to supabase signUp for real backend
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin }
      });
      if (data?.user && roleArg) {
        // try to write role/profile to DB (best-effort)
        await supabase.from('user_roles').insert({ user_id: data.user.id, role: roleArg });
      }
      return { error: error ?? null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signIn = async (email: string, _password: string) => {
    if (DEMO_ACCOUNT_ROLE[email]) {
      seedDemoAccount(email);
      return { error: null };
    }

    // Default to supabase sign in
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: _password });
      if (!error) {
        // supabase listener will update session/user
      }
      return { error: error ?? null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    // If demo user: clear local mock state
    if (user && user.id?.toString().startsWith('demo')) {
      setUser(null);
      setSession(null);
      setRole(null);
      setWalletBalance(0);
      setAiTokens(0);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setWalletBalance(0);
    setAiTokens(0);
  };

  // Virtual economy helpers
  const deductWallet = (amount: number) => {
    if (walletBalance >= amount) {
      setWalletBalance((b) => b - amount);
      return true;
    }
    return false;
  };

  const topUpWallet = (amount: number) => {
    setWalletBalance((b) => b + amount);
  };

  const useAiToken = () => {
    if (aiTokens > 0) {
      setAiTokens((t) => t - 1);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      role,
      loading,
      walletBalance,
      aiTokens,
      signUp,
      signIn,
      signOut,
      deductWallet,
      topUpWallet,
      useAiToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

