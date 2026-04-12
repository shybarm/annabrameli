import { useState } from 'react';
import { SPRINT_TASKS, SprintTask } from '@/data/geo-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarDays, Zap, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

const effortMap = { small: 'קטן', medium: 'בינוני', large: 'גדול' };
const impactMap = { high: 'גבוה', medium: 'בינוני', low: 'נמוך' };
const statusMap = {
  todo: { label: 'לביצוע', variant: 'secondary' as const },
  'in-progress': { label: 'בביצוע', variant: 'default' as const },
  done: { label: 'הושלם', variant: 'outline' as const },
  blocked: { label: 'חסום', variant: 'destructive' as const },
};
const categoryMap = {
  entity: 'ישות',
  structure: 'מבנה',
  content: 'תוכן',
  schema: 'סכימה',
  linking: 'קישור',
  'answer-format': 'תשובה',
};

function ImpactIcon({ impact }: { impact: string }) {
  if (impact === 'high') return <ArrowUp className="h-3 w-3 text-emerald-500" />;
  if (impact === 'medium') return <ArrowRight className="h-3 w-3 text-amber-500" />;
  return <ArrowDown className="h-3 w-3 text-muted-foreground" />;
}

export function GeoSprintPlanner() {
  const [tasks, setTasks] = useState<SprintTask[]>(SPRINT_TASKS);
  const [sprintFilter, setSprintFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const sprints = [...new Set(tasks.map(t => t.sprint))].sort();
  const categories = [...new Set(tasks.map(t => t.category))];

  const filtered = tasks.filter(t => {
    if (sprintFilter !== 'all' && t.sprint !== Number(sprintFilter)) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const toggleDone = (taskId: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t
    ));
  };

  const sprintGroups = sprints.map(s => ({
    sprint: s,
    tasks: filtered.filter(t => t.sprint === s),
  })).filter(g => sprintFilter === 'all' || g.sprint === Number(sprintFilter));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-3">
        <Select value={sprintFilter} onValueChange={setSprintFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="ספרינט" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הספרינטים</SelectItem>
            {sprints.map(s => <SelectItem key={s} value={String(s)}>ספרינט {s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="קטגוריה" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{categoryMap[c as keyof typeof categoryMap]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sprints.map(s => {
          const sTasks = tasks.filter(t => t.sprint === s);
          const done = sTasks.filter(t => t.status === 'done').length;
          return (
            <Card key={s} className="border-border/50">
              <CardContent className="p-4 text-center">
                <CalendarDays className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-semibold">ספרינט {s}</p>
                <p className="text-xs text-muted-foreground">{done}/{sTasks.length} הושלמו</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tasks by Sprint */}
      {sprintGroups.map(group => (
        <Card key={group.sprint}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              ספרינט {group.sprint}
              <Badge variant="secondary" className="text-xs">{group.tasks.length} משימות</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.tasks.map(task => (
              <div
                key={task.id}
                className={`p-3 rounded-lg border border-border/30 flex items-start gap-3 transition-opacity ${task.status === 'done' ? 'opacity-60' : ''}`}
              >
                <Checkbox
                  checked={task.status === 'done'}
                  onCheckedChange={() => toggleDone(task.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through' : ''}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge variant="outline" className="text-[10px]">{categoryMap[task.category]}</Badge>
                    <Badge variant="secondary" className="text-[10px]">מאמץ: {effortMap[task.effort]}</Badge>
                    <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                      <ImpactIcon impact={task.impact} />
                      השפעה: {impactMap[task.impact]}
                    </Badge>
                    <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{task.pagePath}</code>
                  </div>
                </div>
                <Badge variant={statusMap[task.status].variant} className="text-[10px] shrink-0">
                  {statusMap[task.status].label}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
