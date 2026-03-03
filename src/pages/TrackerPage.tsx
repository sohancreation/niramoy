import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLang } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/use-subscription';
import { useFamilyFilter } from '@/hooks/use-family-query';
import SubscriptionGate from '@/components/SubscriptionGate';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Trophy, Droplets, Moon, Dumbbell, Scale, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface HealthLogRow {
  id: string;
  date: string;
  weight: number | null;
  bp: string | null;
  water_intake: number | null;
  sleep: number | null;
  exercise: boolean | null;
  created_at: string;
}

export default function TrackerPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const { canUseTracker } = useSubscription();
  const { applyFilter, insertPayload, familyMemberId } = useFamilyFilter();
  const [logs, setLogs] = useState<HealthLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [weight, setWeight] = useState('');
  const [bp, setBp] = useState('');
  const [water, setWater] = useState('');
  const [sleep, setSleep] = useState('');
  const [exerciseDone, setExerciseDone] = useState(false);

  // Cooldown state
  const [canLog, setCanLog] = useState(true);
  const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState('');

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    const { data } = await applyFilter(
      supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', user.id)
    ).order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setLogs(data as HealthLogRow[]);
      // Check cooldown from latest entry
      if (data.length > 0) {
        const latest = data[0] as HealthLogRow;
        const isSameDay = latest.date === new Date().toLocaleDateString('en-CA');
        if (isSameDay) {
          setCanLog(false);
          // 18 hours still could be useful as a countdown for the next day, 
          // but for simplicity we'll just base it on "tomorrow"
          const lastTime = new Date(latest.created_at).getTime();
          const nextTime = lastTime + 18 * 60 * 60 * 1000;
          setCooldownEnd(new Date(nextTime));
        } else {
          setCanLog(true);
          setCooldownEnd(null);
        }
        // Pre-fill if today's log exists
        if (isSameDay) {
          setWeight(latest.weight?.toString() || '');
          setBp(latest.bp || '');
          setWater(latest.water_intake?.toString() || '');
          setSleep(latest.sleep?.toString() || '');
          setExerciseDone(latest.exercise || false);
        }
      }
    }
    setLoading(false);
  }, [user, familyMemberId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Countdown timer
  useEffect(() => {
    if (!cooldownEnd) { setCountdown(''); return; }
    const tick = () => {
      const diff = cooldownEnd.getTime() - Date.now();
      if (diff <= 0) {
        setCanLog(true);
        setCooldownEnd(null);
        setCountdown('');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [cooldownEnd]);

  const handleSave = async () => {
    if (!user || !canLog) return;
    setSaving(true);
    const today = new Date().toLocaleDateString('en-CA');

    const { error } = await supabase.from('health_logs').insert({
      user_id: user.id,
      date: today,
      weight: weight ? +weight : null,
      bp: bp || null,
      water_intake: water ? +water : null,
      sleep: sleep ? +sleep : null,
      exercise: exerciseDone,
      ...insertPayload,
    });

    if (error) {
      toast.error(lang === 'en' ? 'Failed to save' : 'সংরক্ষণ ব্যর্থ');
    } else {
      toast.success(lang === 'en' ? 'Saved!' : 'সংরক্ষিত!');
      // Create reminder notification for 18 hours later
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: lang === 'en' ? '⏰ Time to log health!' : '⏰ স্বাস্থ্য লগ করার সময়!',
        message: lang === 'en'
          ? 'Your 18-hour cooldown is over. Fill your health tracker now!'
          : 'আপনার ১৮ ঘন্টার কুলডাউন শেষ। এখন আপনার হেলথ ট্র্যাকার পূরণ করুন!',
        type: 'info',
      });
      await fetchLogs();
    }
    setSaving(false);
  };

  // Calculate streak from logs
  const calculateStreak = () => {
    if (logs.length === 0) return 0;
    const dates = [...new Set(logs.map(l => l.date))].sort((a, b) => b.localeCompare(a));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      if (dates.includes(dateStr)) {
        streak++;
      } else break;
    }
    return streak;
  };

  const streak = calculateStreak();
  const last7 = logs.slice(0, 7);

  const bpLabel = (val: string | null) => {
    if (!val) return '-';
    const labels: Record<string, Record<string, string>> = {
      high: { en: 'High BP', bn: 'উচ্চ রক্তচাপ' },
      normal: { en: 'Normal', bn: 'স্বাভাবিক' },
      low: { en: 'Low BP', bn: 'নিম্ন রক্তচাপ' },
    };
    return labels[val]?.[lang] || val;
  };

  const bpColor = (val: string | null) => {
    if (val === 'high') return 'text-destructive';
    if (val === 'low') return 'text-orange-500';
    if (val === 'normal') return 'text-green-500';
    return 'text-muted-foreground';
  };

  if (loading) {
    return <AppLayout><div /></AppLayout>;
  }

  if (!canUseTracker) {
    return (
      <AppLayout>
        <SubscriptionGate
          allowed={false}
          featureName={{ en: 'Health Tracker', bn: 'হেলথ ট্র্যাকার' }}
          message={{
            en: 'Your 7-day free trial has ended. Subscribe to continue tracking your health metrics.',
            bn: 'আপনার ৭ দিনের ফ্রি ট্রায়াল শেষ। স্বাস্থ্য মেট্রিক্স ট্র্যাক করতে সাবস্ক্রাইব করুন।'
          }}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          {t('tracker', lang)}
        </h1>

        {/* Streak */}
        <div className="health-card flex items-center gap-4 gradient-primary text-primary-foreground">
          <Trophy className="h-10 w-10" />
          <div>
            <p className="text-3xl font-heading font-bold">{streak}</p>
            <p className="text-sm opacity-90">{t('streak', lang)} 🔥</p>
          </div>
        </div>

        {/* Cooldown Banner */}
        {!canLog && countdown && (
          <div className="health-card flex items-center gap-3 bg-muted border border-border">
            <Clock className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-semibold text-foreground">
                {lang === 'en' ? 'Next log available in:' : 'পরবর্তী লগ সম্ভব:'}
              </p>
              <p className="text-2xl font-heading font-bold text-primary">{countdown}</p>
            </div>
          </div>
        )}

        {/* Log Form */}
        <div className={`health-card space-y-4 ${!canLog ? 'opacity-60 pointer-events-none' : ''}`}>
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            {lang === 'en' ? "Today's Log" : 'আজকের লগ'}
            {!canLog && <AlertCircle className="h-4 w-4 text-muted-foreground" />}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5"><Scale className="h-3.5 w-3.5" /> {t('logWeight', lang)}</Label>
              <Input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="kg" />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">{t('logBP', lang)}</Label>
              <Select value={bp} onValueChange={setBp}>
                <SelectTrigger>
                  <SelectValue placeholder={lang === 'en' ? 'Select BP' : 'রক্তচাপ নির্বাচন'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">{lang === 'en' ? 'High BP (উচ্চ রক্তচাপ)' : 'উচ্চ রক্তচাপ'}</SelectItem>
                  <SelectItem value="normal">{lang === 'en' ? 'Normal (স্বাভাবিক)' : 'স্বাভাবিক'}</SelectItem>
                  <SelectItem value="low">{lang === 'en' ? 'Low BP (নিম্ন রক্তচাপ)' : 'নিম্ন রক্তচাপ'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5" /> {t('logWater', lang)}</Label>
              <Input type="number" value={water} onChange={e => setWater(e.target.value)} placeholder="8" />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Moon className="h-3.5 w-3.5" /> {t('logSleep', lang)}</Label>
              <Input type="number" value={sleep} onChange={e => setSleep(e.target.value)} placeholder="7" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExerciseDone(!exerciseDone)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${exerciseDone ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
            >
              <Dumbbell className="h-4 w-4" />
              {t('logExercise', lang)} {exerciseDone ? '✓' : ''}
            </button>
          </div>
          <Button onClick={handleSave} disabled={!canLog || saving} className="gradient-primary border-0 text-primary-foreground">
            {saving ? '...' : t('save', lang)}
          </Button>
        </div>

        {/* History */}
        {last7.length > 0 && (
          <div className="health-card">
            <h2 className="font-heading font-semibold text-foreground mb-4">{lang === 'en' ? 'Recent Logs' : 'সাম্প্রতিক লগ'}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">{lang === 'en' ? 'Date' : 'তারিখ'}</th>
                    <th className="text-center py-2 text-muted-foreground font-medium"><Scale className="h-3.5 w-3.5 mx-auto" /></th>
                    <th className="text-center py-2 text-muted-foreground font-medium">{lang === 'en' ? 'BP' : 'রক্তচাপ'}</th>
                    <th className="text-center py-2 text-muted-foreground font-medium"><Droplets className="h-3.5 w-3.5 mx-auto" /></th>
                    <th className="text-center py-2 text-muted-foreground font-medium"><Moon className="h-3.5 w-3.5 mx-auto" /></th>
                    <th className="text-center py-2 text-muted-foreground font-medium"><Dumbbell className="h-3.5 w-3.5 mx-auto" /></th>
                  </tr>
                </thead>
                <tbody>
                  {last7.map(log => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="py-2 text-foreground">{log.date}</td>
                      <td className="py-2 text-center text-muted-foreground">{log.weight || '-'}</td>
                      <td className={`py-2 text-center font-medium ${bpColor(log.bp)}`}>{bpLabel(log.bp)}</td>
                      <td className="py-2 text-center text-muted-foreground">{log.water_intake || '-'}</td>
                      <td className="py-2 text-center text-muted-foreground">{log.sleep || '-'}</td>
                      <td className="py-2 text-center">{log.exercise ? '✅' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
