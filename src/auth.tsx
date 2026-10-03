import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export type UserRole = 'student' | 'lecturer';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsLogin: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithFacebook: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, role')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then((res) => {
      if (!mounted) return;
      const existingSession = res.data.session;
      setSession(existingSession);
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id).then((p) => {
          if (mounted) {
            setProfile(p);
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        (async () => {
          const p = await fetchProfile(newSession.user.id);
          setProfile(p);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (session?.user) {
      const p = await fetchProfile(session.user.id);
      setProfile(p);
    }
  };

  const signUp = async (email: string, password: string, displayName: string): Promise<{ error: string | null; needsLogin: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) {
      return { error: mapAuthError(error.message), needsLogin: false };
    }
    if (data.user && data.session) {
      const p = await fetchProfile(data.user.id);
      setProfile(p);
      return { error: null, needsLogin: false };
    }
    return { error: null, needsLogin: true };
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: mapAuthError(error.message) };
    }
    if (data.user) {
      const p = await fetchProfile(data.user.id);
      setProfile(p);
    }
    return { error: null };
  };

  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) return { error: mapAuthError(error.message) };
    return { error: null };
  };

  const signInWithFacebook = async (): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: window.location.origin },
    });
    if (error) return { error: mapAuthError(error.message) };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithFacebook,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function mapAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Email hoặc mật khẩu không đúng';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Email này đã được đăng ký';
  if (m.includes('email not confirmed')) return 'Email chưa được xác nhận';
  if (m.includes('password')) return 'Mật khẩu không đủ mạnh hoặc không hợp lệ';
  if (m.includes('provider is not enabled')) return 'Phương thức đăng nhập này chưa được cấu hình';
  if (m.includes('rate limit')) return 'Quá nhiều lần thử, vui lòng đợi một chút';
  return 'Đã xảy ra lỗi, vui lòng thử lại';
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
