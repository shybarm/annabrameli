import { ENTITY_SIGNALS } from '@/data/geo-data';
import { TOPIC_CLUSTERS } from '@/data/geo-sprint4-data';
import { useGeoLiveData, useLiveScoredPages, useLiveExecutionTasks } from '@/hooks/useGeoLiveData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Target, Shield, AlertTriangle, CheckCircle, TrendingUp,
  User, Building, MapPin, Stethoscope, Loader2, Database,
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
  const { scanResults, clusterActions, sprintTasks, contentOverrides, loading, loaded } = useGeoLiveData();
  const livePages = useLiveScoredPages(scanResults);
  const liveTasks = useLiveExecutionTasks(sprintTasks, clusterActions);

  const hasScanData = Object.keys(scanResults).length > 0;

  // Always use livePages as unified source (merges static + live scan data)
  const avgGeoScore = livePages.length
    ? Math.round(livePages.reduce((s, p) => s + p.weightedScore, 0) / livePages.length * 10) / 10
    : 0;
  const avgEntity = Math.round(ENTITY_SIGNALS.reduce((s, e) => s + e.consistency, 0) / ENTITY_SIGNALS.length);
  const avgCluster = Math.round(TOPIC_CLUSTERS.reduce((s, c) => s + c.coverageDepth, 0) / TOPIC_CLUSTERS.length);
  const criticalPages = livePages.filter(p => p.weightedScore < 5.5).length;
  const completedTasks = liveTasks.filter(t => t.status === 'done').length;
  const totalTasks = liveTasks.length;
  const savedPages = Object.keys(contentOverrides).length;

  // Find most recent scan timestamp
  const latestScanAt = Object.values(scanResults).reduce((latest, s) => {
    return s.scannedAt > latest ? s.scannedAt : latest;
  }, '');

  const stats = [
    { label: 'ציון GEO ממוצע', value: avgGeoScore, icon: Brain, suffix: '/10', live: hasScanData },
    { label: 'עקביות ישות', value: avgEntity, icon: Target, suffix: '/100', live: false },
    { label: 'כיסוי אשכולות', value: avgCluster, icon: TrendingUp, suffix: '%', live: false },
    { label: 'דפים קריטיים', value: criticalPages, icon: AlertTriangle, suffix: '', live: hasScanData },
    { label: 'דפים נשמרו', value: savedPages, icon: Database, suffix: '', live: true },
    { label: 'תוכנית 90 יום', value: completedTasks, icon: CheckCircle, suffix: `/${totalTasks}`, live: sprintTasks.length > 0 },
  ];

  // Priority pages from live data
  const topPriority = hasScanData
    ? [...livePages].sort((a, b) => a.weightedScore - b.weightedScore).slice(0, 5)
    : GEO_PAGES.filter(p => p.priority === 'high').sort((a, b) => a.geoScore - b.geoScore).slice(0, 5);

  const weakClusters = [...TOPIC_CLUSTERS]
    .sort((a, b) => a.coverageDepth - b.coverageDepth)
    .slice(0, 5);

  if (loading && !loaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground mr-2">טוען נתונים...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data source indicator */}
      {hasScanData && (
        <div className="flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <Database className="h-3 w-3" />
          נתונים חיים מ-{Object.keys(scanResults).length} סריקות AI אחרונות
          {savedPages > 0 && ` • ${savedPages} דפים נשמרו`}
          {clusterActions.length > 0 && ` • ${clusterActions.filter(a => a.status === 'completed').length} פעולות הושלמו`}
        </div>
      )}

      {/* Score Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <s.icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <div className={`text-2xl font-bold ${typeof s.value === 'number' ? scoreColor(s.value) : 'text-foreground'}`}>
                {s.value}{s.suffix}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              {s.live && (
                <span className="text-[8px] text-emerald-500">● חי</span>
              )}
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
              {hasScanData && <Badge variant="outline" className="text-[9px]">נתונים חיים</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPriority.map((page: any) => (
              <div key={page.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{page.titleHe}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{page.path}</p>
                </div>
                <div className="flex items-center gap-3 mr-3">
                  <div className="w-16">
                    <Progress value={(page.weightedScore || page.geoScore || 0) * (hasScanData ? 10 : 1)} className="h-2" />
                  </div>
                  <span className={`text-sm font-bold w-8 text-left ${scoreColor((page.weightedScore || page.geoScore || 0) * (hasScanData ? 10 : 1))}`}>
                    {hasScanData ? page.weightedScore : page.geoScore}
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
                    <p className="text-xs text-muted-foreground line-clamp-1">⚠ {entity.issues[0]}</p>
                  )}
                  {entity.fixes.length > 0 && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 line-clamp-1 mt-0.5">✓ {entity.fixes[0]}</p>
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

      {/* Recent Actions */}
      {clusterActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              פעולות אחרונות
              <Badge variant="outline" className="text-[9px]">חי מ-DB</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {clusterActions.slice(0, 5).map(action => (
              <div key={action.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                <Badge variant={action.status === 'completed' ? 'default' : 'secondary'} className="text-[9px]">
                  {action.status === 'completed' ? 'הושלם' : action.status === 'pending' ? 'ממתין' : action.status}
                </Badge>
                <span className="text-xs text-foreground truncate flex-1">{action.pageTitle}</span>
                <span className="text-[10px] text-muted-foreground">{action.actionType}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
