import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Dumbbell, Droplets, Star, Zap, Target, Award } from 'lucide-react';

interface Badge {
  id: string;
  icon: React.ReactNode;
  name: { en: string; bn: string };
  description: { en: string; bn: string };
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface BadgesDisplayProps {
  xp: number;
  streak: number;
  totalWorkouts: number;
  totalCaloriesBurned: number;
  lang: 'en' | 'bn';
}

export default function BadgesDisplay({ xp, streak, totalWorkouts, totalCaloriesBurned, lang }: BadgesDisplayProps) {
  const badges: Badge[] = [
    {
      id: 'streak7',
      icon: <Flame className="h-6 w-6" />,
      name: { en: '7-Day Streak', bn: '৭ দিনের স্ট্রিক' },
      description: { en: 'Complete 7 days in a row', bn: 'পরপর ৭ দিন সম্পন্ন করুন' },
      unlocked: streak >= 7,
      progress: Math.min(streak, 7),
      maxProgress: 7,
    },
    {
      id: 'streak30',
      icon: <Star className="h-6 w-6" />,
      name: { en: '30-Day Warrior', bn: '৩০ দিনের যোদ্ধা' },
      description: { en: 'Maintain 30-day streak', bn: '৩০ দিনের স্ট্রিক বজায় রাখুন' },
      unlocked: streak >= 30,
      progress: Math.min(streak, 30),
      maxProgress: 30,
    },
    {
      id: 'cal1000',
      icon: <Zap className="h-6 w-6" />,
      name: { en: '1000 Cal Burned', bn: '১০০০ ক্যাল বার্ন' },
      description: { en: 'Burn 1000 total calories', bn: 'মোট ১০০০ ক্যালোরি বার্ন করুন' },
      unlocked: totalCaloriesBurned >= 1000,
      progress: Math.min(totalCaloriesBurned, 1000),
      maxProgress: 1000,
    },
    {
      id: 'workouts30',
      icon: <Dumbbell className="h-6 w-6" />,
      name: { en: '30 Workouts', bn: '৩০ ব্যায়াম' },
      description: { en: 'Complete 30 workouts', bn: '৩০টি ব্যায়াম সম্পন্ন করুন' },
      unlocked: totalWorkouts >= 30,
      progress: Math.min(totalWorkouts, 30),
      maxProgress: 30,
    },
    {
      id: 'xp500',
      icon: <Trophy className="h-6 w-6" />,
      name: { en: 'XP Hunter', bn: 'XP শিকারী' },
      description: { en: 'Earn 500 XP', bn: '৫০০ XP অর্জন করুন' },
      unlocked: xp >= 500,
      progress: Math.min(xp, 500),
      maxProgress: 500,
    },
    {
      id: 'xp2000',
      icon: <Award className="h-6 w-6" />,
      name: { en: 'Health Legend', bn: 'স্বাস্থ্য কিংবদন্তি' },
      description: { en: 'Earn 2000 XP', bn: '২০০০ XP অর্জন করুন' },
      unlocked: xp >= 2000,
      progress: Math.min(xp, 2000),
      maxProgress: 2000,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {badges.map((badge, i) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
            badge.unlocked
              ? 'bg-warning/10 border-warning/30 shadow-sm'
              : 'bg-muted/30 border-border opacity-60'
          }`}
        >
          <div className={`p-2 rounded-full ${badge.unlocked ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'}`}>
            {badge.icon}
          </div>
          <p className="text-xs font-semibold text-foreground leading-tight">{badge.name[lang]}</p>
          {badge.maxProgress && (
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${badge.unlocked ? 'bg-warning' : 'bg-muted-foreground/30'}`}
                initial={{ width: 0 }}
                animate={{ width: `${((badge.progress || 0) / badge.maxProgress) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.1 }}
              />
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            {badge.progress}/{badge.maxProgress}
          </p>
          {badge.unlocked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-warning text-warning-foreground rounded-full p-0.5"
            >
              <CheckMark />
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function CheckMark() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
      <path d="M3 6L5 8L9 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
