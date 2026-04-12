import { useState } from 'react';
import {
  AUTHORITY_CATEGORIES, PAGE_TRUST_ASSESSMENTS, EXTERNAL_OPPORTUNITIES,
  BRAND_FRAGMENTS, SCORECARD,
  type AuthorityCategory, type AuthoritySignal, type ScoreLevel,
  type PageTrustAssessment, type ExternalOpportunity, type BrandFragment,
} from '@/data/geo-sprint3-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Shield, Target, Eye, Globe, Fingerprint,
  CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronRight,
  ExternalLink, Bot,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────

const statusConfig: Record<ScoreLevel, { label: string; color: string; icon: typeof CheckCircle }> = {
  strong: { label: 'חזק', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300', icon: CheckCircle },
  moderate: { label: 'בינוני', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300', icon: AlertCircle },
  weak: { label: 'חלש', color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300', icon: AlertCircle },
  missing: { label: 'חסר', color: 'text-destructive bg-destructive/10 border-destructive/20', icon: XCircle },
};

function ScoreRing({ score, size = 56, label }: { score: number; size?: number; label?: string }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const color = score >= 70 ? 'hsl(var(--primary))' : score >= 50 ? 'hsl(45, 90%, 50%)' : 'hsl(var(--destructive))';
  return (
    <div className="text-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={3} strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} strokeLinecap="round" />
      </svg>
      <span className="block text-xs font-bold -mt-[calc(50%+6px)] mb-2" style={{ color }}>{score}</span>
      {label && <p className="text-[10px] text-muted-foreground mt-3">{label}</p>}
    </div>
  );
}

// ── Signal Row ────────────────────────────────────────────────────────

function SignalRow({ signal }: { signal: AuthoritySignal }) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig[signal.status];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border transition-colors ${open ? 'border-primary/20 bg-primary/5' : 'border-border/20 hover:border-border/40'}`}>
      <button onClick={() => setOpen(!open)} className="w-full text-right p-3 flex items-start gap-2.5">
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color.split(' ')[0]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{signal.labelHe}</span>
            <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${cfg.color}`}>{cfg.label}</Badge>
            <Badge variant={signal.fixPriority === 'high' ? 'destructive' : 'secondary'} className="text-[9px] h-4 px-1.5">
              {signal.fixPriority === 'high' ? 'עדיפות גבוהה' : signal.fixPriority === 'medium' ? 'בינונית' : 'נמוכה'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{signal.currentValue}</p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 mt-1 shrink-0" /> : <ChevronRight className="h-4 w-4 mt-1 shrink-0" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2.5">
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/20">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1">מצב נוכחי</p>
              <p className="text-xs">{signal.currentValue}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
              <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1">מומלץ</p>
              <p className="text-xs">{signal.recommendedValue}</p>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/20">
            <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 mb-1">🤖 השפעה על AI</p>
            <p className="text-xs text-blue-800 dark:text-blue-200">{signal.aiImpact}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Category Card ─────────────────────────────────────────────────────

function CategoryCard({ category }: { category: AuthorityCategory }) {
  const [expanded, setExpanded] = useState(false);
  const highCount = category.signals.filter(s => s.fixPriority === 'high').length;

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-2">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 w-full text-right">
          <span className="text-2xl">{category.icon}</span>
          <div className="flex-1">
            <CardTitle className="text-sm">{category.titleHe}</CardTitle>
            <p className="text-[10px] text-muted-foreground">{category.titleEn}</p>
          </div>
          <div className="flex items-center gap-2">
            {highCount > 0 && (
              <Badge variant="destructive" className="text-[9px] h-4 px-1.5">{highCount} דחוף</Badge>
            )}
            <ScoreRing score={category.score} size={40} />
          </div>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-1.5 pt-0">
          <Progress value={category.score} className="h-1.5 mb-3" />
          {category.signals.map(s => <SignalRow key={s.id} signal={s} />)}
        </CardContent>
      )}
    </Card>
  );
}

