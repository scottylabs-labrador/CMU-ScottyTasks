import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';

type AuthState = { user: User | null; loading: boolean; guest: boolean; enterGuest: () => void; logout: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!supabase);
  const [guest, setGuest] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setGuest(false);
      setLoading(false);
    });
    if (Platform.OS !== 'web' && AppState.currentState === 'active') void supabase.auth.startAutoRefresh();
    const appState = AppState.addEventListener('change', (state) => {
      if (Platform.OS === 'web') return;
      if (state === 'active') void supabase?.auth.startAutoRefresh();
      else void supabase?.auth.stopAutoRefresh();
    });
    return () => {
      subscription.unsubscribe();
      appState.remove();
      if (Platform.OS !== 'web') void supabase?.auth.stopAutoRefresh();
    };
  }, []);
  const logout = async () => {
    if (supabase && user) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setUser(null);
    setGuest(false);
  };
  return <AuthContext.Provider value={{ user, loading, guest, enterGuest: () => setGuest(true), logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth requires AuthProvider');
  return value;
}
