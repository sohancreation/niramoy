import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/use-subscription';
import { useFamilyFilter } from '@/hooks/use-family-query';
import SubscriptionGate from '@/components/SubscriptionGate';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Brain, Smile, Meh, Frown, AlertTriangle as StressIcon, Angry,
  Wind, Timer, BookOpen, Sparkles, Check, Droplets,
  Footprints, Moon, Smartphone, TrendingUp, TrendingDown,
  Send, Loader2, Play, Pause, RotateCcw, Heart, Zap, BedDouble,
  Activity, Eye, Coffee, Leaf, Music, Sun, Target, Flame, Award,
  MessageCircle, RefreshCw, Volume2, VolumeX, ChevronRight, Phone
} from 'lucide-react';
import VapiWellnessChat from '@/components/VapiWellnessChat';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface HealthCheckin {
  mood: string | null;
  energy_level: number | null;
  stress_level: number | null;
  sleep_quality: number | null;
  sleep_hours: number | null;
  pain_areas: string[] | null;
  symptoms: string[] | null;
  notes: string | null;
  update_date: string;
}

interface DynamicHabit {
  key: string;
  icon: React.ElementType;
  label: { en: string; bn: string };
  reason: { en: string; bn: string };
}

// ─── Breathing Exercise with enhanced animation ───
function BreathingExercise({ lang, onComplete }: { lang: 'en' | 'bn'; onComplete?: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [totalCycles, setTotalCycles] = useState(3);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phaseLabels: Record<string, Record<string, string>> = {
    idle: { en: 'Start Breathing', bn: 'শ্বাস-প্রশ্বাস শুরু' },
    inhale: { en: 'Breathe In...', bn: 'শ্বাস নিন...' },
    hold1: { en: 'Hold...', bn: 'ধরে রাখুন...' },
    exhale: { en: 'Breathe Out...', bn: 'শ্বাস ছাড়ুন...' },
    hold2: { en: 'Hold...', bn: 'ধরে রাখুন...' },
  };

  const phaseColors: Record<string, string> = {
    inhale: 'hsl(var(--info))',
    hold1: 'hsl(270, 60%, 50%)',
    exhale: 'hsl(var(--success))',
    hold2: 'hsl(var(--warning))',
  };

  const phaseSequence = ['inhale', 'hold1', 'exhale', 'hold2'] as const;

  useEffect(() => {
    if (phase === 'idle') return;
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev >= 3) {
          const currentIdx = phaseSequence.indexOf(phase as any);
          if (currentIdx === 3) {
            setCycles(c => {
              const next = c + 1;
              if (next >= totalCycles) {
                setPhase('idle');
                onComplete?.();
                confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
              }
              return next;
            });
          }
          const nextIdx = (currentIdx + 1) % 4;
          setPhase(phaseSequence[nextIdx]);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, totalCycles]);

  const stop = () => { setPhase('idle'); setSeconds(0); if (intervalRef.current) clearInterval(intervalRef.current); };
  const scale = phase === 'inhale' ? 1.3 : phase === 'exhale' ? 0.7 : 1;

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <motion.div
        animate={{ scale }}
        transition={{ duration: 4, ease: 'easeInOut' }}
        className="w-44 h-44 rounded-full flex items-center justify-center relative"
        style={{
          background: `radial-gradient(circle, ${phaseColors[phase] || 'hsl(var(--info))'}20, ${phaseColors[phase] || 'hsl(var(--info))'}05)`,
          border: `3px solid ${phaseColors[phase] || 'hsl(var(--info))'}`,
        }}
      >
        {/* Pulsing ring */}
        {phase !== 'idle' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ border: `2px solid ${phaseColors[phase]}` }}
          />
        )}
        <div className="text-center z-10">
          <motion.p key={seconds} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-bold text-foreground">
            {phase === 'idle' ? '🧘' : 4 - seconds}
          </motion.p>
          <p className="text-sm text-muted-foreground mt-1">{phaseLabels[phase]?.[lang]}</p>
        </div>
      </motion.div>

      <div className="flex items-center gap-2">
        {[...Array(totalCycles)].map((_, i) => (
          <motion.div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${i < cycles ? 'bg-[hsl(var(--success))]' : 'bg-muted'}`}
            animate={i === cycles && phase !== 'idle' ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <Button size="sm" variant={totalCycles === 3 ? 'default' : 'outline'} onClick={() => { setTotalCycles(3); setCycles(0); }}>3x</Button>
        <Button size="sm" variant={totalCycles === 5 ? 'default' : 'outline'} onClick={() => { setTotalCycles(5); setCycles(0); }}>5x</Button>
        <Button size="sm" variant={totalCycles === 10 ? 'default' : 'outline'} onClick={() => { setTotalCycles(10); setCycles(0); }}>10x</Button>
      </div>

      <div className="flex gap-3">
        {phase === 'idle' ? (
          <Button onClick={() => { setPhase('inhale'); setSeconds(0); setCycles(0); }} className="bg-[hsl(var(--info))] hover:bg-[hsl(var(--info)/.8)] text-[hsl(var(--info-foreground))]">
            <Play className="h-4 w-4 mr-2" /> {lang === 'en' ? 'Start Session' : 'সেশন শুরু'}
          </Button>
        ) : (
          <Button variant="outline" onClick={stop}><Pause className="h-4 w-4 mr-2" /> {lang === 'en' ? 'Stop' : 'থামুন'}</Button>
        )}
      </div>
    </div>
  );
}

// ─── Focus Timer with improved visuals ───
function FocusTimer({ lang, onComplete }: { lang: 'en' | 'bn'; onComplete?: () => void }) {
  const [duration, setDuration] = useState(180);
  const [remaining, setRemaining] = useState(180);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setRunning(false);
          onComplete?.();
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const reset = (d: number) => { setDuration(d); setRemaining(d); setRunning(false); };
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = ((duration - remaining) / duration) * 100;
  const circumference = 2 * Math.PI * 68;

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r="68" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <motion.circle
            cx="75" cy="75" r="68" fill="none" stroke="hsl(var(--success))" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.span key={remaining} initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-3xl font-bold font-heading text-foreground block">
              {mins}:{secs.toString().padStart(2, '0')}
            </motion.span>
            <p className="text-xs text-muted-foreground">{running ? (lang === 'en' ? 'Focus...' : 'মনোযোগ...') : (lang === 'en' ? 'Ready' : 'প্রস্তুত')}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {[{ d: 60, l: '1' }, { d: 180, l: '3' }, { d: 300, l: '5' }, { d: 600, l: '10' }].map(({ d, l }) => (
          <Button key={d} size="sm" variant={duration === d ? 'default' : 'outline'} onClick={() => reset(d)}>
            {l} {lang === 'en' ? 'min' : 'মি'}
          </Button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={() => setRunning(!running)} className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success)/.8)] text-[hsl(var(--success-foreground))]">
          {running ? <><Pause className="h-4 w-4 mr-2" />{lang === 'en' ? 'Pause' : 'বিরতি'}</> : <><Play className="h-4 w-4 mr-2" />{lang === 'en' ? 'Start' : 'শুরু'}</>}
        </Button>
        <Button variant="outline" onClick={() => reset(duration)}><RotateCcw className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

// ─── Guided Meditation Component ───
function GuidedMeditation({ lang }: { lang: 'en' | 'bn' }) {
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sessions = [
    {
      key: 'body-scan',
      title: { en: 'Body Scan', bn: 'বডি স্ক্যান' },
      icon: Activity,
      duration: { en: '3 min', bn: '৩ মিনিট' },
      color: 'hsl(var(--info))',
      steps: lang === 'en' ? [
        'Close your eyes and take 3 deep breaths...',
        'Focus on your toes. Feel any tension there...',
        'Move your attention up to your legs...',
        'Notice your stomach and chest rising and falling...',
        'Relax your shoulders, let them drop...',
        'Feel your face muscles soften...',
        'Take one final deep breath. You are calm. 🙏',
      ] : [
        'চোখ বন্ধ করুন এবং ৩ বার গভীর শ্বাস নিন...',
        'আপনার পায়ের আঙ্গুলে মনোযোগ দিন...',
        'আপনার পায়ে মনোযোগ সরান...',
        'আপনার পেট ও বুক ওঠানামা অনুভব করুন...',
        'কাঁধ শিথিল করুন...',
        'মুখের পেশী নরম করুন...',
        'একটি শেষ গভীর শ্বাস নিন। আপনি শান্ত। 🙏',
      ],
    },
    {
      key: 'gratitude',
      title: { en: 'Gratitude Meditation', bn: 'কৃতজ্ঞতা ধ্যান' },
      icon: Heart,
      duration: { en: '2 min', bn: '২ মিনিট' },
      color: 'hsl(270, 60%, 50%)',
      steps: lang === 'en' ? [
        'Sit comfortably and close your eyes...',
        'Think of one person you are grateful for...',
        'Feel the warmth of gratitude in your chest...',
        'Think of something in nature you appreciate...',
        'Smile gently. Let gratitude fill you. 💜',
      ] : [
        'আরামে বসুন এবং চোখ বন্ধ করুন...',
        'এমন একজনের কথা ভাবুন যার জন্য আপনি কৃতজ্ঞ...',
        'বুকে কৃতজ্ঞতার উষ্ণতা অনুভব করুন...',
        'প্রকৃতির কিছু নিয়ে ভাবুন যা আপনি পছন্দ করেন...',
        'হালকা হাসুন। কৃতজ্ঞতায় পূর্ণ হন। 💜',
      ],
    },
    {
      key: 'sleep',
      title: { en: 'Sleep Preparation', bn: 'ঘুমের প্রস্তুতি' },
      icon: Moon,
      duration: { en: '3 min', bn: '৩ মিনিট' },
      color: 'hsl(var(--info))',
      steps: lang === 'en' ? [
        'Lie down comfortably...',
        'Breathe slowly: in for 4, out for 6...',
        'Imagine a calm, dark sky full of stars...',
        'Let each thought float away like a cloud...',
        'Feel your body becoming heavier...',
        'You are safe. You are relaxed. Drift to sleep... 🌙',
      ] : [
        'আরামে শুয়ে পড়ুন...',
        'ধীরে শ্বাস নিন: ৪ গুণে ভিতরে, ৬ গুণে বাইরে...',
        'তারায় ভরা শান্ত আকাশ কল্পনা করুন...',
        'প্রতিটি চিন্তা মেঘের মতো ভাসিয়ে দিন...',
        'শরীর ভারী হচ্ছে অনুভব করুন...',
        'আপনি নিরাপদ। আপনি শিথিল। ঘুমিয়ে পড়ুন... 🌙',
      ],
    },
  ];

  const activeData = sessions.find(s => s.key === activeSession);

  useEffect(() => {
    if (autoPlay && activeData && step < activeData.steps.length - 1) {
      timerRef.current = setTimeout(() => setStep(s => s + 1), 8000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [autoPlay, step, activeSession]);

  if (!activeSession || !activeData) {
    return (
      <div className="grid gap-3">
        {sessions.map(s => (
          <motion.button
            key={s.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveSession(s.key); setStep(0); }}
            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${s.color}15`, border: `2px solid ${s.color}` }}>
              <s.icon className="h-5 w-5" style={{ color: s.color }} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{s.title[lang]}</p>
              <p className="text-xs text-muted-foreground">{s.duration[lang]}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex items-center gap-2 w-full">
        <Button variant="ghost" size="sm" onClick={() => { setActiveSession(null); setAutoPlay(false); }}>← {lang === 'en' ? 'Back' : 'ফিরে'}</Button>
        <span className="text-sm font-medium flex-1 text-center">{activeData.title[lang]}</span>
        <Button variant="ghost" size="sm" onClick={() => setAutoPlay(!autoPlay)}>
          {autoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>

      <Progress value={((step + 1) / activeData.steps.length) * 100} className="h-1.5" />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center py-8 px-4"
        >
          <p className="text-lg font-medium text-foreground leading-relaxed">{activeData.steps[step]}</p>
          <p className="text-xs text-muted-foreground mt-4">{step + 1}/{activeData.steps.length}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
          {lang === 'en' ? 'Previous' : 'আগের'}
        </Button>
        <Button size="sm" disabled={step === activeData.steps.length - 1} onClick={() => setStep(s => s + 1)}>
          {lang === 'en' ? 'Next' : 'পরবর্তী'} <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Quick Mood Selector ───
function QuickMoodSelector({ lang, onSelect }: { lang: 'en' | 'bn'; onSelect: (mood: string) => void }) {
  const moods = [
    { key: 'happy', emoji: '😊', label: { en: 'Happy', bn: 'খুশি' }, color: 'hsl(var(--success))' },
    { key: 'calm', emoji: '😌', label: { en: 'Calm', bn: 'শান্ত' }, color: 'hsl(var(--info))' },
    { key: 'neutral', emoji: '😐', label: { en: 'Okay', bn: 'ঠিকঠাক' }, color: 'hsl(var(--muted-foreground))' },
    { key: 'stressed', emoji: '😣', label: { en: 'Stressed', bn: 'চাপে' }, color: 'hsl(var(--warning))' },
    { key: 'sad', emoji: '😢', label: { en: 'Sad', bn: 'দুঃখিত' }, color: 'hsl(270, 60%, 50%)' },
    { key: 'anxious', emoji: '😰', label: { en: 'Anxious', bn: 'উদ্বিগ্ন' }, color: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {moods.map(m => (
        <motion.button
          key={m.key}
          whileHover={{ scale: 1.15, y: -4 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(m.key)}
          className="flex flex-col items-center gap-1 p-3 rounded-xl border bg-card hover:shadow-md transition-shadow min-w-[70px]"
        >
          <span className="text-2xl">{m.emoji}</span>
          <span className="text-[10px] text-muted-foreground font-medium">{m.label[lang]}</span>
        </motion.button>
      ))}
    </div>
  );
}

// ─── Generate dynamic habits based on health check-in ───
function generateDynamicHabits(checkin: HealthCheckin | null): DynamicHabit[] {
  const habits: DynamicHabit[] = [];

  if (!checkin) {
    return [
      { key: 'water', icon: Droplets, label: { en: 'Drink 2L water', bn: '২ লিটার পানি পান' }, reason: { en: 'Stay hydrated', bn: 'হাইড্রেটেড থাকুন' } },
      { key: 'walk', icon: Footprints, label: { en: '10-min walk', bn: '১০ মিনিট হাঁটা' }, reason: { en: 'Move your body', bn: 'শরীর নড়াচড়া করুন' } },
      { key: 'breathing', icon: Wind, label: { en: '5-min breathing', bn: '৫ মিনিট শ্বাস-প্রশ্বাস' }, reason: { en: 'Calm your mind', bn: 'মন শান্ত করুন' } },
      { key: 'no_phone', icon: Smartphone, label: { en: 'No phone before sleep', bn: 'ঘুমের আগে ফোন নয়' }, reason: { en: 'Better sleep quality', bn: 'ভালো ঘুমের জন্য' } },
    ];
  }

  const stress = checkin.stress_level || 3;
  const energy = checkin.energy_level || 3;
  const sleepQ = checkin.sleep_quality || 3;
  const sleepH = checkin.sleep_hours || 7;
  const mood = checkin.mood || 'neutral';
  const symptoms = checkin.symptoms || [];
  const pains = checkin.pain_areas || [];

  habits.push({ key: 'water', icon: Droplets, label: { en: 'Drink 2L water', bn: '২ লিটার পানি পান' }, reason: { en: 'Essential for health', bn: 'স্বাস্থ্যের জন্য অপরিহার্য' } });

  if (stress >= 4) {
    habits.push({ key: 'breathing', icon: Wind, label: { en: '10-min deep breathing', bn: '১০ মিনিট গভীর শ্বাস-প্রশ্বাস' }, reason: { en: 'Your stress is high — breathing helps reset', bn: 'আপনার চাপ বেশি — শ্বাস-প্রশ্বাস রিসেট করতে সাহায্য করে' } });
    habits.push({ key: 'nature', icon: Leaf, label: { en: 'Spend 15 min in nature', bn: '১৫ মিনিট প্রকৃতিতে কাটান' }, reason: { en: 'Nature reduces cortisol levels', bn: 'প্রকৃতি কর্টিসল কমায়' } });
  } else if (stress >= 3) {
    habits.push({ key: 'breathing', icon: Wind, label: { en: '5-min breathing', bn: '৫ মিনিট শ্বাস-প্রশ্বাস' }, reason: { en: 'Moderate stress — stay balanced', bn: 'মাঝারি চাপ — সুস্থির থাকুন' } });
  }

  if (energy <= 2) {
    habits.push({ key: 'walk', icon: Footprints, label: { en: '15-min brisk walk', bn: '১৫ মিনিট দ্রুত হাঁটা' }, reason: { en: 'Low energy — walking boosts it naturally', bn: 'কম শক্তি — হাঁটা প্রাকৃতিকভাবে শক্তি বাড়ায়' } });
    habits.push({ key: 'sunlight', icon: Sun, label: { en: '10-min morning sunlight', bn: '১০ মিনিট সকালের রোদ' }, reason: { en: 'Sunlight boosts energy & mood', bn: 'সূর্যালোক শক্তি ও মেজাজ বাড়ায়' } });
  } else {
    habits.push({ key: 'walk', icon: Footprints, label: { en: '10-min walk', bn: '১০ মিনিট হাঁটা' }, reason: { en: 'Stay active', bn: 'সক্রিয় থাকুন' } });
  }

  if (sleepQ <= 2 || sleepH < 6) {
    habits.push({ key: 'no_phone', icon: Smartphone, label: { en: 'No screen 1hr before bed', bn: 'ঘুমের ১ ঘণ্টা আগে স্ক্রিন নয়' }, reason: { en: 'Poor sleep detected — screen-free time helps', bn: 'খারাপ ঘুম — স্ক্রিনমুক্ত সময় সাহায্য করে' } });
    habits.push({ key: 'early_bed', icon: BedDouble, label: { en: 'Go to bed 30 min earlier', bn: '৩০ মিনিট আগে ঘুমান' }, reason: { en: 'You need more rest', bn: 'আপনার আরো বিশ্রাম দরকার' } });
  } else {
    habits.push({ key: 'no_phone', icon: Smartphone, label: { en: 'No phone before sleep', bn: 'ঘুমের আগে ফোন নয়' }, reason: { en: 'Maintain good sleep', bn: 'ভালো ঘুম বজায় রাখুন' } });
  }

  if (mood === 'sad' || mood === 'stressed' || mood === 'anxious') {
    habits.push({ key: 'journal', icon: BookOpen, label: { en: 'Write 3 things you\'re grateful for', bn: '৩টি কৃতজ্ঞতার কথা লিখুন' }, reason: { en: 'Shifts focus to positive', bn: 'ইতিবাচক দিকে মনোযোগ দেয়' } });
    habits.push({ key: 'music', icon: Music, label: { en: 'Listen to calming music', bn: 'শান্ত সঙ্গীত শুনুন' }, reason: { en: 'Music soothes emotional distress', bn: 'সঙ্গীত আবেগীয় চাপ কমায়' } });
  }

  if (symptoms.includes('Headache') || symptoms.includes('Fatigue') || pains.includes('Headache')) {
    habits.push({ key: 'eye_rest', icon: Eye, label: { en: '20-20-20 eye rest rule', bn: '২০-২০-২০ চোখের বিশ্রাম' }, reason: { en: 'Reduce headache strain', bn: 'মাথাব্যথার চাপ কমান' } });
    habits.push({ key: 'limit_caffeine', icon: Coffee, label: { en: 'Limit caffeine today', bn: 'আজ ক্যাফেইন কম রাখুন' }, reason: { en: 'Can worsen headaches', bn: 'মাথাব্যথা বাড়াতে পারে' } });
  }

  return habits.slice(0, 6);
}

// ─── Mood display helpers ───
const MOOD_DISPLAY: Record<string, { emoji: string; label: { en: string; bn: string }; color: string }> = {
  happy: { emoji: '🙂', label: { en: 'Happy', bn: 'খুশি' }, color: 'text-[hsl(var(--success))]' },
  calm: { emoji: '😌', label: { en: 'Calm', bn: 'শান্ত' }, color: 'text-[hsl(var(--info))]' },
  neutral: { emoji: '😐', label: { en: 'Neutral', bn: 'স্বাভাবিক' }, color: 'text-[hsl(var(--info))]' },
  sad: { emoji: '😔', label: { en: 'Sad', bn: 'দুঃখিত' }, color: 'text-[hsl(270,60%,50%)]' },
  stressed: { emoji: '😣', label: { en: 'Stressed', bn: 'চাপে' }, color: 'text-[hsl(var(--warning))]' },
  anxious: { emoji: '😡', label: { en: 'Anxious', bn: 'উদ্বিগ্ন' }, color: 'text-[hsl(var(--destructive))]' },
};

// Journal prompts
const JOURNAL_PROMPTS = {
  en: [
    'What made you smile today?',
    'What are you grateful for right now?',
    'What is your biggest worry? Write it out.',
    'Describe your ideal peaceful moment.',
    'What would you tell your younger self?',
    'What small win did you have today?',
  ],
  bn: [
    'আজ কী আপনাকে হাসিয়েছে?',
    'এই মুহূর্তে আপনি কিসের জন্য কৃতজ্ঞ?',
    'আপনার সবচেয়ে বড় চিন্তা কী? লিখে ফেলুন।',
    'আপনার আদর্শ শান্তির মুহূর্ত বর্ণনা করুন।',
    'আপনি ছোটবেলার নিজেকে কী বলতেন?',
    'আজ আপনার ছোট কোন সাফল্য হয়েছে?',
  ],
};

// Chat quick replies
const CHAT_QUICK_REPLIES = {
  en: [
    'I feel stressed today',
    'Help me with study burnout',
    'I need motivation',
    'How to deal with overthinking?',
    'Give me a calming exercise',
  ],
  bn: [
    'আজ আমি চাপে আছি',
    'পড়াশোনার বার্নআউটে সাহায্য করুন',
    'আমার অনুপ্রেরণা দরকার',
    'অতিরিক্ত চিন্তা কিভাবে সামলাবো?',
    'একটি শান্ত করার ব্যায়াম দিন',
  ],
};

// Tool sections for sequential navigation
const TOOL_SECTIONS = [
  { key: 'calm', icon: Wind, label: { en: 'Calm', bn: 'শান্ত' }, color: 'hsl(var(--info))' },
  { key: 'focus', icon: Timer, label: { en: 'Focus Timer', bn: 'ফোকাস টাইমার' }, color: 'hsl(var(--success))' },
  { key: 'meditate', icon: Sparkles, label: { en: 'Meditate', bn: 'ধ্যান' }, color: 'hsl(270, 60%, 50%)' },
  { key: 'journal', icon: BookOpen, label: { en: 'Journal', bn: 'জার্নাল' }, color: 'hsl(270, 60%, 50%)' },
  { key: 'chat', icon: MessageCircle, label: { en: 'AI Chat', bn: 'এআই চ্যাট' }, color: 'hsl(270, 60%, 50%)' },
  { key: 'voice', icon: Phone, label: { en: 'Voice Consult', bn: 'ভয়েস পরামর্শ' }, color: 'hsl(var(--success))' },
];

// ─── Main Page ───
export default function MindCarePage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const { applyFilter, insertPayload, familyMemberId } = useFamilyFilter();
  const { toast } = useToast();
  const { canUseMindCare } = useSubscription();

  const [latestCheckin, setLatestCheckin] = useState<HealthCheckin | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<HealthCheckin[]>([]);
  const [checkinLoading, setCheckinLoading] = useState(true);

  const [journalContent, setJournalContent] = useState('');
  const [savingJournal, setSavingJournal] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  const [completedHabits, setCompletedHabits] = useState<string[]>([]);

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [mindcareXp, setMindcareXp] = useState(0);
  const [activeToolIdx, setActiveToolIdx] = useState(0);
  useEffect(() => { if (user) loadCheckinData(); }, [user]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const loadCheckinData = async () => {
    try {
      setCheckinLoading(true);
      const { data } = await applyFilter(supabase
        .from('daily_health_updates')
        .select('*')
        .eq('user_id', user!.id))
        .order('update_date', { ascending: false })
        .limit(7);
      if (data && data.length > 0) {
        setLatestCheckin(data[0] as HealthCheckin);
        setRecentCheckins([...data].reverse() as HealthCheckin[]);
      }
    } catch (e) { console.error('loadCheckinData error:', e); }
    setCheckinLoading(false);
  };

  const dynamicHabits = useMemo(() => generateDynamicHabits(latestCheckin), [latestCheckin]);

  const addXp = useCallback((amount: number, reason: string) => {
    setMindcareXp(prev => prev + amount);
    toast({ title: `+${amount} XP`, description: reason, duration: 2000 });
  }, [toast]);

  const saveJournal = async () => {
    if (!journalContent.trim()) return;
    setSavingJournal(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { error } = await supabase.from('journal_entries').upsert({
        user_id: user!.id, entry_date: today, content: journalContent,
      }, { onConflict: 'user_id,entry_date' });
      if (error) throw error;
      addXp(5, lang === 'en' ? 'Journal entry saved!' : 'জার্নাল সংরক্ষিত!');
      confetti({ particleCount: 40, spread: 40, origin: { y: 0.8 } });
    } catch {
      toast({ title: lang === 'en' ? 'Error' : 'ত্রুটি', variant: 'destructive' });
    }
    setSavingJournal(false);
  };

  const sendChat = async (overrideMsg?: string) => {
    const userMsg = (overrideMsg || chatInput).trim();
    if (!userMsg || chatLoading) return;
    setChatInput('');
    const newMessages = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(newMessages);
    setChatLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mindcare-chat', {
        body: { messages: newMessages.slice(-20), lang },
      });
      if (error) throw error;
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (chatMessages.length === 0) addXp(5, lang === 'en' ? 'MindCare chat session started!' : 'মাইন্ডকেয়ার চ্যাট সেশন শুরু!');
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: lang === 'en' ? 'Sorry, something went wrong. Please try again.' : 'দুঃখিত, কিছু ভুল হয়েছে।' }]);
    }
    setChatLoading(false);
  };

  const toggleHabit = (key: string) => {
    const wasCompleted = completedHabits.includes(key);
    setCompletedHabits(prev => wasCompleted ? prev.filter(k => k !== key) : [...prev, key]);
    if (!wasCompleted) {
      addXp(5, lang === 'en' ? 'Habit completed!' : 'অভ্যাস সম্পন্ন!');
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 }, colors: ['#10b981', '#34d399', '#6ee7b7'] });
    }
  };

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    addXp(3, lang === 'en' ? 'Mood logged!' : 'মেজাজ লগ করা হয়েছে!');
    try {
      if (user) {
        await supabase.from('mood_logs').upsert({
          user_id: user.id, log_date: format(new Date(), 'yyyy-MM-dd'),
          mood, stress_level: mood === 'stressed' || mood === 'anxious' ? 4 : mood === 'sad' ? 3 : 2,
        }, { onConflict: 'user_id,log_date' });
      }
    } catch (e) { console.error('mood save error:', e); }
  };

  const insight = useMemo(() => {
    if (recentCheckins.length < 3) return null;
    const recent = recentCheckins.slice(-3);
    const stressAvg = recent.reduce((sum, c) => sum + (c.stress_level || 3), 0) / recent.length;
    if (stressAvg >= 4) return { type: 'high' as const, text: lang === 'en' ? 'Your stress has been high recently. Try Calm Mode!' : 'সম্প্রতি আপনার চাপ বেশি। শান্ত মোড ব্যবহার করুন!' };
    if (stressAvg <= 2) return { type: 'low' as const, text: lang === 'en' ? 'Great job! Your stress levels are well managed.' : 'চমৎকার! আপনার চাপের মাত্রা ভালোভাবে নিয়ন্ত্রিত।' };
    return null;
  }, [recentCheckins, lang]);

  const moodInfo = latestCheckin?.mood ? MOOD_DISPLAY[latestCheckin.mood] : null;
  const habitProgress = dynamicHabits.length > 0 ? (completedHabits.length / dynamicHabits.length) * 100 : 0;

  if (!canUseMindCare) {
    return (
      <AppLayout>
        <SubscriptionGate
          allowed={false}
          featureName={{ en: 'MindCare', bn: 'মাইন্ডকেয়ার' }}
          message={{
            en: 'MindCare features including breathing exercises, focus timer, guided meditation, and AI emotional companion are available with Niramoy Pro or AI+ subscription.',
            bn: 'শ্বাস-প্রশ্বাস ব্যায়াম, ফোকাস টাইমার, গাইডেড মেডিটেশন এবং AI ইমোশনাল কম্পানিয়ন সহ মাইন্ডকেয়ার ফিচারগুলো নিরাময় Pro বা AI+ সাবস্ক্রিপশনে পাওয়া যায়।'
          }}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header with XP counter */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[hsl(270,60%,95%)] dark:bg-[hsl(270,40%,20%)]">
            <Brain className="h-7 w-7 text-[hsl(270,60%,50%)]" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold text-foreground">{lang === 'en' ? 'MindCare' : 'মাইন্ডকেয়ার'}</h1>
            <p className="text-sm text-muted-foreground">{lang === 'en' ? 'Body & Mind — Fully Supported' : 'শরীর ও মন — পুরোপুরি সহায়তা'}</p>
          </div>
          {mindcareXp > 0 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(var(--success)/.1)] border border-[hsl(var(--success)/.3)]">
              <Zap className="h-4 w-4 text-[hsl(var(--success))]" />
              <span className="text-sm font-bold text-[hsl(var(--success))]">{mindcareXp} XP</span>
            </motion.div>
          )}
        </motion.div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[hsl(var(--warning)/.1)] border border-[hsl(var(--warning)/.3)]">
          <StressIcon className="h-4 w-4 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {lang === 'en'
              ? 'This section provides general stress management tools and does not replace professional mental health services.'
              : 'এই বিভাগটি সাধারণ স্ট্রেস ম্যানেজমেন্ট সরঞ্জাম প্রদান করে এবং পেশাদার মানসিক স্বাস্থ্য সেবার বিকল্প নয়।'}
          </p>
        </div>

        {/* Quick Mood Check */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-[hsl(270,60%,50%)]" />
                {lang === 'en' ? 'How are you feeling right now?' : 'এই মুহূর্তে আপনি কেমন অনুভব করছেন?'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMood ? (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                  <span className="text-4xl">{MOOD_DISPLAY[selectedMood]?.emoji || '😊'}</span>
                  <p className="text-sm text-muted-foreground mt-2">
                    {lang === 'en' ? 'Mood logged! ' : 'মেজাজ লগ করা হয়েছে! '}
                    <button onClick={() => setSelectedMood(null)} className="text-primary underline text-xs">{lang === 'en' ? 'Change' : 'পরিবর্তন'}</button>
                  </p>
                </motion.div>
              ) : (
                <QuickMoodSelector lang={lang} onSelect={handleMoodSelect} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Mental Health Summary */}
        <Card className="border-[hsl(270,30%,90%)] dark:border-[hsl(270,20%,25%)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-[hsl(270,60%,50%)]" />
              {lang === 'en' ? "Today's Mental Health Summary" : 'আজকের মানসিক স্বাস্থ্য সারাংশ'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {checkinLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : latestCheckin ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: lang === 'en' ? 'Mood' : 'মেজাজ', value: moodInfo?.emoji || '❓', sub: moodInfo?.label[lang], color: moodInfo?.color },
                    { label: lang === 'en' ? 'Stress' : 'চাপ', value: `${latestCheckin.stress_level || '-'}/5`, pct: (latestCheckin.stress_level || 0) * 20, barColor: 'bg-[hsl(var(--warning))]' },
                    { label: lang === 'en' ? 'Energy' : 'শক্তি', value: `${latestCheckin.energy_level || '-'}/5`, pct: (latestCheckin.energy_level || 0) * 20, barColor: 'bg-[hsl(var(--success))]' },
                    { label: lang === 'en' ? 'Sleep' : 'ঘুম', value: `${latestCheckin.sleep_hours || '-'}h`, sub: `(${latestCheckin.sleep_quality || '-'}/5)` },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className="bg-muted/30 rounded-xl p-3 text-center"
                    >
                      <p className={`text-2xl font-heading font-bold ${item.color || 'text-foreground'}`}>{item.value}</p>
                      {item.sub && <p className="text-[10px] text-muted-foreground">{item.sub}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{item.label}</p>
                      {item.pct !== undefined && <Progress value={item.pct} className="h-1.5 mt-1" />}
                    </motion.div>
                  ))}
                </div>

                {insight && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`flex items-center gap-3 p-3 rounded-lg ${insight.type === 'high' ? 'bg-[hsl(var(--warning)/.1)] border border-[hsl(var(--warning)/.3)]' : 'bg-[hsl(var(--success)/.1)] border border-[hsl(var(--success)/.3)]'}`}
                  >
                    {insight.type === 'high' ? <TrendingUp className="h-5 w-5 text-[hsl(var(--warning))]" /> : <TrendingDown className="h-5 w-5 text-[hsl(var(--success))]" />}
                    <p className="text-sm text-foreground">{insight.text}</p>
                  </motion.div>
                )}

                {recentCheckins.length > 1 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{lang === 'en' ? '7-Day Trend' : '৭ দিনের প্রবণতা'}</p>
                    <div className="space-y-1.5">
                      {recentCheckins.map((c, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="w-14 text-muted-foreground">{format(new Date(c.update_date), 'EEE dd')}</span>
                          <span className="text-sm">{MOOD_DISPLAY[c.mood || 'neutral']?.emoji || '❓'}</span>
                          <div className="flex-1 flex gap-1">
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <motion.div className="h-full bg-[hsl(var(--warning))] rounded-full" initial={{ width: 0 }} animate={{ width: `${(c.stress_level || 0) * 20}%` }} transition={{ delay: i * 0.05 + 0.2 }} />
                            </div>
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <motion.div className="h-full bg-[hsl(var(--success))] rounded-full" initial={{ width: 0 }} animate={{ width: `${(c.energy_level || 0) * 20}%` }} transition={{ delay: i * 0.05 + 0.3 }} />
                            </div>
                          </div>
                          <span className="text-muted-foreground w-16 text-right">😰{c.stress_level} ⚡{c.energy_level}</span>
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-full bg-[hsl(var(--warning))]" /><span className="text-[10px] text-muted-foreground">{lang === 'en' ? 'Stress' : 'চাপ'}</span></div>
                      <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-full bg-[hsl(var(--success))]" /><span className="text-[10px] text-muted-foreground">{lang === 'en' ? 'Energy' : 'শক্তি'}</span></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">{lang === 'en' ? 'No health check-in data yet' : 'এখনো কোনো চেক-ইন ডেটা নেই'}</p>
                <Link to="/checkin"><Button size="sm" variant="outline">{lang === 'en' ? 'Go to Health Check-in' : 'স্বাস্থ্য চেক-ইনে যান'}</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══ TODAY'S MENTAL CARE MISSIONS — Checklist ═══ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-[hsl(var(--success)/.3)]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-[hsl(var(--success))]" />
                {lang === 'en' ? "Today's Mental Care Missions" : 'আজকের মানসিক যত্ন মিশন'}
              </CardTitle>
              <CardDescription className="text-sm">
                {lang === 'en'
                  ? 'Do these tasks to keep your mind healthy with Manoshi.'
                  : 'মনোশি সাথে ভালো রাখতে এই কাজগুলো করুন।'}
              </CardDescription>
              {latestCheckin && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {lang === 'en' ? 'Personalized from your health data • +5 XP each' : 'আপনার স্বাস্থ্য ডেটা থেকে ব্যক্তিগত • প্রতিটি +৫ XP'}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress overview */}
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="35" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                    <motion.circle cx="40" cy="40" r="35" fill="none" stroke="hsl(var(--success))" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 35}
                      animate={{ strokeDashoffset: 2 * Math.PI * 35 * (1 - habitProgress / 100) }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-foreground">{completedHabits.length}/{dynamicHabits.length}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {lang === 'en' ? `Mission ${Math.min(completedHabits.length + 1, dynamicHabits.length)} of ${dynamicHabits.length}` : `মিশন ${Math.min(completedHabits.length + 1, dynamicHabits.length)}/${dynamicHabits.length}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{completedHabits.length * 5} XP {lang === 'en' ? 'earned' : 'অর্জিত'}</p>
                  <Progress value={habitProgress} className="h-2 mt-1" />
                </div>
              </div>

              {habitProgress === 100 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-2">
                  <p className="text-sm font-bold text-[hsl(var(--success))]">🎉 {lang === 'en' ? 'All Missions Complete!' : 'সব মিশন সম্পন্ন!'}</p>
                </motion.div>
              )}

              {/* All habits as checklist */}
              <AnimatePresence>
                {dynamicHabits.map((h, idx) => {
                  const done = completedHabits.includes(h.key);
                  return (
                    <motion.button
                      key={h.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleHabit(h.key)}
                      className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all text-left ${done
                        ? 'bg-[hsl(var(--success)/.08)] border-[hsl(var(--success)/.3)]'
                        : 'bg-card hover:bg-muted/50 hover:border-primary/20'
                        }`}
                    >
                      <motion.div
                        animate={done ? { scale: [1, 1.3, 1] } : {}}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${done ? 'bg-[hsl(var(--success))] border-[hsl(var(--success))]' : 'border-muted-foreground/40'
                          }`}
                      >
                        {done && <Check className="h-4 w-4 text-[hsl(var(--success-foreground))]" />}
                      </motion.div>
                      <h.icon className={`h-5 w-5 shrink-0 ${done ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium block ${done ? 'line-through text-muted-foreground' : ''}`}>{h.label[lang]}</span>
                        <span className="text-[10px] text-muted-foreground">{h.reason[lang]}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">+5 XP</Badge>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ TOOLS SECTION — Sequential with Next/Previous ═══ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              {/* Step indicators */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap mb-3">
                {TOOL_SECTIONS.map((sec, i) => (
                  <motion.button
                    key={sec.key}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveToolIdx(i)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all ${i === activeToolIdx
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : i < activeToolIdx ? 'bg-[hsl(var(--success)/.15)] text-[hsl(var(--success))]' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    <sec.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{sec.label[lang]}</span>
                  </motion.button>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {lang === 'en' ? `Step ${activeToolIdx + 1} of ${TOOL_SECTIONS.length}` : `ধাপ ${activeToolIdx + 1}/${TOOL_SECTIONS.length}`}
                {' — '}{TOOL_SECTIONS[activeToolIdx].label[lang]}
              </p>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {/* ── Calm (Breathing) ── */}
                {activeToolIdx === 0 && (
                  <motion.div key="calm" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                        <Wind className="h-5 w-5 text-[hsl(var(--info))]" />
                        {lang === 'en' ? 'Box Breathing' : 'বক্স ব্রিদিং'}
                        <Badge variant="outline" className="text-[10px]">+5 XP</Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{lang === 'en' ? 'Breathe with the circle to calm your mind' : 'মন শান্ত করতে বৃত্তের সাথে শ্বাস নিন'}</p>
                    </div>
                    <BreathingExercise lang={lang} onComplete={() => addXp(5, lang === 'en' ? 'Breathing session complete!' : 'শ্বাস-প্রশ্বাস সেশন সম্পন্ন!')} />
                  </motion.div>
                )}

                {/* ── Focus Timer ── */}
                {activeToolIdx === 1 && (
                  <motion.div key="focus" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                        <Timer className="h-5 w-5 text-[hsl(var(--success))]" />
                        {lang === 'en' ? 'Focus Reset Timer' : 'ফোকাস রিসেট টাইমার'}
                        <Badge variant="outline" className="text-[10px]">+5 XP</Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{lang === 'en' ? 'Take a quick break to reset your mind' : 'আপনার মন রিসেট করতে বিরতি নিন'}</p>
                    </div>
                    <FocusTimer lang={lang} onComplete={() => addXp(5, lang === 'en' ? 'Focus session complete!' : 'ফোকাস সেশন সম্পন্ন!')} />
                  </motion.div>
                )}

                {/* ── Meditate ── */}
                {activeToolIdx === 2 && (
                  <motion.div key="meditate" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                        <Sparkles className="h-5 w-5 text-[hsl(270,60%,50%)]" />
                        {lang === 'en' ? 'Guided Meditation' : 'গাইডেড মেডিটেশন'}
                        <Badge variant="outline" className="text-[10px]">+10 XP</Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{lang === 'en' ? 'Step-by-step guided sessions' : 'ধাপে ধাপে গাইডেড সেশন'}</p>
                    </div>
                    <GuidedMeditation lang={lang} />
                  </motion.div>
                )}

                {/* ── Journal ── */}
                {activeToolIdx === 3 && (
                  <motion.div key="journal" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                        <BookOpen className="h-5 w-5 text-[hsl(270,60%,50%)]" />
                        {lang === 'en' ? 'Micro-Journaling' : 'মাইক্রো-জার্নালিং'}
                        <Badge variant="outline" className="text-[10px]">+5 XP</Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{lang === 'en' ? 'Pick a prompt or write freely.' : 'প্রম্পট বেছে নিন বা স্বাধীনভাবে লিখুন।'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{lang === 'en' ? '✨ Need inspiration?' : '✨ অনুপ্রেরণা দরকার?'}</p>
                      <div className="flex flex-wrap gap-2">
                        {JOURNAL_PROMPTS[lang].map((prompt, i) => (
                          <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => { setActivePrompt(prompt); setJournalContent(prev => prev ? prev : ''); }}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activePrompt === prompt ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted text-foreground'}`}
                          >{prompt}</motion.button>
                        ))}
                      </div>
                    </div>
                    {activePrompt && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg bg-[hsl(270,60%,95%)] dark:bg-[hsl(270,40%,15%)] border border-[hsl(270,30%,85%)]"
                      >
                        <p className="text-sm font-medium text-foreground">💭 {activePrompt}</p>
                      </motion.div>
                    )}
                    <Textarea
                      placeholder={lang === 'en' ? 'Write your thoughts here...' : 'আপনার চিন্তা এখানে লিখুন...'}
                      value={journalContent} onChange={e => setJournalContent(e.target.value)}
                      maxLength={2000} className="resize-none min-h-[150px]"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{journalContent.length}/2000</span>
                      <Button onClick={saveJournal} disabled={!journalContent.trim() || savingJournal}>
                        {savingJournal ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                        {lang === 'en' ? 'Save Entry' : 'সংরক্ষণ'}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ── AI Chat ── */}
                {activeToolIdx === 4 && (
                  <motion.div key="chat" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                        <MessageCircle className="h-5 w-5 text-[hsl(270,60%,50%)]" />
                        {lang === 'en' ? 'AI Emotional Companion' : 'এআই আবেগীয় সঙ্গী'}
                        <Badge variant="outline" className="text-[10px]">+5 XP</Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{lang === 'en' ? 'Talk about stress, motivation, or just vent.' : 'চাপ, অনুপ্রেরণা নিয়ে কথা বলুন।'}</p>
                    </div>
                    <div className="h-[300px] overflow-y-auto border rounded-xl p-3 bg-muted/20 space-y-3">
                      {chatMessages.length === 0 && (
                        <div className="text-center py-8">
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <Sparkles className="h-8 w-8 text-[hsl(270,60%,50%)] mx-auto mb-3" />
                          </motion.div>
                          <p className="text-sm text-muted-foreground">{lang === 'en' ? 'Start a conversation or tap a suggestion...' : 'কথোপকথন শুরু করুন বা সাজেশনে ক্লিক করুন...'}</p>
                        </div>
                      )}
                      {chatMessages.map((msg, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border rounded-bl-md'}`}>
                            {msg.role === 'assistant' ? <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div> : msg.content}
                          </div>
                        </motion.div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-card border rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-muted-foreground" />
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 rounded-full bg-muted-foreground" />
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 rounded-full bg-muted-foreground" />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    {chatMessages.length === 0 && (
                      <div className="flex flex-wrap gap-2">
                        {CHAT_QUICK_REPLIES[lang].map((reply, i) => (
                          <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => sendChat(reply)}
                            className="text-xs px-3 py-1.5 rounded-full border bg-muted/50 hover:bg-primary/10 hover:border-primary/30 text-foreground transition-colors"
                          >{reply}</motion.button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                        placeholder={lang === 'en' ? 'Type your message...' : 'আপনার বার্তা লিখুন...'}
                        className="resize-none min-h-[40px] max-h-[80px] rounded-xl" rows={1} maxLength={1000}
                      />
                      <Button onClick={() => sendChat()} disabled={chatLoading || !chatInput.trim()} size="icon" className="shrink-0 rounded-xl">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ── Voice Consultancy ── */}
                {activeToolIdx === 5 && (
                  <motion.div key="voice" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                        <Phone className="h-5 w-5 text-[hsl(var(--success))]" />
                        {lang === 'en' ? 'Mental Wellness Voice Consultancy' : 'মানসিক সুস্থতা ভয়েস পরামর্শ'}
                        <Badge variant="outline" className="text-[10px]">AI</Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lang === 'en' ? 'Talk to our AI wellness consultant via voice call' : 'ভয়েস কলের মাধ্যমে আমাদের এআই পরামর্শকের সাথে কথা বলুন'}
                      </p>
                    </div>
                    <VapiWellnessChat lang={lang} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Next / Previous navigation */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/50">
                <Button variant="outline" size="sm" disabled={activeToolIdx === 0} onClick={() => setActiveToolIdx(i => i - 1)}>
                  ← {lang === 'en' ? 'Previous' : 'আগের'}
                </Button>
                <div className="flex gap-1">
                  {TOOL_SECTIONS.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === activeToolIdx ? 'bg-primary' : i < activeToolIdx ? 'bg-[hsl(var(--success))]' : 'bg-muted'}`} />
                  ))}
                </div>
                <Button size="sm" disabled={activeToolIdx === TOOL_SECTIONS.length - 1} onClick={() => setActiveToolIdx(i => i + 1)}>
                  {lang === 'en' ? 'Next' : 'পরবর্তী'} →
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
