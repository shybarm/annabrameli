import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

/**
 * Single source of truth for "new patient" definition:
 * - reviewed_at IS NULL
 * - NOT a staff member (user_id not in admin/doctor/secretary roles)
 * - NOT inactive status
 * 
 * Uses the same query key pattern as usePatients for consistent cache invalidation.
 */
export function useUnreviewedPatientsCount(clinicId?: string | null) {
  return useQuery({
    queryKey: ['patients', clinicId, 'unreviewed-count'],
    queryFn: async () => {
      // Get staff user IDs to exclude (same logic as usePatients)
      const { data: staffRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'doctor', 'secretary']);
      
      const staffUserIds = staffRoles?.map(r => r.user_id).filter(Boolean) || [];

      let query = supabase
        .from('patients')
        .select('id, user_id, status')
        .is('reviewed_at', null);
      
      // Filter by clinic if specified (same as usePatients)
      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Apply same filters as usePatients:
      // 1. Exclude inactive patients
      // 2. Exclude staff members
      const newPatients = (data || []).filter(p => {
        if (p.status === 'inactive') return false;
        return !p.user_id || !staffUserIds.includes(p.user_id);
      });
      
      return newPatients.length;
    },
    staleTime: 10000, // Consider data fresh for 10 seconds
  });
}

export function useMarkPatientReviewed() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from('patients')
        .update({ 
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id 
        })
        .eq('id', patientId)
        .is('reviewed_at', null);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all patients queries (includes unreviewed-count since it uses same base key)
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({ title: 'המטופל סומן כמתוכנן' });
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });
}

export function useIsPatientUnreviewed(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient-unreviewed', patientId],
    queryFn: async () => {
      if (!patientId) return false;
      
      const { data, error } = await supabase
        .from('patients')
        .select('reviewed_at')
        .eq('id', patientId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Patient is new/unreviewed if reviewed_at is null
      return !data?.reviewed_at;
    },
    enabled: !!patientId,
  });
}
