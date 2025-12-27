import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Shield, Loader2, ArrowRight } from 'lucide-react';

interface MFAVerifyProps {
  onVerified: () => void;
  onCancel?: () => void;
}

export function MFAVerify({ onVerified, onCancel }: MFAVerifyProps) {
  const [verifyCode, setVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      toast({
        title: 'קוד לא תקין',
        description: 'יש להזין קוד בן 6 ספרות',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get the TOTP factors
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

      if (factorsError) {
        toast({
          title: 'שגיאה',
          description: factorsError.message,
          variant: 'destructive',
        });
        return;
      }

      const totpFactor = factors.totp[0];

      if (!totpFactor) {
        toast({
          title: 'שגיאה',
          description: 'לא נמצא אימות דו-שלבי מוגדר',
          variant: 'destructive',
        });
        return;
      }

      // Create challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) {
        toast({
          title: 'שגיאה',
          description: challengeError.message,
          variant: 'destructive',
        });
        return;
      }

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) {
        toast({
          title: 'קוד שגוי',
          description: 'הקוד שהוזן אינו תקין, נסה שנית',
          variant: 'destructive',
        });
        setVerifyCode('');
        return;
      }

      toast({ title: 'אומת בהצלחה!' });
      onVerified();
    } catch (err) {
      console.error('MFA verification error:', err);
      toast({
        title: 'שגיאה באימות',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verifyCode.length === 6) {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md" dir="rtl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle>אימות דו-שלבי</CardTitle>
        <CardDescription>
          הזן את הקוד מאפליקציית Google Authenticator
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="mfa-code">קוד אימות</Label>
          <Input
            id="mfa-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyDown}
            placeholder="123456"
            className="text-center text-2xl tracking-widest font-mono"
            dir="ltr"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              <ArrowRight className="h-4 w-4 ml-2" />
              חזרה
            </Button>
          )}
          <Button
            onClick={handleVerify}
            className={onCancel ? 'flex-1' : 'w-full'}
            disabled={isLoading || verifyCode.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                מאמת...
              </>
            ) : (
              'אמת'
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          פתח את אפליקציית Google Authenticator והזן את הקוד המוצג
        </p>
      </CardContent>
    </Card>
  );
}
