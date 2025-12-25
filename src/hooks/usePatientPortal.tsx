import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface PatientRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  preferred_contact_method: string | null;
  preferred_contact_time: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

export interface PatientAppointment {
  id: string;
  scheduled_at: string;
  status: string | null;
  duration_minutes: number;
  notes: string | null;
  visit_summary: string | null;
  medications: string | null;
  treatment_plan: string | null;
  appointment_type: {
    name_he: string;
    color: string | null;
  } | null;
}

export interface PatientDocument {
  id: string;
  title: string;
  document_type: string;
  description: string | null;
  file_path: string;
  created_at: string;
  mime_type: string | null;
}

export function usePatientRecord() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['patient-record', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id, first_name, last_name, email, phone, date_of_birth, gender,
          address, city, preferred_contact_method, preferred_contact_time,
          emergency_contact_name, emergency_contact_phone
        `)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as PatientRecord | null;
    },
    enabled: !!user,
  });
}

export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<PatientRecord, 'id'>>) => {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!patient) throw new Error('Patient record not found');

      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', patient.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-record'] });
      toast({ title: 'הפרטים עודכנו בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון', description: error.message, variant: 'destructive' });
    },
  });
}

export function usePatientPortalAppointments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['patient-portal-appointments', user?.id],
    queryFn: async () => {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!patient) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          status,
          duration_minutes,
          notes,
          visit_summary,
          medications,
          treatment_plan,
          appointment_type:appointment_types(name_he, color)
        `)
        .eq('patient_id', patient.id)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      return data as PatientAppointment[];
    },
    enabled: !!user,
  });
}

export function usePatientPortalDocuments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['patient-portal-documents', user?.id],
    queryFn: async () => {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!patient) return [];

      const { data, error } = await supabase
        .from('patient_documents')
        .select('id, title, document_type, description, file_path, created_at, mime_type')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PatientDocument[];
    },
    enabled: !!user,
  });
}
