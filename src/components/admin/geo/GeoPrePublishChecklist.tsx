import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  category: 'content' | 'trust' | 'safety' | 'marketing';
  alwaysRequired: boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'direct_answer',
    label: 'תשובה ישירה בפתיחה',
    description: 'הפסקה הראשונה עונה על השאלה המרכזית של ההורה בלי הקדמות מיותרות',
    category: 'content',
    alwaysRequired: true,
  },
  {
    id: 'medical_responsibility',
    label: 'אחריות רפואית',
    description: 'התוכן מדויק קלינית, לא מבטיח תוצאות, וכולל הפניה לרופא כשצריך',
    category: 'safety',
    alwaysRequired: true,
  },
  {
    id: 'parent_readability',
    label: 'קריאות להורים',
    description: 'שפה ברורה, משפטים קצרים, הסבר למונחים רפואיים, טון רגוע ומרגיע',
    category: 'content',
    alwaysRequired: true,
  },
  {
    id: 'trust_signals',
    label: 'סימני אמון',
    description: 'הפניה למחקרים, פרוטוקולים קליניים, או ניסיון קליני ספציפי',
    category: 'trust',
    alwaysRequired: true,
  },
  {
    id: 'expert_identity',
    label: 'זהות המומחה גלויה',
    description: 'שם הרופאה, התמחות, וקרדיט ביקורת רפואית מופיעים בדף',
    category: 'trust',
    alwaysRequired: true,
  },
  {
    id: 'faq_included',
    label: 'FAQ רלוונטי',
    description: 'שאלות נפוצות של הורים עם תשובות קצרות וממוקדות, כולל Schema',
    category: 'content',
    alwaysRequired: false,
  },
  {
    id: 'internal_links',
    label: 'קישורים פנימיים',
    description: 'לפחות 2-3 קישורים לדפים רלוונטיים באתר לחיזוק סמכות נושאית',
    category: 'content',
    alwaysRequired: true,
  },
  {
    id: 'urgent_care',
    label: 'הנחיית מצב דחוף',
    description: 'סקציית "מתי לפנות לרופא" או "מתי לגשת למיון" אם הנושא מצריך',
    category: 'safety',
    alwaysRequired: false,
  },
  {
    id: 'service_cta',
    label: 'CTA לשירות',
    description: 'הנעה רכה לפעולה - קביעת תור, וואטסאפ, או התייעצות - ללא לחץ',
    category: 'marketing',
    alwaysRequired: false,
  },
  {
    id: 'no_exaggeration',
    label: 'ללא הגזמות',
    description: 'אין הבטחות כמו "ריפוי מלא", "מוביל בישראל", או "100% הצלחה"',
    category: 'safety',
    alwaysRequired: true,
  },
  {
    id: 'no_aggressive_tone',
    label: 'ללא טון שיווקי אגרסיבי',
    description: 'התוכן מלמד ומנחה, לא לוחץ. ללא דחיפות מלאכותית או הפחדה',
    category: 'marketing',
    alwaysRequired: true,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  content: 'תוכן',
  trust: 'אמון',
  safety: 'בטיחות רפואית',
  marketing: 'טון שיווקי',
};

interface PrePublishChecklistProps {
  checkedItems: Record<string, boolean>;
  onToggle: (itemId: string, checked: boolean) => void;
}

export function PrePublishChecklist({ checkedItems, onToggle }: PrePublishChecklistProps) {
  const totalRequired = CHECKLIST_ITEMS.filter(i => i.alwaysRequired).length;
  const checkedRequired = CHECKLIST_ITEMS.filter(i => i.alwaysRequired && checkedItems[i.id]).length;
  const totalChecked = CHECKLIST_ITEMS.filter(i => checkedItems[i.id]).length;
  const allRequiredDone = checkedRequired === totalRequired;

  const grouped = CHECKLIST_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Summary */}
      <div className={`p-3 rounded-lg border flex items-center justify-between ${
        allRequiredDone
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
          : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
      }`}>
        <div className="flex items-center gap-2">
          {allRequiredDone
            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            : <AlertCircle className="h-4 w-4 text-amber-600" />
          }
          <span className="text-xs font-semibold text-foreground">
            {allRequiredDone ? 'כל הדרישות החובה עברו' : `${totalRequired - checkedRequired} דרישות חובה חסרות`}
          </span>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {totalChecked}/{CHECKLIST_ITEMS.length} סומנו
        </Badge>
      </div>

      {/* Grouped checklist */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {CATEGORY_LABELS[category]}
            </h4>
          </div>
          {items.map(item => (
            <label
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                checkedItems[item.id]
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800'
                  : 'bg-card border-border/50 hover:border-primary/30'
              }`}
            >
              <Checkbox
                checked={!!checkedItems[item.id]}
                onCheckedChange={(checked) => onToggle(item.id, !!checked)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  {item.alwaysRequired && (
                    <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive">חובה</Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
