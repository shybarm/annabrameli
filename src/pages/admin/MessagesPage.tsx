import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useAdminMessages, 
  useAdminMessageThread, 
  useMarkMessageRead, 
  useSendAdminMessage,
  useAdminMessagesRealtime 
} from '@/hooks/useAdminMessages';
import { MessageSquare, Inbox, ArrowRight, Send, User } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: messages, isLoading } = useAdminMessages();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  const { data: thread } = useAdminMessageThread(selectedThreadId);
  const markAsRead = useMarkMessageRead();
  const sendMessage = useSendAdminMessage();
  
  // Enable realtime updates
  useAdminMessagesRealtime();

  const handleSelectThread = (messageId: string, isRead: boolean) => {
    setSelectedThreadId(messageId);
    if (!isRead) {
      markAsRead.mutate(messageId);
    }
  };

  const handleSendReply = () => {
    if (!replyContent.trim() || !thread?.[0]) return;
    
    sendMessage.mutate({
      patientId: thread[0].patient_id,
      content: replyContent,
      parentId: selectedThreadId || undefined,
    }, {
      onSuccess: () => setReplyContent(''),
    });
  };

  const selectedMessage = messages?.find(m => m.id === selectedThreadId);

  // Thread view
  if (selectedThreadId && thread) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedThreadId(null)}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {selectedMessage?.subject || 'הודעה ללא נושא'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {selectedMessage?.patient?.first_name} {selectedMessage?.patient?.last_name}
                <Button
                  variant="link"
                  size="sm"
                  className="mr-2 p-0 h-auto"
                  onClick={() => navigate(`/admin/patients/${selectedMessage?.patient_id}`)}
                >
                  לתיק המטופל →
                </Button>
              </p>
            </div>
          </div>

          {/* Messages */}
          <Card className="flex-1">
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-4">
                {thread.map((msg) => {
                  const isFromPatient = msg.patient?.user_id && msg.sender_id === msg.patient.user_id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isFromPatient ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          isFromPatient
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isFromPatient ? 'text-gray-500' : 'text-primary-foreground/70'}`}>
                          {format(new Date(msg.created_at), 'HH:mm, d בMMM', { locale: he })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            
            {/* Reply box */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="כתוב תשובה..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
                <Button 
                  onClick={handleSendReply} 
                  disabled={!replyContent.trim() || sendMessage.isPending}
                  className="self-end"
                >
                  <Send className="h-4 w-4 ml-1" />
                  שלח
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הודעות</h1>
          <p className="text-muted-foreground">תקשורת עם מטופלים</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((message) => {
              const isFromPatient = message.patient?.user_id && message.sender_id === message.patient.user_id;
              return (
                <Card 
                  key={message.id} 
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    !message.is_read && isFromPatient ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleSelectThread(message.id, message.is_read)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-medical-100 text-medical-700">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {message.patient?.first_name} {message.patient?.last_name}
                            </p>
                            {!message.is_read && isFromPatient && (
                              <Badge className="bg-primary text-primary-foreground text-xs">חדש</Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {message.subject || 'ללא נושא'}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {message.content}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(message.created_at), 'd/M HH:mm', { locale: he })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Inbox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">אין הודעות</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  הודעות מהמטופלים דרך הפורטל יופיעו כאן.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
