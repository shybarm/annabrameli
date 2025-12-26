import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';

interface ACTScoreDialogProps {
  onScoreComplete: (score: number, interpretation: string) => void;
}

const questions = [
  {
    id: 1,
    text: 'באיזו מידה האסתמה שלך מנעה ממך לבצע פעילויות רגילות בעבודה, בבית הספר או בבית בארבעת השבועות האחרונים?',
    options: [
      { value: 1, label: 'כל הזמן' },
      { value: 2, label: 'רוב הזמן' },
      { value: 3, label: 'חלק מהזמן' },
      { value: 4, label: 'מעט מהזמן' },
      { value: 5, label: 'בכלל לא' },
    ],
  },
  {
    id: 2,
    text: 'בארבעת השבועות האחרונים, כמה פעמים חווית קוצר נשימה?',
    options: [
      { value: 1, label: 'יותר מפעם ביום' },
      { value: 2, label: 'פעם ביום' },
      { value: 3, label: '3-6 פעמים בשבוע' },
      { value: 4, label: 'פעם או פעמיים בשבוע' },
      { value: 5, label: 'בכלל לא' },
    ],
  },
  {
    id: 3,
    text: 'בארבעת השבועות האחרונים, כמה פעמים תסמיני האסתמה שלך (צפצופים, שיעול, קוצר נשימה, לחץ או כאב בחזה) העירו אותך בלילה או מוקדם מהרגיל בבוקר?',
    options: [
      { value: 1, label: '4 לילות או יותר בשבוע' },
      { value: 2, label: '2-3 לילות בשבוע' },
      { value: 3, label: 'פעם בשבוע' },
      { value: 4, label: 'פעם או פעמיים' },
      { value: 5, label: 'בכלל לא' },
    ],
  },
  {
    id: 4,
    text: 'בארבעת השבועות האחרונים, כמה פעמים השתמשת במשאף הצלה או בנבולייזר (כגון סלבוטמול)?',
    options: [
      { value: 1, label: '3 פעמים או יותר ביום' },
      { value: 2, label: '1-2 פעמים ביום' },
      { value: 3, label: '2-3 פעמים בשבוע' },
      { value: 4, label: 'פעם בשבוע או פחות' },
      { value: 5, label: 'בכלל לא' },
    ],
  },
  {
    id: 5,
    text: 'כיצד היית מדרג את השליטה באסתמה שלך בארבעת השבועות האחרונים?',
    options: [
      { value: 1, label: 'לא מבוקרת בכלל' },
      { value: 2, label: 'מבוקרת מעט' },
      { value: 3, label: 'מבוקרת במידה מסוימת' },
      { value: 4, label: 'מבוקרת היטב' },
      { value: 5, label: 'מבוקרת לחלוטין' },
    ],
  },
];

export function ACTScoreDialog({ onScoreComplete }: ACTScoreDialogProps) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
  const allAnswered = Object.keys(answers).length === questions.length;

  const getInterpretation = (score: number) => {
    if (score <= 15) return 'אסתמה לא מבוקרת - יש לשקול שינוי טיפול';
    if (score <= 19) return 'אסתמה מבוקרת חלקית - יש לשקול התאמת טיפול';
    return 'אסתמה מבוקרת היטב';
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
        <Button variant="outline" size="sm">ACT</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>שאלון בקרת אסתמה (ACT)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {questions.map((q) => (
            <Card key={q.id} className="p-4">
              <Label className="text-base font-medium mb-3 block">{q.id}. {q.text}</Label>
              <RadioGroup
                value={answers[q.id]?.toString()}
                onValueChange={(val) => setAnswers({ ...answers, [q.id]: parseInt(val) })}
                className="space-y-2"
              >
                {q.options.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.value.toString()} id={`q${q.id}-${opt.value}`} />
                    <Label htmlFor={`q${q.id}-${opt.value}`} className="cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </Card>
          ))}

          {allAnswered && (
            <Card className="p-4 bg-primary/10">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{totalScore}/25</p>
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
