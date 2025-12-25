import { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { usePatientMessages, useMessageThread, useSendMessage, useMessagesRealtime } from '@/hooks/usePatientMessages';
import { usePatientRecord } from '@/hooks/usePatientPortal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Plus, ArrowRight, Mail, MailOpen } from 'lucide-react';

export default function PatientMessagesTab() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [replyContent, setReplyContent] = useState('');

  const { data: messages, isLoading } = usePatientMessages();
  const { data: thread } = useMessageThread(selectedThreadId);
  const { data: patient } = usePatientRecord();
  const sendMessage = useSendMessage();
  
  useMessagesRealtime();

  const handleSendNewMessage = async () => {
    if (!patient || !subject.trim() || !content.trim()) return;

    await sendMessage.mutateAsync({
      patientId: patient.id,
      subject: subject.trim(),
      content: content.trim(),
    });

    setSubject('');
    setContent('');
    setNewMessageOpen(false);
  };

  const handleSendReply = async () => {
    if (!patient || !replyContent.trim() || !selectedThreadId) return;

    await sendMessage.mutateAsync({
      patientId: patient.id,
      content: replyContent.trim(),
      parentId: selectedThreadId,
    });

    setReplyContent('');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  // Show thread view
  if (selectedThreadId && thread) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedThreadId(null)}>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">{thread[0]?.subject || 'שיחה'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {thread.map((msg) => {
                const isPatient = msg.sender_id === patient?.id || msg.sender_id === patient?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isPatient ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        isPatient
                          ? 'bg-muted text-foreground'
                          : 'bg-medical-600 text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isPatient ? 'text-muted-foreground' : 'text-medical-100'}`}>
                        {format(new Date(msg.created_at), 'd/M HH:mm', { locale: he })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-2 border-t">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="כתוב תגובה..."
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={handleSendReply}
              disabled={sendMessage.isPending || !replyContent.trim()}
              size="icon"
              className="h-auto"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Message Button */}
      <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 ml-2" />
            הודעה חדשה
          </Button>
        </DialogTrigger>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הודעה חדשה למרפאה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="נושא ההודעה"
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="תוכן ההודעה..."
              rows={4}
            />
            <Button
              onClick={handleSendNewMessage}
              disabled={sendMessage.isPending || !subject.trim() || !content.trim()}
              className="w-full"
            >
              {sendMessage.isPending ? 'שולח...' : 'שלח הודעה'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Messages List */}
      {!messages?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">אין הודעות</h3>
            <p className="text-muted-foreground">
              שלח הודעה למרפאה לתחילת שיחה.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Card
              key={msg.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedThreadId(msg.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-medical-100 rounded-lg mt-1">
                      {msg.is_read ? (
                        <MailOpen className="h-4 w-4 text-medical-600" />
                      ) : (
                        <Mail className="h-4 w-4 text-medical-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{msg.subject || 'ללא נושא'}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{msg.content}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), 'd בMMM', { locale: he })}
                    </p>
                    {!msg.is_read && (
                      <Badge variant="default" className="mt-1">חדש</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
