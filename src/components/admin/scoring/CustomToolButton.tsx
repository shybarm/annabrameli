import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface CustomToolButtonProps {
  name: string;
  description: string;
  onScoreComplete: (score: number, interpretation: string) => void;
}

export function CustomToolButton({ name, description, onScoreComplete }: CustomToolButtonProps) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState('');

  const handleSubmit = () => {
    if (!score.trim()) {
      toast({ title: 'נא להזין ציון', variant: 'destructive' });
      return;
    }

    const numericScore = parseFloat(score);
    if (isNaN(numericScore)) {
      toast({ title: 'ציון חייב להיות מספר', variant: 'destructive' });
      return;
    }

    onScoreComplete(numericScore, description);
    setScore('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          {name}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">{description}</p>
          
          <div className="space-y-2">
            <Label htmlFor="custom-score">ציון</Label>
            <Input
              id="custom-score"
              type="number"
              step="0.1"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="הזן ציון..."
              className="text-right"
              autoFocus
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            הוסף לסיכום
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
