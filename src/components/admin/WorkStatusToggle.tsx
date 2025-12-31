import { Button } from '@/components/ui/button';
import { Play, Square, Clock, Loader2 } from 'lucide-react';
import { useWorkSessions, calculateHours } from '@/hooks/useWorkSessions';
import { useClinicContext } from '@/contexts/ClinicContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WorkStatusToggleProps {
  isStaff: boolean;
  compact?: boolean;
}

export function WorkStatusToggle({ isStaff, compact = false }: WorkStatusToggleProps) {
  const { todaySession, clockIn, clockOut } = useWorkSessions();
  const { selectedClinicId } = useClinicContext();

  if (!isStaff) return null;

  const session = todaySession.data;
  const isWorking = session && session.end_time === null;
  const isPending = clockIn.isPending || clockOut.isPending;

  const handleToggle = async () => {
    try {
      if (isWorking) {
        await clockOut.mutateAsync(session!.id);
        toast.success('שעות העבודה נעצרו');
      } else {
        await clockIn.mutateAsync(selectedClinicId || undefined);
        toast.success('שעות העבודה התחילו');
      }
    } catch (error) {
      toast.error(isWorking ? 'שגיאה בעצירת שעות' : 'שגיאה בהתחלת שעות');
    }
  };

  // Calculate duration if working
  const duration = isWorking && session?.start_time
    ? calculateHours(session.start_time, new Date().toTimeString().split(' ')[0])
    : null;

  if (compact) {
    return (
      <Button
        variant={isWorking ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggle}
        disabled={isPending || todaySession.isLoading}
        className={cn(
          'h-9 gap-2 rounded-xl transition-all',
          isWorking 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'border-primary/30 hover:bg-primary/5'
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isWorking ? (
          <Square className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
        <span className="text-xs font-medium">
          {isPending 
            ? '...' 
            : isWorking 
              ? 'סיים' 
              : 'התחל עבודה'
          }
        </span>
      </Button>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-all',
      isWorking 
        ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
        : 'bg-muted/30 border-border'
    )}>
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center',
        isWorking ? 'bg-green-600 text-white' : 'bg-muted'
      )}>
        <Clock className="h-5 w-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium',
          isWorking ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'
        )}>
          {isWorking ? 'בעבודה' : 'לא בעבודה'}
        </p>
        {isWorking && duration && (
          <p className="text-xs text-muted-foreground">
            התחלה: {session?.start_time?.slice(0, 5)} • {duration}
          </p>
        )}
      </div>

      <Button
        variant={isWorking ? 'destructive' : 'default'}
        size="sm"
        onClick={handleToggle}
        disabled={isPending || todaySession.isLoading}
        className="h-9 rounded-xl gap-2"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isWorking ? (
          <Square className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isPending 
          ? '...' 
          : isWorking 
            ? 'סיים עבודה' 
            : 'התחל עבודה'
        }
      </Button>
    </div>
  );
}
