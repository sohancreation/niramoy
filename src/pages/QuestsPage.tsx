import React, { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLang } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { useGamification, calculateLevel, xpForNextLevel, xpForCurrentLevel, getLevelTitle } from '@/hooks/use-gamification';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Trophy, Zap, Flame, Star, CheckCircle2, Circle, Camera, 
  Droplets, Dumbbell, Utensils, BedDouble, RefreshCw, Sparkles, 
  ChevronDown, ChevronUp, Plus, Gift, Percent, Brain, Heart, 
  PartyPopper, Target, Award
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyFilter } from '@/hooks/use-family-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const CATEGORIES = [
  { key: 'all', label: { en: 'All', bn: 'সব' }, icon: Target, color: 'text-foreground' },
  { key: 'exercise', label: { en: 'Exercise', bn: 'ব্যায়াম' }, icon: Dumbbell, color: 'text-accent' },
  { key: 'diet', label: { en: 'Diet', bn: 'ডায়েট' }, icon: Utensils, color: 'text-primary' },
  { key: 'mindcare', label: { en: 'MindCare', bn: 'মাইন্ডকেয়ার' }, icon: Brain, color: 'text-[hsl(270,60%,50%)]' },
  { key: 'water', label: { en: 'Water', bn: 'পানি' }, icon: Droplets, color: 'text-info' },
  { key: 'sleep', label: { en: 'Sleep', bn: 'ঘুম' }, icon: BedDouble, color: 'text-warning' },
];

const taskTypeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  diet: { icon: Utensils, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  exercise: { icon: Dumbbell, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
  water: { icon: Droplets, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
  sleep: { icon: BedDouble, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  mindcare: { icon: Brain, color: 'text-[hsl(270,60%,50%)]', bg: 'bg-[hsl(270,60%,95%)]', border: 'border-[hsl(270,60%,80%)]/30' },
};

export default function QuestsPage() {
  const { lang } = useLang();
  const { user: authUser } = useAuth();
  const { applyFilter, insertPayload, familyMemberId } = useFamilyFilter();
  const { gamification, tasks, loading, completeTask, uncompleteTask, generateDailyTasks, uploadTaskPhoto, fetchData, today } = useGamification();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [hasDietPlan, setHasDietPlan] = useState<boolean | null>(null);
  const [hasExercisePlan, setHasExercisePlan] = useState<boolean | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  useEffect(() => {
    generateDailyTasks();
    checkPlans();
  }, []);

  const checkPlans = async () => {
    if (!authUser) return;
    const { data } = await applyFilter(supabase.from('saved_plans').select('plan_type').eq('user_id', authUser.id).eq('is_active', true));
    setHasDietPlan(!!data?.find((p: any) => p.plan_type === 'diet'));
    setHasExercisePlan(!!data?.find((p: any) => p.plan_type === 'exercise'));
  };

  if (loading || !gamification) {
    return <AppLayout><div /></AppLayout>;
  }

  const level = gamification.level;
  const currentLevelXp = xpForCurrentLevel(level);
  const nextLevelXp = xpForNextLevel(level);
  const progressInLevel = nextLevelXp > currentLevelXp ? ((gamification.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100 : 100;
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const todayXp = tasks.reduce((sum, t) => sum + t.xp_earned, 0);
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = activeCategory === 'all' ? tasks : tasks.filter(t => t.task_type === activeCategory);

  // Category stats
  const categoryStats = CATEGORIES.filter(c => c.key !== 'all').map(c => {
    const catTasks = tasks.filter(t => t.task_type === c.key);
    const done = catTasks.filter(t => t.completed).length;
    return { ...c, total: catTasks.length, done, percent: catTasks.length ? Math.round((done / catTasks.length) * 100) : 0 };
  }).filter(c => c.total > 0);

  // Verify if user actually completed related activities before ticking
  const verifyTaskCompletion = async (task: typeof tasks[0]): Promise<{ verified: boolean; message: string }> => {
    if (!authUser) return { verified: false, message: '' };
    const todayStr = new Date().toISOString().split('T')[0];

    // Check health tracker tasks (weight, water, sleep, exercise, bp related)
    const trackerKeywords = ['weight', 'ওজন', 'water', 'পানি', 'sleep', 'ঘুম', 'bp', 'রক্তচাপ', 'tracker', 'ট্র্যাকার'];
    const isTrackerTask = trackerKeywords.some(k => task.task_name.toLowerCase().includes(k.toLowerCase()));
    
    // Check health check-in tasks (mood, energy, stress, check-in)
    const checkinKeywords = ['check-in', 'চেক-ইন', 'checkin', 'mood', 'মেজাজ', 'energy', 'শক্তি', 'stress', 'চাপ'];
    const isCheckinTask = checkinKeywords.some(k => task.task_name.toLowerCase().includes(k.toLowerCase()));

    // Check exercise tasks
    const exerciseKeywords = ['exercise', 'ব্যায়াম', 'workout', 'ওয়ার্কআউট', 'walk', 'হাঁট', 'run', 'দৌড়', 'push-up', 'squat', 'plank', 'stretch', 'yoga', 'যোগ'];
    const isExerciseTask = task.task_type === 'exercise' || exerciseKeywords.some(k => task.task_name.toLowerCase().includes(k.toLowerCase()));

    // Check mindcare tasks
    const mindcareKeywords = ['meditat', 'ধ্যান', 'journal', 'জার্নাল', 'breath', 'শ্বাস', 'mindcare', 'মাইন্ড', 'calm', 'শান্ত', 'focus', 'ফোকাস'];
    const isMindcareTask = task.task_type === 'mindcare' || mindcareKeywords.some(k => task.task_name.toLowerCase().includes(k.toLowerCase()));

    if (isTrackerTask) {
      const { data } = await supabase.from('health_logs').select('id').eq('user_id', authUser.id).eq('date', todayStr).limit(1);
      if (!data || data.length === 0) {
        return { 
          verified: false, 
          message: lang === 'en' 
            ? '❌ Health Tracker not updated today! Go to Tracker page first.' 
            : '❌ আজ হেলথ ট্র্যাকার আপডেট করেননি! প্রথমে ট্র্যাকার পেজে যান।' 
        };
      }
    }

    if (isCheckinTask) {
      const { data } = await supabase.from('daily_health_updates').select('id').eq('user_id', authUser.id).eq('update_date', todayStr).limit(1);
      if (!data || data.length === 0) {
        return { 
          verified: false, 
          message: lang === 'en' 
            ? '❌ Health Check-in not done today! Complete your check-in on Dashboard first.' 
            : '❌ আজ হেলথ চেক-ইন করেননি! প্রথমে ড্যাশবোর্ডে চেক-ইন সম্পন্ন করুন।' 
        };
      }
    }

    if (isExerciseTask && !isTrackerTask) {
      // Check if exercise logged in health_logs today
      const { data } = await supabase.from('health_logs').select('exercise').eq('user_id', authUser.id).eq('date', todayStr).limit(1);
      if (!data || data.length === 0) {
        return { 
          verified: false, 
          message: lang === 'en' 
            ? '❌ Exercise not logged today! Update your Tracker first.' 
            : '❌ আজ ব্যায়াম লগ করেননি! প্রথমে ট্র্যাকার আপডেট করুন।' 
        };
      }
    }

    if (isMindcareTask) {
      // Check mood_logs or journal_entries for today
      const [{ data: moodData }, { data: journalData }] = await Promise.all([
        supabase.from('mood_logs').select('id').eq('user_id', authUser.id).eq('log_date', todayStr).limit(1),
        supabase.from('journal_entries').select('id').eq('user_id', authUser.id).eq('entry_date', todayStr).limit(1),
      ]);
      if ((!moodData || moodData.length === 0) && (!journalData || journalData.length === 0)) {
        return { 
          verified: false, 
          message: lang === 'en' 
            ? '❌ MindCare not done today! Visit MindCare page first.' 
            : '❌ আজ মাইন্ডকেয়ার করেননি! প্রথমে মাইন্ডকেয়ার পেজে যান।' 
        };
      }
    }

    return { verified: true, message: '' };
  };

  const handleToggle = async (taskId: string, completed: boolean) => {
    if (completed) {
      await uncompleteTask(taskId);
    } else {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Verify actual completion
      const { verified, message } = await verifyTaskCompletion(task);
      if (!verified) {
        toast.error(message, { duration: 4000 });
        return;
      }

      setJustCompleted(taskId);
      await completeTask(taskId);
      toast.success(lang === 'en' ? '+5 XP earned! ⚡' : '+৫ এক্সপি অর্জিত! ⚡', { icon: '⚡' });
      
      // Check if all tasks now completed
      const newCompleted = tasks.filter(t => t.completed || t.id === taskId).length;
      if (newCompleted === tasks.length) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        toast.success(lang === 'en' ? '🎉 All tasks completed! Amazing!' : '🎉 সব টাস্ক সম্পন্ন! অসাধারণ!');
      }
      
      setTimeout(() => setJustCompleted(null), 1500);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTaskId) return;
    setUploadingId(selectedTaskId);
    const url = await uploadTaskPhoto(selectedTaskId, file);
    if (url) {
      setJustCompleted(selectedTaskId);
      await completeTask(selectedTaskId, url);
      toast.success(lang === 'en' ? '+10 XP with photo proof! 📸' : '+১০ এক্সপি ছবি প্রমাণ সহ! 📸', { icon: '📸' });
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      setTimeout(() => setJustCompleted(null), 1500);
    }
    setUploadingId(null);
    setSelectedTaskId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openPhotoUpload = (taskId: string) => {
    setSelectedTaskId(taskId);
    fileInputRef.current?.click();
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
            <Trophy className="h-8 w-8 text-warning" />
            {t('dailyQuests', lang)}
          </h1>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-destructive" />
            <span className="font-heading font-bold text-foreground">{gamification.streak}</span>
            <span className="text-xs text-muted-foreground">{t('streak', lang)}</span>
          </div>
        </div>

        {/* Missing Plans Alert */}
        {(hasDietPlan === false || hasExercisePlan === false) && (
          <div className="health-card border-warning/30 bg-warning/5 space-y-3">
            <h3 className="font-heading font-semibold text-foreground">
              {lang === 'en' ? '⚠️ Create your plans first!' : '⚠️ প্রথমে আপনার প্ল্যান তৈরি করুন!'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {lang === 'en' ? 'Save a diet and exercise plan to get personalized daily tasks.' : 'ব্যক্তিগত দৈনিক টাস্ক পেতে ডায়েট এবং ব্যায়াম প্ল্যান সেভ করুন।'}
            </p>
            <div className="flex gap-2">
              {!hasDietPlan && (
                <Link to="/diet">
                  <Button size="sm" className="gradient-primary border-0 text-primary-foreground gap-1">
                    <Plus className="h-3 w-3" /> {lang === 'en' ? 'Create Diet Plan' : 'ডায়েট প্ল্যান তৈরি'}
                  </Button>
                </Link>
              )}
              {!hasExercisePlan && (
                <Link to="/exercise">
                  <Button size="sm" variant="outline" className="gap-1">
                    <Plus className="h-3 w-3" /> {lang === 'en' ? 'Create Exercise Plan' : 'ব্যায়াম প্ল্যান তৈরি'}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Level Card - Enhanced */}
        <motion.div 
          className="health-card relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <Star className="w-full h-full text-warning" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <motion.div 
              className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-heading text-2xl font-bold shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              {level}
            </motion.div>
            <div className="flex-1">
              <h2 className="font-heading text-xl font-bold text-foreground">{getLevelTitle(level, lang)}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Zap className="h-4 w-4 text-warning" />
                {gamification.xp} XP {lang === 'en' ? 'total' : 'মোট'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{lang === 'en' ? 'Today' : 'আজ'}</p>
              <motion.p 
                className="font-heading text-2xl font-bold text-accent"
                key={todayXp}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
              >
                +{todayXp}
              </motion.p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Level {level}</span>
              <span>{gamification.xp}/{nextLevelXp} XP</span>
              <span>Level {level + 1}</span>
            </div>
            <div className="relative h-3 rounded-full bg-muted overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 rounded-full gradient-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressInLevel}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>

        {/* Circular Progress Ring */}
        <motion.div 
          className="health-card flex items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <motion.circle 
                cx="50" cy="50" r="42" fill="none" 
                stroke="hsl(var(--primary))" strokeWidth="8" 
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - completionPercent / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-2xl font-black text-foreground">{completionPercent}%</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-foreground mb-1">
              {lang === 'en' ? "Today's Progress" : 'আজকের অগ্রগতি'}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {completedCount}/{totalCount} {lang === 'en' ? 'tasks completed' : 'টাস্ক সম্পন্ন'} • +{todayXp} XP
            </p>
            {/* Mini category bars */}
            <div className="space-y-1.5">
              {categoryStats.map(c => {
                const Icon = c.icon;
                return (
                  <div key={c.key} className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${c.color} shrink-0`} />
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div 
                        className={`h-full rounded-full ${c.key === 'exercise' ? 'bg-accent' : c.key === 'diet' ? 'bg-primary' : c.key === 'mindcare' ? 'bg-[hsl(270,60%,50%)]' : c.key === 'water' ? 'bg-info' : 'bg-warning'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${c.percent}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{c.done}/{c.total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Category Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            const isActive = activeCategory === c.key;
            const catTasks = c.key === 'all' ? tasks : tasks.filter(t => t.task_type === c.key);
            const catDone = catTasks.filter(t => t.completed).length;
            return (
              <motion.button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive 
                    ? 'gradient-primary text-primary-foreground shadow-md' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-3.5 w-3.5" />
                {c.label[lang]}
                {catTasks.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {catDone}/{catTasks.length}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Daily Tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-warning" />
              {activeCategory === 'all' 
                ? (lang === 'en' ? "Today's Tasks" : 'আজকের টাস্ক')
                : CATEGORIES.find(c => c.key === activeCategory)?.label[lang]}
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
              disabled={regenerating}
              onClick={async () => {
                if (!authUser) return;
                setRegenerating(true);
                await supabase.from('daily_tasks').delete().eq('user_id', authUser.id).eq('task_date', today);
                await generateDailyTasks();
                setRegenerating(false);
                toast.success(lang === 'en' ? 'Tasks regenerated!' : 'টাস্ক পুনরায় তৈরি!');
              }}
            >
              <RefreshCw className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`} />
              {lang === 'en' ? 'Refresh' : 'রিফ্রেশ'}
            </Button>
          </div>
          
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*,video/*" className="hidden" />

          {filteredTasks.length === 0 ? (
            <div className="health-card text-center py-8 text-muted-foreground">
              {activeCategory === 'all' 
                ? (lang === 'en' ? 'No tasks for today. Save a diet or exercise plan first!' : 'আজ কোনো টাস্ক নেই। প্রথমে একটি প্ল্যান সেভ করুন!')
                : (lang === 'en' ? 'No tasks in this category' : 'এই বিভাগে কোনো টাস্ক নেই')}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task, idx) => {
                const config = taskTypeConfig[task.task_type] || taskTypeConfig.diet;
                const Icon = config.icon;
                const isJustDone = justCompleted === task.id;
                
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`health-card transition-all relative overflow-hidden ${
                      task.completed 
                        ? 'bg-success/5 border-success/20' 
                        : `hover:${config.border} hover:shadow-md`
                    } ${isJustDone ? 'ring-2 ring-success ring-offset-2 ring-offset-background' : ''}`}
                  >
                    {/* Category indicator stripe */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      task.task_type === 'exercise' ? 'bg-accent' 
                      : task.task_type === 'diet' ? 'bg-primary' 
                      : task.task_type === 'mindcare' ? 'bg-[hsl(270,60%,50%)]' 
                      : task.task_type === 'water' ? 'bg-info' 
                      : 'bg-warning'
                    }`} />

                    <div className="flex items-center gap-3 cursor-pointer pl-3" onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}>
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); handleToggle(task.id, task.completed); }}
                        className="shrink-0"
                        whileTap={{ scale: 0.8 }}
                      >
                        {task.completed ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                            <CheckCircle2 className="h-7 w-7 text-success" />
                          </motion.div>
                        ) : (
                          <div className={`h-7 w-7 rounded-full border-2 ${config.border} flex items-center justify-center hover:${config.bg} transition-colors`}>
                            <Icon className={`h-3.5 w-3.5 ${config.color} opacity-40`} />
                          </div>
                        )}
                      </motion.button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {task.task_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.color} font-medium`}>
                            {CATEGORIES.find(c => c.key === task.task_type)?.label[lang] || task.task_type}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <motion.span 
                          className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                            task.xp_earned > 0 
                              ? 'bg-accent/10 text-accent' 
                              : 'bg-warning/10 text-warning'
                          }`}
                          key={task.xp_earned}
                          initial={task.xp_earned > 0 ? { scale: 1.3 } : {}}
                          animate={{ scale: 1 }}
                        >
                          <Zap className="h-3 w-3" />
                          {task.xp_earned > 0 ? `+${task.xp_earned}` : task.photo_url ? '+10' : '5-10'}
                        </motion.span>
                        {expandedTaskId === task.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {expandedTaskId === task.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-border pl-3">
                            {task.task_description && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                  {lang === 'en' ? 'Plan Details' : 'প্ল্যান বিবরণ'}
                                </p>
                                <div className="space-y-1.5 bg-muted/30 rounded-lg p-3">
                                  {task.task_description.split(' | ').map((item, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm">
                                      <span className={`${config.color} mt-0.5`}>•</span>
                                      <span className="text-foreground">{item.trim()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {!task.completed && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleToggle(task.id, false); }}
                                    className="gradient-primary border-0 text-primary-foreground gap-1 text-xs"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    {lang === 'en' ? 'Complete (+5 XP)' : 'সম্পন্ন (+৫ XP)'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => { e.stopPropagation(); openPhotoUpload(task.id); }}
                                    disabled={uploadingId === task.id}
                                    className="gap-1 text-xs"
                                  >
                                    <Camera className="h-3 w-3" />
                                    {uploadingId === task.id 
                                      ? (lang === 'en' ? 'Uploading...' : 'আপলোড হচ্ছে...') 
                                      : (lang === 'en' ? 'Photo Proof (+10 XP)' : 'ছবি প্রমাণ (+১০ XP)')}
                                  </Button>
                                </>
                              )}
                              {task.completed && !task.photo_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => { e.stopPropagation(); openPhotoUpload(task.id); }}
                                  disabled={uploadingId === task.id}
                                  className="gap-1 text-xs"
                                >
                                  <Camera className="h-3 w-3" />
                                  {lang === 'en' ? 'Add Photo (+5 bonus XP)' : 'ছবি যোগ (+৫ বোনাস XP)'}
                                </Button>
                              )}
                            </div>

                            {/* Photo proof display */}
                            {task.photo_url && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                  {lang === 'en' ? '📸 Photo Proof' : '📸 ছবি প্রমাণ'}
                                </p>
                                <img src={task.photo_url} alt="proof" className="w-full max-w-xs rounded-xl border border-border object-cover" />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Completion celebration overlay */}
                    <AnimatePresence>
                      {isJustDone && (
                        <motion.div 
                          className="absolute inset-0 flex items-center justify-center bg-success/10 backdrop-blur-[1px] rounded-xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-2 bg-success text-success-foreground px-4 py-2 rounded-full font-bold shadow-lg"
                          >
                            <PartyPopper className="h-5 w-5" />
                            +{task.xp_earned || 5} XP!
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* XP Guide */}
        <div className="health-card bg-muted/30">
          <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-warning" />
            {lang === 'en' ? 'How to earn XP' : 'কিভাবে XP অর্জন করবেন'}
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">{lang === 'en' ? 'Complete task' : 'টাস্ক সম্পন্ন'}: <strong className="text-foreground">+5 XP</strong></span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
              <Camera className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{lang === 'en' ? 'With photo proof' : 'ছবি প্রমাণ সহ'}: <strong className="text-foreground">+10 XP</strong></span>
            </div>
          </div>
        </div>

        {/* XP Discount Rewards */}
        <div className="health-card border-accent/20 bg-accent/5">
          <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent" />
            {lang === 'en' ? 'XP Discount Rewards' : 'XP ছাড় পুরস্কার'}
          </h4>
          <div className="space-y-3">
            {[
              { xp: 1000, discount: 5 },
              { xp: 5000, discount: 10 },
              { xp: 15000, discount: 15 },
              { xp: 30000, discount: 20 },
            ].map(tier => (
              <div key={tier.xp} className={`flex items-center gap-3 text-sm rounded-xl p-3 ${
                gamification.xp >= tier.xp ? 'bg-success/10 border border-success/30' : 'bg-muted/30'
              }`}>
                <Percent className="h-5 w-5 text-accent shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{tier.discount}% {lang === 'en' ? 'discount' : 'ছাড়'}</p>
                  <p className="text-xs text-muted-foreground">{tier.xp.toLocaleString()} XP {lang === 'en' ? 'required' : 'প্রয়োজন'}</p>
                </div>
                {gamification.xp >= tier.xp ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <span className="text-xs text-muted-foreground">{Math.max(0, tier.xp - gamification.xp).toLocaleString()} XP {lang === 'en' ? 'to go' : 'বাকি'}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
