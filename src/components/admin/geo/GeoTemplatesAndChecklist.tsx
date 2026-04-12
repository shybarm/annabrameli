import { useState } from 'react';
import { PAGE_TEMPLATES } from '@/data/geo-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout, List, FileCode, ClipboardCheck, Shield, Brain, FileText, Link2, Target, Stethoscope } from 'lucide-react';

interface CheckItem { id: string; text: string; category: string; }

const CHECKLIST: CheckItem[] = [
  // Entity & Authority - allergy-specific
  { id: 'e1', text: 'Physician schema עם sameAs: פנקס רופאים, LinkedIn, פורטלי בריאות', category: 'entity' },
  { id: 'e2', text: 'שם ד״ר אנה ברמלי אחיד (עברית + אנגלית) בכל דף רפואי', category: 'entity' },
  { id: 'e3', text: 'AuthorBadge עם "מומחית לאלרגיה ואימונולוגיה" + קישור לביו בכל מאמר', category: 'entity' },
  { id: 'e4', text: 'LocalBusiness schema בדף יצירת קשר עם כתובת הוד השרון + GeoCoordinates', category: 'entity' },
  { id: 'e5', text: 'medicalSpecialty: AllergyAndImmunology בכל MedicalWebPage schema', category: 'entity' },
  // Answer format - allergy Q&A
  { id: 'a1', text: 'TL;DR box בראש כל מאמר ידע (לדוגמה: "פריחה אחרי במבה לרוב אינה אלרגיה")', category: 'answer' },
  { id: 'a2', text: 'תשובות FAQ מתחילות ב-1 משפט ישיר לפני הרחבה (answer-first)', category: 'answer' },
  { id: 'a3', text: 'Key Takeaway boxes במדריכים מקיפים (pillar guides)', category: 'answer' },
  { id: 'a4', text: 'meta-description ב-150 תווים עם תשובה ישירה + שם מומחה', category: 'answer' },
  { id: 'a5', text: 'H1 ייחודי שעונה על כוונת חיפוש ספציפית של הורה', category: 'answer' },
  // Structure
  { id: 's1', text: 'היררכיית כותרות H1 > H2 > H3 ללא דילוגים', category: 'structure' },
  { id: 's2', text: 'תוכן עניינים מקושר במדריכים מעל 1500 מילים', category: 'structure' },
  { id: 's3', text: 'טבלאות השוואה: בדיקת עור vs דם, פרטי vs ציבורי, אלרגיה vs רגישות', category: 'structure' },
  { id: 's4', text: 'רשימות סימני אזהרה (red flags) בכל מאמר תסמינים', category: 'structure' },
  // Schema - medical
  { id: 'sc1', text: 'MedicalWebPage schema בכל דף רפואי (author, reviewer, dateModified)', category: 'schema' },
  { id: 'sc2', text: 'FAQPage schema בכל דף עם שאלות נפוצות', category: 'schema' },
  { id: 'sc3', text: 'BreadcrumbList schema בכל דף', category: 'schema' },
  { id: 'sc4', text: 'MedicalProcedure schema בדפי שירות (בדיקת עור, אתגר מזון, ייעוץ)', category: 'schema' },
  // Internal linking - cluster-aware
  { id: 'l1', text: 'כל מאמר ידע מקושר לדף Pillar של האשכול שלו', category: 'linking' },
  { id: 'l2', text: 'לפחות 2 קישורים פנימיים לפי הקשר רפואי (לא "לחצו כאן")', category: 'linking' },
  { id: 'l3', text: '"מאמרים קשורים" (3 קישורים) בתחתית כל מאמר ידע', category: 'linking' },
  { id: 'l4', text: 'anchor text תיאורי: "בדיקת עור לאלרגיה" ולא "קרא עוד"', category: 'linking' },
  // Medical trust - allergy-specific
  { id: 't1', text: 'disclaimer רפואי: "אין להחליף ייעוץ רפואי מקצועי" בתחתית כל מאמר', category: 'trust' },
  { id: 't2', text: 'תאריך פרסום + "נבדק רפואית על ידי ד״ר ברמלי" + תאריך סקירה', category: 'trust' },
  { id: 't3', text: 'הפניות למחקרים (LEAP study, מדריכי AAP) כשרלוונטי', category: 'trust' },
  { id: 't4', text: 'CTA מרוסן: ייעוץ בוואטסאפ, לא pop-ups או לחץ מכירתי', category: 'trust' },
];

const categoryLabels: Record<string, { label: string; icon: typeof Target }> = {
  entity: { label: 'ישות וסמכות רפואית', icon: Target },
  answer: { label: 'פורמט תשובה', icon: Brain },
  structure: { label: 'מבנה דף', icon: FileText },
  schema: { label: 'Structured Data רפואי', icon: Stethoscope },
  linking: { label: 'קישור פנימי', icon: Link2 },
  trust: { label: 'אמון רפואי', icon: Shield },
};

export function GeoTemplatesAndChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const categories = [...new Set(CHECKLIST.map(c => c.category))];
  const totalChecked = checked.size;
  const total = CHECKLIST.length;
  const pct = Math.round((totalChecked / total) * 100);

  return (
    <Tabs defaultValue="templates" className="w-full">
      <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/30 p-1 rounded-xl">
        <TabsTrigger value="templates" className="text-xs rounded-lg gap-1">
          <Layout className="h-3 w-3" />תבניות דף
        </TabsTrigger>
        <TabsTrigger value="checklist" className="text-xs rounded-lg gap-1">
          <ClipboardCheck className="h-3 w-3" />רשימת בדיקה ({pct}%)
        </TabsTrigger>
      </TabsList>

      <TabsContent value="templates" className="mt-4 space-y-4">
        {PAGE_TEMPLATES.map(template => (
          <Card key={template.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Layout className="h-4 w-4 text-primary" />
                {template.nameHe}
                <span className="text-xs text-muted-foreground font-normal">({template.nameEn})</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <List className="h-3 w-3" />מבנה הדף
                </h4>
                <ol className="space-y-0.5">
                  {template.sections.map((section, i) => (
                    <li key={i} className="text-xs flex gap-2">
                      <span className="text-primary font-mono w-4">{i + 1}.</span>{section}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                  <FileCode className="h-2.5 w-2.5" />{template.schemaType}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">{template.answerFormat}</Badge>
              </div>
              <div className="text-[10px] text-muted-foreground">
                <span className="font-semibold">משמשת: </span>
                {template.usedBy.map((path, i) => (
                  <span key={i}>
                    <code className="bg-muted px-1 py-0.5 rounded">{path}</code>
                    {i < template.usedBy.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="checklist" className="mt-4 space-y-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{totalChecked} מתוך {total} פריטים הושלמו</p>
              <div className="w-full bg-background rounded-full h-2 mt-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-primary">{pct}%</div>
          </CardContent>
        </Card>

        {categories.map(cat => {
          const items = CHECKLIST.filter(c => c.category === cat);
          const catChecked = items.filter(i => checked.has(i.id)).length;
          const meta = categoryLabels[cat];
          const Icon = meta.icon;
          return (
            <Card key={cat}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-primary" />{meta.label}</CardTitle>
                  <Badge variant="secondary" className="text-xs">{catChecked}/{items.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {items.map(item => (
                  <label key={item.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      checked.has(item.id) ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'hover:bg-muted/30'
                    }`}>
                    <Checkbox checked={checked.has(item.id)} onCheckedChange={() => toggle(item.id)} />
                    <span className={`text-xs ${checked.has(item.id) ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span>
                  </label>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </TabsContent>
    </Tabs>
  );
}
