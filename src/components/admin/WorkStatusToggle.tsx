import { Button } from '@/components/ui/button';
import { Play, Square, Loader2 } from 'lucide-react';
import { useWorkSessions, calculateHours } from '@/hooks/useWorkSessions';
import { useClinicContext } from '@/contexts/ClinicContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
  const isLoading = todaySession.isLoading;

  const handleToggle = async () => {
    try {
      if (isWorking) {
        await clockOut.mutateAsync(session!.id);
        toast.success('שעות העבודה נעצרו');
      } else {
        await clockIn.mutateAsync(selectedClinicId || undefined);
        toast.success('שעות העבודה התחילו');
      }
    } catch (error: any) {
      if (error?.message === 'ALREADY_WORKING') {
        toast.info('את/ה כבר בעבודה');
      } else {
        toast.error(isWorking ? 'שגיאה בעצירת שעות' : 'שגיאה בהתחלת שעות');
      }
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
        disabled={isPending || isLoading}
        className={cn(
          'h-8 gap-1.5 text-xs font-medium transition-all',
          isWorking 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'border-border hover:bg-accent'
        )}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isWorking ? (
          <Square className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
        {isPending ? '...' : isWorking ? 'סיים' : 'התחל'}
      </Button>
    );
  }

  return (
    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
      {/* Header row: title + status pill */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-muted-foreground">שעות עבודה</span>
        <Badge 
          variant={isWorking ? "default" : "secondary"}
          className={cn(
            "text-[10px] px-1.5 py-0 h-4 font-normal",
            isWorking 
              ? "bg-green-600 hover:bg-green-600 text-white" 
              : "bg-muted text-muted-foreground"
          )}
        >
          {isLoading ? '...' : isWorking ? 'בעבודה' : 'לא בעבודה'}
        </Badge>
      </div>
      
      {/* Action button - full width */}
      <Button
        variant={isWorking ? 'destructive' : 'default'}
        size="sm"
        onClick={handleToggle}
        disabled={isPending || isLoading}
        className="w-full h-8 text-xs gap-1.5"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isWorking ? (
          <Square className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
        {isPending 
          ? '...' 
          : isWorking 
            ? 'סיים עבודה' 
            : 'התחל עבודה'
        }
      </Button>
      
      {/* Optional: Show time if working */}
      {isWorking && duration && (
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          {session?.start_time?.slice(0, 5)} • {duration}
        </p>
      )}
    </div>
  );
}
