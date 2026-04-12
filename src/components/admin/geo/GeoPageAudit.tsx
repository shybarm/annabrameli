import { useState } from 'react';
import { GEO_PAGES, GeoPage } from '@/data/geo-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ExternalLink, AlertCircle, Lightbulb } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

function statusBadge(status: GeoPage['status']) {
  const map = {
    optimized: { label: 'מותאם', variant: 'default' as const },
    'needs-work': { label: 'דורש עבודה', variant: 'secondary' as const },
    critical: { label: 'קריטי', variant: 'destructive' as const },
    draft: { label: 'טיוטה', variant: 'outline' as const },
  };
  const m = map[status];
  return <Badge variant={m.variant} className="text-xs">{m.label}</Badge>;
}

function scoreColor(s: number) {
  if (s >= 75) return 'text-emerald-600';
  if (s >= 55) return 'text-amber-600';
  return 'text-destructive';
}

export function GeoPageAudit() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clusterFilter, setClusterFilter] = useState<string>('all');
  const [selectedPage, setSelectedPage] = useState<GeoPage | null>(null);

  const clusters = [...new Set(GEO_PAGES.map(p => p.cluster))];
  const types = [...new Set(GEO_PAGES.map(p => p.type))];

  const filtered = GEO_PAGES.filter(p => {
    if (search && !p.titleHe.includes(search) && !p.path.includes(search)) return false;
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (clusterFilter !== 'all' && p.cluster !== clusterFilter) return false;
    return true;
  }).sort((a, b) => a.geoScore - b.geoScore);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש דף..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="סוג דף" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסוגים</SelectItem>
            {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={clusterFilter} onValueChange={setClusterFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="אשכול" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל האשכולות</SelectItem>
            {clusters.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">{filtered.length} דפים</p>

      {/* Page List */}
      <div className="space-y-2">
        {filtered.map(page => (
          <Card
            key={page.id}
            className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setSelectedPage(page)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold truncate">{page.titleHe}</h3>
                    {statusBadge(page.status)}
                    <Badge variant="outline" className="text-xs">{page.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">{page.path}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center w-14">
                    <div className={`text-lg font-bold ${scoreColor(page.geoScore)}`}>{page.geoScore}</div>
                    <p className="text-[10px] text-muted-foreground">GEO</p>
                  </div>
                  <div className="hidden sm:flex gap-2">
                    {[
                      { label: 'ישות', val: page.entitySignalScore },
                      { label: 'תשובה', val: page.answerReadiness },
                      { label: 'מבנה', val: page.structureScore },
                      { label: 'אמון', val: page.trustScore },
                    ].map(s => (
                      <div key={s.label} className="text-center w-12">
                        <div className={`text-sm font-semibold ${scoreColor(s.val)}`}>{s.val}</div>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedPage} onOpenChange={() => setSelectedPage(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
          {selectedPage && (
            <>
              <DialogHeader>
                <DialogTitle className="text-right">{selectedPage.titleHe}</DialogTitle>
                <p className="text-sm text-muted-foreground font-mono">{selectedPage.path}</p>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Scores */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'ציון GEO', val: selectedPage.geoScore },
                    { label: 'אות ישות', val: selectedPage.entitySignalScore },
                    { label: 'מוכנות תשובה', val: selectedPage.answerReadiness },
                    { label: 'מבנה', val: selectedPage.structureScore },
                    { label: 'אמון', val: selectedPage.trustScore },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={s.val} className="h-2 flex-1" />
                        <span className={`text-sm font-bold ${scoreColor(s.val)}`}>{s.val}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Issues */}
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    בעיות
                  </h4>
                  <ul className="space-y-1">
                    {selectedPage.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Opportunities */}
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-emerald-500" />
                    הזדמנויות
                  </h4>
                  <ul className="space-y-1">
                    {selectedPage.opportunities.map((opp, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        {opp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
