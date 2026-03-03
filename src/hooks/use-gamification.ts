import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DailyTask {
  id: string;
  task_date: string;
  task_type: 'diet' | 'exercise' | 'water' | 'sleep' | 'mindcare';
  task_name: string;
  task_description: string | null;
  completed: boolean;
  photo_url: string | null;
  xp_earned: number;
  completed_at: string | null;
}

export interface GamificationData {
  xp: number;
  level: number;
  streak: number;
  last_active_date: string | null;
}

export function calculateLevel(xp: number): number {
  const thresholds = [0, 50, 150, 300, 500, 800, 1200, 1700, 2500, 3500, 5000, 7000, 9500, 12500, 16000, 20000, 25000, 31000, 38000, 46000, 55000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) return i + 1;
  }
  return 1;
}

export function xpForNextLevel(level: number): number {
  const thresholds = [0, 50, 150, 300, 500, 800, 1200, 1700, 2500, 3500, 5000, 7000, 9500, 12500, 16000, 20000, 25000, 31000, 38000, 46000, 55000];
  return thresholds[level] || 55000;
}

export function xpForCurrentLevel(level: number): number {
  const thresholds = [0, 0, 50, 150, 300, 500, 800, 1200, 1700, 2500, 3500, 5000, 7000, 9500, 12500, 16000, 20000, 25000, 31000, 38000, 46000];
  return thresholds[level] || 46000;
}

export function getLevelTitle(level: number, lang: 'en' | 'bn'): string {
  const titles: Record<number, { en: string; bn: string }> = {
    1: { en: 'Health Newbie', bn: 'স্বাস্থ্য নবীন' },
    2: { en: 'Health Learner', bn: 'স্বাস্থ্য শিক্ষার্থী' },
    3: { en: 'Health Explorer', bn: 'স্বাস্থ্য অনুসন্ধানকারী' },
    4: { en: 'Health Warrior', bn: 'স্বাস্থ্য যোদ্ধা' },
    5: { en: 'Health Champion', bn: 'স্বাস্থ্য চ্যাম্পিয়ন' },
    6: { en: 'Health Master', bn: 'স্বাস্থ্য মাস্টার' },
    7: { en: 'Health Legend', bn: 'স্বাস্থ্য কিংবদন্তি' },
    8: { en: 'Health Guru', bn: 'স্বাস্থ্য গুরু' },
    9: { en: 'Health Sage', bn: 'স্বাস্থ্য সাধক' },
    10: { en: 'Health Immortal', bn: 'স্বাস্থ্য অমর' },
    11: { en: 'Fitness Knight', bn: 'ফিটনেস নাইট' },
    12: { en: 'Fitness Paladin', bn: 'ফিটনেস প্যালাডিন' },
    13: { en: 'Fitness Elite', bn: 'ফিটনেস এলিট' },
    14: { en: 'Iron Warrior', bn: 'আয়রন ওয়ারিয়র' },
    15: { en: 'Titan', bn: 'টাইটান' },
    16: { en: 'Diamond Body', bn: 'ডায়মন্ড বডি' },
    17: { en: 'Mythic Fighter', bn: 'মিথিক ফাইটার' },
    18: { en: 'Supreme Master', bn: 'সুপ্রিম মাস্টার' },
    19: { en: 'Cosmic Champion', bn: 'কসমিক চ্যাম্পিয়ন' },
    20: { en: 'Health God', bn: 'স্বাস্থ্য দেবতা' },
  };
  return titles[level]?.[lang] || titles[Math.min(level, 20)]?.[lang] || titles[1]![lang];
}

export function getFitnessRank(level: number, lang: 'en' | 'bn'): string {
  if (level >= 16) return lang === 'en' ? '🏆 Master' : '🏆 মাস্টার';
  if (level >= 11) return lang === 'en' ? '⚔️ Warrior' : '⚔️ যোদ্ধা';
  if (level >= 6) return lang === 'en' ? '💪 Fighter' : '💪 ফাইটার';
  return lang === 'en' ? '🌱 Beginner' : '🌱 শিক্ষার্থী';
}

