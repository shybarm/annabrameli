import { GEO_PAGES, ENTITY_SIGNALS, TOPIC_CLUSTERS, SPRINT_TASKS } from '@/data/geo-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, Target, Shield, Link2, FileText, AlertTriangle, CheckCircle, TrendingUp 
} from 'lucide-react';

function scoreColor(score: number) {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 55) return 'text-amber-600';
  return 'text-destructive';
}


export function GeoDashboard() {
  const avgGeo = Math.round(GEO_PAGES.reduce((s, p) => s + p.geoScore, 0) / GEO_PAGES.length);
  const avgEntity = Math.round(ENTITY_SIGNALS.reduce((s, e) => s + e.consistency, 0) / ENTITY_SIGNALS.length);
  const avgCluster = Math.round(TOPIC_CLUSTERS.reduce((s, c) => s + c.completeness, 0) / TOPIC_CLUSTERS.length);
  const criticalPages = GEO_PAGES.filter(p => p.geoScore < 55).length;
  const completedTasks = SPRINT_TASKS.filter(t => t.status === 'done').length;
  const totalTasks = SPRINT_TASKS.length;

  const stats = [
    { label: 'ציון GEO ממוצע', value: avgGeo, icon: Brain, suffix: '/100' },
    { label: 'עקביות ישות', value: avgEntity, icon: Target, suffix: '/100' },
    { label: 'שלמות אשכולות', value: avgCluster, icon: Link2, suffix: '%' },
    { label: 'דפים קריטיים', value: criticalPages, icon: AlertTriangle, suffix: '' },
    { label: 'דפים באתר', value: GEO_PAGES.length, icon: FileText, suffix: '' },
    { label: 'משימות הושלמו', value: completedTasks, icon: CheckCircle, suffix: `/${totalTasks}` },
  ];

  const topPriority = GEO_PAGES
    .filter(p => p.priority === 'high')
    .sort((a, b) => a.geoScore - b.geoScore)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Score Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <s.icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <div className={`text-2xl font-bold ${scoreColor(s.value)}`}>
                {s.value}{s.suffix}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Priority Pages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              דפים בעדיפות גבוהה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPriority.map(page => (
              <div key={page.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{page.titleHe}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{page.path}</p>
                </div>
                <div className="flex items-center gap-3 mr-3">
                  <div className="w-16">
                    <Progress value={page.geoScore} className="h-2" />
                  </div>
                  <span className={`text-sm font-bold w-8 text-left ${scoreColor(page.geoScore)}`}>
                    {page.geoScore}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Entity Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              בריאות ישויות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ENTITY_SIGNALS.map(entity => (
              <div key={entity.id} className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{entity.entity}</p>
                  <Badge variant={entity.consistency >= 75 ? 'default' : 'secondary'} className="text-xs">
                    {entity.pagesPresent}/{entity.pagesTotal} דפים
                  </Badge>
                </div>
                <Progress value={entity.consistency} className="h-2" />
                {entity.issues.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                    ⚠ {entity.issues[0]}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Cluster Completeness */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">שלמות אשכולות נושאיים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {TOPIC_CLUSTERS.map(cluster => (
              <div key={cluster.id} className="p-4 rounded-xl border border-border/50 text-center">
                <div
                  className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: cluster.color }}
                >
                  {cluster.completeness}%
                </div>
                <p className="text-sm font-medium">{cluster.nameHe}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cluster.satellites.length} מאמרים • {cluster.missingTopics.length} חסרים
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
