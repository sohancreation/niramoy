import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/use-subscription';
import { useFamilyFilter } from '@/hooks/use-family-query';
import SubscriptionGate from '@/components/SubscriptionGate';
import { t } from '@/lib/translations';
import { generateExercisePlan, type Goal, type FitnessLevel, type Equipment, type ExerciseDay } from '@/lib/health-utils';
import { Button } from '@/components/ui/button';
import { Dumbbell, Flame, BedDouble, Calendar, Play, MessageSquare, Target, Sparkles, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LiquidProgress from '@/components/LiquidProgress';
import ExerciseTimer from '@/components/ExerciseTimer';
import PlanFeedbackModal, { type FeedbackData } from '@/components/PlanFeedbackModal';
import LiveWorkoutModal from '@/components/LiveWorkoutModal';
import BadgesDisplay from '@/components/BadgesDisplay';

type Duration = 1 | 3;

export default function ExercisePage() {
  const { lang } = useLang();
  const { user: authUser } = useAuth();
  const { canUseExercisePlan, planDurationLimit, tier } = useSubscription();
  const { applyFilter, insertPayload, familyMemberId } = useFamilyFilter();
  const [goal, setGoal] = useState<Goal>('maintenance');
  const [level, setLevel] = useState<FitnessLevel>('beginner');
  const [equip, setEquip] = useState<Equipment>('none');
  const [duration, setDuration] = useState<Duration>(1);
  const [plan, setPlan] = useState<ExerciseDay[] | null>(null);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [latestCheckin, setLatestCheckin] = useState<any>(null);
  const [liveWorkoutOpen, setLiveWorkoutOpen] = useState(false);

  const today = new Date().toLocaleDateString('en-CA');
  const dayOfWeek = new Date().getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (authUser) {
      fetchActivePlan();
      fetchLatestCheckin();
    }
  }, [authUser]);

  const fetchLatestCheckin = async () => {
    try {
      if (!authUser) return;
      const { data } = await supabase.from('daily_health_updates').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data) setLatestCheckin(data);
    } catch (e) { console.error(e); }
  };

  const fetchActivePlan = async () => {
    try {
      if (!authUser) return;
      const { data: planData } = await applyFilter(supabase.from('saved_plans').select('*').eq('user_id', authUser.id).eq('plan_type', 'exercise').eq('is_active', true)).maybeSingle();
      if (planData) {
        setActivePlan(planData);
        const { data: progress } = await supabase.from('plan_progress').select('*').eq('plan_id', planData.id).order('progress_date', { ascending: true });
        if (progress) {
          setProgressData(progress);
          const todayProgress = progress.find(p => p.progress_date === today);
          if (todayProgress?.completed_items) {
            setCompletedExercises(new Set((todayProgress.completed_items as any[]) || []));
          }
        }
      }
    } catch (e) { console.error('fetchActivePlan error:', e); }
  };

  const handleGenerate = () => setPlan(generateExercisePlan(goal, level, equip));

  const handleStartPlan = async () => {
    try {
      if (!authUser || !plan) return;
      await supabase.from('saved_plans').update({ is_active: false }).eq('user_id', authUser.id).eq('plan_type', 'exercise');
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + duration);
      const { data: newPlan } = await supabase.from('saved_plans').insert({
        user_id: authUser.id,
        plan_type: 'exercise',
        plan_data: plan as any,
        goal,
        is_active: true,
        duration_months: duration,
        start_date: today,
        end_date: endDate.toLocaleDateString('en-CA'),
        total_days_completed: 0,
        ...insertPayload,
      }).select().single();
      if (newPlan) {
        setActivePlan(newPlan);
        setProgressData([]);
        setPlan(null);
      }
      toast.success(lang === 'en' ? 'Exercise plan started! 💪' : 'ব্যায়াম প্ল্যান শুরু! 💪');
    } catch (e) {
      console.error('handleStartPlan error:', e);
      toast.error('Something went wrong');
    }
  };

  const handleExerciseComplete = async (exerciseName: string) => {
    try {
      if (!authUser || !activePlan) return;
      const newCompleted = new Set(completedExercises);
      newCompleted.add(exerciseName);
      setCompletedExercises(newCompleted);

      await supabase.from('plan_progress').upsert({
        user_id: authUser.id,
        plan_id: activePlan.id,
        progress_date: today,
        completed_items: Array.from(newCompleted) as any,
      }, { onConflict: 'plan_id,progress_date' });

      if (completedExercises.size === 0) {
        await supabase.from('saved_plans').update({ total_days_completed: (activePlan.total_days_completed || 0) + 1 }).eq('id', activePlan.id);
        setActivePlan((prev: any) => ({ ...prev, total_days_completed: (prev.total_days_completed || 0) + 1 }));
      }
    } catch (e) { console.error('handleExerciseComplete error:', e); }
  };

  const handleFeedback = async (feedback: FeedbackData) => {
    try {
      if (!authUser || !activePlan) return;
      const existing = progressData.find(p => p.progress_date === today);
      await supabase.from('plan_progress').upsert({
        user_id: authUser.id,
        plan_id: activePlan.id,
        progress_date: today,
        completed_items: existing?.completed_items || Array.from(completedExercises),
        feedback: feedback as any,
        notes: feedback.notes,
      }, { onConflict: 'plan_id,progress_date' });
      toast.success(lang === 'en' ? 'Feedback saved!' : 'ফিডব্যাক সংরক্ষিত!');
      fetchActivePlan();
    } catch (e) {
      console.error('handleFeedback error:', e);
      toast.error('Something went wrong');
    }
  };

  const planProgress = useMemo(() => {
    if (!activePlan) return { percent: 0, daysLeft: 0, totalDays: 30, completed: 0 };
    const start = new Date(activePlan.start_date || activePlan.created_at);
    const end = activePlan.end_date ? new Date(activePlan.end_date) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const elapsed = Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
    const completed = activePlan.total_days_completed || 0;
    const percent = Math.min(100, Math.round((completed / totalDays) * 100));
    const daysLeft = Math.max(0, totalDays - elapsed);
    return { percent, daysLeft, totalDays, completed };
  }, [activePlan]);

  const motivation = useMemo(() => {
    const p = planProgress.percent;
    if (p >= 90) return { en: "You're unstoppable! Final stretch! 🏆", bn: 'তুমি অপ্রতিরোধ্য! শেষ ধাপ! 🏆' };
    if (p >= 70) return { en: "You're on fire! Keep going! 🔥", bn: 'তুমি দুর্দান্ত! চালিয়ে যাও! 🔥' };
    if (p >= 50) return { en: "Halfway! Your body thanks you! 💪", bn: 'অর্ধেক পথ! তোমার শরীর ধন্যবাদ জানাচ্ছে! 💪' };
    if (p >= 25) return { en: "Building the habit! Stay strong! 🌟", bn: 'অভ্যাস তৈরি হচ্ছে! শক্ত থাকো! 🌟' };
    return { en: "Every rep counts! Let's go! 🚀", bn: 'প্রতিটি রেপ গুরুত্বপূর্ণ! চলো শুরু করি! 🚀' };
  }, [planProgress.percent]);

  // Health-based warnings
  const healthWarning = useMemo(() => {
    if (!latestCheckin) return null;
    const warnings: string[] = [];
    if ((latestCheckin.stress_level || 3) >= 4) warnings.push(lang === 'en' ? 'High stress - consider lighter exercises' : 'উচ্চ চাপ - হালকা ব্যায়াম বিবেচনা করুন');
    if (latestCheckin.symptoms?.includes('Fever')) warnings.push(lang === 'en' ? 'Fever detected - rest recommended' : 'জ্বর শনাক্ত - বিশ্রাম সুপারিশ');
    if ((latestCheckin.energy_level || 3) <= 2) warnings.push(lang === 'en' ? 'Low energy - reduce intensity' : 'কম শক্তি - তীব্রতা কমান');
    if (latestCheckin.pain_areas?.length > 0) warnings.push(lang === 'en' ? `Pain reported (${latestCheckin.pain_areas.join(', ')}) - be careful` : `ব্যথা রিপোর্ট (${latestCheckin.pain_areas.join(', ')}) - সতর্ক থাকুন`);
    return warnings.length > 0 ? warnings : null;
  }, [latestCheckin, lang]);

  // Get workout for a specific day offset from today
  const getWorkoutForDay = (offset: number) => {
    if (!activePlan) return null;
    const planData = activePlan.plan_data as any;
    if (!Array.isArray(planData)) return null;
    const targetDay = (dayOfWeek + offset) % 7;
    return planData.find((d: any) => d.day === dayNames[targetDay]) || null;
  };

  const selectedWorkout = getWorkoutForDay(selectedDayOffset);
  const selectedDayName = dayNames[(dayOfWeek + selectedDayOffset) % 7];
  const isToday = selectedDayOffset === 0;

  const todayWorkout = getWorkoutForDay(0);
  const todayExerciseProgress = useMemo(() => {
    if (!todayWorkout || todayWorkout.isRest) return 100;
    const total = todayWorkout.exercises?.length || 1;
    return Math.round((completedExercises.size / total) * 100);
  }, [todayWorkout, completedExercises]);

  const todayFeedbackDone = progressData.some(p => p.progress_date === today && p.feedback && Object.keys(p.feedback as any).length > 0);

  const ToggleGroup = ({ options, value, onChange, translationKeys }: { options: string[]; value: string; onChange: (v: any) => void; translationKeys: string[] }) => (
    <div className="flex gap-2 flex-wrap">
      {options.map((o, i) => (
        <button key={o} onClick={() => onChange(o)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${value === o ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
        >{t(translationKeys[i], lang)}</button>
      ))}
    </div>
  );

  return (
    <AppLayout>
      {!canUseExercisePlan ? (
        <SubscriptionGate
          allowed={false}
          featureName={{ en: 'Exercise Plan', bn: 'ব্যায়াম প্ল্যান' }}
          message={{
            en: 'Your 7-day free trial has ended. Subscribe to create and follow exercise plans.',
            bn: 'আপনার ৭ দিনের ফ্রি ট্রায়াল শেষ। ব্যায়াম প্ল্যান তৈরি ও অনুসরণ করতে সাবস্ক্রাইব করুন।'
          }}
        />
      ) : (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
            <Dumbbell className="h-8 w-8 text-accent" />
            {t('exercise', lang)}
          </h1>

          {/* Health Warnings */}
          {healthWarning && (
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-warning/10 border border-warning/20">
              {healthWarning.map((w, i) => (
                <p key={i} className="text-xs text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-warning flex-shrink-0" /> {w}
                </p>
              ))}
            </div>
          )}

          {/* Active Plan with Progress */}
          {activePlan && (
            <div className="health-card space-y-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" />
                  {lang === 'en' ? 'Active Plan' : 'সক্রিয় প্ল্যান'}
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                    {activePlan.duration_months || 1} {lang === 'en' ? 'month' : 'মাস'}
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  {!todayFeedbackDone && (
                    <Button size="sm" variant="outline" onClick={() => setFeedbackOpen(true)} className="gap-1.5">
                      <MessageSquare className="h-4 w-4" />
                      {lang === 'en' ? 'Feedback' : 'ফিডব্যাক'}
                    </Button>
                  )}
                  {todayFeedbackDone && (
                    <span className="flex items-center gap-1 text-xs text-accent font-medium">
                      <CheckCircle2 className="h-4 w-4" /> ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <LiquidProgress percent={planProgress.percent} label={motivation[lang]} sublabel={`${planProgress.completed}/${planProgress.totalDays} ${lang === 'en' ? 'days' : 'দিন'}`} color="accent" />
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
                  </div>
                  {/* Today's exercise progress */}
                  <div className="p-3 rounded-xl bg-accent/5 border border-accent/20">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{lang === 'en' ? "Today's Progress" : 'আজকের অগ্রগতি'}</span>
                      <span className="text-accent font-bold">{todayExerciseProgress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${todayExerciseProgress}%`, background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)))' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivational Banner */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/5 border border-accent/20">
                <Sparkles className="h-5 w-5 text-accent flex-shrink-0 animate-pulse-soft" />
                <p className="text-sm font-medium text-foreground">{motivation[lang]}</p>
              </div>

              {/* Start Live Workout Button */}
              {todayWorkout && !todayWorkout.isRest && (
                <Button
                  onClick={() => setLiveWorkoutOpen(true)}
                  className="w-full gradient-primary border-0 text-primary-foreground gap-2 h-14 text-lg font-bold animate-pulse-soft"
                >
                  <Play className="h-6 w-6" />
                  {lang === 'en' ? '▶ Start Live Workout' : '▶ লাইভ ওয়ার্কআউট শুরু করুন'}
                </Button>
              )}

              {/* Day Selector - Roadmap Navigation */}
              <div className="flex items-center justify-between bg-muted/30 rounded-xl p-2">
                <button
                  onClick={() => setSelectedDayOffset(Math.max(0, selectedDayOffset - 1))}
                  disabled={selectedDayOffset === 0}
                  className="p-2 rounded-lg hover:bg-background disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-foreground" />
                </button>
                <div className="flex gap-1 overflow-x-auto">
                  {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                    const dayName = dayNames[(dayOfWeek + offset) % 7];
                    const workout = getWorkoutForDay(offset);
                    const isSelected = selectedDayOffset === offset;
                    const isRest = workout?.isRest;
                    return (
                      <button
                        key={offset}
                        onClick={() => setSelectedDayOffset(offset)}
                        className={`flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-all min-w-[52px] ${isSelected
                          ? 'gradient-primary text-primary-foreground shadow-md'
                          : isRest
                            ? 'bg-muted/50 text-muted-foreground hover:bg-muted'
                            : 'hover:bg-background text-foreground'
                          }`}
                      >
                        <span className="font-bold">{dayName.slice(0, 3)}</span>
                        <span className="text-[10px] mt-0.5">
                          {offset === 0 ? (lang === 'en' ? 'Today' : 'আজ') : isRest ? '😴' : '💪'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setSelectedDayOffset(Math.min(6, selectedDayOffset + 1))}
                  disabled={selectedDayOffset === 6}
                  className="p-2 rounded-lg hover:bg-background disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-foreground" />
                </button>
              </div>

              {/* Selected Day's Workout */}
              {selectedWorkout && (
                <div className="space-y-3">
                  <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                    {selectedWorkout.isRest ? <BedDouble className="h-5 w-5 text-muted-foreground" /> : <Dumbbell className="h-5 w-5 text-accent" />}
                    {selectedDayName}
                    {!isToday && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {lang === 'en' ? 'Upcoming' : 'আসছে'}
                      </span>
                    )}
                    {selectedWorkout.isRest && <span className="health-badge bg-muted text-muted-foreground">Rest Day</span>}
                  </h3>
                  {!selectedWorkout.isRest && selectedWorkout.exercises?.map((ex: any, i: number) => (
                    isToday ? (
                      <ExerciseTimer
                        key={i}
                        exerciseName={ex.name}
                        sets={ex.sets}
                        lang={lang}
                        onComplete={() => handleExerciseComplete(ex.name)}
                      />
                    ) : (
                      <div key={i} className="rounded-xl border border-border p-4 bg-card">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{ex.name}</p>
                            <p className="text-xs text-muted-foreground">{ex.sets}</p>
                          </div>
                          <span className="flex items-center gap-1 text-destructive text-xs"><Flame className="h-3 w-3" /> {ex.calories} cal</span>
                        </div>
                      </div>
                    )
                  ))}
                  {selectedWorkout.isRest && (
                    <div className="text-center py-8 text-muted-foreground">
                      <BedDouble className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{lang === 'en' ? 'Rest and recover! 🧘' : 'বিশ্রাম নিন! 🧘'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Generate New Plan */}
          <div className="health-card space-y-4">
            <h2 className="font-heading font-semibold text-foreground">
              {activePlan ? (lang === 'en' ? 'Generate New Plan' : 'নতুন প্ল্যান') : (lang === 'en' ? 'Create Your Plan' : 'আপনার প্ল্যান তৈরি করুন')}
            </h2>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                {lang === 'en' ? 'Plan Duration' : 'প্ল্যানের সময়কাল'}
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
              <ToggleGroup options={['weightLoss', 'maintenance', 'muscleGain']} value={goal} onChange={setGoal} translationKeys={['weightLoss', 'maintenance', 'muscleGain']} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{t('fitnessLevel', lang)}</label>
              <ToggleGroup options={['beginner', 'intermediate', 'advanced']} value={level} onChange={setLevel} translationKeys={['beginner', 'intermediate', 'advanced']} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{t('equipment', lang)}</label>
              <ToggleGroup options={['none', 'home', 'gym']} value={equip} onChange={setEquip} translationKeys={['none', 'home', 'gym']} />
            </div>
            <Button onClick={handleGenerate} className="gradient-primary border-0 text-primary-foreground">
              {t('generatePlan', lang)}
            </Button>
          </div>

          {/* Generated Plan Preview */}
          {plan && (
            <div className="space-y-4 animate-slide-up">
              <div className="grid gap-4">
                {plan.map(day => (
                  <div key={day.day} className={`health-card ${day.isRest ? 'bg-muted/50' : ''}`}>
                    <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                      {day.isRest ? <BedDouble className="h-5 w-5 text-muted-foreground" /> : <Dumbbell className="h-5 w-5 text-accent" />}
                      {day.day}
                      {day.isRest && <span className="health-badge bg-muted text-muted-foreground">Rest Day</span>}
                    </h3>
                    {!day.isRest && (
                      <div className="space-y-2">
                        {day.exercises.map((ex, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{ex.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground">{ex.sets}</span>
                              <span className="flex items-center gap-1 text-destructive text-xs"><Flame className="h-3 w-3" /> {ex.calories}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={handleStartPlan} className="w-full gradient-primary border-0 text-primary-foreground gap-2 h-12 text-base">
                <Play className="h-5 w-5" />
                {lang === 'en' ? `Start ${duration}-Month Plan` : `${duration} মাসের প্ল্যান শুরু করুন`}
              </Button>
            </div>
          )}

          {/* Badges Section */}
          {activePlan && (
            <div className="health-card space-y-4">
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-5 w-5 text-warning" />
                {lang === 'en' ? 'Fitness Badges' : 'ফিটনেস ব্যাজ'}
              </h3>
              <BadgesDisplay
                xp={0}
                streak={0}
                totalWorkouts={planProgress.completed}
                totalCaloriesBurned={0}
                lang={lang}
              />
            </div>
          )}

          <PlanFeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} onSubmit={handleFeedback} planType="exercise" lang={lang} />

          {/* Live Workout Modal */}
          <AnimatePresence>
            {liveWorkoutOpen && todayWorkout && !todayWorkout.isRest && (
              <LiveWorkoutModal
                exercises={todayWorkout.exercises || []}
                onComplete={async (totalCalories, completedExercises) => {
                  setLiveWorkoutOpen(false);
                  // Mark all exercises as completed
                  const allNames = new Set(completedExercises);
                  setCompletedExercises(allNames);
                  try {
                    if (authUser && activePlan) {
                      await supabase.from('plan_progress').upsert({
                        user_id: authUser.id,
                        plan_id: activePlan.id,
                        progress_date: today,
                        completed_items: completedExercises as any,
                      }, { onConflict: 'plan_id,progress_date' });
                      await supabase.from('saved_plans').update({
                        total_days_completed: (activePlan.total_days_completed || 0) + 1,
                      }).eq('id', activePlan.id);
                      setActivePlan((prev: any) => ({ ...prev, total_days_completed: (prev.total_days_completed || 0) + 1 }));
                      toast.success(lang === 'en' ? `Workout complete! 🔥 ${totalCalories} cal burned!` : `ব্যায়াম সম্পন্ন! 🔥 ${totalCalories} ক্যাল বার্ন!`);
                    }
                  } catch (e) { console.error(e); }
                }}
                onClose={() => setLiveWorkoutOpen(false)}
                lang={lang}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </AppLayout>
  );
}
