import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Crown, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/use-subscription';

export default function SubscriptionBanner() {
  const { lang } = useLang();
  const { tier, isTrialActive, trialDaysRemaining, trialExpired, subscription, loading } = useSubscription();

  if (loading) return null;

  // Free user on trial — compact inline badge
  if (tier === 'free' && isTrialActive) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="font-medium text-foreground">
          {lang === 'en' ? `Trial: ${trialDaysRemaining}d left` : `ট্রায়াল: ${trialDaysRemaining} দিন`}
        </span>
        <Link to="/pricing">
          <span className="text-primary font-semibold hover:underline cursor-pointer">
            {lang === 'en' ? 'Upgrade' : 'আপগ্রেড'}
          </span>
        </Link>
      </div>
    );
  }

  // Free user trial expired — compact warning
  if (tier === 'free' && trialExpired) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
        <span className="font-medium text-foreground">
          {lang === 'en' ? 'Trial expired' : 'ট্রায়াল শেষ'}
        </span>
        <Link to="/pricing">
          <span className="text-destructive font-semibold hover:underline cursor-pointer">
            {lang === 'en' ? 'Subscribe' : 'সাবস্ক্রাইব'}
          </span>
        </Link>
      </div>
    );
  }

  // Subscribed user
  if (subscription) {
    const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;
    const now = new Date();
    const daysRemaining = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;
    const isLow = daysRemaining !== null && daysRemaining <= 10;
    const planLabel = subscription.plan_type === 'pro' ? 'Pro' : subscription.plan_type === 'premium' ? 'AI+' : subscription.plan_type;

    // ≤10 days remaining — show big urgent banner with upgrade/renew button
    if (isLow) {
      return (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-destructive/20 p-2 rounded-full">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">
              ⚠️ {planLabel} — {lang === 'en' ? 'Expiring Soon!' : 'মেয়াদ শেষ হচ্ছে!'}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {lang === 'en'
                  ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                  : `${daysRemaining} দিন বাকি`}
              </span>
            </div>
          </div>
          <Link to="/pricing">
            <Button size="sm" variant="destructive" className="text-xs">
              {lang === 'en' ? 'Renew Now' : 'রিনিউ করুন'}
            </Button>
          </Link>
        </div>
      );
    }

    // >10 days — compact active badge
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 text-xs">
        <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--success))] shrink-0" />
        <span className="font-medium text-foreground">
          {planLabel} {lang === 'en' ? 'Active' : 'সক্রিয়'}
          {daysRemaining !== null && ` · ${daysRemaining}d`}
        </span>
      </div>
    );
  }

  return null;
}
