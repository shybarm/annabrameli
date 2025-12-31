import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  useTeamConversations, 
  useTeamChat, 
  useSendTeamMessage, 
  useMarkTeamMessagesRead,
  useUnreadTeamMessagesCount,
  useTeamMessagesRealtime 
} from '@/hooks/useTeamMessages';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, X, ChevronDown, Users } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function TeamChatWidget() {
  const { user, isStaff } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: conversations } = useTeamConversations();
  const { data: messages } = useTeamChat(selectedPartnerId);
  const { data: unreadCount } = useUnreadTeamMessagesCount();
  const sendMessage = useSendTeamMessage();
  const markRead = useMarkTeamMessagesRead();
  
  // Enable realtime updates
  useTeamMessagesRealtime();
  
  // Fetch all staff members for starting new conversations
  const { data: staffMembers } = useQuery({
    queryKey: ['staff-members-for-chat'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'doctor', 'secretary']);
      
      if (error) throw error;
      
      const userIds = roles?.map(r => r.user_id).filter(id => id !== user?.id) || [];
      if (userIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);
      
      return profiles?.map(p => ({
        ...p,
        role: roles?.find(r => r.user_id === p.user_id)?.role,
      })) || [];
    },
    enabled: isOpen && !!user?.id,
  });
  
  // Get partner profile
  const { data: partnerProfile } = useQuery({
    queryKey: ['partner-profile', selectedPartnerId],
    queryFn: async () => {
      if (!selectedPartnerId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', selectedPartnerId)
        .single();
      return data;
    },
    enabled: !!selectedPartnerId,
  });
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (selectedPartnerId && isOpen) {
      markRead.mutate(selectedPartnerId);
    }
  }, [selectedPartnerId, isOpen]);
  
  const handleSend = () => {
    if (!message.trim() || !selectedPartnerId) return;
    sendMessage.mutate({ recipientId: selectedPartnerId, content: message.trim() });
    setMessage('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  if (!isStaff) return null;
  
  const roleLabels: Record<string, string> = {
    admin: 'מנהל',
    doctor: 'רופא',
    secretary: 'מזכירה',
  };
  
  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 left-4 z-50 rounded-full w-14 h-14 shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          isOpen && "bg-muted hover:bg-muted/90 text-muted-foreground"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <Users className="h-6 w-6" />
            {unreadCount && unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </Badge>
            )}
          </>
        )}
      </Button>
      
      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 z-50 w-80 h-96 bg-background border rounded-lg shadow-xl flex flex-col" dir="rtl">
          {/* Header */}
          <div className="p-3 border-b bg-muted/50 rounded-t-lg">
            {selectedPartnerId ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedPartnerId(null)} className="p-1 h-auto">
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </Button>
                <span className="font-medium">
                  {partnerProfile?.first_name} {partnerProfile?.last_name}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">הודעות צוות</span>
              </div>
            )}
          </div>
          
          {/* Content */}
          {selectedPartnerId ? (
            // Chat view
            <>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "max-w-[80%] p-2 rounded-lg text-sm",
                        msg.sender_id === user?.id
                          ? "bg-primary text-primary-foreground mr-auto"
                          : "bg-muted ml-auto"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={cn(
                        "text-xs mt-1 opacity-70",
                        msg.sender_id === user?.id ? "text-left" : "text-right"
                      )}>
                        {format(new Date(msg.created_at), 'HH:mm', { locale: he })}
                      </p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Input */}
              <div className="p-2 border-t flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="הקלד הודעה..."
                  className="flex-1 text-sm"
                />
                <Button 
                  size="sm" 
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessage.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            // Conversation list view
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {/* Existing conversations */}
                {conversations?.map((conv) => (
                  <button
                    key={conv.partnerId}
                    onClick={() => setSelectedPartnerId(conv.partnerId)}
                    className="w-full p-2 rounded-lg hover:bg-muted text-right flex items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {conv.partner?.first_name} {conv.partner?.last_name}
                        </span>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                ))}
                
                {/* New conversation options */}
                {staffMembers?.filter(s => !conversations?.some(c => c.partnerId === s.user_id)).map((staff) => (
                  <button
                    key={staff.user_id}
                    onClick={() => setSelectedPartnerId(staff.user_id)}
                    className="w-full p-2 rounded-lg hover:bg-muted text-right flex items-center gap-2 opacity-70"
                  >
                    <div className="flex-1">
                      <span className="text-sm">
                        {staff.first_name} {staff.last_name}
                      </span>
                      <Badge variant="outline" className="mr-2 text-xs">
                        {roleLabels[staff.role || ''] || staff.role}
                      </Badge>
                    </div>
                  </button>
                ))}
                
                {(!conversations || conversations.length === 0) && (!staffMembers || staffMembers.length === 0) && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    אין חברי צוות זמינים
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </>
  );
}
