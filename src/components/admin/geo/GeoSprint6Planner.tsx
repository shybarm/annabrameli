import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  EXECUTION_TASKS, PHASE_META, OWNER_LABELS, PAGE_TO_TASK_MAP,
  ExecutionTask, Phase, TaskStatus,
} from '@/data/geo-sprint6-data';
import {
  CalendarDays, Target, ArrowUp, ArrowRight, ArrowDown,
  Clock, Link2, CheckCircle2, Circle, Loader2, Ban, Users, Zap,
  BarChart3, ChevronRight,
} from 'lucide-react';

const STATUS_CFG: Record<TaskStatus, { icon: typeof Circle; label: string; cls: string }> = {
  'todo': { icon: Circle, label: 'לביצוע', cls: 'text-muted-foreground' },
  'in-progress': { icon: Loader2, label: 'בביצוע', cls: 'text-amber-500' },
  'done': { icon: CheckCircle2, label: 'הושלם', cls: 'text-emerald-500' },
  'blocked': { icon: Ban, label: 'חסום', cls: 'text-destructive' },
};

const IMPACT_ICON = { high: ArrowUp, medium: ArrowRight, low: ArrowDown };
const IMPACT_CLS = { high: 'text-emerald-500', medium: 'text-amber-500', low: 'text-muted-foreground' };
const DIFF_LABEL = { easy: 'קל', medium: 'בינוני', hard: 'מורכב' };

