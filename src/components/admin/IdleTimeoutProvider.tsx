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
import { Clock, Square } from 'lucide-react';
import { useWorkSessions } from '@/hooks/useWorkSessions';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const IDLE_TIMEOUT_MS = 45 * 60 * 1000; // 45 minutes
const WARNING_COUNTDOWN_SECONDS = 60; // 60 seconds to respond

interface IdleTimeoutProviderProps {
  children: React.ReactNode;
  isStaff: boolean;
}

export function IdleTimeoutProvider({ children, isStaff }: IdleTimeoutProviderProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_COUNTDOWN_SECONDS);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logoutDeadlineRef = useRef<number | null>(null);
  const isLoggingOutRef = useRef(false);
  
  const { todaySession, clockOut } = useWorkSessions();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const hasActiveSession = todaySession.data && todaySession.data.end_time === null;
  const activeSessionId = todaySession.data?.id;

  // Force logout - called when countdown expires
  const forceLogout = useCallback(async () => {
    // Prevent multiple logout calls
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setIsLoggingOut(true);
    
    // Clear all timers
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    logoutDeadlineRef.current = null;
    
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Force logout error:', error);
      // Even on error, redirect to auth
      navigate('/auth');
    }
  }, [signOut, navigate]);

  // Handle manual logout with optional clock out
  const handleLogout = useCallback(async (shouldClockOut: boolean = false) => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setIsLoggingOut(true);
    
    // Clear all timers
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    logoutDeadlineRef.current = null;
    
    try {
      if (shouldClockOut && activeSessionId) {
        await clockOut.mutateAsync(activeSessionId);
        toast.success('שעות העבודה נעצרו');
      }
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast.error('שגיאה ביציאה מהמערכת');
      isLoggingOutRef.current = false;
      setIsLoggingOut(false);
    }
  }, [activeSessionId, clockOut, signOut, navigate]);

  // Start the warning countdown with deadline-based approach
  const startWarningCountdown = useCallback(() => {
    // Set absolute deadline for logout
    const deadline = Date.now() + (WARNING_COUNTDOWN_SECONDS * 1000);
    logoutDeadlineRef.current = deadline;
    setCountdown(WARNING_COUNTDOWN_SECONDS);
    setShowWarning(true);
    
    // Clear any existing countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    // Use interval to check deadline - robust against tab throttling
    countdownIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const deadlineTime = logoutDeadlineRef.current;
      
      if (!deadlineTime) {
        // Deadline was cleared (user clicked stay logged in)
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        return;
      }
      
      const remainingMs = deadlineTime - now;
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      if (remainingMs <= 0) {
        // Time's up - force logout immediately
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(0);
        forceLogout();
      } else {
        setCountdown(remainingSeconds);
      }
    }, 1000);
  }, [forceLogout]);

  // Reset idle timer - called on user activity
  const resetIdleTimer = useCallback(() => {
    // Don't reset if warning is showing or logging out
    if (showWarning || isLoggingOutRef.current) return;
    
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    if (!isStaff) return;
    
    idleTimerRef.current = setTimeout(() => {
      startWarningCountdown();
    }, IDLE_TIMEOUT_MS);
  }, [isStaff, showWarning, startWarningCountdown]);

  // Handle "stay logged in" button click
  const handleStayLoggedIn = useCallback(() => {
    // Clear the deadline first to stop the countdown
    logoutDeadlineRef.current = null;
    
    // Clear countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // Hide warning and reset countdown display
    setShowWarning(false);
    setCountdown(WARNING_COUNTDOWN_SECONDS);
    
    // Reset idle timer for another 45 minutes
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    idleTimerRef.current = setTimeout(() => {
      startWarningCountdown();
    }, IDLE_TIMEOUT_MS);
  }, [startWarningCountdown]);

  // Handle clock out and logout button click
  const handleClockOutAndLogout = useCallback(() => {
    handleLogout(true);
  }, [handleLogout]);

  // Set up activity listeners
  useEffect(() => {
    if (!isStaff) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      // Only reset if warning is NOT showing
      if (!showWarning && !isLoggingOutRef.current) {
        resetIdleTimer();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial idle timer
    resetIdleTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isStaff, showWarning, resetIdleTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      logoutDeadlineRef.current = null;
    };
  }, []);

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
