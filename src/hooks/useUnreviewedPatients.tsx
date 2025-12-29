import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// Count new patients (patients that haven't been reviewed/marked as scheduled)
export function useUnreviewedPatientsCount(clinicId?: string | null) {
  return useQuery({
    queryKey: ['unreviewed-patients-count', clinicId],
    queryFn: async () => {
      // Get staff user IDs to exclude
      const { data: staffRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'doctor', 'secretary']);
      
      const staffUserIds = staffRoles?.map(r => r.user_id).filter(Boolean) || [];

      let query = supabase
        .from('patients')
        .select('id, user_id', { count: 'exact', head: false })
        .is('reviewed_at', null);
      
      // Filter by clinic if specified
      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter out staff members
      const nonStaffPatients = (data || []).filter(p => 
        !p.user_id || !staffUserIds.includes(p.user_id)
      );
      
      return nonStaffPatients.length;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
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
      queryClient.invalidateQueries({ queryKey: ['unreviewed-patients-count'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-unreviewed'] });
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
