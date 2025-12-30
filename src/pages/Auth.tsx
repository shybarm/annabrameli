import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMFA } from '@/hooks/useMFA';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, Mail, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MFAVerify } from '@/components/auth/MFAVerify';
import { MFAEnroll } from '@/components/auth/MFAEnroll';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showMFAVerify, setShowMFAVerify] = useState(false);
  const [showMFAEnroll, setShowMFAEnroll] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user, loading, rolesLoading, isStaff, isPatient, isAdmin, isDoctor, roles } = useAuth();
  const { needsMFAVerification, hasMFAEnabled, isLoading: mfaLoading, refreshMFAStatus } = useMFA();

  // Check if user has secretary role
  const isSecretary = roles.includes('secretary');

  // Determine if user requires mandatory MFA (admin, doctor, or secretary)
  const requiresMandatoryMFA = isAdmin || isDoctor || isSecretary;

  // Check if MFA verification is needed after login
  useEffect(() => {
    if (!loading && !rolesLoading && !mfaLoading && user) {
      if (requiresMandatoryMFA) {
        // Staff with mandatory MFA requirement
        if (!hasMFAEnabled) {
          // Need to enroll in MFA first
          setShowMFAEnroll(true);
          setShowMFAVerify(false);
        } else if (needsMFAVerification) {
          // MFA enabled but needs verification
          setShowMFAVerify(true);
          setShowMFAEnroll(false);
        }
      } else if (needsMFAVerification) {
        // Optional MFA users who have it enabled
        setShowMFAVerify(true);
      }
    }
  }, [loading, rolesLoading, mfaLoading, user, needsMFAVerification, hasMFAEnabled, requiresMandatoryMFA]);

  // Redirect authenticated staff users after roles are loaded and MFA requirements met
  useEffect(() => {
    if (!loading && !rolesLoading && !mfaLoading && user && !showMFAVerify && !showMFAEnroll) {
      // Check if staff user meets MFA requirements
      if (requiresMandatoryMFA && !hasMFAEnabled) {
        // Still needs to enroll, don't redirect
        return;
      }
      if (needsMFAVerification) {
        // Still needs verification, don't redirect
        return;
      }
      
      // Only staff can access admin - patients are not allowed to login
      if (isStaff) {
        navigate('/admin');
      } else {
        // Non-staff users: sign them out and show error
        toast({
          title: 'גישה מוגבלת',
          description: 'כניסה למערכת מיועדת לצוות המרפאה בלבד',
          variant: 'destructive',
        });
      }
    }
  }, [loading, rolesLoading, mfaLoading, user, isStaff, needsMFAVerification, hasMFAEnabled, requiresMandatoryMFA, showMFAVerify, showMFAEnroll, navigate]);

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

  const handleMFAEnrolled = async () => {
    setShowMFAEnroll(false);
    await refreshMFAStatus();
    toast({
      title: 'אימות דו-שלבי הופעל',
      description: 'החשבון שלך מאובטח כעת',
    });
    // Navigation will be handled by useEffect
  };

  // Show mandatory MFA enrollment screen for admin/doctor
  if (showMFAEnroll && user && requiresMandatoryMFA) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Stethoscope className="h-10 w-10 text-medical-600" />
              <h1 className="text-2xl font-bold text-medical-800">מערכת ניהול מרפאה</h1>
            </div>
            <p className="text-muted-foreground">ד״ר אנה ברמלי</p>
          </div>
          
          {/* Mandatory MFA Warning */}
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                    אימות דו-שלבי נדרש
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    לצורך אבטחת המידע הרפואי, כל צוות המרפאה נדרש להפעיל אימות דו-שלבי לפני הכניסה למערכת.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <MFAEnroll
            onEnrolled={handleMFAEnrolled}
            onCancelled={() => {
              // Can't cancel - it's mandatory
              toast({
                title: 'אימות דו-שלבי נדרש',
                description: 'יש להפעיל אימות דו-שלבי כדי להמשיך',
                variant: 'destructive',
              });
            }}
            hideCancelButton={true}
          />
        </div>
      </div>
    );
  }

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
                </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}