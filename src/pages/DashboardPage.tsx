import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveProfile } from '@/contexts/ActiveProfileContext';
import { useFamilyFilter } from '@/hooks/use-family-query';
import { supabase } from '@/integrations/supabase/client';
import { t } from '@/lib/translations';
import { calculateBMI, calculateTDEE } from '@/lib/health-utils';
import AppLayout from '@/components/AppLayout';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Utensils, Dumbbell, Leaf, MapPin, Flame, Droplets, Trophy,
  CalendarDays, TrendingUp, Brain, Heart, Smile, Frown, Meh,
  Zap, Moon, AlertCircle, Sparkles, RefreshCw, CheckCircle2,
  ChevronLeft, ChevronRight, Bell, BedDouble, Eye, EyeOff, History, FileText, X
} from 'lucide-react';
import XpInfoModal from '@/components/XpInfoModal';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import HealthCheckinWizard from '@/components/HealthCheckinWizard';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

const quickLinks = [
  { path: '/diet', icon: Utensils, key: 'dietPlan', color: 'bg-primary/10 text-primary' },
  { path: '/exercise', icon: Dumbbell, key: 'exercise', color: 'bg-accent/10 text-accent' },
  { path: '/remedies', icon: Leaf, key: 'remedies', color: 'bg-success/10 text-success' },
  { path: '/find-care', icon: MapPin, key: 'findCare', color: 'bg-info/10 text-info' },
  { path: '/prescriptions', icon: FileText, key: 'prescriptions', color: 'bg-warning/10 text-warning' },
  { path: '/quests', icon: Trophy, key: 'dailyQuests', color: 'bg-destructive/10 text-destructive' },
  { path: '/tracker', icon: TrendingUp, key: 'tracker', color: 'bg-muted text-muted-foreground' },
  { path: '/mindcare', icon: Brain, key: 'mindCare', color: 'bg-[hsl(270,60%,95%)]/80 text-[hsl(270,60%,50%)]' },
];

const moodOptions = [
  { value: 'happy', icon: Smile, label: { en: 'Happy', bn: 'খুশি' }, color: 'text-success' },
  { value: 'neutral', icon: Meh, label: { en: 'Neutral', bn: 'স্বাভাবিক' }, color: 'text-warning' },
  { value: 'sad', icon: Frown, label: { en: 'Sad', bn: 'দুঃখিত' }, color: 'text-info' },
  { value: 'stressed', icon: AlertCircle, label: { en: 'Stressed', bn: 'চাপে' }, color: 'text-destructive' },
];

const painOptions = [
  { en: 'Headache', bn: 'মাথাব্যথা' },
  { en: 'Back Pain', bn: 'পিঠে ব্যথা' },
  { en: 'Joint Pain', bn: 'জয়েন্টে ব্যথা' },
  { en: 'Stomach', bn: 'পেটে ব্যথা' },
  { en: 'Chest', bn: 'বুকে ব্যথা' },
];

