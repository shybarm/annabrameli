import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUnreviewedPatientsCount() {
  return useQuery({
    queryKey: ['unreviewed-patients-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .is('reviewed_at', null)
        .not('intake_completed_at', 'is', null);
      
      if (error) throw error;
      return count || 0;
    },
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
        .select('reviewed_at, intake_completed_at')
        .eq('id', patientId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Patient is unreviewed if they completed intake but haven't been reviewed
      return data?.intake_completed_at && !data?.reviewed_at;
    },
    enabled: !!patientId,
  });
}
