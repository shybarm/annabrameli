import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface AppointmentType {
  id: string;
  name: string;
  name_he: string;
  description: string | null;
  duration_minutes: number;
  color: string;
  price: number | null;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  patient_id: string;
  appointment_type_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  internal_notes: string | null;
  visit_summary: string | null;
  treatment_plan: string | null;
  medications: string | null;
  visit_completed_at: string | null;
  visit_shared_whatsapp_at: string | null;
  visit_shared_email_at: string | null;
  reminder_sent: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    id_number?: string | null;
  };
  appointment_types?: AppointmentType;
}

export interface AppointmentInput {
  patient_id: string;
  appointment_type_id?: string;
  scheduled_at: string;
  duration_minutes?: number;
  notes?: string;
  internal_notes?: string;
}

export function useAppointmentTypes() {
  return useQuery({
    queryKey: ['appointment-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('is_active', true)
        .order('name_he');
      
      if (error) throw error;
      return data as AppointmentType[];
    },
  });
}

export function useAppointments(startDate?: string, endDate?: string, clinicId?: string | null) {
  return useQuery({
    queryKey: ['appointments', startDate, endDate, clinicId],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients!inner(id, first_name, last_name, phone, main_complaint, intake_completed_at, intake_token_id, clinic_id),
          appointment_types(*)
        `)
        .order('scheduled_at', { ascending: true });
      
      if (startDate) {
        query = query.gte('scheduled_at', startDate);
      }
      if (endDate) {
        query = query.lte('scheduled_at', endDate);
      }
      if (clinicId) {
        // Filter by appointment's clinic_id OR patient's clinic_id (using inner join filter)
        query = query.or(`clinic_id.eq.${clinicId},clinic_id.is.null`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // If filtering by clinic, also filter results where appointment has no clinic_id but patient does
      if (clinicId && data) {
        return data.filter(apt => {
          // Include if appointment is for this clinic
          if (apt.clinic_id === clinicId) return true;
          // Include if appointment has no clinic but patient belongs to this clinic
          if (!apt.clinic_id && apt.patients?.clinic_id === clinicId) return true;
          // Include if neither has a clinic_id (legacy data)
          if (!apt.clinic_id && !apt.patients?.clinic_id) return true;
          return false;
        }) as Appointment[];
      }
      
      return data as Appointment[];
    },
  });
}

export function useAppointmentsByDate(date: string) {
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;
  
  return useAppointments(startOfDay, endOfDay);
}

export function useTodaysAppointments() {
  const today = new Date().toISOString().split('T')[0];
  return useAppointmentsByDate(today);
}

export function usePatientAppointments(patientId: string | undefined) {
  return useQuery({
    queryKey: ['appointments', 'patient', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_types(*)
        `)
        .eq('patient_id', patientId)
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!patientId,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: AppointmentInput) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'תור נקבע בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<AppointmentInput> & { id: string; status?: string; cancelled_at?: string; cancellation_reason?: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'התור עודכן בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'התור בוטל' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });
}

// Real-time subscription hook
export function useAppointmentsRealtime() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
