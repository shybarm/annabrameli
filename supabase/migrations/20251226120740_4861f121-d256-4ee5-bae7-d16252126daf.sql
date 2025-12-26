-- Create table for custom scoring tools
CREATE TABLE public.custom_scoring_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  specialty TEXT,
  created_by UUID,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_scoring_tools ENABLE ROW LEVEL SECURITY;

-- Staff can view all scoring tools
CREATE POLICY "Staff can view scoring tools"
ON public.custom_scoring_tools
FOR SELECT
USING (is_staff(auth.uid()));

-- Staff can create scoring tools
CREATE POLICY "Staff can create scoring tools"
ON public.custom_scoring_tools
FOR INSERT
WITH CHECK (is_staff(auth.uid()));

-- Staff can update their own tools or global tools if admin
CREATE POLICY "Staff can update own tools"
ON public.custom_scoring_tools
FOR UPDATE
USING (is_staff(auth.uid()) AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin')));

-- Staff can delete their own tools
CREATE POLICY "Staff can delete own tools"
ON public.custom_scoring_tools
FOR DELETE
USING (is_staff(auth.uid()) AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin')));

-- Add trigger for updated_at
CREATE TRIGGER update_custom_scoring_tools_updated_at
BEFORE UPDATE ON public.custom_scoring_tools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();