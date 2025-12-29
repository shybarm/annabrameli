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
  clinic_id: string | null;
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
    clinic_id?: string | null;
    intake_completed_at?: string | null;
    reviewed_at?: string | null;
  };
  appointment_types?: AppointmentType;
}

export interface AppointmentInput {
  patient_id: string;
  appointment_type_id?: string;
  clinic_id?: string;
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
          patients!inner(id, first_name, last_name, phone, main_complaint, intake_completed_at, intake_token_id, clinic_id, reviewed_at),
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
      
      // If filtering by clinic, keep ONLY appointments that belong to this clinic
      // - appointment.clinic_id === clinicId (preferred)
      // - OR (legacy) appointment has no clinic_id but patient.clinic_id matches
      if (clinicId && data) {
        return data.filter((apt) => {
          if (apt.clinic_id === clinicId) return true;
          if (!apt.clinic_id && apt.patients?.clinic_id === clinicId) return true;
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

// Check if a time slot overlaps with existing appointments
export async function checkSlotAvailability(
  clinicId: string | undefined,
  scheduledAt: string,
  durationMinutes: number,
  excludeAppointmentId?: string
): Promise<{ available: boolean; conflictingAppointment?: Appointment }> {
  const startTime = new Date(scheduledAt);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  
  // Query for overlapping appointments in the same clinic
  let query = supabase
    .from('appointments')
    .select('*')
    .neq('status', 'cancelled');
  
  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
  
  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId);
  }
  
  // Get appointments on the same day
  const dayStart = new Date(startTime);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(startTime);
  dayEnd.setHours(23, 59, 59, 999);
  
  query = query
    .gte('scheduled_at', dayStart.toISOString())
    .lte('scheduled_at', dayEnd.toISOString());
  
  const { data: appointments, error } = await query;
  
  if (error) {
    console.error('Error checking slot availability:', error);
    throw error;
  }
  
  // Check for overlaps
  for (const apt of appointments || []) {
    const aptStart = new Date(apt.scheduled_at);
    const aptEnd = new Date(aptStart.getTime() + (apt.duration_minutes || 30) * 60 * 1000);
    
    // Check if there's an overlap: existing.start < requested.end AND existing.end > requested.start
    if (aptStart < endTime && aptEnd > startTime) {
      return { available: false, conflictingAppointment: apt as Appointment };
    }
  }
  
  return { available: true };
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: AppointmentInput) => {
      // Check slot availability before creating
      const { available } = await checkSlotAvailability(
        input.clinic_id,
        input.scheduled_at,
        input.duration_minutes || 30
      );
      
      if (!available) {
        throw new Error('SLOT_TAKEN');
      }
      
      const { data, error } = await supabase
        .from('appointments')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      
      // Post-create validation for race condition handling
      const { available: stillAvailable, conflictingAppointment } = await checkSlotAvailability(
        input.clinic_id,
        input.scheduled_at,
        input.duration_minutes || 30,
        data.id
      );
      
      if (!stillAvailable && conflictingAppointment) {
        // Race condition: another appointment was created at the same time
        // Keep the one created first (compare created_at timestamps)
        const thisCreatedAt = new Date(data.created_at);
        const otherCreatedAt = new Date(conflictingAppointment.created_at);
        
        if (thisCreatedAt > otherCreatedAt) {
          // This appointment was created later - cancel it
          await supabase
            .from('appointments')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              cancellation_reason: 'התור נתפס באותו רגע על ידי מטופל אחר',
            })
            .eq('id', data.id);
          
          throw new Error('SLOT_RACE_CONDITION');
        }
      }
      
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'תור נקבע בהצלחה' });
    },
    onError: (error: Error) => {
      if (error.message === 'SLOT_TAKEN') {
        toast({ 
          title: 'הזמן הזה כבר תפוס', 
          description: 'בחרו זמן אחר', 
          variant: 'destructive' 
        });
      } else if (error.message === 'SLOT_RACE_CONDITION') {
        toast({ 
          title: 'התור נתפס באותו רגע', 
          description: 'הזמנה בוטלה. אנא בחרו זמן אחר.', 
          variant: 'destructive' 
        });
      } else {
        toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
      }
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
