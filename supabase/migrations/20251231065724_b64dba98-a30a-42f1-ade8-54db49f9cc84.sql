-- Create internal staff messages table for 1:1 team communication
CREATE TABLE public.team_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to team_messages"
ON public.team_messages
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Staff can view messages they sent or received
CREATE POLICY "Staff can view own messages"
ON public.team_messages
FOR SELECT
USING (
  is_staff(auth.uid()) AND 
  (sender_id = auth.uid() OR recipient_id = auth.uid())
);

-- Staff can send messages to other staff
CREATE POLICY "Staff can send messages"
ON public.team_messages
FOR INSERT
WITH CHECK (
  is_staff(auth.uid()) AND 
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = recipient_id 
    AND role IN ('admin', 'doctor', 'secretary')
  )
);

-- Staff can update their own received messages (mark as read)
CREATE POLICY "Staff can mark messages as read"
ON public.team_messages
FOR UPDATE
USING (
  is_staff(auth.uid()) AND 
  recipient_id = auth.uid()
);

-- Staff can delete their own sent messages
CREATE POLICY "Staff can delete own sent messages"
ON public.team_messages
FOR DELETE
USING (
  is_staff(auth.uid()) AND 
  sender_id = auth.uid()
);

-- Add index for quick lookup
CREATE INDEX idx_team_messages_recipient ON public.team_messages(recipient_id, created_at DESC);
CREATE INDEX idx_team_messages_sender ON public.team_messages(sender_id, created_at DESC);
CREATE INDEX idx_team_messages_conversation ON public.team_messages(
  LEAST(sender_id, recipient_id), 
  GREATEST(sender_id, recipient_id), 
  created_at DESC
);