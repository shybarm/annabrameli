import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthMFAGetAuthenticatorAssuranceLevelResponse } from '@supabase/supabase-js';

type AssuranceLevel = 'aal1' | 'aal2';

interface MFAState {
  isLoading: boolean;
  currentLevel: AssuranceLevel | null;
  nextLevel: AssuranceLevel | null;
  hasMFAEnabled: boolean;
  needsMFAVerification: boolean;
  refreshMFAStatus: () => Promise<void>;
}

export function useMFA(): MFAState {
  const [isLoading, setIsLoading] = useState(true);
  const [currentLevel, setCurrentLevel] = useState<AssuranceLevel | null>(null);
  const [nextLevel, setNextLevel] = useState<AssuranceLevel | null>(null);
  const [hasMFAEnabled, setHasMFAEnabled] = useState(false);

  const checkMFAStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check assurance level
      const { data: aalData, error: aalError }: AuthMFAGetAuthenticatorAssuranceLevelResponse = 
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalError) {
        console.error('Error checking AAL:', aalError);
        return;
      }

      setCurrentLevel(aalData.currentLevel as AssuranceLevel);
      setNextLevel(aalData.nextLevel as AssuranceLevel);

      // Check if user has any verified TOTP factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        console.error('Error listing factors:', factorsError);
        return;
      }

      const hasVerifiedTOTP = factorsData.totp.some(f => f.status === 'verified');
      setHasMFAEnabled(hasVerifiedTOTP);
    } catch (err) {
      console.error('MFA status check failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkMFAStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkMFAStatus();
    });

    return () => subscription.unsubscribe();
  }, [checkMFAStatus]);

  // User needs MFA verification if they have MFA enabled but current level is aal1
  const needsMFAVerification = hasMFAEnabled && currentLevel === 'aal1' && nextLevel === 'aal2';

  return {
    isLoading,
    currentLevel,
    nextLevel,
    hasMFAEnabled,
    needsMFAVerification,
    refreshMFAStatus: checkMFAStatus,
  };
}
