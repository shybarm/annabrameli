import { ENTITY_SIGNALS } from '@/data/geo-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { User, Building, MapPin, Stethoscope, AlertTriangle, CheckCircle } from 'lucide-react';

const iconMap: Record<string, any> = {
  physician: User,
  organization: Building,
  location: MapPin,
  condition: Stethoscope,
  procedure: Stethoscope,
};

function scoreColor(s: number) {
  if (s >= 75) return 'text-emerald-600';
  if (s >= 55) return 'text-amber-600';
  return 'text-destructive';
}

export function GeoEntityLayer() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
        <h3 className="text-sm font-semibold mb-2">מהו שכבת הישויות?</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          מערכות AI מזהות ומצטטות אתרים על בסיס ישויות (Entities) — רופא, מרפאה, מיקום, התמחות.
          עקביות גבוהה בין כל הדפים מחזקת את האמון האלגוריתמי ומגדילה סיכוי לציטוט.
        </p>
      </div>

      <div className="grid gap-4">
        {ENTITY_SIGNALS.map(entity => {
          const Icon = iconMap[entity.type] || Stethoscope;
          return (
            <Card key={entity.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    {entity.entity}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">{entity.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">עקביות</span>
                    <span className={`text-sm font-bold ${scoreColor(entity.consistency)}`}>
                      {entity.consistency}%
                    </span>
                  </div>
                  <Progress value={entity.consistency} className="h-2" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    נוכח ב-{entity.pagesPresent} מתוך {entity.pagesTotal} דפים
                  </Badge>
                  {entity.consistency >= 75 ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                {entity.issues.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground">בעיות:</p>
                    {entity.issues.map((issue, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-amber-500">⚠</span> {issue}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Consistency Recommendations */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold mb-3">📋 המלצות לשיפור עקביות ישויות</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• ודאו שם הרופאה מופיע תמיד כ: <strong>ד״ר אנה ברמלי</strong> (עברית) / <strong>Dr. Anna Brameli</strong> (אנגלית)</li>
            <li>• הוסיפו AuthorBadge לכל דף תוכן רפואי</li>
            <li>• ודאו שהתמחות מנוסחת אחיד: <strong>אלרגיה ואימונולוגיה קלינית</strong></li>
            <li>• הוסיפו LocalBusiness schema לדף יצירת קשר</li>
            <li>• הרחיבו sameAs עם קישורים לפנקס רופאים, LinkedIn, פורטלי בריאות</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
