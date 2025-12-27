import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Shield, Smartphone, Copy, Check, Loader2 } from 'lucide-react';

interface MFAEnrollProps {
  onEnrolled: () => void;
  onCancelled: () => void;
}

export function MFAEnroll({ onEnrolled, onCancelled }: MFAEnrollProps) {
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    enrollMFA();
  }, []);

  const enrollMFA = async () => {
    setIsEnrolling(true);
    try {
      // First, check for and remove any existing unverified factors
      const { data: existingFactors } = await supabase.auth.mfa.listFactors();
      if (existingFactors?.totp) {
        for (const factor of existingFactors.totp) {
          if (factor.status !== 'verified') {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          }
        }
      }

      // Now enroll a new factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Google Authenticator',
      });

      if (error) {
        toast({
          title: 'שגיאה בהפעלת אימות דו-שלבי',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (data.type === 'totp') {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      }
    } catch (err) {
      console.error('MFA enrollment error:', err);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהפעלת אימות דו-שלבי',
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'הקוד הסודי הועתק' });
    } catch {
      toast({
        title: 'שגיאה בהעתקה',
        variant: 'destructive',
      });
    }
  };

  const verifyAndEnable = async () => {
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
      // Challenge the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
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
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) {
        toast({
          title: 'קוד שגוי',
          description: 'הקוד שהוזן אינו תקין, נסה שנית',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'אימות דו-שלבי הופעל בהצלחה!',
        description: 'החשבון שלך מוגן כעת עם אימות דו-שלבי',
      });
      onEnrolled();
    } catch (err) {
      console.error('Verification error:', err);
      toast({
        title: 'שגיאה באימות',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEnrolling) {
    return (
      <Card className="w-full max-w-md" dir="rtl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md" dir="rtl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle>הפעלת אימות דו-שלבי</CardTitle>
        <CardDescription>
          סרוק את קוד ה-QR באפליקציית Google Authenticator
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          {qrCode && (
            <img
              src={qrCode}
              alt="QR Code for 2FA"
              className="w-48 h-48 border rounded-lg"
            />
          )}
        </div>

        {/* Manual entry option */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            או הזן את הקוד הסודי ידנית:
          </Label>
          <div className="flex gap-2">
            <Input
              value={secret}
              readOnly
              className="font-mono text-xs"
              dir="ltr"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copySecret}
              title="העתק קוד"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Verification code input */}
        <div className="space-y-2">
          <Label htmlFor="verify-code">הזן את הקוד מהאפליקציה</Label>
          <Input
            id="verify-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="text-center text-2xl tracking-widest font-mono"
            dir="ltr"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancelled}
            className="flex-1"
            disabled={isLoading}
          >
            ביטול
          </Button>
          <Button
            onClick={verifyAndEnable}
            className="flex-1"
            disabled={isLoading || verifyCode.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                מאמת...
              </>
            ) : (
              'הפעל אימות דו-שלבי'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
