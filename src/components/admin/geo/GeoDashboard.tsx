import { GEO_PAGES, ENTITY_SIGNALS } from '@/data/geo-data';
import { TOPIC_CLUSTERS } from '@/data/geo-sprint4-data';
import { SCORED_PAGES } from '@/data/geo-sprint5-data';
import { EXECUTION_TASKS } from '@/data/geo-sprint6-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Target, Shield, FileText, AlertTriangle, CheckCircle, TrendingUp,
  User, Building, MapPin, Stethoscope,
} from 'lucide-react';

function scoreColor(score: number) {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 55) return 'text-amber-600';
  return 'text-destructive';
}

const iconMap: Record<string, any> = {
  physician: User, organization: Building, location: MapPin, condition: Stethoscope, procedure: Stethoscope,
};

export function GeoDashboard() {
  const avgGeoScore = SCORED_PAGES.length
    ? Math.round((SCORED_PAGES.reduce((s, p) => s + p.weightedScore, 0) / SCORED_PAGES.length) * 10)
    : 0;
  const avgEntity = Math.round(ENTITY_SIGNALS.reduce((s, e) => s + e.consistency, 0) / ENTITY_SIGNALS.length);
  const avgCluster = Math.round(TOPIC_CLUSTERS.reduce((s, c) => s + c.coverageDepth, 0) / TOPIC_CLUSTERS.length);
  const criticalPages = GEO_PAGES.filter(p => p.geoScore < 55).length;
  const completedTasks = EXECUTION_TASKS.filter(t => t.status === 'done').length;
  const totalTasks = EXECUTION_TASKS.length;

  const stats = [
    { label: 'ציון GEO ממוצע', value: avgGeoScore, icon: Brain, suffix: '/100' },
    { label: 'עקביות ישות', value: avgEntity, icon: Target, suffix: '/100' },
    { label: 'כיסוי אשכולות', value: avgCluster, icon: TrendingUp, suffix: '%' },
    { label: 'דפים קריטיים', value: criticalPages, icon: AlertTriangle, suffix: '' },
    { label: 'דפים באתר', value: GEO_PAGES.length, icon: FileText, suffix: '' },
    { label: 'תוכנית 90 יום', value: completedTasks, icon: CheckCircle, suffix: `/${totalTasks}` },
  ];

  const topPriority = GEO_PAGES
    .filter(p => p.priority === 'high')
    .sort((a, b) => a.geoScore - b.geoScore)
    .slice(0, 5);

  // Weakest clusters
  const weakClusters = [...TOPIC_CLUSTERS]
    .sort((a, b) => a.coverageDepth - b.coverageDepth)
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

        {/* Entity Health - integrated from Entity Layer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              עקביות ישויות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ENTITY_SIGNALS.map(entity => {
              const Icon = iconMap[entity.type] || Stethoscope;
              return (
                <div key={entity.id} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{entity.entity}</p>
                    </div>
                    <Badge variant={entity.consistency >= 75 ? 'default' : 'secondary'} className="text-xs">
                      {entity.consistency}%
                    </Badge>
                  </div>
                  <Progress value={entity.consistency} className="h-2 mb-2" />
                  {entity.issues.length > 0 && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      ⚠ {entity.issues[0]}
                    </p>
                  )}
                  {entity.fixes.length > 0 && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 line-clamp-1 mt-0.5">
                      ✓ {entity.fixes[0]}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Weakest Clusters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">פערי כיסוי - אשכולות חלשים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {weakClusters.map(cluster => (
              <div key={cluster.id} className="p-4 rounded-xl border border-border/50 text-center">
                <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-sm ${
                  cluster.coverageDepth >= 60 ? 'bg-primary text-primary-foreground' : 'bg-destructive/20 text-destructive'
                }`}>
                  {cluster.coverageDepth}%
                </div>
                <p className="text-sm font-medium">{cluster.nameHe}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cluster.pages.filter(p => p.role !== 'missing').length} דפים • {cluster.pages.filter(p => p.role === 'missing').length} חסרים
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
