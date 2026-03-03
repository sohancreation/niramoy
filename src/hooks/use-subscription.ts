import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type PlanTier = 'free' | 'pro' | 'premium';

export interface SubscriptionInfo {
  tier: PlanTier;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
  accountCreatedAt: string | null;
  subscription: any | null;
  loading: boolean;
  // Feature access
  canUseAiChat: boolean;
  aiChatLimit: number; // 0 = no access, -1 = unlimited
  canGenerateRemedies: boolean;
  canUseMindCare: boolean;
  canUseFindCare: boolean;
  canUseTracker: boolean;
  canUseDietPlan: boolean;
  canUseExercisePlan: boolean;
  planDurationLimit: number; // days for plan generation
  // Usage tracking
  aiChatUsedToday: number;
  aiChatRemainingToday: number;
  incrementAiChatUsage: () => Promise<boolean>; // returns false if limit reached
  refresh: () => void;
}

const TRIAL_DAYS = 7;

export function useSubscription(): SubscriptionInfo {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);
  const [aiChatUsedToday, setAiChatUsedToday] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const today = new Date().toLocaleDateString('en-CA');

    const [subRes, profileRes, chatUsageRes] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('ai_chat_usage')
        .select('question_count')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle(),
    ]);

    setSubscription(subRes.data);
    setAccountCreatedAt(profileRes.data?.created_at || null);
    setAiChatUsedToday(chatUsageRes.data?.question_count || 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Determine tier
  let tier: PlanTier = 'free';
  if (subscription) {
    if (subscription.plan_type === 'premium') tier = 'premium';
    else if (subscription.plan_type === 'pro') tier = 'pro';
  }

  // Trial logic (for free users only)
  const now = new Date();
  const createdDate = accountCreatedAt ? new Date(accountCreatedAt) : now;
  const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const isTrialActive = tier === 'free' && daysSinceCreation < TRIAL_DAYS;
  const trialDaysRemaining = tier === 'free' ? Math.max(0, TRIAL_DAYS - daysSinceCreation) : 0;
  const trialExpired = tier === 'free' && daysSinceCreation >= TRIAL_DAYS;

  // Feature access rules
  const freeHasAccess = isTrialActive; // during trial, free users get limited access

  // AI Chat limits: free=1/day (trial only), pro=10/day, premium=unlimited
  const aiChatLimit = tier === 'premium' ? -1 : tier === 'pro' ? 10 : (freeHasAccess ? 1 : 0);
  const aiChatRemainingToday = aiChatLimit === -1 ? 999 : Math.max(0, aiChatLimit - aiChatUsedToday);
  const canUseAiChat = aiChatRemainingToday > 0;

  // Remedies: free users can't generate new, only view existing
  const canGenerateRemedies = tier === 'pro' || tier === 'premium';

  // MindCare: not available for free users
  const canUseMindCare = tier === 'pro' || tier === 'premium';

  // FindCare: available for all
  const canUseFindCare = true;

  // Tracker: free trial 7 days only, then subscription needed
  const canUseTracker = tier !== 'free' || freeHasAccess;

  // Diet/Exercise plans: free trial 7 days only
  const canUseDietPlan = tier !== 'free' || freeHasAccess;
  const canUseExercisePlan = tier !== 'free' || freeHasAccess;

  // Plan duration: free=7 days, pro/premium=full
  const planDurationLimit = tier === 'free' ? 7 : 90;

  const incrementAiChatUsage = async (): Promise<boolean> => {
    if (!user) return false;
    if (aiChatLimit !== -1 && aiChatUsedToday >= aiChatLimit) return false;

    const today = new Date().toLocaleDateString('en-CA');
    const newCount = aiChatUsedToday + 1;

    const { error } = await supabase
      .from('ai_chat_usage')
      .upsert(
        { user_id: user.id, usage_date: today, question_count: newCount },
        { onConflict: 'user_id,usage_date' }
      );

    if (!error) {
      setAiChatUsedToday(newCount);
      return true;
    }
    return false;
  };

  return {
    tier,
    isTrialActive,
    trialDaysRemaining,
    trialExpired,
    accountCreatedAt,
    subscription,
    loading,
    canUseAiChat,
    aiChatLimit,
    canGenerateRemedies,
    canUseMindCare,
    canUseFindCare,
    canUseTracker,
    canUseDietPlan,
    canUseExercisePlan,
    planDurationLimit,
    aiChatUsedToday,
    aiChatRemainingToday,
    incrementAiChatUsage,
    refresh: fetchData,
  };
}
