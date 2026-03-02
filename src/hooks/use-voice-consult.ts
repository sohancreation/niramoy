import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/use-subscription';
import { supabase } from '@/integrations/supabase/client';

interface VoiceConsultAccess {
  loading: boolean;
  isBlocked: boolean;
  minutesUsedInWindow: number;
  minutesRemainingInWindow: number;
  windowDays: number;
  maxMinutes: number;
  nextAvailableDate: Date | null;
  logSession: (durationSeconds: number) => Promise<void>;
  refresh: () => void;
}

const MAX_MINUTES = 10;

export function useVoiceConsult(): VoiceConsultAccess {
  const { user } = useAuth();
  const { tier, isTrialActive } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [minutesUsedInWindow, setMinutesUsedInWindow] = useState(0);
  const [oldestSessionInWindow, setOldestSessionInWindow] = useState<Date | null>(null);

  // Free users are always blocked
  const isFreeTierBlocked = tier === 'free' && !isTrialActive;

  // Window: trial/pro = 7 days, premium = 3 days
  const windowDays = tier === 'premium' ? 3 : 7;

  const fetchUsage = useCallback(async () => {
    if (!user || isFreeTierBlocked) {
      setLoading(false);
      return;
    }

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - windowDays);

    const { data } = await supabase
      .from('voice_consult_usage')
      .select('duration_seconds, session_date')
      .eq('user_id', user.id)
      .gte('session_date', windowStart.toISOString())
      .order('session_date', { ascending: true });

    if (data && data.length > 0) {
      const totalSeconds = data.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
      setMinutesUsedInWindow(Math.ceil(totalSeconds / 60));
      setOldestSessionInWindow(new Date(data[0].session_date));
    } else {
      setMinutesUsedInWindow(0);
      setOldestSessionInWindow(null);
    }
    setLoading(false);
  }, [user, isFreeTierBlocked, windowDays]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const minutesRemaining = Math.max(0, MAX_MINUTES - minutesUsedInWindow);
  const isBlocked = isFreeTierBlocked || minutesRemaining <= 0;

  // Calculate next available date (when oldest session falls out of window)
  let nextAvailableDate: Date | null = null;
  if (minutesRemaining <= 0 && oldestSessionInWindow) {
    nextAvailableDate = new Date(oldestSessionInWindow);
    nextAvailableDate.setDate(nextAvailableDate.getDate() + windowDays);
  }

  const logSession = async (durationSeconds: number) => {
    if (!user) return;
    await supabase.from('voice_consult_usage').insert({
      user_id: user.id,
      duration_seconds: durationSeconds,
    });
    fetchUsage();
  };

  return {
    loading,
    isBlocked,
    minutesUsedInWindow,
    minutesRemainingInWindow: minutesRemaining,
    windowDays,
    maxMinutes: MAX_MINUTES,
    nextAvailableDate,
    logSession,
    refresh: fetchUsage,
  };
}
