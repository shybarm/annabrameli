import { useState } from 'react';
import {
  WORKSPACE_BRIEFS, type RewriteBrief,
} from '@/data/geo-workspace-briefs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle, ArrowRight, BookOpen, CheckCircle2, ClipboardList, ExternalLink,
  FileText, Hash, HelpCircle, Link2, List, MessageSquare, PenLine,
  Shield, Star, Target, TrendingUp,
} from 'lucide-react';

const priorityMeta = {
  critical: { label: 'קריטי', color: 'text-destructive', bg: 'bg-destructive/10' },
  high:     { label: 'גבוה', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950' },
  medium:   { label: 'בינוני', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950' },
  low:      { label: 'נמוך', color: 'text-muted-foreground', bg: 'bg-muted' },
};

function ScoreArrow({ from, to }: { from: number; to: number }) {
  const fromColor = from >= 7 ? 'text-primary' : from >= 5 ? 'text-amber-600' : 'text-destructive';
  const toColor = 'text-emerald-600 dark:text-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <span className={`text-2xl font-bold ${fromColor}`}>{from || '—'}</span>
      <ArrowRight className="h-5 w-5 text-muted-foreground" />
      <span className={`text-2xl font-bold ${toColor}`}>{to}</span>
      <span className="text-xs text-muted-foreground">/10</span>
    </div>
  );
}

function BriefCard({ brief, onClick }: { brief: RewriteBrief; onClick: () => void }) {
  const pm = priorityMeta[brief.rewritePriority];
  const isNew = brief.currentGeoScore === 0;
  return (
    <Card className="border-border/50 cursor-pointer hover:border-primary/40 transition-colors" onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${pm.color} ${pm.bg}`}>{pm.label}</span>
              <Badge variant="outline" className="text-[10px]">{brief.pageType}</Badge>
              {isNew && <Badge variant="destructive" className="text-[10px]">דף חדש</Badge>}
            </div>
            <h3 className="text-sm font-bold text-foreground">{brief.suggestedTitle}</h3>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{brief.pagePath}</p>
          </div>
          <ScoreArrow from={brief.currentGeoScore} to={brief.targetGeoScore} />
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{brief.issues.length} בעיות</span>
          <span className="flex items-center gap-1"><List className="h-3 w-3" />{brief.sectionOutline.length} סקציות</span>
          <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" />{brief.faqSuggestions.length} FAQ</span>
          <span className="flex items-center gap-1"><Link2 className="h-3 w-3" />{brief.internalLinkingSuggestions.length} קישורים</span>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionBlock({ title, icon: Icon, children }: { title: string; icon: typeof Target; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />{title}
      </h4>
      {children}
    </div>
  );
}

function BriefDetail({ brief, open, onClose }: { brief: RewriteBrief | null; open: boolean; onClose: () => void }) {
  if (!brief) return null;
  const pm = priorityMeta[brief.rewritePriority];
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-3">
            <ScoreArrow from={brief.currentGeoScore} to={brief.targetGeoScore} />
            <div className="flex-1 min-w-0">
              <p className="truncate">{brief.suggestedTitle}</p>
              <p className="text-xs font-mono text-muted-foreground font-normal">{brief.pagePath}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Priority & Rationale */}
          <div className={`p-3 rounded-lg border ${brief.rewritePriority === 'critical' ? 'border-destructive/30 bg-destructive/5' : 'border-border/50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${pm.color} ${pm.bg}`}>{pm.label}</span>
              <span className="text-xs font-semibold text-foreground">עדיפות שכתוב</span>
            </div>
            <p className="text-xs text-muted-foreground">{brief.rewriteRationale}</p>
          </div>

          {/* Issues */}
          <SectionBlock title={`בעיות נוכחיות (${brief.issues.length})`} icon={AlertTriangle}>
            <div className="space-y-1">
              {brief.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-destructive/5">
                  <span className="text-destructive mt-0.5">✗</span>
                  <span className="text-foreground">{issue}</span>
                </div>
              ))}
            </div>
          </SectionBlock>

          <Separator />

          {/* Suggested Title & Meta */}
          <SectionBlock title="כותרת ו-meta description מוצעים" icon={PenLine}>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-[10px] font-semibold text-primary mb-0.5">Title</p>
                <p className="text-sm font-medium text-foreground" dir="rtl">{brief.suggestedTitle}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{brief.suggestedTitle.length} תווים</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Meta Description</p>
                <p className="text-xs text-foreground" dir="rtl">{brief.suggestedMetaDescription}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{brief.suggestedMetaDescription.length} תווים</p>
              </div>
            </div>
          </SectionBlock>

          <Separator />

          {/* Answer-First Intro */}
          <SectionBlock title="פתיחת Answer-First" icon={MessageSquare}>
            <div className="p-4 rounded-lg border-r-4 border-primary bg-primary/5">
              <p className="text-sm text-foreground leading-relaxed" dir="rtl">{brief.answerFirstIntro}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">⬆ הפסקה הזו צריכה להופיע ראשונה בדף. AI חולץ את הפסקה הראשונה כתשובה.</p>
          </SectionBlock>

          <Separator />

          {/* Section Outline */}
          <SectionBlock title={`מבנה דף מוצע (${brief.sectionOutline.length} סקציות)`} icon={ClipboardList}>
            <div className="space-y-2">
              {brief.sectionOutline.map((section, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">H2</span>
                    <span className="text-sm font-semibold text-foreground">{section.heading}</span>
                    {section.schemaHint && (
                      <Badge variant="outline" className="text-[9px]">{section.schemaHint}</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-primary font-medium mb-0.5">מטרה: {section.purpose}</p>
                  <p className="text-xs text-muted-foreground">{section.contentGuidance}</p>
                </div>
              ))}
            </div>
          </SectionBlock>

          <Separator />

          {/* FAQ */}
          <SectionBlock title={`שאלות נפוצות מוצעות (${brief.faqSuggestions.length})`} icon={HelpCircle}>
            <div className="space-y-2">
              {brief.faqSuggestions.map((faq, i) => (
                <div key={i} className="p-3 rounded-lg bg-card border border-border/50">
                  <p className="text-sm font-semibold text-foreground mb-1">שאלה: {faq.question}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-1">תשובה: {faq.suggestedAnswer}</p>
                  <Badge variant="secondary" className="text-[9px]">{faq.intent}</Badge>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">כל השאלות צריכות להיות עטופות ב-FAQPage JSON-LD schema.</p>
          </SectionBlock>

          <Separator />

          {/* Internal Linking */}
          <SectionBlock title={`קישורים פנימיים (${brief.internalLinkingSuggestions.length})`} icon={Link2}>
            <div className="space-y-1.5">
              {brief.internalLinkingSuggestions.map((link, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/20">
                  <ExternalLink className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-primary">"{link.anchorText}"</span>
                    <span className="text-muted-foreground"> → </span>
                    <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{link.targetPath}</code>
                    <span className="text-muted-foreground block mt-0.5">מיקום: {link.context}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionBlock>

          <Separator />

          {/* Trust Signals */}
          <SectionBlock title={`שיפורי אמון (${brief.trustSignalImprovements.length})`} icon={Shield}>
            <div className="space-y-1">
              {brief.trustSignalImprovements.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </SectionBlock>

          {/* Structure Notes */}
          {brief.structureNotes && (
            <>
              <Separator />
              <SectionBlock title="הערות מבניות" icon={BookOpen}>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                  <p className="text-xs text-foreground">{brief.structureNotes}</p>
                </div>
              </SectionBlock>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GeoWorkspace() {
  const [selectedBrief, setSelectedBrief] = useState<RewriteBrief | null>(null);

  const totalIssues = WORKSPACE_BRIEFS.reduce((s, b) => s + b.issues.length, 0);
  const newPages = WORKSPACE_BRIEFS.filter(b => b.currentGeoScore === 0).length;
  const critical = WORKSPACE_BRIEFS.filter(b => b.rewritePriority === 'critical').length;
  const avgTarget = Math.round(WORKSPACE_BRIEFS.reduce((s, b) => s + b.targetGeoScore, 0) / WORKSPACE_BRIEFS.length * 10) / 10;

  const stats = [
    { label: 'דפים מנותחים', value: WORKSPACE_BRIEFS.length, icon: FileText, accent: 'text-primary' },
    { label: 'דפים חדשים', value: newPages, icon: Star, accent: 'text-purple-600 dark:text-purple-400' },
    { label: 'קריטיים', value: critical, icon: AlertTriangle, accent: 'text-destructive' },
    { label: 'סה"כ בעיות', value: totalIssues, icon: Hash, accent: 'text-amber-600 dark:text-amber-400' },
    { label: 'ציון יעד ממוצע', value: avgTarget, icon: TrendingUp, accent: 'text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-gradient-to-l from-primary/10 to-transparent border border-primary/20">
        <h2 className="text-base font-bold text-foreground mb-1">GEO Workspace — תוכניות שכתוב</h2>
        <p className="text-xs text-muted-foreground">
          לכל דף: ציון GEO נוכחי, בעיות מזוהות, כותרת ו-meta מוצעים, פתיחת answer-first, מבנה דף, FAQ, קישורים פנימיים ושיפורי אמון.
          לחץ על דף לצפייה בתוכנית המלאה.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <s.icon className={`h-5 w-5 ${s.accent}`} />
              <span className="text-2xl font-bold text-foreground">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Brief Cards */}
      <div className="space-y-3">
        {WORKSPACE_BRIEFS.map(brief => (
          <BriefCard key={brief.id} brief={brief} onClick={() => setSelectedBrief(brief)} />
        ))}
      </div>

      <BriefDetail brief={selectedBrief} open={!!selectedBrief} onClose={() => setSelectedBrief(null)} />
    </div>
  );
}