export function GeoSprint6Planner() {
  const [tasks, setTasks] = useState<ExecutionTask[]>(EXECUTION_TASKS);
  const [selectedTask, setSelectedTask] = useState<ExecutionTask | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<'all' | Phase>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  // Auto-complete tasks when pages are saved via the transform system
  const handlePageSaved = useCallback((e: Event) => {
    const pageId = (e as CustomEvent).detail?.pageId;
    if (!pageId) return;
    const taskIds = PAGE_TO_TASK_MAP[pageId];
    if (!taskIds?.length) return;
    setTasks(prev => prev.map(t =>
      taskIds.includes(t.id) && t.status !== 'done'
        ? { ...t, status: 'done' as TaskStatus }
        : t
    ));
  }, []);

  useEffect(() => {
    window.addEventListener('geo-page-saved', handlePageSaved);
    return () => window.removeEventListener('geo-page-saved', handlePageSaved);
  }, [handlePageSaved]);

  const toggleStatus = (id: string) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t
    ));
  };

  const filtered = tasks.filter(t => {
    if (phaseFilter !== 'all' && t.phase !== phaseFilter) return false;
    if (ownerFilter !== 'all' && t.owner !== ownerFilter) return false;
    return true;
  });

  const totalDone = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const overallProgress = Math.round((totalDone / totalTasks) * 100);

  // Score projection
  const phaseDone = (p: Phase) => {
    const pt = tasks.filter(t => t.phase === p);
    return pt.length ? Math.round((pt.filter(t => t.status === 'done').length / pt.length) * 100) : 0;
  };
  const projectedScore = 6 + (phaseDone(1) / 100) * 0.8 + (phaseDone(2) / 100) * 0.6 + (phaseDone(3) / 100) * 0.6;

  // Owner workload
  const owners = Object.keys(OWNER_LABELS) as Array<keyof typeof OWNER_LABELS>;
  const ownerStats = owners.map(o => ({
    owner: o,
    total: tasks.filter(t => t.owner === o).length,
    done: tasks.filter(t => t.owner === o && t.status === 'done').length,
    days: tasks.filter(t => t.owner === o && t.status !== 'done').reduce((s, t) => s + t.daysEstimate, 0),
  }));

  return (
    <div className="space-y-6">
      {/* Score Projection Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">{projectedScore.toFixed(1)}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">ציון GEO משוער</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">6.0 → 8.0</Badge>
                  <span className="text-xs text-muted-foreground">90 ימים</span>
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-xs w-full">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>התקדמות כללית</span>
                <span>{totalDone}/{totalTasks} ({overallProgress}%)</span>
              </div>
              <Progress value={overallProgress} className="h-2.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([1, 2, 3] as Phase[]).map(p => {
          const meta = PHASE_META[p];
          const pt = tasks.filter(t => t.phase === p);
          const done = pt.filter(t => t.status === 'done').length;
          const pct = pt.length ? Math.round((done / pt.length) * 100) : 0;
          return (
            <Card
              key={p}
              className={`cursor-pointer transition-all hover:shadow-md ${phaseFilter === p ? 'ring-2 ring-primary' : 'border-border/50'}`}
              onClick={() => setPhaseFilter(phaseFilter === p ? 'all' : p)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={p === 1 ? 'default' : 'secondary'} className="text-xs">
                    Phase {p}
                  </Badge>
                  <span className="text-xs text-muted-foreground">שבועות {meta.weeks}</span>
                </div>
                <h3 className="font-semibold text-sm">{meta.titleHe}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{meta.goal}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{done}/{pt.length}</span>
                    <span>{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs: Board / Timeline / Workload */}
      <Tabs defaultValue="board" className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/30 p-1.5 rounded-xl">
          <TabsTrigger value="board" className="text-xs rounded-lg gap-1"><Target className="h-3 w-3" />לוח משימות</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs rounded-lg gap-1"><CalendarDays className="h-3 w-3" />ציר זמן</TabsTrigger>
          <TabsTrigger value="workload" className="text-xs rounded-lg gap-1"><Users className="h-3 w-3" />עומס צוות</TabsTrigger>
        </TabsList>

        {/* Board View */}
        <TabsContent value="board" className="mt-4 space-y-4">
          {/* Owner filter */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={ownerFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setOwnerFilter('all')}
            >הכל</Badge>
            {owners.map(o => (
              <Badge
                key={o}
                variant={ownerFilter === o ? 'default' : 'outline'}
                className={`cursor-pointer text-xs ${ownerFilter === o ? '' : OWNER_LABELS[o].color}`}
                onClick={() => setOwnerFilter(ownerFilter === o ? 'all' : o)}
              >
                {OWNER_LABELS[o].label} ({tasks.filter(t => t.owner === o).length})
              </Badge>
            ))}
          </div>

          {/* Tasks grouped by phase */}
          {([1, 2, 3] as Phase[]).filter(p => phaseFilter === 'all' || phaseFilter === p).map(p => {
            const phaseTasks = filtered.filter(t => t.phase === p);
            if (!phaseTasks.length) return null;
            return (
              <Card key={p}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Phase {p}: {PHASE_META[p].titleHe}
                    <Badge variant="secondary" className="text-xs">{phaseTasks.length} משימות</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {phaseTasks.map(task => {
                    const StatusIcon = STATUS_CFG[task.status].icon;
                    const ImpactIcon = IMPACT_ICON[task.impact];
                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border border-border/30 flex items-start gap-3 transition-all hover:bg-muted/30 ${task.status === 'done' ? 'opacity-60' : ''}`}
                      >
                        <Checkbox
                          checked={task.status === 'done'}
                          onCheckedChange={() => toggleStatus(task.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm font-medium cursor-pointer hover:text-primary transition-colors ${task.status === 'done' ? 'line-through' : ''}`}
                              onClick={() => setSelectedTask(task)}
                            >
                              {task.title}
                            </p>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setSelectedTask(task)}>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${OWNER_LABELS[task.owner].color}`}>
                              {OWNER_LABELS[task.owner].label}
                            </span>
                            <Badge variant="outline" className="text-[10px]">{DIFF_LABEL[task.difficulty]}</Badge>
                            <Badge variant="secondary" className="text-[10px] flex items-center gap-0.5">
                              <ImpactIcon className={`h-2.5 w-2.5 ${IMPACT_CLS[task.impact]}`} />
                              {task.impact === 'high' ? 'גבוה' : task.impact === 'medium' ? 'בינוני' : 'נמוך'}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {task.daysEstimate}d
                            </Badge>
                            {task.dependency && (
                              <Badge variant="outline" className="text-[10px] flex items-center gap-0.5">
                                <Link2 className="h-2.5 w-2.5" />
                                {task.dependency}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <StatusIcon className={`h-4 w-4 shrink-0 mt-0.5 ${STATUS_CFG[task.status].cls}`} />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Timeline View */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                ציר זמן - 12 שבועות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(week => {
                  const weekTasks = tasks.filter(t => t.week === week);
                  const phase = week <= 4 ? 1 : week <= 8 ? 2 : 3;
                  const phaseColors = { 1: 'border-primary/40', 2: 'border-amber-400/40', 3: 'border-emerald-400/40' };
                  const phaseBg = { 1: 'bg-primary/5', 2: 'bg-amber-50 dark:bg-amber-900/10', 3: 'bg-emerald-50 dark:bg-emerald-900/10' };
                  return (
                    <div key={week} className={`flex gap-3 p-3 rounded-lg border ${phaseColors[phase]} ${phaseBg[phase]}`}>
                      <div className="w-16 shrink-0 text-center">
                        <p className="text-xs font-semibold">שבוע {week}</p>
                        <p className="text-[10px] text-muted-foreground">P{phase}</p>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-1.5">
                        {weekTasks.length ? weekTasks.map(t => (
                          <Badge
                            key={t.id}
                            variant={t.status === 'done' ? 'outline' : 'secondary'}
                            className={`text-[10px] cursor-pointer hover:bg-primary/10 ${t.status === 'done' ? 'line-through opacity-60' : ''}`}
                            onClick={() => setSelectedTask(t)}
                          >
                            <span className={`mr-1 inline-block w-1.5 h-1.5 rounded-full ${OWNER_LABELS[t.owner].color.split(' ')[0]}`} />
                            {t.title.slice(0, 30)}…
                          </Badge>
                        )) : (
                          <span className="text-xs text-muted-foreground italic">-</span>
                        )}
                      </div>
                      <div className="w-12 text-center shrink-0">
                        <p className="text-xs font-medium">{weekTasks.reduce((s, t) => s + t.daysEstimate, 0)}d</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workload View */}
        <TabsContent value="workload" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ownerStats.map(os => {
              const pct = os.total ? Math.round((os.done / os.total) * 100) : 0;
              return (
                <Card key={os.owner} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${OWNER_LABELS[os.owner].color}`}>
                        {OWNER_LABELS[os.owner].label}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{os.days} ימים נותרו</Badge>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-2xl font-bold">{os.done}</span>
                      <span className="text-sm text-muted-foreground">/ {os.total}</span>
                    </div>
                    <Progress value={pct} className="h-1.5 mb-2" />
                    <div className="space-y-1">
                      {tasks.filter(t => t.owner === os.owner && t.status !== 'done').slice(0, 3).map(t => (
                        <p key={t.id} className="text-xs text-muted-foreground truncate">• {t.title}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Impact summary */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                סיכום השפעה לפי קטגוריה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {(['high', 'medium', 'low'] as const).map(imp => {
                  const count = tasks.filter(t => t.impact === imp).length;
                  const done = tasks.filter(t => t.impact === imp && t.status === 'done').length;
                  const ImpIcon = IMPACT_ICON[imp];
                  return (
                    <div key={imp} className="text-center p-3 rounded-lg bg-muted/30">
                      <ImpIcon className={`h-5 w-5 mx-auto mb-1 ${IMPACT_CLS[imp]}`} />
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{done} הושלמו</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={open => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          {selectedTask && (() => {
            const t = selectedTask;
            const StatusIcon = STATUS_CFG[t.status].icon;
            const ImpactIcon = IMPACT_ICON[t.impact];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base leading-relaxed">{t.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.description}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-[10px] text-muted-foreground mb-1">בעלים</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${OWNER_LABELS[t.owner].color}`}>
                        {OWNER_LABELS[t.owner].label}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-[10px] text-muted-foreground mb-1">קושי</p>
                      <p className="text-xs font-medium">{DIFF_LABEL[t.difficulty]}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-[10px] text-muted-foreground mb-1">השפעה</p>
                      <div className="flex items-center gap-1">
                        <ImpactIcon className={`h-3 w-3 ${IMPACT_CLS[t.impact]}`} />
                        <span className="text-xs font-medium">{t.impact === 'high' ? 'גבוהה' : t.impact === 'medium' ? 'בינונית' : 'נמוכה'}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-[10px] text-muted-foreground mb-1">אומדן</p>
                      <p className="text-xs font-medium">{t.daysEstimate} ימים · שבוע {t.week}</p>
                    </div>
                  </div>

                  {t.dependency && (
                    <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
                      <p className="text-xs flex items-center gap-1.5">
                        <Link2 className="h-3 w-3 text-amber-600" />
                        <span className="font-medium">תלוי ב:</span> {t.dependency}
                      </p>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mb-1">תוצאה צפויה</p>
                    <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">{t.estimatedOutcome}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon className={`h-4 w-4 ${STATUS_CFG[t.status].cls}`} />
                      <span className="text-xs">{STATUS_CFG[t.status].label}</span>
                    </div>
                    <Button size="sm" variant={t.status === 'done' ? 'outline' : 'default'} onClick={() => { toggleStatus(t.id); setSelectedTask(null); }}>
                      {t.status === 'done' ? 'סמן כלא הושלם' : 'סמן כהושלם'}
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
