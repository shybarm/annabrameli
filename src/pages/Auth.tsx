import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMFA } from '@/hooks/useMFA';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stethoscope, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MFAVerify } from '@/components/auth/MFAVerify';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showMFAVerify, setShowMFAVerify] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user, loading, rolesLoading, isStaff, isPatient } = useAuth();
  const { needsMFAVerification, isLoading: mfaLoading, refreshMFAStatus } = useMFA();

  // Check if MFA verification is needed after login
  useEffect(() => {
    if (!loading && !mfaLoading && user && needsMFAVerification) {
      setShowMFAVerify(true);
    }
  }, [loading, mfaLoading, user, needsMFAVerification]);

  // Redirect authenticated users after roles are loaded and MFA is verified
  useEffect(() => {
    if (!loading && !rolesLoading && !mfaLoading && user && !needsMFAVerification && !showMFAVerify) {
      if (isStaff) {
        navigate('/admin');
      } else {
        navigate('/portal');
      }
    }
  }, [loading, rolesLoading, mfaLoading, user, isStaff, isPatient, needsMFAVerification, showMFAVerify, navigate]);

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
            <CardTitle>כניסה למערכת</CardTitle>
            <CardDescription>התחבר לחשבון שלך או צור חשבון חדש</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">התחברות</TabsTrigger>
                <TabsTrigger value="signup">הרשמה</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
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
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">שם פרטי</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          name="firstName"
                          placeholder="שם פרטי"
                          required
                          className="pr-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">שם משפחה</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="שם משפחה"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
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
                    <Label htmlFor="signup-password">סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="לפחות 6 תווים"
                        required
                        minLength={6}
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? 'נרשם...' : 'הרשמה'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}