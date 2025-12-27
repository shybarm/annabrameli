import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface AdminMessage {
  id: string;
  patient_id: string;
  sender_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  read_at: string | null;
  parent_id: string | null;
  created_at: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    user_id: string | null;
  };
}

export interface UnreadCount {
  total: number;
  byPatient: Record<string, number>;
}

// Fetch all messages for admin view
export function useAdminMessages() {
  return useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          patient:patients(id, first_name, last_name, user_id)
        `)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminMessage[];
    },
  });
}

// Fetch unread message count (from patients to staff)
export function useUnreadMessageCount() {
  return useQuery({
    queryKey: ['unread-message-count'],
    queryFn: async () => {
      // Get messages from patients (sender_id matches patient's user_id)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          patient_id,
          sender_id,
          is_read,
          patient:patients!inner(id, user_id)
        `)
        .eq('is_read', false);

      if (error) throw error;

      // Filter to only messages sent by patients (sender_id = patient's user_id)
      const patientMessages = data?.filter(msg => {
        const patient = msg.patient as any;
        return patient?.user_id && msg.sender_id === patient.user_id;
      }) || [];

      const byPatient: Record<string, number> = {};
      patientMessages.forEach(msg => {
        byPatient[msg.patient_id] = (byPatient[msg.patient_id] || 0) + 1;
      });

      return {
        total: patientMessages.length,
        byPatient,
      } as UnreadCount;
    },
  });
}

// Fetch message thread for admin
export function useAdminMessageThread(parentId: string | null) {
  return useQuery({
    queryKey: ['admin-message-thread', parentId],
    queryFn: async () => {
      if (!parentId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          patient:patients(id, first_name, last_name, user_id)
        `)
        .or(`id.eq.${parentId},parent_id.eq.${parentId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as AdminMessage[];
    },
    enabled: !!parentId,
  });
}

// Mark message as read
export function useMarkMessageRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-message-thread'] });
      queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
    },
  });
}

// Send message from staff to patient
export function useSendAdminMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      patientId, 
      subject, 
      content, 
      parentId 
    }: { 
      patientId: string; 
      subject?: string; 
      content: string; 
      parentId?: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          patient_id: patientId,
          sender_id: user!.id,
          subject: subject || null,
          content,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AdminMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-message-thread'] });
      queryClient.invalidateQueries({ queryKey: ['patient-messages'] });
      toast({ title: 'ההודעה נשלחה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בשליחת ההודעה', description: error.message, variant: 'destructive' });
    },
  });
}

// Realtime updates for admin messages
export function useAdminMessagesRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('admin-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
          queryClient.invalidateQueries({ queryKey: ['admin-message-thread'] });
          queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// Get messages for a specific patient (for PatientDetail page)
export function usePatientMessagesAdmin(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient-messages-admin', patientId],
    queryFn: async () => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}
