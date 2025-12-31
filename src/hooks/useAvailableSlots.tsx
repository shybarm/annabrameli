import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useEffect } from 'react';

interface AvailableSlot {
  slot_time: string;
  slot_datetime: string;
}

/**
 * Hook to fetch available time slots from the server
 * This is the SINGLE SOURCE OF TRUTH for slot availability
 * Used by both public booking and admin calendar
 */
export function useAvailableSlots(
  clinicId: string | undefined,
  date: Date | undefined,
  durationMinutes: number = 30
) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['available-slots', clinicId, date ? format(date, 'yyyy-MM-dd') : null, durationMinutes],
    queryFn: async () => {
      if (!clinicId || !date) return [];
      
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_clinic_id: clinicId,
        p_date: dateStr,
        p_duration_minutes: durationMinutes,
      });
      
      if (error) {
        console.error('Error fetching available slots:', error);
        throw error;
      }
      
      // Map to time strings for the dropdown
      return (data || []).map((slot: AvailableSlot) => slot.slot_time.substring(0, 5)); // "HH:MM"
    },
    enabled: !!clinicId && !!date,
    staleTime: 30000, // 30 seconds - slots can change quickly
    refetchOnWindowFocus: true,
  });
  
  // Set up real-time subscription to refetch when appointments change
  useEffect(() => {
    if (!clinicId) return;
    
    const channel = supabase
      .channel('slots-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `clinic_id=eq.${clinicId}`,
        },
        () => {
          // Invalidate slots query when any appointment changes
          queryClient.invalidateQueries({ 
            queryKey: ['available-slots', clinicId] 
          });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinicId, queryClient]);
  
  return {
    ...query,
    refetchSlots: () => query.refetch(),
  };
}

/**
 * Function to refresh available slots (for use after booking errors)
 */
export function useRefreshSlots() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['available-slots'] });
  };
}
