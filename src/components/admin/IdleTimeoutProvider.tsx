import { useEffect, useRef, useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, Square } from 'lucide-react';
import { useWorkSessions } from '@/hooks/useWorkSessions';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const IDLE_TIMEOUT_MS = 45 * 60 * 1000; // 45 minutes
const WARNING_COUNTDOWN_MS = 60 * 1000; // 60 seconds to respond

interface IdleTimeoutProviderProps {
  children: React.ReactNode;
  isStaff: boolean;
}

export function IdleTimeoutProvider({ children, isStaff }: IdleTimeoutProviderProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  
  const { todaySession, clockOut } = useWorkSessions();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const hasActiveSession = todaySession.data && todaySession.data.end_time === null;
  const activeSessionId = todaySession.data?.id;

  const handleLogout = useCallback(async (shouldClockOut: boolean = false) => {
    setIsLoggingOut(true);
    try {
      if (shouldClockOut && activeSessionId) {
        await clockOut.mutateAsync(activeSessionId);
        toast.success('שעות העבודה נעצרו');
      }
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast.error('שגיאה ביציאה מהמערכת');
      setIsLoggingOut(false);
    }
  }, [activeSessionId, clockOut, signOut, navigate]);

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    if (!isStaff || showWarning) return;
    
    idleTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(60);
    }, IDLE_TIMEOUT_MS);
  }, [isStaff, showWarning]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    resetIdleTimer();
  };

  const handleClockOutAndLogout = () => {
    handleLogout(true);
  };

  // Set up activity listeners
  useEffect(() => {
    if (!isStaff) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      if (!showWarning) {
        resetIdleTimer();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer
    resetIdleTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [isStaff, showWarning, resetIdleTimer]);

  // Countdown timer when warning is shown
  useEffect(() => {
    if (!showWarning) return;

    setCountdown(60);
    
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Time's up - auto logout WITHOUT clockOut (compliance-safe)
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
          }
          handleLogout(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [showWarning, handleLogout]);

  if (!isStaff) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      <AlertDialog open={showWarning} onOpenChange={() => {}}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-7 w-7 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-center">
              חוסר פעילות
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-2">
              <p>היית לא פעיל/ה 45 דקות.</p>
              {hasActiveSession ? (
                <p>האם לעצור שעות עבודה ולצאת?</p>
              ) : (
                <p>תתנתק/י אוטומטית בעוד {countdown} שניות.</p>
              )}
              <div className="mt-4 text-2xl font-bold text-foreground">
                {countdown} שניות
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2">
            {hasActiveSession && (
              <Button
                onClick={handleClockOutAndLogout}
                disabled={isLoggingOut}
                className="w-full"
              >
                <Square className="h-4 w-4 ml-2" />
                {isLoggingOut ? 'יוצא...' : 'עצור וצא'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleStayLoggedIn}
              disabled={isLoggingOut}
              className="w-full"
            >
              הישאר מחובר/ת
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
