import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PUCAIScoreDialogProps {
  onScoreComplete: (score: number, interpretation: string) => void;
}

const questions = [
  {
    id: 'abdominal_pain',
    text: 'כאב בטן',
    options: [
      { value: 0, label: 'אין כאב (0)' },
      { value: 5, label: 'ניתן להתעלם מהכאב (5)' },
      { value: 10, label: 'לא ניתן להתעלם מהכאב (10)' },
    ],
  },
  {
    id: 'rectal_bleeding',
    text: 'דימום רקטלי',
    options: [
      { value: 0, label: 'אין (0)' },
      { value: 10, label: 'כמות קטנה, פחות מ-50% מהיציאות (10)' },
      { value: 20, label: 'כמות קטנה עם רוב היציאות (20)' },
      { value: 30, label: 'כמות גדולה (>50% של תכולת היציאה) (30)' },
    ],
  },
  {
    id: 'stool_consistency',
    text: 'עקביות היציאות של רוב היציאות',
    options: [
      { value: 0, label: 'מגובשות (0)' },
      { value: 5, label: 'מגובשות חלקית (5)' },
      { value: 10, label: 'נוזליות לחלוטין (10)' },
    ],
  },
  {
    id: 'stool_frequency',
    text: 'מספר יציאות ב-24 שעות',
    options: [
      { value: 0, label: '0-2 (0)' },
      { value: 5, label: '3-5 (5)' },
      { value: 10, label: '6-8 (10)' },
      { value: 15, label: 'יותר מ-8 (15)' },
    ],
  },
  {
    id: 'nocturnal_stools',
    text: 'יציאות לילה (כל התעוררות שגורמת ליציאה)',
    options: [
      { value: 0, label: 'לא (0)' },
      { value: 10, label: 'כן (10)' },
    ],
  },
  {
    id: 'activity_level',
    text: 'רמת פעילות',
    options: [
      { value: 0, label: 'אין הגבלה בפעילות (0)' },
      { value: 5, label: 'הגבלה מזדמנת בפעילות (5)' },
      { value: 10, label: 'הגבלה משמעותית בפעילות (10)' },
    ],
  },
];

export function PUCAIScoreDialog({ onScoreComplete }: PUCAIScoreDialogProps) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
  const allAnswered = Object.keys(answers).length === questions.length;

  const getInterpretation = (score: number): string => {
    if (score < 10) return 'הפוגה (Remission)';
    if (score <= 34) return 'פעילות קלה (Mild)';
    if (score <= 64) return 'פעילות בינונית (Moderate)';
    return 'פעילות חמורה (Severe)';
  };

  const handleSubmit = () => {
    const interpretation = getInterpretation(totalScore);
    onScoreComplete(totalScore, interpretation);
    setOpen(false);
    setAnswers({});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          PUCAI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-right">
            PUCAI - מדד פעילות קוליטיס כיבית בילדים
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-right">
            Pediatric Ulcerative Colitis Activity Index
          </p>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6" dir="rtl">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <Label className="text-base font-medium">
                  {index + 1}. {question.text}
                </Label>
                <RadioGroup
                  value={answers[question.id]?.toString()}
                  onValueChange={(value) =>
                    setAnswers((prev) => ({ ...prev, [question.id]: parseInt(value) }))
                  }
                  className="space-y-2"
                >
                  {question.options.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={option.value.toString()}
                        id={`${question.id}-${option.value}`}
                      />
                      <Label
                        htmlFor={`${question.id}-${option.value}`}
                        className="font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
        </ScrollArea>

        {allAnswered && (
          <div className="mt-4 p-4 bg-primary/10 rounded-lg text-right" dir="rtl">
            <p className="font-bold text-lg">ציון כולל: {totalScore}/85</p>
            <p className="text-muted-foreground">{getInterpretation(totalScore)}</p>
            <p className="text-xs text-muted-foreground mt-2">
              &lt;10: הפוגה | 10-34: קל | 35-64: בינוני | ≥65: חמור
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={!allAnswered}>
            שמור ציון
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