const symptomOptions = [
  { en: 'Fever', bn: 'জ্বর' },
  { en: 'Cough', bn: 'কাশি' },
  { en: 'Fatigue', bn: 'ক্লান্তি' },
  { en: 'Nausea', bn: 'বমি ভাব' },
  { en: 'Dizziness', bn: 'মাথা ঘোরা' },
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

export default function Dashboard() {
  const { lang } = useLang();
  const { user: authUser } = useAuth();
  const { activeMember, isViewingFamily } = useActiveProfile();
  const { applyFilter, insertPayload, familyMemberId } = useFamilyFilter();
  const [profile, setProfile] = useState<any>(null);
  const [savedDietPlan, setSavedDietPlan] = useState<any>(null);
  const [savedExercisePlan, setSavedExercisePlan] = useState<any>(null);
  const [allDietPlans, setAllDietPlans] = useState<any[]>([]);
  const [allExercisePlans, setAllExercisePlans] = useState<any[]>([]);
  const [gamification, setGamification] = useState<any>(null);
  const [streakDays, setStreakDays] = useState<string[]>([]);
  const [healthHistory, setHealthHistory] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [userStartDate, setUserStartDate] = useState<string | null>(null);
  const [showDietDetail, setShowDietDetail] = useState(false);
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [showDietHistory, setShowDietHistory] = useState(false);
  const [showExerciseHistory, setShowExerciseHistory] = useState(false);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [exerciseDayPopup, setExerciseDayPopup] = useState<any>(null);
  const [dietMealPopup, setDietMealPopup] = useState<{ mealType: string; items: string[] } | null>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [showPrescriptionHistory, setShowPrescriptionHistory] = useState(false);

  // Health update form
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [sleepHours, setSleepHours] = useState(7);
  const [selectedPains, setSelectedPains] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [healthNotes, setHealthNotes] = useState('');
  const [todayHealthDone, setTodayHealthDone] = useState(false);
  const [canCheckinAgain, setCanCheckinAgain] = useState(true);
  const [lastCheckinTime, setLastCheckinTime] = useState<string | null>(null);
  const [savingHealth, setSavingHealth] = useState(false);
  const [notifDismissed, setNotifDismissed] = useState(false);
  const [xpModalOpen, setXpModalOpen] = useState(false);
  const [showHealthHistory, setShowHealthHistory] = useState(false);

  // Reset all state when family profile changes
  useEffect(() => {
    setProfile(null);
    setSavedDietPlan(null);
    setSavedExercisePlan(null);
    setAllDietPlans([]);
    setAllExercisePlans([]);
    setGamification(null);
    setStreakDays([]);
    setHealthHistory([]);
    setAiSuggestions([]);
    setTodayTasks([]);
    setPrescriptions([]);
    setTodayHealthDone(false);
    setCanCheckinAgain(true);
    setLastCheckinTime(null);
    setMood('');
    setEnergy(3);
    setStress(3);
    setSleepQuality(3);
    setSleepHours(7);
    setSelectedPains([]);
    setSelectedSymptoms([]);
    setHealthNotes('');
  }, [familyMemberId]);

  const today = new Date().toLocaleDateString('en-CA');

  const fetchAll = useCallback(async () => {
    if (!authUser) return;

    const profileQuery = isViewingFamily && activeMember
      ? Promise.resolve({ data: { name: activeMember.name, age: activeMember.age, gender: activeMember.gender, weight: activeMember.weight, height: activeMember.height, activity_level: activeMember.activity_level, medical_conditions: activeMember.medical_conditions, created_at: new Date().toISOString() } })
      : supabase.from('profiles').select('*').eq('user_id', authUser.id).single();

    const [profileRes, dietRes, exerciseRes, gamRes, healthRes, tasksRes, todayTasksRes, allDietRes, allExRes, rxRes] = await Promise.all([
      profileQuery,
      applyFilter(supabase.from('saved_plans').select('*').eq('user_id', authUser.id).eq('plan_type', 'diet').eq('is_active', true)).maybeSingle(),
      applyFilter(supabase.from('saved_plans').select('*').eq('user_id', authUser.id).eq('plan_type', 'exercise').eq('is_active', true)).maybeSingle(),
      applyFilter(supabase.from('user_gamification').select('*').eq('user_id', authUser.id)).maybeSingle(),
      applyFilter(supabase.from('daily_health_updates').select('*').eq('user_id', authUser.id)).order('created_at', { ascending: false }),
      applyFilter(supabase.from('daily_tasks').select('task_date, completed').eq('user_id', authUser.id)),
      applyFilter(supabase.from('daily_tasks').select('*').eq('user_id', authUser.id).eq('task_date', today)),
      applyFilter(supabase.from('saved_plans').select('*').eq('user_id', authUser.id).eq('plan_type', 'diet')).order('created_at', { ascending: false }),
      applyFilter(supabase.from('saved_plans').select('*').eq('user_id', authUser.id).eq('plan_type', 'exercise')).order('created_at', { ascending: false }),
      applyFilter(supabase.from('prescriptions').select('*').eq('user_id', authUser.id).eq('analysis_status', 'completed')).order('created_at', { ascending: false }),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
      setUserStartDate(profileRes.data.created_at?.split('T')[0] || today);
    }
    if (dietRes.data) setSavedDietPlan(dietRes.data.plan_data);
    if (exerciseRes.data) setSavedExercisePlan(exerciseRes.data.plan_data);
    if (gamRes.data) setGamification(gamRes.data);
    if (healthRes.data) {
      // Sort ascending for chart display
      setHealthHistory([...(healthRes.data || [])].reverse());

      // 18-hour cooldown logic
      const latest = healthRes.data[0]; // most recent (desc order)
      if (latest) {
        const lastTime = new Date(latest.created_at).getTime();
        const now = Date.now();
        const hoursSince = (now - lastTime) / (1000 * 60 * 60);
        setLastCheckinTime(latest.created_at);

        if (latest.update_date === today) {
          setTodayHealthDone(true);
          const h = latest;
          setMood(h.mood || '');
          setEnergy(h.energy_level || 3);
          setStress(h.stress_level || 3);
          setSleepQuality(h.sleep_quality || 3);
          setSleepHours(h.sleep_hours || 7);
          setSelectedPains(h.pain_areas || []);
          setSelectedSymptoms(h.symptoms || []);
          setHealthNotes(h.notes || '');
        }

        setCanCheckinAgain(hoursSince >= 18);
      } else {
        setCanCheckinAgain(true);
      }
    }
    if (todayTasksRes.data) setTodayTasks(todayTasksRes.data);
    if (allDietRes.data) setAllDietPlans(allDietRes.data);
    if (allExRes.data) setAllExercisePlans(allExRes.data);
    if (rxRes.data) setPrescriptions(rxRes.data);

    const completedDates = [...new Set((tasksRes.data || []).filter((t: any) => t.completed).map((t: any) => t.task_date))];
    const healthDates = (healthRes.data || []).map((h: any) => h.update_date);
    const allActive = [...new Set([...completedDates, ...healthDates])];
    setStreakDays(allActive as string[]);
  }, [authUser, today, familyMemberId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSaveHealthUpdate = async () => {
    if (!authUser) return;
    setSavingHealth(true);
    const payload = {
      user_id: authUser.id,
      update_date: today,
      mood,
      energy_level: energy,
      stress_level: stress,
      sleep_quality: sleepQuality,
      sleep_hours: sleepHours,
      pain_areas: selectedPains,
      symptoms: selectedSymptoms,
      notes: healthNotes,
      ...insertPayload,
    };

    if (todayHealthDone) {
      // If we already have a record for today, update it
      await supabase.from('daily_health_updates')
        .update(payload)
        .eq('user_id', authUser.id)
        .eq('update_date', today);
    } else {
      // Otherwise insert a new record
      await supabase.from('daily_health_updates').insert(payload);
    }
    setTodayHealthDone(true);
    setCanCheckinAgain(false);
    setLastCheckinTime(new Date().toISOString());
    setSavingHealth(false);
    toast.success(lang === 'en' ? 'Health update saved!' : 'স্বাস্থ্য আপডেট সংরক্ষিত!');
    fetchAll();

    // Auto-notify with AI advice
    fetchAiSuggestions().then(async () => {
      // The AI suggestions are fetched - create a notification
      try {
        const { data, error } = await supabase.functions.invoke('ai-health-suggestions', {});
        if (!error && data?.suggestions?.length > 0) {
          const firstAdvice = typeof data.suggestions[0] === 'string'
            ? data.suggestions[0]
            : data.suggestions[0]?.[lang] || data.suggestions[0]?.en || '';
          if (firstAdvice) {
            await supabase.from('notifications').insert({
              user_id: authUser.id,
              title: lang === 'en' ? '🧠 AI Health Advice' : '🧠 এআই স্বাস্থ্য পরামর্শ',
              message: firstAdvice.substring(0, 200),
              type: 'info',
            } as any);
          }
        }
      } catch (e) {
        console.error('Auto-notify error:', e);
      }
    });
  };

  const fetchAiSuggestions = async () => {
    if (!authUser) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-health-suggestions', {});
      if (error) throw error;
      setAiSuggestions(data.suggestions || []);
    } catch (e) {
      console.error('AI suggestions error:', e);
    }
    setAiLoading(false);
  };

  useEffect(() => {
    if (authUser) fetchAiSuggestions();
  }, [authUser]);

  // Calendar data
  const { firstDay, daysInMonth } = useMemo(() => getMonthDays(calYear, calMonth), [calYear, calMonth]);
  const monthNames = lang === 'en'
    ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    : ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const dayLabels = lang === 'en' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['র', 'সো', 'ম', 'বু', 'বৃ', 'শু', 'শ'];

  const canGoPrev = useMemo(() => {
    if (!userStartDate) return false;
    const start = new Date(userStartDate);
    return calYear > start.getFullYear() || (calYear === start.getFullYear() && calMonth > start.getMonth());
  }, [calYear, calMonth, userStartDate]);

  const canGoNext = useMemo(() => {
    const now = new Date();
    return calYear < now.getFullYear() || (calYear === now.getFullYear() && calMonth < now.getMonth());
  }, [calYear, calMonth]);

  const navigateMonth = (dir: -1 | 1) => {
    let newMonth = calMonth + dir;
    let newYear = calYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCalMonth(newMonth);
    setCalYear(newYear);
  };

  // Health improvement chart data
  const chartData = useMemo(() => {
    return healthHistory.slice(-14).map(d => ({
      date: new Date(d.update_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', { day: 'numeric', month: 'short' }),
      energy: d.energy_level || 0,
      sleep: d.sleep_quality || 0,
      stress: d.stress_level || 0,
    }));
  }, [healthHistory, lang]);

  // Plan completeness - always compute, show even with 0 tasks
  const dietCompleteness = useMemo(() => {
    const dietTasks = todayTasks.filter((t: any) => t.task_type === 'diet');
    const completed = dietTasks.filter((t: any) => t.completed).length;
    return { completed, total: dietTasks.length, percent: dietTasks.length ? Math.round((completed / dietTasks.length) * 100) : 0 };
  }, [todayTasks]);

  const exerciseCompleteness = useMemo(() => {
    const exTasks = todayTasks.filter((t: any) => t.task_type === 'exercise');
    const completed = exTasks.filter((t: any) => t.completed).length;
    return { completed, total: exTasks.length, percent: exTasks.length ? Math.round((completed / exTasks.length) * 100) : 0 };
  }, [todayTasks]);

  const mindcareCompleteness = useMemo(() => {
    const mcTasks = todayTasks.filter((t: any) => t.task_type === 'mindcare');
    const completed = mcTasks.filter((t: any) => t.completed).length;
    return { completed, total: mcTasks.length, percent: mcTasks.length ? Math.round((completed / mcTasks.length) * 100) : 0 };
  }, [todayTasks]);

  const planChartData = useMemo(() => [
    {
      name: lang === 'en' ? 'Diet' : 'ডায়েট',
      completed: dietCompleteness.percent,
      remaining: 100 - dietCompleteness.percent,
    },
    {
      name: lang === 'en' ? 'Exercise' : 'ব্যায়াম',
      completed: exerciseCompleteness.percent,
      remaining: 100 - exerciseCompleteness.percent,
    },
    {
      name: lang === 'en' ? 'MindCare' : 'মাইন্ডকেয়ার',
      completed: mindcareCompleteness.percent,
      remaining: 100 - mindcareCompleteness.percent,
    },
  ], [dietCompleteness, exerciseCompleteness, mindcareCompleteness, lang]);

  if (!profile) return <AppLayout><div /></AppLayout>;

  const weight = Number(profile.weight) || 70;
  const height = Number(profile.height) || 170;
  const age = profile.age || 25;
  const gender = profile.gender || 'male';
  const activityLevel = profile.activity_level || 'moderate';

  const baseTdee = calculateTDEE({ weight, height, age, gender, activityLevel, name: profile.name || '', location: '', medicalConditions: '' });

  // Dynamically adjust TDEE based on latest health check-in data
  const latestHealth = healthHistory.length > 0 ? healthHistory[healthHistory.length - 1] : null;
  let tdeeAdjustment = 1.0;
  if (latestHealth) {
    // High stress increases caloric needs slightly
    if ((latestHealth.stress_level || 3) >= 4) tdeeAdjustment += 0.03;
    // Poor sleep increases caloric needs
    if ((latestHealth.sleep_quality || 3) <= 2) tdeeAdjustment += 0.02;
    // Low energy suggests reducing intake slightly for recovery
    if ((latestHealth.energy_level || 3) <= 2) tdeeAdjustment -= 0.02;
    // Symptoms like fever increase needs
    if (latestHealth.symptoms?.includes('Fever')) tdeeAdjustment += 0.05;
  }
  const tdee = Math.round(baseTdee * tdeeAdjustment);

  // Dynamic water intake: base on weight + adjust for activity, stress, symptoms
  let waterBase = weight * 0.033;
  if (latestHealth) {
    if ((latestHealth.stress_level || 3) >= 4) waterBase += 0.3;
    if (latestHealth.symptoms?.includes('Fever')) waterBase += 0.5;
    if ((latestHealth.sleep_hours || 7) < 6) waterBase += 0.2;
  }
  if (activityLevel === 'active') waterBase += 0.4;
  else if (activityLevel === 'moderate') waterBase += 0.2;
  const waterTarget = Math.round(waterBase * 10) / 10;

  const bmi = calculateBMI(weight, height);

  const RatingSelector = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${value === v ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  const scrollToCheckin = () => {
    document.getElementById('health-checkin')?.scrollIntoView({ behavior: 'smooth' });
    setNotifDismissed(true);
  };

  // Calendar active count for current month
  const activeThisMonth = streakDays.filter(d => {
    const [y, m] = d.split('-').map(Number);
    return y === calYear && m === calMonth + 1;
  }).length;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 overflow-x-hidden">
        {/* Subscription Status Banner */}
        <SubscriptionBanner />

        {/* Health Check-in Notification Banner */}
        {((!todayHealthDone || canCheckinAgain) && !notifDismissed) && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
            <div className="bg-primary/20 p-2 rounded-full">
              <Bell className="h-5 w-5 text-primary animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">
                {canCheckinAgain && todayHealthDone
                  ? (lang === 'en' ? "📋 New Health Check-in Available!" : "📋 নতুন স্বাস্থ্য চেক-ইন উপলব্ধ!")
                  : (lang === 'en' ? "📋 Daily Health Check-in Pending!" : "📋 আজকের স্বাস্থ্য চেক-ইন বাকি আছে!")}
              </p>
              <p className="text-xs text-muted-foreground">
                {lang === 'en' ? "Complete your check-in to track progress & get AI suggestions." : "প্রগতি ট্র্যাক করতে ও AI পরামর্শ পেতে চেক-ইন সম্পন্ন করুন।"}
              </p>
            </div>
            <Button size="sm" onClick={scrollToCheckin} className="gradient-primary border-0 text-primary-foreground text-xs">
              {lang === 'en' ? 'Check In' : 'চেক ইন'}
            </Button>
          </div>
        )}

        {/* Daily Tasks Reminder Banner */}
        {todayTasks.length > 0 && todayTasks.some((t: any) => !t.completed) && !notifDismissed && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
            <div className="bg-destructive/20 p-2 rounded-full">
              <Trophy className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">
                🎯 {todayTasks.filter((t: any) => !t.completed).length} {lang === 'en' ? 'tasks remaining today!' : 'টি টাস্ক বাকি আছে আজ!'}
              </p>
              <p className="text-xs text-muted-foreground">
                {lang === 'en' ? "Complete your daily tasks to earn XP and maintain your streak!" : "XP অর্জন করতে ও স্ট্রিক বজায় রাখতে দৈনিক টাস্ক সম্পন্ন করুন!"}
              </p>
            </div>
            <Link to="/quests">
              <Button size="sm" className="bg-destructive hover:bg-destructive/90 border-0 text-destructive-foreground text-xs">
                {lang === 'en' ? 'Go to Tasks' : 'টাস্কে যান'}
              </Button>
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground break-words">
              {isViewingFamily && activeMember
                ? `${activeMember.avatar_emoji} ${activeMember.name}`
                : `${t('welcome', lang)}, ${profile.name || 'User'}! 👋`}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isViewingFamily
                ? (lang === 'en' ? `Viewing ${activeMember?.name}'s health dashboard` : `${activeMember?.name}-এর স্বাস্থ্য ড্যাশবোর্ড দেখছেন`)
                : t('todaySummary', lang)}
            </p>
          </div>
          <button
            onClick={() => setXpModalOpen(true)}
            className="flex items-center gap-2 bg-warning/10 hover:bg-warning/20 border border-warning/30 rounded-xl px-4 py-2 transition-all cursor-pointer"
          >
            <Zap className="h-5 w-5 text-warning" />
            <span className="font-heading font-bold text-foreground">{gamification?.xp || 0}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">XP</span>
          </button>
        </div>

        <XpInfoModal open={xpModalOpen} onOpenChange={setXpModalOpen} xp={gamification?.xp || 0} />

        {/* Smart AI Summary Message */}
        {healthHistory.length >= 2 && (() => {
          const recent = healthHistory.slice(-7);
          const older = healthHistory.slice(-14, -7);
          const recentAvgEnergy = recent.reduce((s, h) => s + (h.energy_level || 3), 0) / recent.length;
          const olderAvgEnergy = older.length > 0 ? older.reduce((s, h) => s + (h.energy_level || 3), 0) / older.length : recentAvgEnergy;
          const energyDiff = Math.round((recentAvgEnergy - olderAvgEnergy) * 20);
          const completionRate = todayTasks.length > 0 ? Math.round((todayTasks.filter((t: any) => t.completed).length / todayTasks.length) * 100) : 0;

          const message = energyDiff > 0
            ? (lang === 'en' ? `📈 You're ${energyDiff}% more energetic than last week! Keep it up!` : `📈 তুমি গত সপ্তাহের চেয়ে ${energyDiff}% বেশি সক্রিয়! চালিয়ে যাও!`)
            : energyDiff < 0
              ? (lang === 'en' ? `💡 Energy is down ${Math.abs(energyDiff)}%. Try a lighter workout today.` : `💡 শক্তি ${Math.abs(energyDiff)}% কমেছে। আজ হালকা ব্যায়াম করুন।`)
              : (lang === 'en' ? `🌟 Staying consistent! ${completionRate}% tasks done today.` : `🌟 ধারাবাহিক আছো! আজ ${completionRate}% টাস্ক সম্পন্ন।`);

          return (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm font-medium text-foreground">{message}</p>
            </div>
          );
        })()}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="health-card text-center">
            <Flame className="h-6 w-6 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-heading font-bold text-foreground">{tdee}</p>
            <p className="text-xs text-muted-foreground">{t('calories', lang)}/day</p>
          </div>
          <div className="health-card text-center">
            <Droplets className="h-6 w-6 text-info mx-auto mb-2" />
            <p className="text-2xl font-heading font-bold text-foreground">{waterTarget}L</p>
            <p className="text-xs text-muted-foreground">{t('water', lang)}</p>
          </div>
          <div className="health-card text-center">
            <p className="text-sm text-muted-foreground mb-1">BMI</p>
            <p className="text-2xl font-heading font-bold text-foreground">{bmi}</p>
            <p className="text-xs text-muted-foreground">
              {bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'}
            </p>
          </div>
          <div className="health-card text-center">
            <Trophy className="h-6 w-6 text-warning mx-auto mb-2" />
            <p className="text-2xl font-heading font-bold text-foreground">{gamification?.streak || 0}</p>
            <p className="text-xs text-muted-foreground">{t('streak', lang)} 🔥</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {quickLinks.map(ql => {
            const remainingTasks = todayTasks.filter((t: any) => !t.completed).length;
            const isQuestsIncomplete = ql.path === '/quests' && remainingTasks > 0;
            return (
              <Link key={ql.path} to={ql.path} className={`health-card flex flex-col items-center gap-3 py-8 hover:scale-[1.02] transition-transform relative ${isQuestsIncomplete ? 'border-2 border-destructive ring-1 ring-destructive/20' : ''}`}>
                <div className={`p-3 rounded-xl ${isQuestsIncomplete ? 'bg-destructive/10 text-destructive' : ql.color}`}>
                  <ql.icon className="h-6 w-6" />
                </div>
                <span className={`font-heading font-semibold text-sm ${isQuestsIncomplete ? 'text-destructive' : 'text-card-foreground'}`}>{t(ql.key, lang)}</span>
                {isQuestsIncomplete && (
                  <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {remainingTasks}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Plan Completeness Flow Chart - Always show */}
        <div className="health-card">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            {lang === 'en' ? "Today's Plan Progress" : 'আজকের পরিকল্পনা অগ্রগতি'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Diet Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Utensils className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium text-sm text-foreground">{lang === 'en' ? 'Diet Plan' : 'ডায়েট প্ল্যান'}</span>
                </div>
                <span className="text-lg font-heading font-bold text-primary">{dietCompleteness.percent}%</span>
              </div>
              <div className="relative h-4 rounded-full bg-muted overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full gradient-primary transition-all duration-700 ease-out"
                  style={{ width: `${dietCompleteness.percent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {dietCompleteness.total > 0
                  ? `${dietCompleteness.completed}/${dietCompleteness.total} ${lang === 'en' ? 'tasks done' : 'টাস্ক সম্পন্ন'}`
                  : (savedDietPlan
                    ? (lang === 'en' ? 'Plan saved • No tasks for today yet' : 'প্ল্যান সংরক্ষিত • আজ কোনো টাস্ক নেই')
                    : (lang === 'en' ? 'No diet plan saved yet' : 'এখনো কোনো ডায়েট প্ল্যান নেই'))
                }
              </p>
            </div>
            {/* Exercise Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Dumbbell className="h-4 w-4 text-accent" />
                  </div>
                  <span className="font-medium text-sm text-foreground">{lang === 'en' ? 'Exercise Plan' : 'ব্যায়াম প্ল্যান'}</span>
                </div>
                <span className="text-lg font-heading font-bold text-accent">{exerciseCompleteness.percent}%</span>
              </div>
              <div className="relative h-4 rounded-full bg-muted overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-700 ease-out"
                  style={{ width: `${exerciseCompleteness.percent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {exerciseCompleteness.total > 0
                  ? `${exerciseCompleteness.completed}/${exerciseCompleteness.total} ${lang === 'en' ? 'tasks done' : 'টাস্ক সম্পন্ন'}`
                  : (savedExercisePlan
                    ? (lang === 'en' ? 'Plan saved • No tasks for today yet' : 'প্ল্যান সংরক্ষিত • আজ কোনো টাস্ক নেই')
                    : (lang === 'en' ? 'No exercise plan saved yet' : 'এখনো কোনো ব্যায়াম প্ল্যান নেই'))
                }
              </p>
            </div>
            {/* MindCare Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[hsl(270,60%,95%)]">
                    <Brain className="h-4 w-4 text-[hsl(270,60%,50%)]" />
                  </div>
                  <span className="font-medium text-sm text-foreground">{lang === 'en' ? 'MindCare' : 'মাইন্ডকেয়ার'}</span>
                </div>
                <span className="text-lg font-heading font-bold text-[hsl(270,60%,50%)]">{mindcareCompleteness.percent}%</span>
              </div>
              <div className="relative h-4 rounded-full bg-muted overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[hsl(270,60%,50%)] transition-all duration-700 ease-out"
                  style={{ width: `${mindcareCompleteness.percent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {mindcareCompleteness.total > 0
                  ? `${mindcareCompleteness.completed}/${mindcareCompleteness.total} ${lang === 'en' ? 'tasks done' : 'টাস্ক সম্পন্ন'}`
                  : (lang === 'en' ? 'Mental care tasks appear in Daily Tasks' : 'মানসিক যত্নের টাস্ক দৈনিক টাস্কে দেখুন')
                }
              </p>
            </div>
          </div>
          {/* Combined bar chart - always show */}
          <div className="h-44 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} width={60} />
                <Tooltip
                  formatter={(value: number) => `${value}%`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="completed" stackId="a" fill="hsl(var(--primary))" radius={[4, 0, 0, 4]} name={lang === 'en' ? 'Done' : 'সম্পন্ন'} />
                <Bar dataKey="remaining" stackId="a" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} name={lang === 'en' ? 'Remaining' : 'বাকি'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Streak Calendar - Compact */}
        <div className="health-card overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-primary" />
                {lang === 'en' ? 'Streak Calendar' : 'স্ট্রিক ক্যালেন্ডার'}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {activeThisMonth} {lang === 'en' ? 'active days' : 'দিন সক্রিয়'}
              </p>
            </div>
            <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
              <button
                onClick={() => navigateMonth(-1)}
                disabled={!canGoPrev}
                className="p-1 rounded-md hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-foreground" />
              </button>
              <span className="text-xs font-semibold text-foreground min-w-[100px] text-center px-1">
                {monthNames[calMonth]} {calYear}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                disabled={!canGoNext}
                className="p-1 rounded-md hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1 max-w-sm mx-auto">
            {dayLabels.map((d, i) => (
              <div key={`${d}-${i}`} className="text-center text-[10px] font-bold text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid - compact */}
          <div className="grid grid-cols-7 gap-1 max-w-sm mx-auto">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="w-full aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isActive = streakDays.includes(dateStr);
              const isToday = dateStr === today;
              const isFuture = dateStr > today;
              const isBeforeStart = userStartDate ? dateStr < userStartDate : false;

              return (
                <div
                  key={day}
                  title={dateStr}
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm transition-all duration-200 ${isFuture || isBeforeStart
                      ? 'text-muted-foreground/40 font-medium'
                      : isActive && isToday
                        ? 'gradient-primary text-white ring-2 ring-primary ring-offset-1 ring-offset-background shadow-sm font-black'
                        : isActive
                          ? 'gradient-primary text-white shadow-sm font-black'
                          : isToday
                            ? 'border-2 border-primary bg-primary/20 font-black text-primary'
                            : 'bg-card border border-border font-bold text-card-foreground hover:bg-muted'
                    }`}
                >
                  {isActive ? (
                    <span className="flex flex-col items-center leading-none">
                      <span className="text-sm font-black">{day}</span>
                      <span className="text-[8px]">✓</span>
                    </span>
                  ) : (
                    <span className="font-bold">{day}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border max-w-sm mx-auto">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded gradient-primary" />
              <span className="text-[10px] font-medium text-muted-foreground">{lang === 'en' ? 'Active' : 'সক্রিয়'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border-2 border-primary bg-primary/10" />
              <span className="text-[10px] font-medium text-muted-foreground">{lang === 'en' ? 'Today' : 'আজ'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-muted/40" />
              <span className="text-[10px] font-medium text-muted-foreground">{lang === 'en' ? 'Missed' : 'মিসড'}</span>
            </div>
          </div>
        </div>

        {/* Health Improvement Graph - Always show */}
        <div className="health-card">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-destructive" />
            {lang === 'en' ? 'Health Improvement Graph' : 'স্বাস্থ্য উন্নতির গ্রাফ'}
          </h3>
          {chartData.length > 1 ? (
            <>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="energy" name={lang === 'en' ? 'Energy' : 'শক্তি'} stroke="hsl(var(--warning))" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(var(--warning))' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="sleep" name={lang === 'en' ? 'Sleep' : 'ঘুম'} stroke="hsl(var(--info))" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(var(--info))' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="stress" name={lang === 'en' ? 'Stress' : 'চাপ'} stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                {lang === 'en'
                  ? '↑ Higher energy & sleep = better • ↓ Lower stress = better'
                  : '↑ বেশি শক্তি ও ঘুম = ভালো • ↓ কম চাপ = ভালো'}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Heart className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {lang === 'en' ? 'Not enough data yet' : 'এখনো যথেষ্ট ডেটা নেই'}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                {lang === 'en'
                  ? 'Complete at least 2 daily health check-ins to see your improvement graph.'
                  : 'আপনার উন্নতির গ্রাফ দেখতে কমপক্ষে ২টি দৈনিক স্বাস্থ্য চেক-ইন সম্পন্ন করুন।'}
              </p>
            </div>
          )}
        </div>

        {/* Saved Diet Plan with History */}
        <Link to="/diet" className="block">
          <div className="health-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                {lang === 'en' ? 'Diet Plan' : 'ডায়েট প্ল্যান'}
                {savedDietPlan?.weeklyBudget && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    ৳{Math.round(savedDietPlan.weeklyBudget / 7)}/{lang === 'en' ? 'day' : 'দিন'}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1">
                {allDietPlans.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDietHistory(!showDietHistory); }} className="gap-1 text-xs">
                    <History className="h-3.5 w-3.5" />
                    {lang === 'en' ? `History (${allDietPlans.length})` : `ইতিহাস (${allDietPlans.length})`}
                  </Button>
                )}
              </div>
            </div>

            {savedDietPlan ? (
              <>
                {/* Clickable Meal Summary - each meal type opens popup */}
                <div className="grid grid-cols-4 gap-2 mb-3" onClick={(e) => e.preventDefault()}>
                  {['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => {
                    const icons: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍎' };
                    // Support both old flat format and new days format
                    const planDays = savedDietPlan.days;
                    let items: string[] = [];
                    if (planDays && Array.isArray(planDays)) {
                      // Collect all unique items from all days for this meal
                      const todayIdx = new Date().getDay() === 6 ? 0 : new Date().getDay() + 1;
                      items = planDays[todayIdx]?.[meal] || planDays[0]?.[meal] || [];
                    } else {
                      items = Array.isArray(savedDietPlan[meal]) ? savedDietPlan[meal] : [];
                    }
                    const count = items.length;
                    return (
                      <button
                        key={meal}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDietMealPopup({ mealType: meal, items }); }}
                        className="bg-muted/30 rounded-lg p-2 text-center hover:bg-primary/10 hover:border-primary/20 border border-transparent transition-all"
                      >
                        <span className="text-lg">{icons[meal]}</span>
                        <p className="text-xs font-medium text-foreground mt-1">{t(meal, lang)}</p>
                        <p className="text-[10px] text-primary font-medium">{lang === 'en' ? 'Tap to view' : 'দেখুন'}</p>
                      </button>
                    );
                  })}
                </div>

                {savedDietPlan.totalCalories && (
                  <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <span><Flame className="inline h-3 w-3 text-destructive" /> {savedDietPlan.totalCalories} cal</span>
                    <span><Droplets className="inline h-3 w-3 text-info" /> {savedDietPlan.waterLiters}L water</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <Utensils className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{lang === 'en' ? 'No active diet plan' : 'কোনো সক্রিয় ডায়েট প্ল্যান নেই'}</p>
                <Link to="/diet">
                  <Button size="sm" variant="outline" className="mt-2 text-xs">
                    {lang === 'en' ? 'Create Diet Plan' : 'ডায়েট প্ল্যান তৈরি করুন'}
                  </Button>
                </Link>
              </div>
            )}

            {/* Diet History */}
            {showDietHistory && allDietPlans.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border space-y-2 animate-in slide-in-from-top-2" onClick={(e) => e.preventDefault()}>
                <p className="text-xs font-semibold text-muted-foreground mb-2">{lang === 'en' ? 'Previous Plans' : 'পূর্ববর্তী প্ল্যান'}</p>
                {allDietPlans.map((p, i) => (
                  <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg text-xs ${p.is_active ? 'bg-primary/10 border border-primary/20' : 'bg-muted/20'}`}>
                    <div className="flex items-center gap-2">
                      {p.is_active && <CheckCircle2 className="h-3 w-3 text-primary" />}
                      <span className="text-foreground font-medium">{p.goal || 'General'}</span>
                      <span className="text-muted-foreground">• {new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${p.is_active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {p.is_active ? (lang === 'en' ? 'Active' : 'সক্রিয়') : (lang === 'en' ? 'Past' : 'পুরনো')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Link>

        {/* Saved Exercise Plan with History */}
        <Link to="/exercise" className="block">
          <div className="health-card hover:border-accent/40 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-accent" />
                {lang === 'en' ? 'Exercise Plan' : 'ব্যায়াম প্ল্যান'}
              </h3>
              <div className="flex items-center gap-1">
                {allExercisePlans.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setShowExerciseHistory(!showExerciseHistory)} className="gap-1 text-xs">
                    <History className="h-3.5 w-3.5" />
                    {lang === 'en' ? `History (${allExercisePlans.length})` : `ইতিহাস (${allExercisePlans.length})`}
                  </Button>
                )}
                {savedExercisePlan && Array.isArray(savedExercisePlan) && (
                  <Button size="sm" variant="ghost" onClick={() => setShowExerciseDetail(!showExerciseDetail)} className="gap-1 text-xs">
                    {showExerciseDetail ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showExerciseDetail ? (lang === 'en' ? 'Hide' : 'লুকান') : (lang === 'en' ? 'Show' : 'দেখুন')}
                  </Button>
                )}
              </div>
            </div>

            {savedExercisePlan && Array.isArray(savedExercisePlan) ? (
              <>
                {/* Clickable day chips - tap to see exercises */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {savedExercisePlan.map((day: any, i: number) => (
                    <button
                      key={i}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExerciseDayPopup(day); }}
                      className={`shrink-0 px-3 py-2 rounded-lg text-center min-w-[70px] transition-all hover:shadow-md ${day.isRest ? 'bg-muted/30 hover:bg-muted/50' : 'bg-accent/10 hover:bg-accent/20 border border-transparent hover:border-accent/30'
                        }`}
                    >
                      <p className="text-xs font-semibold text-foreground">{day.day?.split(' ')[0] || `D${i + 1}`}</p>
                      {day.isRest ? (
                        <BedDouble className="h-3.5 w-3.5 text-muted-foreground mx-auto mt-1" />
                      ) : (
                        <p className="text-[10px] text-accent font-medium mt-1">{lang === 'en' ? 'Tap' : 'দেখুন'}</p>
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Dumbbell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{lang === 'en' ? 'No active exercise plan' : 'কোনো সক্রিয় ব্যায়াম প্ল্যান নেই'}</p>
                <Link to="/exercise">
                  <Button size="sm" variant="outline" className="mt-2 text-xs">
                    {lang === 'en' ? 'Create Exercise Plan' : 'ব্যায়াম প্ল্যান তৈরি করুন'}
                  </Button>
                </Link>
              </div>
            )}

            {/* Exercise History */}
            {showExerciseHistory && allExercisePlans.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border space-y-2 animate-in slide-in-from-top-2" onClick={(e) => e.preventDefault()}>
                <p className="text-xs font-semibold text-muted-foreground mb-2">{lang === 'en' ? 'Previous Plans' : 'পূর্ববর্তী প্ল্যান'}</p>
                {allExercisePlans.map((p, i) => (
                  <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg text-xs ${p.is_active ? 'bg-accent/10 border border-accent/20' : 'bg-muted/20'}`}>
                    <div className="flex items-center gap-2">
                      {p.is_active && <CheckCircle2 className="h-3 w-3 text-accent" />}
                      <span className="text-foreground font-medium">{p.goal || 'General'}</span>
                      <span className="text-muted-foreground">• {new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${p.is_active ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                      {p.is_active ? (lang === 'en' ? 'Active' : 'সক্রিয়') : (lang === 'en' ? 'Past' : 'পুরনো')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Link>

        {/* Prescription & Medicine Reminders */}
        <div className="health-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-destructive" />
              {lang === 'en' ? 'Prescriptions & Medicines' : 'প্রেসক্রিপশন ও ওষুধ'}
            </h3>
            <div className="flex items-center gap-1">
              {prescriptions.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setShowPrescriptionHistory(!showPrescriptionHistory)} className="gap-1 text-xs">
                  <History className="h-3.5 w-3.5" />
                  {lang === 'en' ? `History (${prescriptions.length})` : `ইতিহাস (${prescriptions.length})`}
                </Button>
              )}
              <Link to="/prescriptions">
                <Button size="sm" variant="outline" className="text-xs">
                  {lang === 'en' ? 'Upload New' : 'আপলোড'}
                </Button>
              </Link>
            </div>
          </div>

          {prescriptions.length > 0 ? (
            <>
              {/* Today's medicines from latest prescription */}
              {(() => {
                const allMeds: any[] = [];
                prescriptions.forEach((rx: any) => {
                  const meds = (rx.medicines as any[]) || [];
                  meds.forEach(m => {
                    if (!allMeds.find(x => x.name?.toLowerCase() === m.name?.toLowerCase())) {
                      allMeds.push({ ...m, rxDate: rx.created_at, doctor: rx.doctor_name });
                    }
                  });
                });
                if (allMeds.length === 0) return (
                  <p className="text-sm text-muted-foreground">{lang === 'en' ? 'No medicines found in prescriptions' : 'প্রেসক্রিপশনে কোনো ওষুধ পাওয়া যায়নি'}</p>
                );
                return (
                  <div className="space-y-2">
                    {allMeds.slice(0, 5).map((med, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                          <span className="text-base">💊</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{med.name}</p>
                          <p className="text-xs text-muted-foreground">{[med.dosage, med.frequency].filter(Boolean).join(' • ')}</p>
                        </div>
                        {med.timing && (
                          <span className="text-[10px] bg-warning/10 text-warning px-2 py-1 rounded-full shrink-0">{med.timing}</span>
                        )}
                      </div>
                    ))}
                    {allMeds.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">+{allMeds.length - 5} {lang === 'en' ? 'more medicines' : 'আরও ওষুধ'}</p>
                    )}
                  </div>
                );
              })()}

              {/* Prescription History */}
              {showPrescriptionHistory && (
                <div className="mt-4 pt-3 border-t border-border space-y-2 animate-in slide-in-from-top-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{lang === 'en' ? 'Saved Prescriptions' : 'সংরক্ষিত প্রেসক্রিপশন'}</p>
                  {prescriptions.map((rx: any) => {
                    const meds = (rx.medicines as any[]) || [];
                    return (
                      <div key={rx.id} className="p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-destructive" />
                            <span className="text-sm font-medium text-foreground">
                              {rx.doctor_name ? `Dr. ${rx.doctor_name}` : (lang === 'en' ? 'Prescription' : 'প্রেসক্রিপশন')}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(rx.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {rx.diagnosis && (
                          <p className="text-xs text-muted-foreground">🩺 {rx.diagnosis}</p>
                        )}
                        {meds.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {meds.map((m: any, j: number) => (
                              <span key={j} className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                                💊 {m.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {rx.dietary_restrictions && (rx.dietary_restrictions as any[]).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(rx.dietary_restrictions as any[]).map((d: any, j: number) => (
                              <span key={j} className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full">
                                🍽️ {d.restriction}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{lang === 'en' ? 'No prescriptions uploaded' : 'কোনো প্রেসক্রিপশন আপলোড করা হয়নি'}</p>
              <Link to="/prescriptions">
                <Button size="sm" variant="outline" className="mt-2 text-xs">
                  {lang === 'en' ? 'Upload Prescription' : 'প্রেসক্রিপশন আপলোড করুন'}
                </Button>
              </Link>
            </div>
          )}
        </div>

        <Dialog open={!!exerciseDayPopup} onOpenChange={() => setExerciseDayPopup(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {exerciseDayPopup?.isRest ? <BedDouble className="h-5 w-5 text-muted-foreground" /> : <Dumbbell className="h-5 w-5 text-accent" />}
                {exerciseDayPopup?.day}
                {exerciseDayPopup?.isRest && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Rest Day</span>}
              </DialogTitle>
            </DialogHeader>
            {exerciseDayPopup?.isRest ? (
              <div className="text-center py-6">
                <BedDouble className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{lang === 'en' ? 'Rest day — recover and recharge!' : 'বিশ্রামের দিন — পুনরুদ্ধার করুন!'}</p>
              </div>
            ) : exerciseDayPopup?.exercises ? (
              <div className="space-y-3">
                {exerciseDayPopup.exercises.map((ex: any, j: number) => (
                  <div key={j} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">{ex.sets}</p>
                    </div>
                    <span className="text-xs text-destructive flex items-center gap-1 font-medium"><Flame className="h-3 w-3" />{ex.calories} cal</span>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground pt-2 border-t border-border text-center">
                  {lang === 'en' ? 'Total:' : 'মোট:'} {exerciseDayPopup.exercises.reduce((s: number, e: any) => s + (e.calories || 0), 0)} cal
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Diet Meal Popup */}
        <Dialog open={!!dietMealPopup} onOpenChange={() => setDietMealPopup(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-xl">{{ breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍎' }[dietMealPopup?.mealType || 'breakfast']}</span>
                {t(dietMealPopup?.mealType || 'breakfast', lang)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {dietMealPopup?.items?.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <span className="text-primary mt-0.5 font-bold">•</span>
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
              {(!dietMealPopup?.items || dietMealPopup.items.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">{lang === 'en' ? 'No items found' : 'কোনো আইটেম নেই'}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Daily Health Update - Step-by-Step Wizard */}
        <HealthCheckinWizard
          lang={lang}
          mood={mood} setMood={setMood}
          energy={energy} setEnergy={setEnergy}
          stress={stress} setStress={setStress}
          sleepQuality={sleepQuality} setSleepQuality={setSleepQuality}
          sleepHours={sleepHours} setSleepHours={setSleepHours}
          selectedPains={selectedPains} setSelectedPains={setSelectedPains}
          selectedSymptoms={selectedSymptoms} setSelectedSymptoms={setSelectedSymptoms}
          healthNotes={healthNotes} setHealthNotes={setHealthNotes}
          todayHealthDone={todayHealthDone}
          canCheckinAgain={canCheckinAgain}
          lastCheckinTime={lastCheckinTime}
          savingHealth={savingHealth}
          handleSaveHealthUpdate={handleSaveHealthUpdate}
          showHealthHistory={showHealthHistory} setShowHealthHistory={setShowHealthHistory}
          healthHistory={healthHistory}
          moodOptions={moodOptions}
        />

        {/* AI Suggestions - Enhanced with categories */}
        <div className="health-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-warning" />
              {lang === 'en' ? 'AI Health Insights' : 'এআই স্বাস্থ্য ইনসাইট'}
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchAiSuggestions}
              disabled={aiLoading}
              className="gap-1 text-xs"
            >
              <RefreshCw className={`h-3 w-3 ${aiLoading ? 'animate-spin' : ''}`} />
              {lang === 'en' ? 'Refresh' : 'রিফ্রেশ'}
            </Button>
          </div>
          {aiLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{lang === 'en' ? 'Analyzing your data...' : 'আপনার ডেটা বিশ্লেষণ হচ্ছে...'}</p>
          ) : aiSuggestions.length > 0 ? (
            <div className="space-y-2.5">
              {aiSuggestions.map((s, i) => {
                const categoryIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
                  diet: { icon: Utensils, color: 'text-primary', bg: 'bg-primary/10' },
                  exercise: { icon: Dumbbell, color: 'text-accent', bg: 'bg-accent/10' },
                  mindcare: { icon: Brain, color: 'text-[hsl(270,60%,50%)]', bg: 'bg-[hsl(270,60%,95%)]' },
                  tracker: { icon: TrendingUp, color: 'text-info', bg: 'bg-info/10' },
                  medicine: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
                  sleep: { icon: Moon, color: 'text-warning', bg: 'bg-warning/10' },
                  general: { icon: Sparkles, color: 'text-foreground', bg: 'bg-muted' },
                };
                const cat = s.category || 'general';
                const cfg = categoryIcons[cat] || categoryIcons.general;
                const CatIcon = cfg.icon;
                const priority = s.priority || 'medium';
                const text = typeof s === 'string' ? s : s[lang] || s.en || JSON.stringify(s);
                const altText = typeof s !== 'string' ? (lang === 'en' ? s.bn : s.en) : null;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`rounded-xl p-3 text-sm border ${priority === 'high' ? 'border-destructive/30 bg-destructive/5' : 'border-border/50 bg-muted/30'
                      }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg ${cfg.bg} shrink-0 mt-0.5`}>
                        <CatIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide ${cfg.color}`}>{cat}</span>
                          {priority === 'high' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold">
                              {lang === 'en' ? 'PRIORITY' : 'গুরুত্বপূর্ণ'}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground leading-relaxed">{text}</p>
                        {altText && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{altText}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {lang === 'en' ? 'Complete your health check-in to get personalized AI insights.' : 'ব্যক্তিগত এআই ইনসাইট পেতে আপনার স্বাস্থ্য চেক-ইন সম্পন্ন করুন।'}
            </p>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
