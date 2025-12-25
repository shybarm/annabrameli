import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ReferralSource {
  id: string;
  name: string;
  count: number;
  created_at: string;
}

export function useReferralSources() {
  return useQuery({
    queryKey: ['referral-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_sources')
        .select('*')
        .order('count', { ascending: false });
      if (error) throw error;
      return data as ReferralSource[];
    },
  });
}

export function useReferralStats() {
  return useQuery({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      // Get referral source counts from patients table
      const { data: patients, error } = await supabase
        .from('patients')
        .select('referral_source');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      patients.forEach(p => {
        if (p.referral_source) {
          counts[p.referral_source] = (counts[p.referral_source] || 0) + 1;
        }
      });
      
      return counts;
    },
  });
}

export function useAddReferralSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('referral_sources')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-sources'] });
      toast({ title: 'מקור ההפניה נוסף בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בהוספת מקור ההפניה', description: error.message, variant: 'destructive' });
    },
  });
}
