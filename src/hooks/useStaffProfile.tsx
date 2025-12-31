import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface StaffProfile {
  first_name: string | null;
  last_name: string | null;
  full_name: string;
}

export function useStaffProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['staff-profile', user?.id],
    queryFn: async (): Promise<StaffProfile> => {
      if (!user?.id) {
        return { first_name: null, last_name: null, full_name: '' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const firstName = data?.first_name || '';
      const lastName = data?.last_name || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

      return {
        first_name: firstName || null,
        last_name: lastName || null,
        full_name: fullName || user.email?.split('@')[0] || ''
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
