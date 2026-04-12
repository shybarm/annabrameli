import { GEO_PAGES, GEO_WEIGHTS } from '@/data/geo-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Info } from 'lucide-react';

function scoreColor(s: number) {
  if (s >= 75) return 'text-emerald-600';
  if (s >= 55) return 'text-amber-600';
  return 'text-destructive';
}

function gradeLabel(s: number) {
  if (s >= 80) return { label: 'מעולה', color: 'bg-emerald-500' };
  if (s >= 65) return { label: 'טוב', color: 'bg-emerald-400' };
  if (s >= 50) return { label: 'בינוני', color: 'bg-amber-500' };
  return { label: 'חלש', color: 'bg-destructive' };
}

export function GeoScoringEngine() {
  const sorted = [...GEO_PAGES].sort((a, b) => a.geoScore - b.geoScore);

  const weights = [
    { key: 'entitySignal', label: 'אות ישות (Entity Signal)', weight: GEO_WEIGHTS.entitySignal },
    { key: 'answerReadiness', label: 'מוכנות תשובה (Answer Readiness)', weight: GEO_WEIGHTS.answerReadiness },
    { key: 'structureClarity', label: 'בהירות מבנית (Structure Clarity)', weight: GEO_WEIGHTS.structureClarity },
    { key: 'trustAuthority', label: 'אמון וסמכות (Trust & Authority)', weight: GEO_WEIGHTS.trustAuthority },
    { key: 'internalLinking', label: 'קישור פנימי (Internal Linking)', weight: GEO_WEIGHTS.internalLinking },
  ];

  return (
    <div className="space-y-6">
      {/* Weights Explanation */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            מודל ציון GEO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            ציון GEO מורכב מ-5 ממדים. כל ממד מייצג היבט שמערכות AI מעריכות בעת בחירת מקורות לציטוט.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {weights.map(w => (
              <div key={w.key} className="p-3 rounded-lg bg-background border border-border/50 text-center">
                <div className="text-xl font-bold text-primary">{Math.round(w.weight * 100)}%</div>
                <p className="text-xs text-muted-foreground mt-1">{w.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dimension Explanations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            פירוט ממדים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="font-semibold text-foreground">אות ישות</p>
            <p>האם הדף מקושר לישות מזוהה (רופא, מרפאה, מיקום)? האם יש schema מתאים?</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="font-semibold text-foreground">מוכנות תשובה</p>
            <p>האם הדף כולל פסקת תשובה ישירה ב-50 המילים הראשונות? האם ניתן לצטט אותו?</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="font-semibold text-foreground">בהירות מבנית</p>
            <p>שימוש נכון ב-H1/H2/H3, רשימות, טבלאות, וחלוקה לוגית לסעיפים.</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="font-semibold text-foreground">אמון וסמכות</p>
            <p>ייחוס מחבר, הסמכות רפואיות, מקורות חיצוניים, disclaimer רפואי.</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="font-semibold text-foreground">קישור פנימי</p>
            <p>קישורים לדפי עמוד, מאמרים קשורים, וניווט בתוך האשכול הנושאי.</p>
          </div>
        </CardContent>
      </Card>

      {/* Full Score Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">ציוני GEO — כל הדפים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-right py-2 pr-2">דף</th>
                  <th className="text-center py-2 w-16">GEO</th>
                  <th className="text-center py-2 w-14">ישות</th>
                  <th className="text-center py-2 w-14">תשובה</th>
                  <th className="text-center py-2 w-14">מבנה</th>
                  <th className="text-center py-2 w-14">אמון</th>
                  <th className="text-center py-2 w-16">דירוג</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(page => {
                  const grade = gradeLabel(page.geoScore);
                  return (
                    <tr key={page.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="py-2.5 pr-2">
                        <p className="font-medium text-xs truncate max-w-[200px]">{page.titleHe}</p>
                      </td>
                      <td className={`text-center font-bold ${scoreColor(page.geoScore)}`}>{page.geoScore}</td>
                      <td className="text-center text-xs">{page.entitySignalScore}</td>
                      <td className="text-center text-xs">{page.answerReadiness}</td>
                      <td className="text-center text-xs">{page.structureScore}</td>
                      <td className="text-center text-xs">{page.trustScore}</td>
                      <td className="text-center">
                        <Badge className={`text-[10px] ${grade.color} text-white`}>{grade.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
