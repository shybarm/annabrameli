import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface SCORADScoreDialogProps {
  onScoreComplete: (score: number, interpretation: string) => void;
}

const bodyAreas = [
  { id: 'head', label: 'ראש וצוואר', percent: 9 },
  { id: 'trunk_front', label: 'חזה ובטן', percent: 18 },
  { id: 'trunk_back', label: 'גב', percent: 18 },
  { id: 'arms', label: 'זרועות', percent: 18 },
  { id: 'hands', label: 'כפות ידיים', percent: 4 },
  { id: 'legs', label: 'רגליים', percent: 36 },
  { id: 'feet', label: 'כפות רגליים', percent: 2 },
  { id: 'genitals', label: 'איברי מין', percent: 1 },
];

export function SCORADScoreDialog({ onScoreComplete }: SCORADScoreDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [erythema, setErythema] = useState(0);
  const [edema, setEdema] = useState(0);
  const [oozing, setOozing] = useState(0);
  const [excoriation, setExcoriation] = useState(0);
  const [lichenification, setLichenification] = useState(0);
  const [dryness, setDryness] = useState(0);
  const [pruritus, setPruritus] = useState(0);
  const [sleepLoss, setSleepLoss] = useState(0);

  // Calculate A (extent) - percentage of affected body surface
  const extentA = selectedAreas.reduce((sum, areaId) => {
    const area = bodyAreas.find(a => a.id === areaId);
    return sum + (area?.percent || 0);
  }, 0);

  // Calculate B (intensity) - sum of intensity scores (0-3 each, max 18)
  const intensityB = erythema + edema + oozing + excoriation + lichenification + dryness;

  // Calculate C (subjective symptoms) - pruritus + sleep loss (0-10 each, max 20)
  const subjectiveC = pruritus + sleepLoss;

  // SCORAD = A/5 + 7B/2 + C
  const totalScore = Math.round((extentA / 5) + (7 * intensityB / 2) + subjectiveC);

  const getInterpretation = (score: number) => {
    if (score < 25) return 'דרמטיטיס אטופית קלה';
    if (score < 50) return 'דרמטיטיס אטופית בינונית';
    return 'דרמטיטיס אטופית קשה';
  };

  const handleSubmit = () => {
    const interpretation = getInterpretation(totalScore);
    onScoreComplete(totalScore, interpretation);
    setOpen(false);
    // Reset
    setSelectedAreas([]);
    setErythema(0);
    setEdema(0);
    setOozing(0);
    setExcoriation(0);
    setLichenification(0);
    setDryness(0);
    setPruritus(0);
    setSleepLoss(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">SCORAD</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>SCORAD - הערכת חומרת דרמטיטיס אטופית</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* A - Extent */}
          <Card className="p-4">
            <Label className="text-base font-medium mb-3 block">A. היקף הפגיעה (אזורים מעורבים)</Label>
            <div className="grid grid-cols-2 gap-2">
              {bodyAreas.map((area) => (
                <div key={area.id} className="flex items-center gap-2">
                  <Checkbox
                    id={area.id}
                    checked={selectedAreas.includes(area.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAreas([...selectedAreas, area.id]);
                      } else {
                        setSelectedAreas(selectedAreas.filter(a => a !== area.id));
                      }
                    }}
                  />
                  <Label htmlFor={area.id} className="cursor-pointer text-sm">
                    {area.label} ({area.percent}%)
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">סה"כ: {extentA}%</p>
          </Card>

          {/* B - Intensity */}
          <Card className="p-4">
            <Label className="text-base font-medium mb-3 block">B. עוצמת הסימנים (0=אין, 1=קל, 2=בינוני, 3=קשה)</Label>
            <div className="space-y-4">
              {[
                { label: 'אודם (Erythema)', value: erythema, setter: setErythema },
                { label: 'בצקת/פפולות (Edema/Papules)', value: edema, setter: setEdema },
                { label: 'הפרשה/גלד (Oozing/Crusts)', value: oozing, setter: setOozing },
                { label: 'שריטות (Excoriation)', value: excoriation, setter: setExcoriation },
                { label: 'ליכניפיקציה (Lichenification)', value: lichenification, setter: setLichenification },
                { label: 'יובש (Dryness)', value: dryness, setter: setDryness },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-sm">{item.label}</Label>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                  <Slider
                    value={[item.value]}
                    onValueChange={(val) => item.setter(val[0])}
                    max={3}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">סה"כ B: {intensityB}/18</p>
          </Card>

          {/* C - Subjective */}
          <Card className="p-4">
            <Label className="text-base font-medium mb-3 block">C. תסמינים סובייקטיביים (0-10)</Label>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-sm">גירוד (Pruritus)</Label>
                  <span className="text-sm font-medium">{pruritus}</span>
                </div>
                <Slider
                  value={[pruritus]}
                  onValueChange={(val) => setPruritus(val[0])}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-sm">הפרעות שינה (Sleep Loss)</Label>
                  <span className="text-sm font-medium">{sleepLoss}</span>
                </div>
                <Slider
                  value={[sleepLoss]}
                  onValueChange={(val) => setSleepLoss(val[0])}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">סה"כ C: {subjectiveC}/20</p>
          </Card>

          {/* Result */}
          <Card className="p-4 bg-primary/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{totalScore}/103</p>
              <p className="text-sm mt-2">{getInterpretation(totalScore)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                A/5 ({Math.round(extentA/5)}) + 7B/2 ({Math.round(7*intensityB/2)}) + C ({subjectiveC})
              </p>
            </div>
          </Card>

          <Button onClick={handleSubmit} className="w-full">
            הוסף לרשומה
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
