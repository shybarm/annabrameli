import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const BUILT_IN_TOOLS = [
  { id: 'ACT', name: 'ACT', description: 'מבחן שליטה באסתמה' },
  { id: 'SCORAD', name: 'SCORAD', description: 'מדד חומרת אטופיק דרמטיטיס' },
  { id: 'SNOT-22', name: 'SNOT-22', description: 'שאלון תסמיני סינוסים' },
  { id: 'PUCAI', name: 'PUCAI', description: 'מדד פעילות קוליטיס כיבית בילדים' },
];

interface CustomTool {
  id: string;
  name: string;
  description: string;
}

export function ManageScoringToolsDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch hidden tools setting
  const { data: hiddenTools = [] } = useQuery({
    queryKey: ['hidden-scoring-tools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('value')
        .eq('key', 'hidden_scoring_tools')
        .maybeSingle();
      
      if (error) throw error;
      return (data?.value as string[]) || [];
    },
  });

  // Fetch custom tools
  const { data: customTools = [] } = useQuery({
    queryKey: ['custom-scoring-tools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_scoring_tools')
        .select('id, name, description')
        .order('name');
      if (error) throw error;
      return data as CustomTool[];
    },
  });

  // Mutation to update hidden tools
  const updateHiddenTools = useMutation({
    mutationFn: async (newHiddenTools: string[]) => {
      const { data: existing } = await supabase
        .from('clinic_settings')
        .select('id')
        .eq('key', 'hidden_scoring_tools')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('clinic_settings')
          .update({ value: newHiddenTools, updated_at: new Date().toISOString() })
          .eq('key', 'hidden_scoring_tools');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clinic_settings')
          .insert({ key: 'hidden_scoring_tools', value: newHiddenTools });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hidden-scoring-tools'] });
      toast.success('הגדרות נשמרו');
    },
    onError: () => {
      toast.error('שגיאה בשמירת ההגדרות');
    },
  });

  // Mutation to delete custom tool
  const deleteCustomTool = useMutation({
    mutationFn: async (toolId: string) => {
      const { error } = await supabase
        .from('custom_scoring_tools')
        .delete()
        .eq('id', toolId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-scoring-tools'] });
      toast.success('הכלי נמחק');
    },
    onError: () => {
      toast.error('שגיאה במחיקת הכלי');
    },
  });

  const toggleBuiltInTool = (toolId: string) => {
    const newHidden = hiddenTools.includes(toolId)
      ? hiddenTools.filter((id) => id !== toolId)
      : [...hiddenTools, toolId];
    updateHiddenTools.mutate(newHidden);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">ניהול כלי מדידה</DialogTitle>
        </DialogHeader>

        <div className="space-y-6" dir="rtl">
          {/* Built-in tools */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">כלים מובנים</h4>
            {BUILT_IN_TOOLS.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div>
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </div>
                <Switch
                  checked={!hiddenTools.includes(tool.id)}
                  onCheckedChange={() => toggleBuiltInTool(tool.id)}
                />
              </div>
            ))}
          </div>

          {/* Custom tools */}
          {customTools.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">כלים מותאמים אישית</h4>
              {customTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteCustomTool.mutate(tool.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
