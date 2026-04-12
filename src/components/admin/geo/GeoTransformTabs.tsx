import { type ContentTransform, type DraftSection } from '@/data/geo-content-transforms';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle, CheckCircle2, ClipboardList,
  Stethoscope, Target, Zap,
} from 'lucide-react';

export function DiagnosisTab({ transform }: { transform: ContentTransform }) {
  const d = transform.diagnosis;
  return (
    <div className="space-y-5">
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-primary" />כוונת הדף
        </h4>
        <p className="text-xs text-foreground leading-relaxed" dir="rtl">{d.pageIntent}</p>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />מה עובד
        </h4>
        {d.strengths.map((s, i) => (
          <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
            <span className="text-emerald-600 mt-0.5">✓</span>
            <span className="text-foreground">{s}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />מה חלש
        </h4>
        {d.weaknesses.map((w, i) => (
          <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <span className="text-amber-600 mt-0.5">△</span>
            <span className="text-foreground">{w}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-destructive" />חוסמי GEO - למה AI לא יצטט את הדף
        </h4>
        {d.geoBlockers.map((b, i) => (
          <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-destructive/5 border border-destructive/20">
            <span className="text-destructive mt-0.5">✗</span>
            <span className="text-foreground">{b}</span>
          </div>
        ))}
      </div>
      <Separator />
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-primary" />חוויית ההורה
        </h4>
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-foreground leading-relaxed" dir="rtl">{d.parentExperience}</p>
        </div>
      </div>
    </div>
  );
}

export function StructureTab({ transform }: { transform: ContentTransform }) {
  const s = transform.recommendedStructure;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">אורך מומלץ</p>
          <p className="text-sm font-bold text-foreground">{s.wordCountTarget}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">טון</p>
          <p className="text-xs text-foreground">{s.tone}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">Schema Types</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {s.schemaTypes.map(st => (
              <Badge key={st} variant="secondary" className="text-[9px]">{st}</Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />מבנה דף מומלץ
        </h4>
        {s.sections.map((sec, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
            <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold">
              {sec.tag}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{sec.heading}</p>
              <p className="text-[11px] text-muted-foreground">{sec.purpose}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DraftTab({ draft }: { draft: DraftSection[] }) {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
        <p className="text-xs text-foreground">
          <strong>שימו לב:</strong> זהו טיוטה מוצעת - לא טקסט סופי. התוכן מותאם ל-GEO (בהירות, אמון, extractability) וצריך עריכה רפואית ואישור ד״ר ברמלי לפני פרסום.
        </p>
      </div>
      {draft.map((section, i) => (
        <div key={i} className="space-y-1">
          {section.heading && (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                section.tag === 'h1'
                  ? 'text-primary bg-primary/10'
                  : section.tag === 'h2'
                    ? 'text-primary/80 bg-primary/5'
                    : 'text-muted-foreground bg-muted'
              }`}>
                {section.tag.toUpperCase()}
              </span>
              <h3 className={`font-bold text-foreground ${section.tag === 'h1' ? 'text-base' : 'text-sm'}`}>
                {section.heading}
              </h3>
            </div>
          )}
          {section.content && (
            <div className="p-4 rounded-lg bg-card border border-border/50 text-sm text-foreground leading-relaxed whitespace-pre-wrap" dir="rtl">
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ChangeLogTab({ changeLog }: { changeLog: ContentTransform['changeLog'] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">כל שינוי + הסיבה שלו. ממוקד ב-GEO impact.</p>
      {changeLog.map((item, i) => (
        <div key={i} className="p-4 rounded-lg bg-card border border-border/50 space-y-2">
          <Badge variant="outline" className="text-[10px]">{item.area}</Badge>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
              <p className="text-[10px] font-semibold text-destructive mb-1">לפני</p>
              <p className="text-foreground">{item.before}</p>
            </div>
            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">אחרי</p>
              <p className="text-foreground">{item.after}</p>
            </div>
          </div>
          <p className="text-[11px] text-primary flex items-center gap-1">
            <Target className="h-3 w-3" />
            {item.reason}
          </p>
        </div>
      ))}
    </div>
  );
}
