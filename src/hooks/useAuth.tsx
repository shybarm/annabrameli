import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient } from '@tanstack/react-query';

type AppRole = 'admin' | 'doctor' | 'secretary' | 'patient';

export interface UserPermissions {
  canViewPatients: boolean;
  canEditPatients: boolean;
  canViewAppointments: boolean;
  canEditAppointments: boolean;
  canViewBilling: boolean;
  canEditBilling: boolean;
  canViewDocuments: boolean;
  canEditDocuments: boolean;
  // New section-level permissions
  canViewExpenses: boolean;
  canEditExpenses: boolean;
  canViewDoctorDiary: boolean;
  canViewCancellations: boolean;
  canViewTeam: boolean;
  canEditTeam: boolean;
  canViewWorkHours: boolean;
  canEditWorkHours: boolean;
  canViewAuditLog: boolean;
  canViewSettings: boolean;
  canEditSettings: boolean;
}

const defaultPermissions: UserPermissions = {
  canViewPatients: false,
  canEditPatients: false,
  canViewAppointments: false,
  canEditAppointments: false,
  canViewBilling: false,
  canEditBilling: false,
  canViewDocuments: false,
  canEditDocuments: false,
  canViewExpenses: false,
  canEditExpenses: false,
  canViewDoctorDiary: false,
  canViewCancellations: false,
  canViewTeam: false,
  canEditTeam: false,
  canViewWorkHours: true, // All staff can view their own hours
  canEditWorkHours: false,
  canViewAuditLog: false,
  canViewSettings: false,
  canEditSettings: false,
};

// Admin gets full permissions
const adminPermissions: UserPermissions = {
  canViewPatients: true,
  canEditPatients: true,
  canViewAppointments: true,
  canEditAppointments: true,
  canViewBilling: true,
  canEditBilling: true,
  canViewDocuments: true,
  canEditDocuments: true,
  canViewExpenses: true,
  canEditExpenses: true,
  canViewDoctorDiary: true,
  canViewCancellations: true,
  canViewTeam: true,
  canEditTeam: true,
  canViewWorkHours: true,
  canEditWorkHours: true,
  canViewAuditLog: true,
  canViewSettings: true,
  canEditSettings: true,
};

// Doctor gets clinical permissions
const doctorPermissions: UserPermissions = {
  canViewPatients: true,
  canEditPatients: true,
  canViewAppointments: true,
  canEditAppointments: true,
  canViewBilling: true,
  canEditBilling: true,
  canViewDocuments: true,
  canEditDocuments: true,
  canViewExpenses: false,
  canEditExpenses: false,
  canViewDoctorDiary: true,
  canViewCancellations: true,
  canViewTeam: false,
  canEditTeam: false,
  canViewWorkHours: true,
  canEditWorkHours: false,
  canViewAuditLog: false,
  canViewSettings: false,
  canEditSettings: false,
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  rolesLoading: boolean;
  roles: AppRole[];
  permissions: UserPermissions;
  isStaff: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isPatient: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
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
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);

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
          setPermissions(defaultPermissions);
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
        .select('role, permissions')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching roles:', error);
        setRolesLoading(false);
        return;
      }
      
      const userRoles = data?.map(r => r.role as AppRole) || [];
      setRoles(userRoles);

      // Determine permissions based on role hierarchy
      if (userRoles.includes('admin')) {
        setPermissions(adminPermissions);
      } else if (userRoles.includes('doctor')) {
        setPermissions(doctorPermissions);
      } else {
        // Secretary and others use stored permissions merged with defaults
        const staffRole = data?.find(r => r.role === 'secretary');
        if (staffRole?.permissions && typeof staffRole.permissions === 'object') {
          const storedPerms = staffRole.permissions as Record<string, boolean>;
          setPermissions({
            canViewPatients: storedPerms.canViewPatients ?? false,
            canEditPatients: storedPerms.canEditPatients ?? false,
            canViewAppointments: storedPerms.canViewAppointments ?? false,
            canEditAppointments: storedPerms.canEditAppointments ?? false,
            canViewBilling: storedPerms.canViewBilling ?? false,
            canEditBilling: storedPerms.canEditBilling ?? false,
            canViewDocuments: storedPerms.canViewDocuments ?? false,
            canEditDocuments: storedPerms.canEditDocuments ?? false,
            canViewExpenses: storedPerms.canViewExpenses ?? false,
            canEditExpenses: storedPerms.canEditExpenses ?? false,
            canViewDoctorDiary: storedPerms.canViewDoctorDiary ?? false,
            canViewCancellations: storedPerms.canViewCancellations ?? true, // Secretaries can view cancellations by default
            canViewTeam: storedPerms.canViewTeam ?? false,
            canEditTeam: storedPerms.canEditTeam ?? false,
            canViewWorkHours: storedPerms.canViewWorkHours ?? true,
            canEditWorkHours: storedPerms.canEditWorkHours ?? false,
            canViewAuditLog: storedPerms.canViewAuditLog ?? false,
            canViewSettings: storedPerms.canViewSettings ?? false,
            canEditSettings: storedPerms.canEditSettings ?? false,
          });
        } else {
          setPermissions(defaultPermissions);
        }
      }
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

  const hasPermission = useCallback((permission: keyof UserPermissions): boolean => {
    // Admins and doctors always have all permissions
    if (isAdmin || isDoctor) return true;
    return permissions[permission] || false;
  }, [isAdmin, isDoctor, permissions]);

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
    setPermissions(defaultPermissions);
    
    // Clear localStorage keys used for routing/auth state
    localStorage.removeItem('clinic_onboarding_completed');
    localStorage.removeItem('patient_portal_onboarding_completed');
    
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
      permissions,
      isStaff,
      isAdmin,
      isDoctor,
      isPatient,
      hasPermission,
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