// ── AI Trust Assessment ───────────────────────────────────────────────

function AiTrustCard({ page }: { page: PageTrustAssessment }) {
  const [open, setOpen] = useState(false);
  const color = page.aiTrustScore >= 7 ? 'text-emerald-600' : page.aiTrustScore >= 5 ? 'text-amber-600' : 'text-destructive';

  return (
    <div className={`rounded-xl border transition-colors ${open ? 'border-primary/20' : 'border-border/20 hover:border-border/40'}`}>
      <button onClick={() => setOpen(!open)} className="w-full text-right p-3 flex items-center gap-3">
        <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{page.titleHe}</span>
            <code className="text-[10px] text-muted-foreground">{page.path}</code>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={page.wouldCite ? 'default' : 'secondary'} className="text-[9px] h-4">
            {page.wouldCite ? '✓ היה מצטט' : '✗ לא היה מצטט'}
          </Badge>
          <span className={`text-lg font-bold ${color}`}>{page.aiTrustScore}</span>
        </div>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
            <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1">למה AI כן סומך</p>
            <ul className="space-y-0.5">
              {page.reasons.map((r, i) => <li key={i} className="text-xs flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />{r}</li>)}
            </ul>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/20">
            <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 mb-1">מה צריך לשפר</p>
            <ul className="space-y-0.5">
              {page.fixes.map((f, i) => <li key={i} className="text-xs flex items-start gap-1.5"><AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />{f}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ── External Opportunity Row ──────────────────────────────────────────

function OpportunityRow({ opp }: { opp: ExternalOpportunity }) {
  const typeLabels: Record<string, string> = {
    citation: '📝 ציטוט', directory: '📋 מדריך', 'guest-content': '✍️ תוכן אורח',
    podcast: '🎙️ פודקאסט', partnership: '🤝 שיתוף', commentary: '💬 תגובה', mention: '📢 אזכור',
  };
  return (
    <div className="p-3 rounded-xl border border-border/20 hover:border-border/40 transition-colors">
      <div className="flex items-start gap-2.5">
        <span className="text-sm">{typeLabels[opp.type]?.split(' ')[0]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{opp.titleHe}</span>
            <Badge variant={opp.impact === 'high' ? 'destructive' : 'secondary'} className="text-[9px] h-4">
              {opp.impact === 'high' ? 'השפעה גבוהה' : opp.impact === 'medium' ? 'בינונית' : 'נמוכה'}
            </Badge>
            <Badge variant="outline" className="text-[9px] h-4">
              {opp.effort === 'low' ? 'מאמץ נמוך' : opp.effort === 'medium' ? 'בינוני' : 'גבוה'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{opp.description}</p>
        </div>
      </div>
    </div>
  );
}

// ── Brand Fragment Row ────────────────────────────────────────────────

function BrandRow({ frag }: { frag: BrandFragment }) {
  return (
    <div className={`p-3 rounded-xl border ${frag.isCanonical ? 'border-emerald-200/50 bg-emerald-50/30 dark:border-emerald-800/30 dark:bg-emerald-950/10' : 'border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10'}`}>
      <div className="flex items-center gap-2.5">
        {frag.isCanonical ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm font-semibold">{frag.variant}</code>
            <span className="text-[10px] text-muted-foreground">{frag.location}</span>
            {frag.isCanonical && <Badge className="text-[9px] h-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">קנוני ✓</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{frag.issue || frag.fix}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export function GeoSprint3Authority() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Sprint 3 — שכבת סמכות וישות
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          חיזוק זהות מומחה, עקביות ישות, ואמינות עבור מנועי AI
        </p>
      </div>

      {/* Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'בהירות ישות', score: SCORECARD.entityClarity, icon: Target },
          { label: 'הצגת אמון', score: SCORECARD.trustPresentation, icon: Shield },
          { label: 'נראות מומחה', score: SCORECARD.expertVisibility, icon: Eye },
          { label: 'סמכות חיצונית', score: SCORECARD.externalAuthority, icon: Globe },
          { label: 'ציון כולל', score: SCORECARD.overall, icon: Fingerprint },
        ].map(item => (
          <Card key={item.label} className="border-border/30">
            <CardContent className="p-3 flex flex-col items-center gap-1">
              <ScoreRing score={item.score} size={48} />
              <p className="text-[11px] font-medium text-center mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="signals" className="w-full">
        <TabsList className="bg-muted/30 p-1 rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger value="signals" className="text-xs rounded-lg gap-1"><Target className="h-3 w-3" />אותות סמכות</TabsTrigger>
          <TabsTrigger value="ai-trust" className="text-xs rounded-lg gap-1"><Bot className="h-3 w-3" />האם AI סומך?</TabsTrigger>
          <TabsTrigger value="brand" className="text-xs rounded-lg gap-1"><Fingerprint className="h-3 w-3" />איחוד מותג</TabsTrigger>
          <TabsTrigger value="external" className="text-xs rounded-lg gap-1"><Globe className="h-3 w-3" />סמכות חיצונית</TabsTrigger>
        </TabsList>

        {/* Authority Signals */}
        <TabsContent value="signals" className="mt-4 space-y-3">
          {AUTHORITY_CATEGORIES.map(cat => <CategoryCard key={cat.id} category={cat} />)}
        </TabsContent>

        {/* AI Trust Assessment */}
        <TabsContent value="ai-trust" className="mt-4 space-y-4">
          <Card className="border-blue-200/30 dark:border-blue-800/20 bg-blue-50/20 dark:bg-blue-950/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">האם AI היה סומך על המקור הזה?</p>
                  <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1">
                    הערכה לכל דף: האם מנוע AI (כמו GPT, Gemini, Perplexity) היה מצטט תוכן מהדף הזה בתשובה למשתמש?
                    הציון מבוסס על: בהירות ישות, מבנה תשובה, credentials, freshness, ו-disclaimer.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-1.5">
            {PAGE_TRUST_ASSESSMENTS
              .sort((a, b) => b.aiTrustScore - a.aiTrustScore)
              .map(page => <AiTrustCard key={page.path} page={page} />)}
          </div>
        </TabsContent>

        {/* Brand Consolidation */}
        <TabsContent value="brand" className="mt-4 space-y-4">
          <Card className="border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-primary" />
                מיפוי וריאנטים של מותג/שם
              </CardTitle>
              <p className="text-xs text-muted-foreground">כל הגרסאות של השם, המרפאה, והדומיין — והאם הן עקביות</p>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {BRAND_FRAGMENTS.map(f => <BrandRow key={f.id} frag={f} />)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* External Authority */}
        <TabsContent value="external" className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3 mb-2">
            {[
              { label: 'השפעה גבוהה + מאמץ נמוך', count: EXTERNAL_OPPORTUNITIES.filter(o => o.impact === 'high' && o.effort === 'low').length },
              { label: 'סך הכל הזדמנויות', count: EXTERNAL_OPPORTUNITIES.length },
              { label: 'התחילו', count: EXTERNAL_OPPORTUNITIES.filter(o => o.status !== 'not-started').length },
            ].map(s => (
              <Card key={s.label} className="border-border/30">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{s.count}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-1.5">
            {EXTERNAL_OPPORTUNITIES
              .sort((a, b) => {
                const impactOrder = { high: 0, medium: 1, low: 2 };
                const effortOrder = { low: 0, medium: 1, high: 2 };
                return (impactOrder[a.impact] - impactOrder[b.impact]) || (effortOrder[a.effort] - effortOrder[b.effort]);
              })
              .map(opp => <OpportunityRow key={opp.id} opp={opp} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
