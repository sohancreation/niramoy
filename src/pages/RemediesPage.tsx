import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLang } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { homeRemedies } from '@/lib/health-utils';
import { useSubscription } from '@/hooks/use-subscription';
import { Leaf, AlertTriangle, Search, Loader2, Stethoscope, Apple, Ban, Hospital, Sparkles, ShieldAlert, ShieldCheck, Shield, Lock, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function RemediesPage() {
  const { lang } = useLang();
  const { canGenerateRemedies } = useSubscription();
  const [diseaseInput, setDiseaseInput] = useState('');
  const [symptomsInput, setSymptomsInput] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!diseaseInput.trim() && !symptomsInput.trim()) {
      toast.error(lang === 'en' ? 'Please describe your condition or symptoms' : 'অনুগ্রহ করে আপনার অবস্থা বা লক্ষণ বর্ণনা করুন');
      return;
    }
    setLoading(true);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-remedy-suggest', {
        body: { disease: diseaseInput, symptoms: symptomsInput, lang },
      });
      if (error) throw error;
      setAiResult(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to get suggestions');
    }
    setLoading(false);
  };

  const severityConfig = {
    critical: { icon: ShieldAlert, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', label: { en: '🚨 Critical - See a Doctor Immediately!', bn: '🚨 জরুরি - এখনই ডাক্তার দেখান!' } },
    moderate: { icon: Shield, color: 'text-warning', bg: 'bg-warning/10 border-warning/30', label: { en: '⚠️ Moderate - Consider Seeing a Doctor', bn: '⚠️ মাঝারি - ডাক্তার দেখানো বিবেচনা করুন' } },
    mild: { icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10 border-success/30', label: { en: '✅ Mild - Home Remedies May Help', bn: '✅ হালকা - ঘরোয়া প্রতিকার সাহায্য করতে পারে' } },
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
          <Leaf className="h-8 w-8 text-success" />
          {t('remedies', lang)}
        </h1>

        {/* AI Disease Search */}
        {canGenerateRemedies ? (
        <div className="health-card space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-warning" />
            <h3 className="font-heading font-semibold text-foreground">
              {lang === 'en' ? 'AI Health Advisor' : 'এআই স্বাস্থ্য উপদেষ্টা'}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {lang === 'en' 
              ? 'Describe your disease or symptoms to get personalized remedies and advice.' 
              : 'ব্যক্তিগত প্রতিকার এবং পরামর্শ পেতে আপনার রোগ বা লক্ষণ বর্ণনা করুন।'}
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {lang === 'en' ? '🩺 Disease / Condition' : '🩺 রোগ / অবস্থা'}
              </label>
              <input
                value={diseaseInput}
                onChange={e => setDiseaseInput(e.target.value)}
                placeholder={lang === 'en' ? 'e.g. Diabetes, Cold, Back Pain, Migraine...' : 'যেমন ডায়াবেটিস, সর্দি, পিঠে ব্যথা, মাইগ্রেন...'}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {lang === 'en' ? '📝 Describe Symptoms (optional)' : '📝 লক্ষণ বর্ণনা করুন (ঐচ্ছিক)'}
              </label>
              <textarea
                value={symptomsInput}
                onChange={e => setSymptomsInput(e.target.value)}
                placeholder={lang === 'en' 
                  ? 'e.g. I have been having headaches for 3 days, with nausea and sensitivity to light...' 
                  : 'যেমন ৩ দিন ধরে মাথাব্যথা হচ্ছে, বমি ভাব এবং আলোতে সমস্যা...'}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="gradient-primary border-0 text-primary-foreground w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading 
                ? (lang === 'en' ? 'Analyzing...' : 'বিশ্লেষণ হচ্ছে...') 
                : (lang === 'en' ? 'Get AI Advice' : 'এআই পরামর্শ নিন')}
            </Button>
          </div>
        </div>
        ) : (
        <div className="health-card space-y-4 opacity-80">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-heading font-semibold text-foreground">
              {lang === 'en' ? 'AI Health Advisor' : 'এআই স্বাস্থ্য উপদেষ্টা'}
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">PRO</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {lang === 'en'
              ? 'AI-powered remedy generation is available with Niramoy Pro or AI+ subscription. Browse the common remedies below for free.'
              : 'AI-চালিত প্রতিকার তৈরি নিরাময় Pro বা AI+ সাবস্ক্রিপশনে পাওয়া যায়। নিচের সাধারণ প্রতিকারগুলো বিনামূল্যে দেখুন।'}
          </p>
          <Link to="/pricing">
            <Button className="gradient-primary border-0 text-primary-foreground w-full gap-2">
              <Crown className="h-4 w-4" />
              {lang === 'en' ? 'Upgrade to Unlock AI Advisor' : 'AI উপদেষ্টা আনলক করতে আপগ্রেড করুন'}
            </Button>
          </Link>
        </div>
        )}

        {/* AI Result */}
        {aiResult && (
          <div className="space-y-4 animate-in slide-in-from-top-2">
            {/* Severity Banner */}
            {aiResult.severity && (
              <div className={`rounded-xl border p-4 flex items-center gap-3 ${severityConfig[aiResult.severity as keyof typeof severityConfig]?.bg || severityConfig.moderate.bg}`}>
                {(() => {
                  const config = severityConfig[aiResult.severity as keyof typeof severityConfig] || severityConfig.moderate;
                  const Icon = config.icon;
                  return <Icon className={`h-6 w-6 ${config.color} shrink-0`} />;
                })()}
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {severityConfig[aiResult.severity as keyof typeof severityConfig]?.label[lang] || ''}
                  </p>
                  {aiResult.condition_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {aiResult.condition_name[lang] || aiResult.condition_name.en}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Doctor Warning for critical */}
            {aiResult.severity === 'critical' && aiResult.doctor_warning && (
              <div className="health-card border-destructive/30 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <Hospital className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive text-sm mb-1">
                      {lang === 'en' ? 'Seek Medical Help Immediately' : 'অবিলম্বে চিকিৎসা সহায়তা নিন'}
                    </p>
                    <p className="text-sm text-foreground">
                      {aiResult.doctor_warning[lang] || aiResult.doctor_warning.en}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Remedies */}
            {aiResult.remedies && aiResult.remedies.length > 0 && (
              <div className="health-card">
                <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  {lang === 'en' ? 'Recommended Remedies' : 'প্রস্তাবিত প্রতিকার'}
                </h3>
                <div className="space-y-3">
                  {aiResult.remedies.map((r: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                        r.type === 'home' ? 'bg-success/10 text-success' : r.type === 'medical' ? 'bg-info/10 text-info' : 'bg-accent/10 text-accent'
                      }`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm text-foreground">{r[lang] || r.en}</p>
                        {r.type && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${
                            r.type === 'home' ? 'bg-success/10 text-success' : r.type === 'medical' ? 'bg-info/10 text-info' : 'bg-accent/10 text-accent'
                          }`}>
                            {r.type === 'home' ? (lang === 'en' ? 'Home Remedy' : 'ঘরোয়া') : r.type === 'medical' ? (lang === 'en' ? 'Medical' : 'চিকিৎসা') : (lang === 'en' ? 'Lifestyle' : 'জীবনধারা')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diet Tips */}
            {aiResult.diet_tips && aiResult.diet_tips.length > 0 && (
              <div className="health-card">
                <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Apple className="h-5 w-5 text-success" />
                  {lang === 'en' ? 'Diet Tips' : 'খাদ্য পরামর্শ'}
                </h3>
                <ul className="space-y-2">
                  {aiResult.diet_tips.map((d: any, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-success mt-0.5">✓</span>
                      {d[lang] || d.en}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What to Avoid */}
            {aiResult.avoid && aiResult.avoid.length > 0 && (
              <div className="health-card">
                <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Ban className="h-5 w-5 text-destructive" />
                  {lang === 'en' ? 'What to Avoid' : 'যা এড়িয়ে চলুন'}
                </h3>
                <ul className="space-y-2">
                  {aiResult.avoid.map((a: any, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-destructive mt-0.5">✗</span>
                      {a[lang] || a.en}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* When to See Doctor */}
            {aiResult.when_to_see_doctor && (
              <div className="flex items-start gap-2 p-4 rounded-xl bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  {aiResult.when_to_see_doctor[lang] || aiResult.when_to_see_doctor.en}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Existing Common Remedies */}
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Leaf className="h-5 w-5 text-success" />
            {lang === 'en' ? 'Common Home Remedies' : 'সাধারণ ঘরোয়া প্রতিকার'}
          </h2>

          <div className="flex items-start gap-2 p-4 rounded-lg bg-warning/10 border border-warning/20 mb-4">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{t('seekDoctor', lang)}</p>
          </div>

          <div className="grid gap-4">
            {homeRemedies.map(remedy => (
              <div key={remedy.condition} className="health-card">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
                  {lang === 'en' ? remedy.condition : remedy.conditionBn}
                </h3>
                <ul className="space-y-3">
                  {remedy.remedies.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success/10 text-success text-xs font-bold shrink-0">{i + 1}</span>
                      <span className="text-muted-foreground">{lang === 'en' ? r.en : r.bn}</span>
                    </li>
                  ))}
                </ul>
                {remedy.warning && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('seekDoctor', lang)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
