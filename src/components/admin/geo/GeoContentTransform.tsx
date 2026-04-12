import { useState } from 'react';
import { CONTENT_TRANSFORMS, type ContentTransform, type DraftSection } from '@/data/geo-content-transforms';
import { WORKSPACE_BRIEFS } from '@/data/geo-workspace-briefs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle, ArrowRight, CheckCircle2, ClipboardList,
  FileText, Microscope, PenLine, RefreshCw, Stethoscope,
  Target, Zap,
} from 'lucide-react';

function TransformCard({ transform }: { transform: ContentTransform; onClick: () => void }) {
  const brief = WORKSPACE_BRIEFS.find(b => b.id === transform.pageId);
  if (!brief) return null;
  const isNew = brief.currentGeoScore === 0;
  const blockers = transform.diagnosis.geoBlockers.length;
  const changes = transform.changeLog.length;

  return (
    <Card
      className="border-border/50 cursor-pointer hover:border-primary/40 transition-colors"
      onClick={arguments[0].onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="text-[10px]">{brief.pageType}</Badge>
              {isNew && <Badge variant="destructive" className="text-[10px]">דף חדש</Badge>}
            </div>
            <h3 className="text-sm font-bold text-foreground">{brief.suggestedTitle}</h3>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{brief.pagePath}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${brief.currentGeoScore >= 7 ? 'text-primary' : brief.currentGeoScore >= 5 ? 'text-amber-600' : brief.currentGeoScore === 0 ? 'text-muted-foreground' : 'text-destructive'}`}>
              {brief.currentGeoScore || '-'}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{brief.targetGeoScore}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" />{blockers} חוסמי GEO</span>
          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{transform.draft.length} סקציות</span>
          <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" />{changes} שינויים</span>
        </div>
      </CardContent>
    </Card>
  );
}

function DiagnosisTab({ transform }: { transform: ContentTransform }) {
  const d = transform.diagnosis;
  return (
    <div className="space-y-5">
      {/* Page Intent */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-primary" />כוונת הדף
        </h4>
        <p className="text-xs text-foreground leading-relaxed" dir="rtl">{d.pageIntent}</p>
      </div>
      {/* Strengths */}
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

      {/* Weaknesses */}
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

      {/* GEO Blockers */}
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

      {/* Parent experience */}
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

function StructureTab({ transform }: { transform: ContentTransform }) {
  const s = transform.recommendedStructure;
  return (
    <div className="space-y-5">
      {/* Meta */}
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

      {/* Section hierarchy */}
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

function DraftTab({ draft }: { draft: DraftSection[] }) {
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

function ChangeLogTab({ changeLog }: { changeLog: ContentTransform['changeLog'] }) {
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

function TransformDetail({ transform, open, onClose }: { transform: ContentTransform | null; open: boolean; onClose: () => void }) {
  if (!transform) return null;
  const brief = WORKSPACE_BRIEFS.find(b => b.id === transform.pageId);
  if (!brief) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-3">
            <Microscope className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="truncate">{brief.suggestedTitle}</p>
              <p className="text-xs font-mono text-muted-foreground font-normal">{brief.pagePath}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="diagnosis" className="mt-4" dir="rtl">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="diagnosis" className="text-xs">אבחון</TabsTrigger>
            <TabsTrigger value="structure" className="text-xs">מבנה GEO</TabsTrigger>
            <TabsTrigger value="draft" className="text-xs">טיוטה</TabsTrigger>
            <TabsTrigger value="changelog" className="text-xs">מה השתנה</TabsTrigger>
          </TabsList>

          <TabsContent value="diagnosis" className="mt-4">
            <DiagnosisTab transform={transform} />
          </TabsContent>

          <TabsContent value="structure" className="mt-4">
            <StructureTab transform={transform} />
          </TabsContent>

          <TabsContent value="draft" className="mt-4">
            <DraftTab draft={transform.draft} />
          </TabsContent>

          <TabsContent value="changelog" className="mt-4">
            <ChangeLogTab changeLog={transform.changeLog} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function GeoContentTransform() {
  const [selected, setSelected] = useState<ContentTransform | null>(null);

  const totalBlockers = CONTENT_TRANSFORMS.reduce((s, t) => s + t.diagnosis.geoBlockers.length, 0);
  const totalChanges = CONTENT_TRANSFORMS.reduce((s, t) => s + t.changeLog.length, 0);
  const newPages = CONTENT_TRANSFORMS.filter(t => {
    const b = WORKSPACE_BRIEFS.find(br => br.id === t.pageId);
    return b && b.currentGeoScore === 0;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-gradient-to-l from-purple-500/10 to-transparent border border-purple-500/20">
        <h2 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
          <Microscope className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Content Transformation - אבחון, מבנה, טיוטה ושינויים
        </h2>
        <p className="text-xs text-muted-foreground">
          לכל דף: אבחון מצב נוכחי, מבנה GEO-first מומלץ, טיוטה מותאמת לבהירות ואמון, ורשימת שינויים עם הסיבה לכל אחד.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <PenLine className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{CONTENT_TRANSFORMS.length}</span>
            <span className="text-xs text-muted-foreground">טיוטות מוכנות</span>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <Zap className="h-5 w-5 text-destructive" />
            <span className="text-2xl font-bold text-foreground">{totalBlockers}</span>
            <span className="text-xs text-muted-foreground">חוסמי GEO</span>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-2xl font-bold text-foreground">{totalChanges}</span>
            <span className="text-xs text-muted-foreground">שינויים מתועדים</span>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-2xl font-bold text-foreground">{newPages}</span>
            <span className="text-xs text-muted-foreground">דפים חדשים</span>
          </CardContent>
        </Card>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {CONTENT_TRANSFORMS.map(t => (
          <TransformCard key={t.pageId} transform={t} onClick={() => setSelected(t)} />
        ))}
      </div>

      <TransformDetail transform={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
