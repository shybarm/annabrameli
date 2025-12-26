import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Save, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface CustomScoringTool {
  id: string;
  name: string;
  description: string;
  specialty: string | null;
  created_by: string | null;
  is_global: boolean;
}

export function CustomScoringDialog() {
  const [open, setOpen] = useState(false);
  const [toolName, setToolName] = useState('');
  const [description, setDescription] = useState('');
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch saved scoring tools
  const { data: savedTools, isLoading, refetch } = useQuery({
    queryKey: ['custom-scoring-tools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_scoring_tools')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as CustomScoringTool[];
    },
    refetchOnMount: true,
    staleTime: 0,
  });

  // Create new tool mutation
  const createTool = useMutation({
    mutationFn: async (tool: { name: string; description: string }) => {
      const { data, error } = await supabase
        .from('custom_scoring_tools')
        .insert({
          name: tool.name,
          description: tool.description,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-scoring-tools'] });
      toast({ title: 'כלי המדידה נוסף בהצלחה' });
      setToolName('');
      setDescription('');
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה בשמירת הכלי', description: error.message, variant: 'destructive' });
    },
  });

  // Delete tool mutation
  const deleteTool = useMutation({
    mutationFn: async (toolId: string) => {
      const { error } = await supabase
        .from('custom_scoring_tools')
        .delete()
        .eq('id', toolId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-scoring-tools'] });
      toast({ title: 'כלי המדידה נמחק' });
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה במחיקת הכלי', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreateTool = () => {
    if (!toolName.trim()) {
      toast({ title: 'נא להזין שם כלי המדידה', variant: 'destructive' });
      return;
    }
    if (!description.trim()) {
      toast({ title: 'נא להזין תיאור כלי המדידה', variant: 'destructive' });
      return;
    }
    createTool.mutate({ name: toolName.trim(), description: description.trim() });
  };

  // Refetch when dialog opens
  useEffect(() => {
    if (open) {
      refetch();
    } else {
      setToolName('');
      setDescription('');
    }
  }, [open, refetch]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1">
          <Plus className="h-3 w-3" />
          הוסף כלי מדידה
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>ניהול כלי מדידה</DialogTitle>
          <DialogDescription>
            צור כלי מדידה חדשים או מחק קיימים
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Create new tool form */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium text-sm">צור כלי חדש</h4>
            <div className="space-y-2">
              <Label htmlFor="toolName">שם הכלי</Label>
              <Input
                id="toolName"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                placeholder="לדוגמה: PASI, HAQ, VAS..."
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">תיאור</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="תיאור קצר של הכלי..."
                rows={2}
                className="resize-none text-right"
              />
            </div>

            <Button 
              onClick={handleCreateTool} 
              className="w-full"
              disabled={createTool.isPending}
            >
              <Save className="h-4 w-4 ml-2" />
              {createTool.isPending ? 'שומר...' : 'הוסף'}
            </Button>
          </div>

          {/* Saved tools list */}
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">טוען...</div>
          ) : savedTools && savedTools.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">כלים קיימים</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-3 border rounded-lg flex items-center justify-between bg-background"
                  >
                    <div>
                      <p className="font-medium text-sm">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteTool.mutate(tool.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-2">
              אין כלי מדידה שמורים
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
