import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Shield, ShieldCheck, ShieldOff, Loader2, Trash2 } from 'lucide-react';
import { MFAEnroll } from './MFAEnroll';

interface MFAFactor {
  id: string;
  friendly_name: string | null;
  factor_type: string;
  status: string;
  created_at: string;
}

export function MFASettings() {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [factorToRemove, setFactorToRemove] = useState<MFAFactor | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error('Error loading MFA factors:', error);
        return;
      }

      // Only show verified factors
      const verifiedFactors = data.totp.filter(f => f.status === 'verified');
      setFactors(verifiedFactors as MFAFactor[]);
    } catch (err) {
      console.error('Failed to load MFA factors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFactor = async () => {
    if (!factorToRemove) return;

    setIsRemoving(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorToRemove.id,
      });

      if (error) {
        toast({
          title: 'שגיאה בהסרת אימות דו-שלבי',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({ title: 'אימות דו-שלבי הוסר בהצלחה' });
      setShowRemoveDialog(false);
      setFactorToRemove(null);
      loadFactors();
    } catch (err) {
      console.error('Error removing factor:', err);
      toast({
        title: 'שגיאה',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const confirmRemove = (factor: MFAFactor) => {
    setFactorToRemove(factor);
    setShowRemoveDialog(true);
  };

  if (showEnroll) {
    return (
      <div className="flex justify-center">
        <MFAEnroll
          onEnrolled={() => {
            setShowEnroll(false);
            loadFactors();
          }}
          onCancelled={() => setShowEnroll(false)}
        />
      </div>
    );
  }

  return (
    <>
      <Card dir="rtl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>אימות דו-שלבי (2FA)</CardTitle>
              <CardDescription>
                הגן על החשבון שלך עם Google Authenticator
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : factors.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-300">
                    אימות דו-שלבי מופעל
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    החשבון שלך מוגן עם Google Authenticator
                  </p>
                </div>
              </div>

              {factors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        {factor.friendly_name || 'Google Authenticator'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        נוסף: {new Date(factor.created_at).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => confirmRemove(factor)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <ShieldOff className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    אימות דו-שלבי לא מופעל
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    מומלץ להפעיל אימות דו-שלבי להגנה נוספת
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowEnroll(true)} className="w-full">
                <Shield className="h-4 w-4 ml-2" />
                הפעל אימות דו-שלבי
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הסרת אימות דו-שלבי</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך להסיר את אימות הדו-שלבי? פעולה זו תפחית את רמת האבטחה של החשבון שלך.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              disabled={isRemoving}
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveFactor}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  מסיר...
                </>
              ) : (
                'הסר אימות דו-שלבי'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
