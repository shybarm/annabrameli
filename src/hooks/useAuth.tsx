import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient } from '@tanstack/react-query';

type AppRole = 'admin' | 'doctor' | 'secretary' | 'patient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  rolesLoading: boolean;
  roles: AppRole[];
  isStaff: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isPatient: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store a reference to the query client for signOut
let queryClientRef: QueryClient | null = null;

export function setQueryClientRef(client: QueryClient) {
  queryClientRef = client;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching with setTimeout
        if (session?.user) {
          setRolesLoading(true);
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setRoles([]);
          setRolesLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRoles(session.user.id);
      } else {
        setRolesLoading(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserRoles(userId: string) {
    try {
      setRolesLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching roles:', error);
        setRolesLoading(false);
        return;
      }
      
      const userRoles = data?.map(r => r.role as AppRole) || [];
      setRoles(userRoles);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setRolesLoading(false);
    }
  }

  const isStaff = roles.some(r => ['admin', 'doctor', 'secretary'].includes(r));
  const isAdmin = roles.includes('admin');
  const isDoctor = roles.includes('doctor');
  const isPatient = roles.includes('patient');

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = useCallback(async () => {
    // Clear all state first
    setUser(null);
    setSession(null);
    setRoles([]);
    
    // Clear React Query cache
    if (queryClientRef) {
      queryClientRef.clear();
    }
    
    // Then sign out from Supabase (ignore errors if session already expired)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Sign out completed');
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      rolesLoading,
      roles,
      isStaff,
      isAdmin,
      isDoctor,
      isPatient,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
