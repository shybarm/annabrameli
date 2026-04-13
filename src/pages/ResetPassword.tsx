import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    // Also check hash for recovery type
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: 'סיסמה קצרה מדי', description: 'הסיסמה חייבת להכיל לפחות 6 תווים', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'הסיסמאות לא תואמות', description: 'אנא ודא שהסיסמאות זהות', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: 'שגיאה באיפוס סיסמה', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'הסיסמה עודכנה בהצלחה' });
      navigate('/auth');
    }
    setIsLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md border-medical-200 shadow-lg">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">טוען...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Stethoscope className="h-10 w-10 text-medical-600" />
            <h1 className="text-2xl font-bold text-medical-800">איפוס סיסמה</h1>
          </div>
        </div>

        <Card className="border-medical-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>הגדר סיסמה חדשה</CardTitle>
            <CardDescription>הזן סיסמה חדשה לחשבון שלך</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">סיסמה חדשה</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                    dir="ltr"
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">אישור סיסמה</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                    dir="ltr"
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'מעדכן...' : 'עדכן סיסמה'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
