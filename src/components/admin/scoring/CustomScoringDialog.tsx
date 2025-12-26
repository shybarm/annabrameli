import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface CustomScoringDialogProps {
  onScoreComplete: (toolName: string, score: number, interpretation: string) => void;
}

export function CustomScoringDialog({ onScoreComplete }: CustomScoringDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('saved');
  const [toolName, setToolName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTool, setSelectedTool] = useState<CustomScoringTool | null>(null);
  const [score, setScore] = useState('');
  const [interpretation, setInterpretation] = useState('');
  
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['custom-scoring-tools'] });
      toast({ title: 'כלי המדידה נשמר בהצלחה' });
      setSelectedTool(data);
      setActiveTab('saved');
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
      setSelectedTool(null);
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

  const handleUseSelectedTool = () => {
    if (!selectedTool) {
      toast({ title: 'נא לבחור כלי מדידה', variant: 'destructive' });
      return;
    }
    if (!score.trim()) {
      toast({ title: 'נא להזין ציון', variant: 'destructive' });
      return;
    }

    const numericScore = parseFloat(score);
    if (isNaN(numericScore)) {
      toast({ title: 'ציון חייב להיות מספר', variant: 'destructive' });
      return;
    }

    onScoreComplete(
      selectedTool.name, 
      numericScore, 
      interpretation.trim() || selectedTool.description
    );
    
    // Reset form
    setSelectedTool(null);
    setScore('');
    setInterpretation('');
    setOpen(false);
  };

  // Refetch when dialog opens
  useEffect(() => {
    if (open) {
      refetch();
    } else {
      setSelectedTool(null);
      setScore('');
      setInterpretation('');
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
          <DialogTitle>כלי מדידה מותאם אישית</DialogTitle>
          <DialogDescription>
            בחר כלי מדידה קיים או צור כלי חדש לפי התמחותך
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saved">כלים שמורים</TabsTrigger>
            <TabsTrigger value="new">צור כלי חדש</TabsTrigger>
          </TabsList>
          
          {/* Saved Tools Tab */}
          <TabsContent value="saved" className="space-y-4 py-4">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">טוען...</div>
            ) : savedTools && savedTools.length > 0 ? (
              <>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {savedTools.map((tool) => (
                    <div
                      key={tool.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTool?.id === tool.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTool(tool)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{tool.name}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTool.mutate(tool.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                    </div>
                  ))}
                </div>

                {selectedTool && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="score">ציון *</Label>
                      <Input
                        id="score"
                        type="number"
                        step="0.1"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder="לדוגמה: 12.5"
                        className="text-right"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interpretation">פרשנות (אופציונלי)</Label>
                      <Textarea
                        id="interpretation"
                        value={interpretation}
                        onChange={(e) => setInterpretation(e.target.value)}
                        placeholder="פרשנות הציון..."
                        rows={2}
                        className="resize-none text-right"
                      />
                    </div>

                    <Button onClick={handleUseSelectedTool} className="w-full">
                      הוסף לסיכום
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>אין כלי מדידה שמורים</p>
                <p className="text-sm">עבור ללשונית "צור כלי חדש" כדי להוסיף כלי</p>
              </div>
            )}
          </TabsContent>

          {/* New Tool Tab */}
          <TabsContent value="new" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="toolName">שם כלי המדידה *</Label>
              <Input
                id="toolName"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                placeholder="לדוגמה: PASI, HAQ, VAS..."
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">תיאור כלי המדידה *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="תאר את כלי המדידה - מה הוא מודד, באיזה תחום משמש, טווח הציונים..."
                rows={4}
                className="resize-none text-right"
              />
              <p className="text-xs text-muted-foreground">
                תיאור מפורט יעזור לך ולצוות למצוא את הכלי המתאים בעתיד
              </p>
            </div>

            <Button 
              onClick={handleCreateTool} 
              className="w-full"
              disabled={createTool.isPending}
            >
              <Save className="h-4 w-4 ml-2" />
              {createTool.isPending ? 'שומר...' : 'שמור כלי מדידה'}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