export function useGamification() {
  const { user } = useAuth();
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('en-CA');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: gData } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gData) {
      setGamification(gData as GamificationData);
    } else {
      const { data: newG } = await supabase
        .from('user_gamification')
        .insert({ user_id: user.id, xp: 0, level: 1, streak: 0 })
        .select()
        .single();
      if (newG) setGamification(newG as GamificationData);
    }

    const { data: tData } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_date', today)
      .order('created_at');

    setTasks((tData || []) as DailyTask[]);
    setLoading(false);
  }, [user, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const completeTask = async (taskId: string, photoUrl?: string) => {
    if (!user || !gamification) return;
    const xp = photoUrl ? 10 : 5;

    await supabase
      .from('daily_tasks')
      .update({ completed: true, xp_earned: xp, photo_url: photoUrl || null, completed_at: new Date().toISOString() })
      .eq('id', taskId);

    const newXp = gamification.xp + xp;
    const newLevel = calculateLevel(newXp);
    const newStreak = gamification.last_active_date === today ? gamification.streak : (gamification.streak + 1);

    await supabase
      .from('user_gamification')
      .update({ xp: newXp, level: newLevel, streak: newStreak, last_active_date: today })
      .eq('user_id', user.id);

    await fetchData();
  };

  const uncompleteTask = async (taskId: string) => {
    if (!user || !gamification) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await supabase
      .from('daily_tasks')
      .update({ completed: false, xp_earned: 0, photo_url: null, completed_at: null })
      .eq('id', taskId);

    const newXp = Math.max(0, gamification.xp - task.xp_earned);
    const newLevel = calculateLevel(newXp);

    await supabase
      .from('user_gamification')
      .update({ xp: newXp, level: newLevel })
      .eq('user_id', user.id);

    await fetchData();
  };

  const generateDailyTasks = async () => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('daily_tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_date', today)
      .limit(1);

    if (existing && existing.length > 0) return;

    // Fetch plans, prescriptions in parallel
    const [plansRes, rxRes] = await Promise.all([
      supabase.from('saved_plans').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('prescriptions').select('*').eq('user_id', user.id).eq('analysis_status', 'completed').order('created_at', { ascending: false }).limit(5),
    ]);

    const plans = plansRes.data;
    const prescriptions = rxRes.data || [];

    const tasksToInsert: { user_id: string; task_date: string; task_type: 'diet' | 'exercise' | 'water' | 'sleep' | 'mindcare'; task_name: string; task_description: string }[] = [];

    // Always add water & sleep
    tasksToInsert.push(
      { user_id: user.id, task_date: today, task_type: 'water', task_name: '💧 পানি পান করুন / Drink 8 glasses of water', task_description: 'Stay hydrated throughout the day' },
      { user_id: user.id, task_date: today, task_type: 'sleep', task_name: '😴 ঘুম / Get 7-8 hours of sleep', task_description: 'Maintain a good sleep schedule' },
    );

    // Mental care daily habits
    tasksToInsert.push(
      { user_id: user.id, task_date: today, task_type: 'mindcare', task_name: '🧘 ৫ মিনিট শ্বাস-প্রশ্বাস / 5-min Breathing', task_description: 'Complete a breathing or calm exercise (+5 XP)' },
      { user_id: user.id, task_date: today, task_type: 'mindcare', task_name: '🚶 ১০ মিনিট হাঁটা / 10-min Walk', task_description: 'Take a mindful walk (+5 XP)' },
      { user_id: user.id, task_date: today, task_type: 'mindcare', task_name: '📝 জার্নাল লিখুন / Write Journal', task_description: 'Write in your MindCare journal (+5 XP)' },
      { user_id: user.id, task_date: today, task_type: 'mindcare', task_name: '📵 ঘুমের আগে ফোন নয় / No Phone Before Sleep', task_description: 'Digital detox before bed (+5 XP)' },
    );

    // Diet plan tasks from saved plan
    const dietPlan = plans?.find((p: any) => p.plan_type === 'diet');
    if (dietPlan) {
      const pd = dietPlan.plan_data as any;
      const meals = [
        { key: 'breakfast', emoji: '🌅', label: 'সকালের নাস্তা / Breakfast' },
        { key: 'lunch', emoji: '☀️', label: 'দুপুরের খাবার / Lunch' },
        { key: 'dinner', emoji: '🌙', label: 'রাতের খাবার / Dinner' },
        { key: 'snacks', emoji: '🍎', label: 'স্ন্যাকস / Snacks' },
      ];

      // Support day-based diet plan
      const planDays = pd?.days;
      const todayDayIdx = new Date().getDay() === 6 ? 0 : new Date().getDay() + 1; // Sat=0

      meals.forEach(m => {
        let items: string[] = [];
        if (planDays && Array.isArray(planDays)) {
          items = planDays[todayDayIdx]?.[m.key] || planDays[0]?.[m.key] || [];
        } else {
          items = Array.isArray(pd?.[m.key]) ? pd[m.key] : [];
        }
        if (items.length > 0) {
          tasksToInsert.push({
            user_id: user.id,
            task_date: today,
            task_type: 'diet',
            task_name: `${m.emoji} ${m.label}`,
            task_description: items.join(' | '),
          });
        }
      });
    } else {
      tasksToInsert.push(
        { user_id: user.id, task_date: today, task_type: 'diet', task_name: '🌅 সকালের নাস্তা / Healthy breakfast', task_description: 'Save a diet plan to see specific meals' },
        { user_id: user.id, task_date: today, task_type: 'diet', task_name: '☀️ দুপুরের খাবার / Healthy lunch', task_description: 'Save a diet plan to see specific meals' },
        { user_id: user.id, task_date: today, task_type: 'diet', task_name: '🌙 রাতের খাবার / Healthy dinner', task_description: 'Save a diet plan to see specific meals' },
      );
    }

    // Exercise plan tasks from saved plan
    const exercisePlan = plans?.find((p: any) => p.plan_type === 'exercise');
    if (exercisePlan) {
      const planData = exercisePlan.plan_data as any;
      const dayOfWeek = new Date().getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayPlan = planData?.find?.((d: any) => d.day === dayNames[dayOfWeek]);
      if (todayPlan && !todayPlan.isRest) {
        todayPlan.exercises?.forEach?.((ex: any) => {
          tasksToInsert.push({
            user_id: user.id,
            task_date: today,
            task_type: 'exercise',
            task_name: `💪 ${ex.name}`,
            task_description: `${ex.sets} • ~${ex.calories} cal`,
          });
        });
      } else {
        tasksToInsert.push({
          user_id: user.id, task_date: today, task_type: 'exercise',
          task_name: '🧘 Rest Day / বিশ্রামের দিন',
          task_description: 'Take it easy today, light stretching recommended',
        });
      }
    } else {
      tasksToInsert.push({
        user_id: user.id, task_date: today, task_type: 'exercise',
        task_name: '🏃 ব্যায়াম করুন / Exercise',
        task_description: 'Save an exercise plan to see specific workouts',
      });
    }

    // Medicine tasks from prescriptions
    const addedMedicines = new Set<string>();
    for (const rx of prescriptions) {
      const medicines = (rx.medicines as any[]) || [];
      for (const med of medicines) {
        const medKey = (med.name || '').toLowerCase().trim();
        if (!medKey || addedMedicines.has(medKey)) continue;
        addedMedicines.add(medKey);

        const desc = [
          med.dosage || '',
          med.frequency || '',
          med.timing || '',
          med.instructions || '',
        ].filter(Boolean).join(' • ');

        tasksToInsert.push({
          user_id: user.id,
          task_date: today,
          task_type: 'diet', // Using diet type for medicine (closest match)
          task_name: `💊 ${med.name}`,
          task_description: desc || 'Take as prescribed',
        });
      }
    }

    await supabase.from('daily_tasks').insert(tasksToInsert);

    // Generate daily notifications
    await generateDailyNotifications(prescriptions);

    await fetchData();
  };

  const generateDailyNotifications = async (prescriptions: any[]) => {
    if (!user) return;

    // Check if we already sent today's notifications
    const { data: existingNotifs } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)
      .limit(1);

    if (existingNotifs && existingNotifs.length > 0) return;

    const notifs: { user_id: string; title: string; message: string; type: string }[] = [];

    // Daily task reminder
    notifs.push({
      user_id: user.id,
      title: '🎯 আজকের টাস্ক প্রস্তুত!',
      message: 'আজকের ডায়েট, ব্যায়াম ও মাইন্ডকেয়ার টাস্ক তৈরি হয়েছে। টাস্ক সম্পন্ন করে XP অর্জন করুন!',
      type: 'info',
    });

    // Health check-in reminder
    notifs.push({
      user_id: user.id,
      title: '📋 স্বাস্থ্য চেক-ইন করুন',
      message: 'আজকের স্বাস্থ্য আপডেট দিন — AI আপনাকে ব্যক্তিগত পরামর্শ দেবে।',
      type: 'info',
    });

    // Tracker reminder
    notifs.push({
      user_id: user.id,
      title: '📊 ট্র্যাকার আপডেট করুন',
      message: 'ওজন, পানি, ও ব্লাড প্রেসার ট্র্যাক করতে ভুলবেন না!',
      type: 'info',
    });

    // Medicine reminders from prescriptions
    for (const rx of prescriptions) {
      const medicines = (rx.medicines as any[]) || [];
      if (medicines.length > 0) {
        const medNames = medicines.map((m: any) => m.name).filter(Boolean).slice(0, 3).join(', ');
        const extraCount = medicines.length > 3 ? ` +${medicines.length - 3} more` : '';
        notifs.push({
          user_id: user.id,
          title: '💊 ওষুধ খাওয়ার সময়',
          message: `আজকের ওষুধ: ${medNames}${extraCount}। নিয়মিত ওষুধ খাওয়া চালিয়ে যান।`,
          type: 'warning',
        });
        break; // One medicine notification is enough
      }
    }

    if (notifs.length > 0) {
      await supabase.from('notifications').insert(notifs as any);
    }
  };

  const uploadTaskPhoto = async (taskId: string, file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${taskId}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('task-photos').upload(path, file);
    if (error) return null;

    const { data: urlData } = await supabase.storage.from('task-photos').createSignedUrl(path, 86400);
    return urlData?.signedUrl || null;
  };

  return {
    gamification,
    tasks,
    loading,
    completeTask,
    uncompleteTask,
    generateDailyTasks,
    uploadTaskPhoto,
    fetchData,
    today,
  };
}
