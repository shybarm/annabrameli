import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMFA } from '@/hooks/useMFA';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MFAVerify } from '@/components/auth/MFAVerify';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showMFAVerify, setShowMFAVerify] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Same-origin relative path only, so OAuth consent flows can return here safely.
  const nextParam = searchParams.get('next');
  const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;

  const { signIn, signUp, user, loading, rolesLoading, isStaff } = useAuth();
  const { needsMFAVerification, isLoading: mfaLoading, refreshMFAStatus } = useMFA();

  useEffect(() => {
    if (!loading && !rolesLoading && !mfaLoading && user) {
      setShowMFAVerify(needsMFAVerification);
    }
  }, [loading, rolesLoading, mfaLoading, user, needsMFAVerification]);

  // Redirect authenticated staff users after roles are loaded and MFA requirements met
  useEffect(() => {
    if (!loading && !rolesLoading && !mfaLoading && user && !showMFAVerify) {
      if (needsMFAVerification) {
        // Still needs verification, don't redirect
        return;
      }
      
      // Only staff can access admin - patients are not allowed to login
      if (isStaff) {
        navigate(safeNext ?? '/admin');
      } else {
        // Non-staff users: sign them out and show error
        toast({
          title: 'גישה מוגבלת',
          description: 'כניסה למערכת מיועדת לצוות המרפאה בלבד',
          variant: 'destructive',
        });
      }
    }
  }, [loading, rolesLoading, mfaLoading, user, isStaff, needsMFAVerification, showMFAVerify, navigate, safeNext]);


  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'שגיאה בהתחברות',
        description: error.message === 'Invalid login credentials' 
          ? 'פרטי התחברות שגויים'
          : error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    } else {
      toast({ title: 'התחברת בהצלחה' });
      // Refresh MFA status to check if verification is needed
      await refreshMFAStatus();
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    if (password.length < 6) {
      toast({
        title: 'סיסמה קצרה מדי',
        description: 'הסיסמה חייבת להכיל לפחות 6 תווים',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, firstName, lastName);

    if (error) {
      const message = error.message.includes('already registered')
        ? 'כתובת האימייל כבר רשומה במערכת'
        : error.message;
      toast({
        title: 'שגיאה בהרשמה',
        description: message,
        variant: 'destructive',
      });
      setIsLoading(false);
    } else {
      toast({ 
        title: 'נרשמת בהצלחה!',
        description: 'ברוכים הבאים למערכת',
      });
      // Navigation handled by useEffect after roles are fetched
    }
  };

  const handleMFAVerified = async () => {
    setShowMFAVerify(false);
    await refreshMFAStatus();
    // Navigation will be handled by useEffect
  };

  // Show MFA verification screen
  if (showMFAVerify && user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Stethoscope className="h-10 w-10 text-medical-600" />
              <h1 className="text-2xl font-bold text-medical-800">מערכת ניהול מרפאה</h1>
            </div>
            <p className="text-muted-foreground">ד״ר אנה ברמלי</p>
          </div>
          <MFAVerify onVerified={handleMFAVerified} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-medical-700 hover:text-medical-800 transition-colors mb-4">
            <ArrowRight className="h-4 w-4" />
            <span>חזרה לאתר</span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Stethoscope className="h-10 w-10 text-medical-600" />
            <h1 className="text-2xl font-bold text-medical-800">מערכת ניהול מרפאה</h1>
          </div>
          <p className="text-muted-foreground">ד״ר אנה ברמלי</p>
        </div>

        <Card className="border-medical-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>כניסה לצוות המרפאה</CardTitle>
            <CardDescription>התחבר לחשבון צוות המרפאה שלך</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        required
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? 'מתחבר...' : 'התחבר'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    שכחת סיסמה?
                  </button>
                </form>

            {showForgotPassword && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <Label htmlFor="forgot-email">הזן את כתובת האימייל שלך</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your@email.com"
                  dir="ltr"
                />
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={isLoading || !forgotEmail}
                  onClick={async () => {
                    setIsLoading(true);
                    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) {
                      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
                    } else {
                      toast({ title: 'נשלח בהצלחה', description: 'קישור לאיפוס סיסמה נשלח לאימייל שלך' });
                      setShowForgotPassword(false);
                    }
                    setIsLoading(false);
                  }}
                >
                  {isLoading ? 'שולח...' : 'שלח קישור איפוס'}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  חזרה להתחברות
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}