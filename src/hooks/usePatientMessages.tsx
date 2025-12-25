import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface Message {
  id: string;
  patient_id: string;
  sender_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  read_at: string | null;
  parent_id: string | null;
  created_at: string;
}

export function usePatientMessages() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['patient-messages', user?.id],
    queryFn: async () => {
      // First get patient record
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!patient) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('patient_id', patient.id)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user,
  });
}

export function useMessageThread(parentId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['message-thread', parentId],
    queryFn: async () => {
      if (!parentId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`id.eq.${parentId},parent_id.eq.${parentId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!parentId && !!user,
  });
}

export function useSendMessage() {
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
      return data as Message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-messages'] });
      queryClient.invalidateQueries({ queryKey: ['message-thread'] });
      toast({ title: 'ההודעה נשלחה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בשליחת ההודעה', description: error.message, variant: 'destructive' });
    },
  });
}

export function useMessagesRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('patient-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['patient-messages'] });
          queryClient.invalidateQueries({ queryKey: ['message-thread'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);
}
