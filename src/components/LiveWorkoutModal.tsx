import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, CheckCircle2, Flame, Dumbbell, ChevronRight, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface Exercise {
  name: string;
  sets: string;
  calories: number;
}

interface LiveWorkoutModalProps {
  exercises: Exercise[];
  onComplete: (totalCalories: number, completedExercises: string[]) => void;
  onClose: () => void;
  lang: 'en' | 'bn';
}

function parseTimerDuration(sets: string): number {
  const minMatch = sets.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1]) * 60;
  const secMatch = sets.match(/(\d+)\s*sec/i);
  if (secMatch) return parseInt(secMatch[1]);
  return 60;
}

export default function LiveWorkoutModal({ exercises, onComplete, onClose, lang }: LiveWorkoutModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [completedList, setCompletedList] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [restMode, setRestMode] = useState(false);
  const [restCountdown, setRestCountdown] = useState(30);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentExercise = exercises[currentIndex];
  const isCountdown = currentExercise ? /sec|min/i.test(currentExercise.sets) : false;
  const totalSeconds = currentExercise ? parseTimerDuration(currentExercise.sets) : 60;
  const totalProgress = exercises.length > 0 ? ((completedList.length) / exercises.length) * 100 : 0;

  useEffect(() => {
    setCountdown(totalSeconds);
    setSeconds(0);
  }, [currentIndex, totalSeconds]);

  // Main timer
  useEffect(() => {
    if (!isRunning || restMode) return;
    intervalRef.current = setInterval(() => {
      if (isCountdown) {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            handleExerciseDone();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setSeconds(prev => prev + 1);
      }
      // Increment calories gradually
      if (currentExercise) {
        setCaloriesBurned(prev => prev + (currentExercise.calories / (isCountdown ? totalSeconds : 120)));
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isCountdown, restMode, currentExercise]);

  // Rest timer
  useEffect(() => {
    if (!restMode) return;
    const timer = setInterval(() => {
      setRestCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setRestMode(false);
          setRestCountdown(30);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [restMode]);

  const handleExerciseDone = () => {
    if (!currentExercise) return;
    const newCompleted = [...completedList, currentExercise.name];
    setCompletedList(newCompleted);

    if (currentIndex < exercises.length - 1) {
      setRestMode(true);
      setRestCountdown(30);
    } else {
      // All done!
      setShowCelebration(true);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => {
        onComplete(Math.round(caloriesBurned + currentExercise.calories * 0.3), newCompleted);
      }, 3000);
    }
  };

  const skipRest = () => {
    setRestMode(false);
    setRestCountdown(30);
    setCurrentIndex(prev => prev + 1);
    setIsRunning(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.round(s) % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const displayTime = isCountdown ? countdown : seconds;
  const progress = isCountdown && totalSeconds > 0 ? ((totalSeconds - countdown) / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 80;

  if (showCelebration) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Trophy className="h-24 w-24 text-warning mx-auto" />
          </motion.div>
          <h2 className="font-heading text-4xl font-bold text-foreground">
            {lang === 'en' ? 'Workout Complete!' : 'ব্যায়াম সম্পন্ন!'}
          </h2>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-destructive">{Math.round(caloriesBurned)}</p>
              <p className="text-sm text-muted-foreground">{lang === 'en' ? 'Calories Burned' : 'ক্যালোরি বার্ন'}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-accent">{completedList.length}</p>
              <p className="text-sm text-muted-foreground">{lang === 'en' ? 'Exercises' : 'ব্যায়াম'}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-warning">+50</p>
              <p className="text-sm text-muted-foreground">XP</p>
            </div>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-lg text-primary font-medium"
          >
            🔥 {lang === 'en' ? "Great job! You're getting stronger!" : 'দুর্দান্ত! তুমি শক্তিশালী হচ্ছো!'}
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Top Progress Bar */}
      <div className="relative h-2 bg-muted">
        <motion.div
          className="h-full rounded-r-full"
          style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' }}
          animate={{ width: `${totalProgress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1}/{exercises.length}
          </span>
        </div>
        <motion.div
          className="flex items-center gap-2 bg-destructive/10 px-3 py-1.5 rounded-full"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Flame className="h-4 w-4 text-destructive" />
          <span className="font-heading font-bold text-destructive text-sm">
            {Math.round(caloriesBurned)} cal
          </span>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-8">
        {restMode ? (
          /* Rest Mode */
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6"
          >
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
              {lang === 'en' ? 'Rest Period' : 'বিশ্রামের সময়'}
            </p>
            <motion.p
              className="text-7xl font-heading font-bold text-foreground"
              key={restCountdown}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {restCountdown}s
            </motion.p>
            <p className="text-sm text-muted-foreground">
              {lang === 'en' ? 'Next:' : 'পরবর্তী:'} <strong>{exercises[currentIndex + 1]?.name}</strong>
            </p>
            <Button onClick={skipRest} variant="outline" className="gap-2">
              <ChevronRight className="h-4 w-4" />
              {lang === 'en' ? 'Skip Rest' : 'বিশ্রাম এড়িয়ে যান'}
            </Button>
          </motion.div>
        ) : currentExercise ? (
          /* Exercise Mode */
          <>
            <motion.div
              key={currentIndex}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                className="inline-flex p-4 rounded-2xl bg-accent/10 mb-4"
                animate={{ rotate: isRunning ? [0, 5, -5, 0] : 0 }}
                transition={{ repeat: isRunning ? Infinity : 0, duration: 0.8 }}
              >
                <Dumbbell className="h-12 w-12 text-accent" />
              </motion.div>
              <h2 className="font-heading text-2xl font-bold text-foreground">
                {currentExercise.name}
              </h2>
              <p className="text-muted-foreground mt-1">{currentExercise.sets}</p>
            </motion.div>

            {/* Circular Timer */}
            <div className="relative">
              <svg className="h-48 w-48 -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                {isCountdown && (
                  <motion.circle
                    cx="100" cy="100" r="80" fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
                    transition={{ duration: 0.5 }}
                  />
                )}
                {!isCountdown && isRunning && (
                  <motion.circle
                    cx="100" cy="100" r="80" fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: [circumference, 0] }}
                    transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-5xl font-mono font-bold text-foreground"
                  key={displayTime}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                >
                  {formatTime(displayTime)}
                </motion.span>
                <span className="text-xs text-muted-foreground mt-1">
                  {isCountdown ? (lang === 'en' ? 'remaining' : 'বাকি') : (lang === 'en' ? 'elapsed' : 'অতিবাহিত')}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                variant="ghost"
                onClick={() => {
                  setSeconds(0);
                  setCountdown(totalSeconds);
                  setIsRunning(false);
                }}
                className="h-14 w-14 rounded-full"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>

              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  size="lg"
                  onClick={() => setIsRunning(!isRunning)}
                  className={`h-20 w-20 rounded-full text-lg ${!isRunning ? 'gradient-primary border-0 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                </Button>
              </motion.div>

              {!isCountdown && (
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleExerciseDone}
                    className="h-14 w-14 rounded-full border-accent text-accent"
                  >
                    <CheckCircle2 className="h-6 w-6" />
                  </Button>
                </motion.div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Bottom Exercise List */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {exercises.map((ex, i) => (
            <div
              key={i}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                i === currentIndex
                  ? 'gradient-primary text-primary-foreground'
                  : completedList.includes(ex.name)
                    ? 'bg-accent/20 text-accent line-through'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {ex.name.length > 15 ? ex.name.slice(0, 15) + '…' : ex.name}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
