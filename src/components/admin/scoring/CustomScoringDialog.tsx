import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomScoringDialogProps {
  onScoreComplete: (toolName: string, score: number, interpretation: string) => void;
}

export function CustomScoringDialog({ onScoreComplete }: CustomScoringDialogProps) {
  const [open, setOpen] = useState(false);
  const [toolName, setToolName] = useState('');
  const [score, setScore] = useState('');
  const [interpretation, setInterpretation] = useState('');

  const handleSubmit = () => {
    if (!toolName.trim()) {
      toast({ title: 'נא להזין שם כלי המדידה', variant: 'destructive' });
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
      toolName.trim(), 
      numericScore, 
      interpretation.trim() || 'ללא פרשנות'
    );
    
    // Reset form
    setToolName('');
    setScore('');
    setInterpretation('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1">
          <Plus className="h-3 w-3" />
          הוסף כלי מדידה
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוסף כלי מדידה מותאם אישית</DialogTitle>
          <DialogDescription>
            הוסף כלי מדידה לפי התמחותך. הציון והפרשנות יתווספו אוטומטית לסיכום הביקור.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="toolName">שם כלי המדידה *</Label>
            <Input
              id="toolName"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              placeholder="לדוגמה: PASI, HAQ, VAS..."
              className="text-right"
            />
            <p className="text-xs text-muted-foreground">
              הזן את שם כלי המדידה הרפואי המקובל בתחומך
            </p>
          </div>

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
            <Label htmlFor="interpretation">פרשנות / משמעות הציון</Label>
            <Textarea
              id="interpretation"
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              placeholder="לדוגמה: פעילות מחלה קלה, נדרש מעקב..."
              rows={2}
              className="resize-none text-right"
            />
            <p className="text-xs text-muted-foreground">
              הסבר קצר על משמעות הציון כדי שיהיה ברור בסיכום
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button onClick={handleSubmit}>
            הוסף לסיכום
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
