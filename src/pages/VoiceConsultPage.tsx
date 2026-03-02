import React, { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useVoiceConsult } from '@/hooks/use-voice-consult';
import { useSubscription } from '@/hooks/use-subscription';
import VapiWellnessChat from '@/components/VapiWellnessChat';
import SubscriptionGate from '@/components/SubscriptionGate';
import { HeartPulse, ArrowLeft, Timer, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function VoiceConsultPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const { tier, isTrialActive } = useSubscription();
  const {
    loading,
    isBlocked,
    minutesUsedInWindow,
    minutesRemainingInWindow,
    windowDays,
    maxMinutes,
    nextAvailableDate,
    logSession,
  } = useVoiceConsult();

  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);

  const isFreeBlocked = tier === 'free' && !isTrialActive;

  // Clamp session options to remaining minutes
  const allOptions = [3, 5, 7];
  const availableOptions = allOptions.filter(m => m <= minutesRemainingInWindow);

  const handleCallEnd = (durationSeconds: number) => {
    logSession(durationSeconds);
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4 gap-1 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {lang === 'en' ? 'Back' : 'ফিরে যান'}
      </Button>

      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <HeartPulse className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {lang === 'en' ? 'Mental Wellness Voice Consult' : 'মানসিক সুস্থতা ভয়েস পরামর্শ'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'en'
            ? 'Talk to our AI wellness consultant for stress, anxiety, or emotional support.'
            : 'চাপ, উদ্বেগ বা মানসিক সহায়তার জন্য আমাদের এআই পরামর্শকের সাথে কথা বলুন।'}
        </p>
      </div>

      <SubscriptionGate
        allowed={!isFreeBlocked}
        featureName={{ en: 'Voice Consult', bn: 'ভয়েস পরামর্শ' }}
        message={{
          en: 'Voice Consult is available for trial, Pro, and AI+ subscribers.',
          bn: 'ভয়েস পরামর্শ ট্রায়াল, প্রো এবং AI+ সাবস্ক্রাইবারদের জন্য উপলব্ধ।'
        }}
      >
        {/* Usage info banner */}
        {!loading && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {lang === 'en'
                  ? `${minutesUsedInWindow}/${maxMinutes} min used (resets every ${windowDays} days)`
                  : `${minutesUsedInWindow}/${maxMinutes} মিনিট ব্যবহৃত (প্রতি ${windowDays} দিনে রিসেট)`}
              </span>
            </div>
            <Badge variant={minutesRemainingInWindow > 0 ? 'secondary' : 'destructive'}>
              {minutesRemainingInWindow > 0
                ? (lang === 'en' ? `${minutesRemainingInWindow} min left` : `${minutesRemainingInWindow} মিনিট বাকি`)
                : (lang === 'en' ? 'Limit reached' : 'সীমা শেষ')}
            </Badge>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-6">
          {isBlocked && !isFreeBlocked ? (
            // Quota exhausted
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Timer className="h-8 w-8 text-destructive" />
              </div>
              <p className="font-semibold text-foreground text-lg">
                {lang === 'en' ? 'Session Limit Reached' : 'সেশনের সীমা শেষ'}
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                {lang === 'en'
                  ? `You've used all ${maxMinutes} minutes for this ${windowDays}-day window.${nextAvailableDate ? ` Next session available ${nextAvailableDate.toLocaleDateString()}.` : ''}`
                  : `আপনি এই ${windowDays}-দিনের উইন্ডোতে সব ${maxMinutes} মিনিট ব্যবহার করেছেন।${nextAvailableDate ? ` পরবর্তী সেশন ${nextAvailableDate.toLocaleDateString()} এ উপলব্ধ।` : ''}`}
              </p>
            </div>
          ) : !selectedMinutes ? (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Timer className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-lg">
                {lang === 'en' ? 'Choose Session Duration' : 'সেশনের সময় নির্বাচন করুন'}
              </p>
              <div className="flex gap-3">
                {allOptions.map((min) => {
                  const disabled = min > minutesRemainingInWindow;
                  return (
                    <Button
                      key={min}
                      variant="outline"
                      size="lg"
                      disabled={disabled}
                      className="flex flex-col items-center gap-1 h-auto py-4 px-6 hover:border-primary hover:bg-primary/5 disabled:opacity-40"
                      onClick={() => setSelectedMinutes(min)}
                    >
                      <span className="text-2xl font-bold text-foreground">{min}</span>
                      <span className="text-xs text-muted-foreground">
                        {lang === 'en' ? 'min' : 'মিনিট'}
                      </span>
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {lang === 'en'
                  ? 'The call will auto-end after the selected duration.'
                  : 'নির্বাচিত সময়ের পর কলটি স্বয়ংক্রিয়ভাবে শেষ হবে।'}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMinutes(null)}
                  className="text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {lang === 'en' ? 'Change duration' : 'সময় পরিবর্তন'}
                </Button>
                <span className="text-sm font-medium text-muted-foreground">
                  {selectedMinutes} {lang === 'en' ? 'min session' : 'মিনিট সেশন'}
                </span>
              </div>
              <VapiWellnessChat
                lang={lang}
                maxDurationSeconds={selectedMinutes * 60}
                onCallEnded={handleCallEnd}
              />
            </div>
          )}
        </div>
      </SubscriptionGate>
    </div>
  );
}
