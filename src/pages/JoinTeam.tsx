import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Users, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function JoinTeam() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    loadInvitation();
  }, [code]);

  const loadInvitation = async () => {
    if (!code) {
      setError('קוד הזמנה חסר');
      setLoading(false);
      return;
    }

    try {
      // Use edge function to verify invite code securely
      const { data, error: fetchError } = await supabase.functions.invoke('verify-team-invite', {
        body: { invite_code: code }
      });

      if (fetchError) throw fetchError;

      if (!data.valid) {
        setError(data.error || 'הזמנה לא נמצאה או שפג תוקפה');
      } else {
        setInvitation(data.invitation);
        setEmail(data.invitation.email);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !code) return;

    setSubmitting(true);
    try {
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (signUpError) {
        // If user already exists, they might need to just log in
        if (signUpError.message.includes('already registered')) {
          toast({ 
            title: 'המשתמש כבר רשום', 
            description: 'נסה להתחבר עם הסיסמה שלך',
            variant: 'destructive' 
          });
          navigate('/auth');
          return;
        }
        throw signUpError;
      }

      if (authData.user) {
        // Use the secure function to accept the invitation and create the role
        const { data: accepted, error: acceptError } = await supabase
          .rpc('accept_team_invitation', {
            _invite_code: code,
            _user_id: authData.user.id,
          });

        if (acceptError) {
          console.error('Failed to accept invitation:', acceptError);
          // User was created but role assignment failed - still let them proceed
          toast({ 
            title: 'ההרשמה הושלמה', 
            description: 'יש לפנות למנהל להשלמת ההרשאות',
          });
        } else {
          toast({ title: 'ההרשמה הושלמה בהצלחה!' });
        }
        
        navigate('/auth');
      }
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'מנהל',
    doctor: 'רופא',
    secretary: 'מזכירה',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">שגיאה</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button variant="link" onClick={() => navigate('/')} className="mt-4">
              חזור לדף הבית
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>הצטרף לצוות המרפאה</CardTitle>
          <CardDescription>
            הוזמנת להצטרף כ<strong>{roleLabels[invitation?.role] || invitation?.role}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">שם פרטי</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">שם משפחה</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  נרשם...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 ml-2" />
                  הרשם והצטרף
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
