import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface TeamMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender?: {
    first_name: string | null;
    last_name: string | null;
  };
}

// Fetch conversations (unique chat partners)
export function useTeamConversations() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['team-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get all messages where user is sender or recipient
      const { data: messages, error } = await supabase
        .from('team_messages')
        .select('sender_id, recipient_id, created_at, content, is_read')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Group by conversation partner
      const conversationMap = new Map<string, {
        partnerId: string;
        lastMessage: string;
        lastMessageAt: string;
        unreadCount: number;
      }>();
      
      messages?.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            partnerId,
            lastMessage: msg.content,
            lastMessageAt: msg.created_at,
            unreadCount: 0,
          });
        }
        // Count unread messages from this partner
        if (msg.recipient_id === user.id && !msg.is_read) {
          const conv = conversationMap.get(partnerId)!;
          conv.unreadCount++;
        }
      });
      
      // Get partner profiles
      const partnerIds = Array.from(conversationMap.keys());
      if (partnerIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', partnerIds);
      
      return Array.from(conversationMap.values()).map(conv => ({
        ...conv,
        partner: profiles?.find(p => p.user_id === conv.partnerId),
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}

// Fetch messages in a conversation
export function useTeamChat(partnerId: string | null) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['team-chat', user?.id, partnerId],
    queryFn: async () => {
      if (!user?.id || !partnerId) return [];
      
      const { data, error } = await supabase
        .from('team_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as TeamMessage[];
    },
    enabled: !!user?.id && !!partnerId,
  });
}

// Send a message
export function useSendTeamMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('team_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-chat'] });
      queryClient.invalidateQueries({ queryKey: ['team-conversations'] });
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה בשליחת ההודעה', description: error.message, variant: 'destructive' });
    },
  });
}

// Mark messages as read
export function useMarkTeamMessagesRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (senderId: string) => {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('team_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('sender_id', senderId)
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['team-chat'] });
    },
  });
}

// Unread count for team messages
export function useUnreadTeamMessagesCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['team-messages-unread', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('team_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}

// Real-time subscription for team messages
export function useTeamMessagesRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel('team-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['team-chat'] });
          queryClient.invalidateQueries({ queryKey: ['team-conversations'] });
          queryClient.invalidateQueries({ queryKey: ['team-messages-unread'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
