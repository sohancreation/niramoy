import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useLang } from '@/contexts/LanguageContext';
import type { UserProfile } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/use-subscription';
import { useFamilyFilter } from '@/hooks/use-family-query';
import SubscriptionGate from '@/components/SubscriptionGate';
import { t } from '@/lib/translations';
import { generateDietPlan, type Goal, type FoodPref, type MealPlan } from '@/lib/health-utils';
import { Button } from '@/components/ui/button';
import { Utensils, Droplets, Flame, AlertTriangle, Wallet, Calendar, Play, MessageSquare, Target, Sparkles, CheckCircle2, RefreshCw, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LiquidProgress from '@/components/LiquidProgress';
import PlanFeedbackModal, { type FeedbackData } from '@/components/PlanFeedbackModal';
import WaterTracker from '@/components/WaterTracker';
import confetti from 'canvas-confetti';

type Duration = 1 | 3;

const DAY_NAMES_EN = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_NAMES_BN = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'];

function getTodayDayIndex(): number {
  const jsDay = new Date().getDay(); // 0=Sun
  // Convert to Sat=0 index: Sat=0, Sun=1, Mon=2...
  return jsDay === 6 ? 0 : jsDay + 1;
}

export default function DietPlanPage() {
  const { lang } = useLang();
  const { user: authUser } = useAuth();
  const { canUseDietPlan, tier } = useSubscription();
  const { applyFilter, insertPayload, familyMemberId } = useFamilyFilter();
  const [goal, setGoal] = useState<Goal>('maintenance');
  const [foodPref, setFoodPref] = useState<FoodPref>('mixed');
  const [weeklyBudget, setWeeklyBudget] = useState<number>(2000);
  const [duration, setDuration] = useState<Duration>(1);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [latestCheckin, setLatestCheckin] = useState<any>(null);
  const [checkedMeals, setCheckedMeals] = useState<Set<string>>(new Set());
  const [generatingAlt, setGeneratingAlt] = useState<string | null>(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const [selectedDay, setSelectedDay] = useState(getTodayDayIndex());
  const [previewDay, setPreviewDay] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  const normalizeActivity = useCallback((activity: string | null): UserProfile['activityLevel'] => {
    return (['sedentary', 'light', 'moderate', 'active'] as const).includes(activity as any)
      ? (activity as UserProfile['activityLevel'])
      : 'moderate';
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!authUser) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    try {
      if (familyMemberId) {
        const { data } = await supabase.from('family_members')
          .select('name, age, gender, height, weight, activity_level, medical_conditions')
          .eq('id', familyMemberId)
          .maybeSingle();
        if (data) {
          setProfile({
            name: data.name || 'Family Member',
            age: data.age ?? 30,
            gender: data.gender === 'female' ? 'female' : 'male',
            height: data.height ?? 170,
            weight: data.weight ?? 70,
            activityLevel: normalizeActivity(data.activity_level),
            location: 'Dhaka',
            medicalConditions: data.medical_conditions || '',
          });
        } else {
          setProfile(null);
        }
      } else {
        const { data } = await supabase.from('profiles')
          .select('name, age, gender, height, weight, activity_level, location, medical_conditions')
          .eq('user_id', authUser.id)
          .maybeSingle();
        if (data) {
          setProfile({
            name: data.name || 'You',
            age: data.age ?? 30,
            gender: data.gender === 'female' ? 'female' : 'male',
            height: data.height ?? 170,
            weight: data.weight ?? 70,
            activityLevel: normalizeActivity(data.activity_level),
            location: data.location || '',
            medicalConditions: data.medical_conditions || '',
          });
        } else {
          setProfile(null);
        }
      }
    } catch (e) {
      console.error('fetchProfile error:', e);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [authUser, familyMemberId, normalizeActivity]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (authUser) { fetchActivePlan(); fetchLatestCheckin(); }
  }, [authUser, familyMemberId]);

  const fetchLatestCheckin = async () => {
    try {
      if (!authUser) return;
      const { data } = await supabase.from('daily_health_updates').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data) setLatestCheckin(data);
    } catch (e) { console.error('fetchLatestCheckin error:', e); }
  };

  const fetchActivePlan = async () => {
    try {
      if (!authUser) return;
      const { data: planData } = await applyFilter(supabase.from('saved_plans').select('*').eq('user_id', authUser.id).eq('plan_type', 'diet').eq('is_active', true)).maybeSingle();
      if (planData) {
        setActivePlan(planData);
        const { data: progress } = await supabase.from('plan_progress').select('*').eq('plan_id', planData.id).order('progress_date', { ascending: true });
        if (progress) {
          setProgressData(progress);
          const todayProgress = progress.find(p => p.progress_date === today);
          if (todayProgress?.completed_items) {
            setCheckedMeals(new Set((todayProgress.completed_items as any[]) || []));
          }
        }
      }
    } catch (e) { console.error('fetchActivePlan error:', e); }
  };

  const planProgress = useMemo(() => {
    if (!activePlan) return { percent: 0, daysLeft: 0, totalDays: 30, completed: 0 };
    const start = new Date(activePlan.start_date || activePlan.created_at);
    const end = activePlan.end_date ? new Date(activePlan.end_date) : new Date(start.getTime() + 30 * 86400000);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const elapsed = Math.ceil((Date.now() - start.getTime()) / 86400000);
    const completed = activePlan.total_days_completed || progressData.length;
    return { percent: Math.min(100, Math.round((completed / totalDays) * 100)), daysLeft: Math.max(0, totalDays - elapsed), totalDays, completed };
  }, [activePlan, progressData]);

  const motivation = useMemo(() => {
    const p = planProgress.percent;
    if (p >= 90) return { en: "Almost there! You're a health champion! 🏆", bn: 'প্রায় শেষ! তুমি একজন স্বাস্থ্য চ্যাম্পিয়ন! 🏆' };
    if (p >= 70) return { en: "Amazing progress! Keep pushing! 💪", bn: 'দুর্দান্ত অগ্রগতি! চালিয়ে যাও! 💪' };
    if (p >= 50) return { en: "Halfway there! You're doing great! 🌟", bn: 'অর্ধেক পথ! তুমি দারুণ করছো! 🌟' };
    if (p >= 25) return { en: "Great start! Stay consistent! 🔥", bn: 'দুর্দান্ত শুরু! ধারাবাহিক থাকো! 🔥' };
    return { en: "Every journey starts with one step! 🚀", bn: 'প্রতিটি যাত্রা একটি পদক্ষেপ দিয়ে শুরু! 🚀' };
  }, [planProgress.percent]);

  const healthWarning = useMemo(() => {
    if (!latestCheckin) return null;
    const warnings: string[] = [];
    if ((latestCheckin.stress_level || 3) >= 4) warnings.push(lang === 'en' ? 'High stress detected - extra calories added' : 'উচ্চ চাপ - অতিরিক্ত ক্যালোরি যোগ');
    if (latestCheckin.symptoms?.includes('Fever')) warnings.push(lang === 'en' ? 'Fever detected - lighter meals recommended' : 'জ্বর - হালকা খাবার সুপারিশ');
    if ((latestCheckin.energy_level || 3) <= 2) warnings.push(lang === 'en' ? 'Low energy - energy-boosting foods prioritized' : 'কম শক্তি - শক্তিবর্ধক খাবার অগ্রাধিকার');
    return warnings.length > 0 ? warnings : null;
  }, [latestCheckin, lang]);

  // Get current day's data from active plan
  const activePlanDays = useMemo(() => {
    if (!activePlan?.plan_data) return null;
    const pd = activePlan.plan_data as any;
    // Support both old format (flat) and new format (days array)
    if (pd.days && Array.isArray(pd.days)) return pd.days;
    // Old format: convert to single-day repeated
    return null;
  }, [activePlan]);

  const currentDayPlan = useMemo(() => {
    if (!activePlanDays) {
      // Fallback for old format plans
      if (!activePlan?.plan_data) return null;
      const pd = activePlan.plan_data as any;
      if (pd.breakfast) return pd; // old flat format
      return null;
    }
    return activePlanDays[selectedDay] || activePlanDays[0];
  }, [activePlanDays, selectedDay, activePlan]);

  const todayMealProgress = useMemo(() => {
    if (!currentDayPlan) return 0;
    const totalItems = ['breakfast', 'lunch', 'dinner', 'snacks'].reduce((sum, k) => sum + (currentDayPlan?.[k]?.length || 0), 0);
    return totalItems > 0 ? Math.round((checkedMeals.size / totalItems) * 100) : 0;
  }, [currentDayPlan, checkedMeals]);

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
            <Utensils className="h-8 w-8 text-primary" />
            {t('dietPlan', lang)}
          </h1>
          <div className="health-card text-sm text-muted-foreground">
            {lang === 'en' ? 'Loading your profile...' : 'আপনার প্রোফাইল লোড করা হচ্ছে...'}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
            <Utensils className="h-8 w-8 text-primary" />
            {t('dietPlan', lang)}
          </h1>
          <div className="health-card space-y-3">
            <p className="text-sm text-muted-foreground">
              {lang === 'en'
                ? 'Add your age, height, weight, activity level, and medical conditions in your profile to generate a personalized diet plan.'
                : 'ব্যক্তিগত ডায়েট প্ল্যান পেতে প্রোফাইলে বয়স, উচ্চতা, ওজন, কার্যক্রম মাত্রা ও স্বাস্থ্য তথ্য যোগ করুন।'}
            </p>
            <div className="flex gap-2">
              <Button asChild className="gradient-primary border-0 text-primary-foreground">
                <Link to="/profile">{lang === 'en' ? 'Update profile' : 'প্রোফাইল আপডেট করুন'}</Link>
              </Button>
              <Button variant="outline" onClick={fetchProfile}>
                {lang === 'en' ? 'Retry' : 'পুনরায় চেষ্টা করুন'}
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleGenerate = () => {
    if (!profile) {
      toast.error(lang === 'en' ? 'Add your profile details first' : 'প্রোফাইলের তথ্য যোগ করুন');
      return;
    }
    setPlan(generateDietPlan(profile, goal, foodPref));
    setPreviewDay(0);
  };

  const handleStartPlan = async () => {
    try {
      if (!authUser || !plan) return;
      await supabase.from('saved_plans').update({ is_active: false }).eq('user_id', authUser.id).eq('plan_type', 'diet');
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + duration);
      const { data: newPlan } = await supabase.from('saved_plans').insert({
        user_id: authUser.id, plan_type: 'diet',
        plan_data: { ...plan, weeklyBudget } as any,
        goal, is_active: true, duration_months: duration,
        start_date: today, end_date: endDate.toISOString().split('T')[0],
        total_days_completed: 0,
        ...insertPayload,
      }).select().single();
      if (newPlan) { setActivePlan(newPlan); setProgressData([]); setCheckedMeals(new Set()); setPlan(null); }
      toast.success(lang === 'en' ? 'Plan started! 🚀' : 'প্ল্যান শুরু হয়েছে! 🚀');
    } catch (e) { console.error('handleStartPlan error:', e); toast.error('Something went wrong'); }
  };

  const handleMealCheck = async (mealKey: string) => {
    try {
      if (!authUser || !activePlan) return;
      const newChecked = new Set(checkedMeals);
      if (newChecked.has(mealKey)) { newChecked.delete(mealKey); }
      else { newChecked.add(mealKey); confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } }); }
      setCheckedMeals(newChecked);
      await supabase.from('plan_progress').upsert({
        user_id: authUser.id, plan_id: activePlan.id, progress_date: today,
        completed_items: Array.from(newChecked) as any,
      }, { onConflict: 'plan_id,progress_date' });
      if (checkedMeals.size === 0 && newChecked.size > 0) {
        await supabase.from('saved_plans').update({ total_days_completed: (activePlan.total_days_completed || 0) + 1 }).eq('id', activePlan.id);
        setActivePlan((prev: any) => ({ ...prev, total_days_completed: (prev.total_days_completed || 0) + 1 }));
      }
    } catch (e) { console.error('handleMealCheck error:', e); }
  };

  const handleGenerateAlternative = async (mealType: string, itemIndex: number, dayIdx: number) => {
    if (!activePlan) return;
    const key = `${dayIdx}-${mealType}-${itemIndex}`;
    setGeneratingAlt(key);

    const alternatives: Record<string, string[]> = {
      breakfast: ['Poha with peanuts (280 cal)', 'Idli with sambar (300 cal)', 'Muesli with yogurt (320 cal)', 'Paratha with curd (350 cal)', 'Banana pancakes (310 cal)', 'Dalia porridge (290 cal)'],
      lunch: ['Chicken biryani (500 cal)', 'Lentil soup with bread (380 cal)', 'Fried rice with veggies (420 cal)', 'Fish curry with rice (480 cal)', 'Rajma rice (440 cal)', 'Veg pulao (410 cal)'],
      dinner: ['Chapati with dal (360 cal)', 'Soup with bread (300 cal)', 'Grilled paneer (380 cal)', 'Chicken stew (420 cal)', 'Egg curry with roti (400 cal)', 'Khichdi with pickle (350 cal)'],
      snacks: ['Trail mix (160 cal)', 'Apple with PB (180 cal)', 'Yogurt parfait (140 cal)', 'Hummus with carrots (130 cal)', 'Dates & almonds (150 cal)', 'Popcorn (100 cal)'],
    };

    const pd = activePlan.plan_data as any;
    const days = pd.days ? [...pd.days] : null;
    
    if (days) {
      const dayPlan = { ...days[dayIdx] };
      const currentItems: string[] = [...(dayPlan[mealType] || [])];
      const options = alternatives[mealType] || alternatives.snacks;
      const available = options.filter(o => !currentItems.includes(o));
      const newItem = available[Math.floor(Math.random() * available.length)] || options[0];
      currentItems[itemIndex] = newItem;
      dayPlan[mealType] = currentItems;
      days[dayIdx] = dayPlan;
      const updatedPlanData = { ...pd, days };
      await supabase.from('saved_plans').update({ plan_data: updatedPlanData }).eq('id', activePlan.id);
      setActivePlan((prev: any) => ({ ...prev, plan_data: updatedPlanData }));
    }

    setGeneratingAlt(null);
    toast.success(lang === 'en' ? 'Alternative generated!' : 'বিকল্প তৈরি!');
  };

  const handleFeedback = async (feedback: FeedbackData) => {
    try {
      if (!authUser || !activePlan) return;
      const existing = progressData.find(p => p.progress_date === today);
      await supabase.from('plan_progress').upsert({
        user_id: authUser.id, plan_id: activePlan.id, progress_date: today,
        completed_items: existing?.completed_items || Array.from(checkedMeals),
        feedback: feedback as any, notes: feedback.notes,
      }, { onConflict: 'plan_id,progress_date' });
      toast.success(lang === 'en' ? 'Feedback saved!' : 'ফিডব্যাক সংরক্ষিত!');
      fetchActivePlan();
    } catch (e) { console.error('handleFeedback error:', e); toast.error('Something went wrong'); }
  };

  const dailyBudget = Math.round(weeklyBudget / 7);
  const todayFeedbackDone = progressData.some(p => p.progress_date === today && p.feedback && Object.keys(p.feedback as any).length > 0);
  const todayDayIdx = getTodayDayIndex();

  const mealIcons: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍎' };
  const mealBudget: Record<string, number> = { breakfast: 20, lunch: 35, dinner: 30, snacks: 15 };

  return (
    <AppLayout>
      {!canUseDietPlan ? (
        <SubscriptionGate
          allowed={false}
          featureName={{ en: 'Diet Plan', bn: 'ডায়েট প্ল্যান' }}
          message={{
            en: 'Your 7-day free trial has ended. Subscribe to create and follow diet plans.',
            bn: 'আপনার ৭ দিনের ফ্রি ট্রায়াল শেষ। ডায়েট প্ল্যান তৈরি ও অনুসরণ করতে সাবস্ক্রাইব করুন।'
          }}
        />
      ) : (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
          <Utensils className="h-8 w-8 text-primary" />
          {t('dietPlan', lang)}
        </h1>

        {/* Active Plan Progress */}
        {activePlan && (
          <div className="health-card space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {lang === 'en' ? 'Active Plan' : 'সক্রিয় প্ল্যান'}
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {activePlan.duration_months || 1} {lang === 'en' ? 'month' : 'মাস'}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                {!todayFeedbackDone && (
                  <Button size="sm" variant="outline" onClick={() => setFeedbackOpen(true)} className="gap-1.5">
                    <MessageSquare className="h-4 w-4" /> {lang === 'en' ? 'Feedback' : 'ফিডব্যাক'}
                  </Button>
                )}
                {todayFeedbackDone && <span className="flex items-center gap-1 text-xs text-accent font-medium"><CheckCircle2 className="h-4 w-4" /> ✓</span>}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <LiquidProgress percent={planProgress.percent} label={motivation[lang]} sublabel={`${planProgress.completed}/${planProgress.totalDays} ${lang === 'en' ? 'days' : 'দিন'}`} color="primary" />
              <div className="flex-1 w-full space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <p className="text-2xl font-heading font-bold text-foreground">{planProgress.daysLeft}</p>
                    <p className="text-xs text-muted-foreground">{lang === 'en' ? 'Days Left' : 'বাকি দিন'}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <p className="text-2xl font-heading font-bold text-foreground">{planProgress.completed}</p>
                    <p className="text-xs text-muted-foreground">{lang === 'en' ? 'Completed' : 'সম্পন্ন'}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <Flame className="h-4 w-4 text-destructive mx-auto mb-1" />
                    <p className="text-sm font-bold text-foreground">{(activePlan.plan_data as any)?.totalCalories || 0}</p>
                    <p className="text-[10px] text-muted-foreground">{t('calories', lang)}/day</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <Droplets className="h-4 w-4 text-info mx-auto mb-1" />
                    <p className="text-sm font-bold text-foreground">{(activePlan.plan_data as any)?.waterLiters || 0}L</p>
                    <p className="text-[10px] text-muted-foreground">{t('water', lang)}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground font-medium">{lang === 'en' ? "Today's Meals" : 'আজকের খাবার'}</span>
                    <span className="text-primary font-bold">{todayMealProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${todayMealProgress}%`, background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 animate-pulse-soft" />
              <p className="text-sm font-medium text-foreground">{motivation[lang]}</p>
            </div>

            <div className="flex justify-center p-4 rounded-xl bg-info/5 border border-info/20">
              <WaterTracker target={Math.round(((activePlan.plan_data as any)?.waterLiters || 2) * 1000)} current={waterIntake} onAdd={(ml) => setWaterIntake(prev => prev + ml)} lang={lang} />
            </div>

            {/* Day Selector for Active Plan */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {lang === 'en' ? 'Weekly Meal Plan — Select a day' : 'সাপ্তাহিক খাবার পরিকল্পনা — একটি দিন বেছে নিন'}
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(lang === 'en' ? DAY_NAMES_EN : DAY_NAMES_BN).map((dayName, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDay(i)}
                    className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all min-w-[70px] text-center ${
                      selectedDay === i
                        ? 'gradient-primary text-primary-foreground shadow-md'
                        : i === todayDayIdx
                          ? 'bg-primary/10 border-2 border-primary/30 text-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {dayName.slice(0, 3)}
                    {i === todayDayIdx && <span className="block text-[8px] mt-0.5">{lang === 'en' ? 'Today' : 'আজ'}</span>}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Selected Day's Meals */}
            {currentDayPlan && (
              <AnimatePresence mode="wait">
                <motion.div key={selectedDay} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {(lang === 'en' ? DAY_NAMES_EN : DAY_NAMES_BN)[selectedDay]} — {lang === 'en' ? 'Tick when done' : 'খেলে টিক দিন'}
                    {selectedDay !== todayDayIdx && <span className="text-xs text-muted-foreground ml-2">({lang === 'en' ? 'Preview only' : 'শুধু দেখুন'})</span>}
                  </h3>
                  {['breakfast', 'lunch', 'dinner', 'snacks'].map(key => {
                    const items: string[] = currentDayPlan?.[key] || [];
                    return (
                      <div key={key} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                          <span>{mealIcons[key]}</span> {t(key, lang)}
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto">
                            ≈ ৳{Math.round(dailyBudget * (mealBudget[key] || 20) / 100)}
                          </span>
                        </h4>
                        <ul className="space-y-2">
                          {items.map((item: string, i: number) => {
                            const mealKey = `d${selectedDay}-${key}-${i}`;
                            const isDone = checkedMeals.has(mealKey);
                            const isToday = selectedDay === todayDayIdx;
                            const isGenAlt = generatingAlt === `${selectedDay}-${key}-${i}`;
                            return (
                              <motion.li key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className={`flex items-center gap-2 text-sm rounded-lg p-2 transition-all ${isDone ? 'bg-accent/10' : 'hover:bg-muted/50'}`}
                              >
                                <button onClick={() => isToday && handleMealCheck(mealKey)} disabled={!isToday} className="shrink-0">
                                  {isDone ? <CheckCircle2 className="h-5 w-5 text-accent" /> : <Circle className={`h-5 w-5 ${isToday ? 'text-muted-foreground hover:text-primary' : 'text-muted-foreground/40'} transition-colors`} />}
                                </button>
                                <span className={`flex-1 ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item}</span>
                                {isToday && (
                                  <button onClick={() => handleGenerateAlternative(key, i, selectedDay)} disabled={isGenAlt}
                                    className="shrink-0 text-xs text-primary hover:text-primary/80 flex items-center gap-1 px-2 py-1 rounded-md bg-primary/5 hover:bg-primary/10 transition-all"
                                  >
                                    <RefreshCw className={`h-3 w-3 ${isGenAlt ? 'animate-spin' : ''}`} />
                                    {lang === 'en' ? 'Alt' : 'বিকল্প'}
                                  </button>
                                )}
                              </motion.li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        )}

        {/* Health Condition Alerts */}
        {healthWarning && (
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-warning/10 border border-warning/20">
            {healthWarning.map((w, i) => (
              <p key={i} className="text-xs text-foreground flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-warning flex-shrink-0" /> {w}
              </p>
            ))}
          </div>
        )}

        {/* Generate New Plan */}
        <div className="health-card space-y-4">
          <h2 className="font-heading font-semibold text-foreground">
            {activePlan ? (lang === 'en' ? 'Generate New Plan' : 'নতুন প্ল্যান তৈরি') : (lang === 'en' ? 'Create Your Plan' : 'আপনার প্ল্যান তৈরি করুন')}
          </h2>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> {lang === 'en' ? 'Plan Duration' : 'প্ল্যানের সময়কাল'}
            </label>
            <div className="flex gap-2">
              {([1, 3] as Duration[]).map(d => {
                const disabled = tier === 'free' && d > 1;
                return (
                <button key={d} onClick={() => !disabled && setDuration(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${duration === d ? 'gradient-primary text-primary-foreground' : disabled ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                >{d} {lang === 'en' ? 'Month' : 'মাস'} {disabled ? '🔒' : ''}</button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">{t('goal', lang)}</label>
            <div className="flex gap-2 flex-wrap">
              {(['weightLoss', 'maintenance', 'muscleGain'] as Goal[]).map(g => (
                <button key={g} onClick={() => setGoal(g)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${goal === g ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                >{t(g, lang)}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">{t('foodPreference', lang)}</label>
            <div className="flex gap-2 flex-wrap">
              {(['veg', 'nonVeg', 'mixed'] as FoodPref[]).map(f => (
                <button key={f} onClick={() => setFoodPref(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${foodPref === f ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                >{t(f, lang)}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-warning" /> {lang === 'en' ? 'Weekly Food Budget (BDT)' : 'সাপ্তাহিক খাবার বাজেট (টাকা)'}
            </label>
            <div className="flex gap-2 flex-wrap">
              {[1000, 1500, 2000, 3000, 5000].map(b => (
                <button key={b} onClick={() => setWeeklyBudget(b)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${weeklyBudget === b ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                >৳{b}</button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">≈ ৳{dailyBudget}/{lang === 'en' ? 'day' : 'দিন'}</p>
          </div>

          <Button onClick={handleGenerate} className="gradient-primary border-0 text-primary-foreground">
            {t('generatePlan', lang)}
          </Button>
        </div>

        {/* Generated Plan Preview with Day Navigation */}
        {plan && (
          <div className="space-y-4 animate-slide-up">
            <div className="grid grid-cols-3 gap-4">
              <div className="health-card text-center">
                <Flame className="h-6 w-6 text-destructive mx-auto mb-1" />
                <p className="text-2xl font-heading font-bold text-foreground">{plan.totalCalories}</p>
                <p className="text-xs text-muted-foreground">{t('calories', lang)}/day</p>
              </div>
              <div className="health-card text-center">
                <Droplets className="h-6 w-6 text-info mx-auto mb-1" />
                <p className="text-2xl font-heading font-bold text-foreground">{plan.waterLiters}L</p>
                <p className="text-xs text-muted-foreground">{t('water', lang)}</p>
              </div>
              <div className="health-card text-center">
                <Wallet className="h-6 w-6 text-warning mx-auto mb-1" />
                <p className="text-2xl font-heading font-bold text-foreground">৳{dailyBudget}</p>
                <p className="text-xs text-muted-foreground">{lang === 'en' ? 'Daily Budget' : 'দৈনিক বাজেট'}</p>
              </div>
            </div>

            {/* Day selector for preview */}
            <div className="flex items-center justify-between">
              <Button size="sm" variant="ghost" onClick={() => setPreviewDay(Math.max(0, previewDay - 1))} disabled={previewDay === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-2 overflow-x-auto">
                {plan.days.map((d, i) => (
                  <button key={i} onClick={() => setPreviewDay(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${previewDay === i ? 'gradient-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                  >
                    {(lang === 'en' ? d.day : d.dayBn).slice(0, 3)}
                  </button>
                ))}
              </div>
              <Button size="sm" variant="ghost" onClick={() => setPreviewDay(Math.min(6, previewDay + 1))} disabled={previewDay === 6}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={previewDay} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h3 className="font-heading font-semibold text-foreground mb-3">
                  {lang === 'en' ? plan.days[previewDay].day : plan.days[previewDay].dayBn}
                </h3>
                {['breakfast', 'lunch', 'dinner', 'snacks'].map(key => {
                  const items = (plan.days[previewDay] as any)[key] as string[];
                  return (
                    <div key={key} className="health-card mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-heading font-semibold text-foreground flex items-center gap-2">
                          <span>{mealIcons[key]}</span> {t(key, lang)}
                        </h4>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">≈ ৳{Math.round(dailyBudget * (mealBudget[key] || 20) / 100)}</span>
                      </div>
                      <ul className="space-y-2">
                        {items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-0.5">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            <Button onClick={handleStartPlan} className="w-full gradient-primary border-0 text-primary-foreground gap-2 h-12 text-base">
              <Play className="h-5 w-5" />
              {lang === 'en' ? `Start ${duration}-Month Plan` : `${duration} মাসের প্ল্যান শুরু করুন`}
            </Button>

            <div className="flex items-start gap-2 p-4 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{t('disclaimer', lang)}</p>
            </div>
          </div>
        )}

        <PlanFeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} onSubmit={handleFeedback} planType="diet" lang={lang} />
      </div>
      )}
    </AppLayout>
  );
}
