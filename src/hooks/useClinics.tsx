import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Clinic {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  working_hours: {
    sunday?: { open: string; close: string } | null;
    monday?: { open: string; close: string } | null;
    tuesday?: { open: string; close: string } | null;
    wednesday?: { open: string; close: string } | null;
    thursday?: { open: string; close: string } | null;
    friday?: { open: string; close: string } | null;
    saturday?: { open: string; close: string } | null;
  } | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  doctor_name: string | null;
  doctor_license: string | null;
  doctor_specialty: string | null;
}

// Public clinic info (limited fields for unauthenticated users)
export interface PublicClinic {
  id: string;
  name: string;
  city: string | null;
  working_hours: {
    sunday?: { open: string; close: string } | null;
    monday?: { open: string; close: string } | null;
    tuesday?: { open: string; close: string } | null;
    wednesday?: { open: string; close: string } | null;
    thursday?: { open: string; close: string } | null;
    friday?: { open: string; close: string } | null;
    saturday?: { open: string; close: string } | null;
  } | null;
  is_active: boolean;
}

// Hook for authenticated staff to get full clinic details
export function useClinics() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['clinics', user?.id],
    queryFn: async () => {
      // If authenticated, try to get full details
      if (user) {
        const { data, error } = await supabase
          .from('clinics')
          .select('*')
          .eq('is_active', true)
          .order('name');
        
        if (!error && data) {
          return data as Clinic[];
        }
      }
      
      // Fall back to public function for limited data
      const { data, error } = await supabase.rpc('get_public_clinics');
      if (error) throw error;
      return (data || []) as PublicClinic[] as Clinic[];
    },
  });
}

// Hook for public/guest access - only returns safe fields
export function usePublicClinics() {
  return useQuery({
    queryKey: ['public-clinics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_clinics');
      if (error) throw error;
      return (data || []) as PublicClinic[];
    },
  });
}

export function useClinic(id: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['clinic', id, user?.id],
    queryFn: async () => {
      if (!id) return null;
      
      // If authenticated, try to get full details
      if (user) {
        const { data, error } = await supabase
          .from('clinics')
          .select('*')
          .eq('id', id)
          .single();
        
        if (!error && data) {
          return data as Clinic;
        }
      }
      
      // Fall back to public function
      const { data, error } = await supabase.rpc('get_public_clinic', { clinic_id: id });
      if (error) throw error;
      return data?.[0] as PublicClinic as Clinic || null;
    },
    enabled: !!id,
  });
}

export function useCreateClinic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clinic: { name: string; address?: string; city?: string; phone?: string; email?: string }) => {
      const { data, error } = await supabase
        .from('clinics')
        .insert({
          name: clinic.name,
          address: clinic.address || null,
          city: clinic.city || null,
          phone: clinic.phone || null,
          email: clinic.email || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      toast({ title: 'המרפאה נוספה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בהוספת המרפאה', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateClinic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Clinic>) => {
      const { data, error } = await supabase
        .from('clinics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      queryClient.invalidateQueries({ queryKey: ['clinic', data.id] });
      toast({ title: 'המרפאה עודכנה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון המרפאה', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteClinic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clinics')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      queryClient.invalidateQueries({ queryKey: ['clinic'] });
      toast({ title: 'המרפאה נמחקה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה במחיקת המרפאה', description: error.message, variant: 'destructive' });
    },
  });
}

// Get working hours for a specific day
export function getClinicHoursForDay(clinic: Clinic | null, date: Date): { open: string; close: string } | null {
  if (!clinic?.working_hours) return null;
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[date.getDay()] as keyof typeof clinic.working_hours;
  
  return clinic.working_hours[dayName] || null;
}

// Check if a time slot is within clinic hours
export function isTimeWithinClinicHours(clinic: Clinic | null, date: Date, time: string): boolean {
  const hours = getClinicHoursForDay(clinic, date);
  if (!hours) return false;
  
  return time >= hours.open && time < hours.close;
}

// Generate available time slots based on clinic hours
export function getAvailableTimeSlots(clinic: Clinic | null, date: Date, interval: number = 30): string[] {
  const hours = getClinicHoursForDay(clinic, date);
  if (!hours) return [];
  
  const slots: string[] = [];
  const [openHour, openMin] = hours.open.split(':').map(Number);
  const [closeHour, closeMin] = hours.close.split(':').map(Number);
  
  let currentHour = openHour;
  let currentMin = openMin;
  
  while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
    const time = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push(time);
    
    currentMin += interval;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }
  
  return slots;
}
