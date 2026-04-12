import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Shield, Brain, FileText, Link2, Target } from 'lucide-react';

interface CheckItem {
  id: string;
  text: string;
  category: string;
}

const CHECKLIST: CheckItem[] = [
  // Entity
  { id: 'e1', text: 'Physician schema עם sameAs מלא בכל דפי פרופיל', category: 'entity' },
  { id: 'e2', text: 'שם רופא אחיד (עברית + אנגלית) בכל דף רפואי', category: 'entity' },
  { id: 'e3', text: 'AuthorBadge עם קישור לביוגרפיה בכל מאמר', category: 'entity' },
  { id: 'e4', text: 'LocalBusiness schema בדף יצירת קשר', category: 'entity' },
  { id: 'e5', text: 'Organization schema עם לוגו ו-URL בדף הבית', category: 'entity' },
  // Answer Format
  { id: 'a1', text: 'TL;DR box (1-2 משפטים) בראש כל מאמר לווייני', category: 'answer' },
  { id: 'a2', text: 'FAQ answer-first: תשובה ישירה לפני הרחבה', category: 'answer' },
  { id: 'a3', text: 'Key Takeaway boxes בדפי עמוד', category: 'answer' },
  { id: 'a4', text: 'מטא-תיאור ב-150 תווים עם תשובה ישירה', category: 'answer' },
  { id: 'a5', text: 'H1 ייחודי שנותן מענה לכוונת החיפוש', category: 'answer' },
  // Structure
  { id: 's1', text: 'היררכיית כותרות (H1 > H2 > H3) ללא דילוגים', category: 'structure' },
  { id: 's2', text: 'תוכן עניינים מקושר בדפי עמוד ארוכים', category: 'structure' },
  { id: 's3', text: 'טבלאות השוואה במקום שרלוונטי', category: 'structure' },
  { id: 's4', text: 'רשימות (bullets/numbered) לפריטים מובנים', category: 'structure' },
  // Schema
  { id: 'sc1', text: 'MedicalWebPage schema בכל דף רפואי', category: 'schema' },
  { id: 'sc2', text: 'FAQPage schema בדפים עם שאלות נפוצות', category: 'schema' },
  { id: 'sc3', text: 'BreadcrumbList schema בכל דף', category: 'schema' },
  { id: 'sc4', text: 'MedicalProcedure schema בדפי שירותים', category: 'schema' },
  // Linking
  { id: 'l1', text: 'כל מאמר לווייני מקושר לדף עמוד', category: 'linking' },
  { id: 'l2', text: 'לפחות 2 קישורים פנימיים לפי הקשר', category: 'linking' },
  { id: 'l3', text: '3 מאמרים קשורים בתחתית כל מאמר', category: 'linking' },
  { id: 'l4', text: 'anchor text תיאורי (לא "לחצו כאן")', category: 'linking' },
  // Trust
  { id: 't1', text: 'disclaimer רפואי בתחתית כל מאמר', category: 'trust' },
  { id: 't2', text: 'תאריך פרסום ועדכון אחרון', category: 'trust' },
  { id: 't3', text: 'מקורות או הפניות למחקרים (כשרלוונטי)', category: 'trust' },
  { id: 't4', text: 'CTA מרוסן ומתאים להקשר רפואי', category: 'trust' },
];

const categoryLabels: Record<string, { label: string; icon: any }> = {
  entity: { label: 'ישות וסמכות', icon: Target },
  answer: { label: 'פורמט תשובה', icon: Brain },
  structure: { label: 'מבנה דף', icon: FileText },
  schema: { label: 'Structured Data', icon: Shield },
  linking: { label: 'קישור פנימי', icon: Link2 },
  trust: { label: 'אמון רפואי', icon: Shield },
};

export function GeoChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categories = [...new Set(CHECKLIST.map(c => c.category))];
  const totalChecked = checked.size;
  const total = CHECKLIST.length;
  const pct = Math.round((totalChecked / total) * 100);

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-4">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{totalChecked} מתוך {total} פריטים הושלמו</p>
            <div className="w-full bg-background rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="text-2xl font-bold text-primary">{pct}%</div>
        </CardContent>
      </Card>

      {/* Sections */}
      {categories.map(cat => {
        const items = CHECKLIST.filter(c => c.category === cat);
        const catChecked = items.filter(i => checked.has(i.id)).length;
        const meta = categoryLabels[cat];
        const Icon = meta.icon;

        return (
          <Card key={cat}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {meta.label}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">{catChecked}/{items.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map(item => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    checked.has(item.id) ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'hover:bg-muted/30'
                  }`}
                >
                  <Checkbox
                    checked={checked.has(item.id)}
                    onCheckedChange={() => toggle(item.id)}
                  />
                  <span className={`text-sm ${checked.has(item.id) ? 'line-through text-muted-foreground' : ''}`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
