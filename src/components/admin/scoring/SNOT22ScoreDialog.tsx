import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface SNOT22ScoreDialogProps {
  onScoreComplete: (score: number, interpretation: string) => void;
}

const questions = [
  'צורך לנקות את האף',
  'התעטשות',
  'נזלת',
  'שיעול',
  'טפטוף אחורי',
  'הפרשה אפית סמיכה',
  'אוזניים סתומות',
  'סחרחורת',
  'כאב אוזניים',
  'כאב/לחץ פנים',
  'ירידה בחוש הריח/טעם',
  'קושי להירדם',
  'התעוררות בלילה',
  'חוסר שינה טובה',
  'התעוררות עייפה',
  'עייפות',
  'ירידה בפרודוקטיביות',
  'ירידה בריכוז',
  'תסכול/חוסר שקט/עצבנות',
  'עצב',
  'מבוכה',
  'קשיי טעם/ריח',
];

const severityOptions = [
  { value: 0, label: 'אין בעיה' },
  { value: 1, label: 'בעיה קלה מאוד' },
  { value: 2, label: 'בעיה קלה' },
  { value: 3, label: 'בעיה בינונית' },
  { value: 4, label: 'בעיה קשה' },
  { value: 5, label: 'בעיה קשה מאוד' },
];

export function SNOT22ScoreDialog({ onScoreComplete }: SNOT22ScoreDialogProps) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [importantItems, setImportantItems] = useState<number[]>([]);

  const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
  const allAnswered = Object.keys(answers).length === questions.length;

  const getInterpretation = (score: number) => {
    if (score <= 7) return 'תפקוד תקין';
    if (score <= 20) return 'פגיעה קלה';
    if (score <= 50) return 'פגיעה בינונית';
    return 'פגיעה קשה באיכות החיים';
  };

  const handleSubmit = () => {
    const interpretation = getInterpretation(totalScore);
    const importantItemsText = importantItems.length > 0 
      ? `\nפריטים חשובים ביותר: ${importantItems.map(i => questions[i]).join(', ')}`
      : '';
    onScoreComplete(totalScore, interpretation + importantItemsText);
    setOpen(false);
    setAnswers({});
    setImportantItems([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">SNOT-22</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>SNOT-22 - שאלון לדלקת סינוסים כרונית</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            דרג כל תסמין לפי מידת הבעיה שהוא גורם לך. בסוף, סמן עד 5 פריטים שהכי חשובים לך.
          </p>

          {questions.map((q, idx) => (
            <Card key={idx} className="p-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id={`important-${idx}`}
                  checked={importantItems.includes(idx)}
                  onCheckedChange={(checked) => {
                    if (checked && importantItems.length < 5) {
                      setImportantItems([...importantItems, idx]);
                    } else if (!checked) {
                      setImportantItems(importantItems.filter(i => i !== idx));
                    }
                  }}
                  disabled={!importantItems.includes(idx) && importantItems.length >= 5}
                />
                <div className="flex-1">
                  <Label className="text-sm font-medium">{idx + 1}. {q}</Label>
                  <RadioGroup
                    value={answers[idx]?.toString()}
                    onValueChange={(val) => setAnswers({ ...answers, [idx]: parseInt(val) })}
                    className="flex flex-wrap gap-2 mt-2"
                  >
                    {severityOptions.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-1">
                        <RadioGroupItem value={opt.value.toString()} id={`q${idx}-${opt.value}`} className="h-3 w-3" />
                        <Label htmlFor={`q${idx}-${opt.value}`} className="cursor-pointer text-xs">
                          {opt.value}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </Card>
          ))}

          <div className="text-xs text-muted-foreground">
            0=אין בעיה, 1=קלה מאוד, 2=קלה, 3=בינונית, 4=קשה, 5=קשה מאוד
          </div>

          {allAnswered && (
            <Card className="p-4 bg-primary/10">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{totalScore}/110</p>
                <p className="text-sm mt-2">{getInterpretation(totalScore)}</p>
              </div>
            </Card>
          )}

          <Button 
            onClick={handleSubmit} 
            disabled={!allAnswered}
            className="w-full"
          >
            הוסף לרשומה
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
