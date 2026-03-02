import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExerciseTimerProps {
  exerciseName: string;
  sets: string;
  onComplete?: () => void;
  lang: 'en' | 'bn';
}

export default function ExerciseTimer({ exerciseName, sets, onComplete, lang }: ExerciseTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parse duration from sets string (e.g., "3 x 20 sec" → countdown mode, "3 x 10" → stopwatch)
  const isCountdown = /sec|min/i.test(sets);
  const totalSeconds = isCountdown ? parseTimerDuration(sets) : 0;
  const [countdown, setCountdown] = useState(totalSeconds);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      if (isCountdown) {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setIsCompleted(true);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setSeconds(prev => prev + 1);
      }
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isCountdown]);

  const reset = () => {
    setIsRunning(false);
    setSeconds(0);
    setCountdown(totalSeconds);
    setIsCompleted(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const displayTime = isCountdown ? countdown : seconds;
  const progress = isCountdown && totalSeconds > 0 ? ((totalSeconds - countdown) / totalSeconds) * 100 : 0;

  return (
    <div className={`rounded-xl border p-4 transition-all ${isCompleted ? 'bg-accent/10 border-accent' : isRunning ? 'bg-primary/5 border-primary' : 'bg-card border-border'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{exerciseName}</p>
          <p className="text-xs text-muted-foreground">{sets}</p>
        </div>
        {isCompleted && <CheckCircle2 className="h-5 w-5 text-accent" />}
      </div>

      {/* Timer display */}
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 flex-shrink-0">
          {/* Circular progress for countdown */}
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
            {isCountdown && (
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke={isCompleted ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                className="transition-all duration-500"
              />
            )}
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-mono font-bold text-foreground">
            {formatTime(displayTime)}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isRunning ? 'outline' : 'default'}
            onClick={() => setIsRunning(!isRunning)}
            disabled={isCompleted}
            className={!isRunning && !isCompleted ? 'gradient-primary border-0 text-primary-foreground' : ''}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRunning ? (lang === 'en' ? 'Pause' : 'বিরতি') : (lang === 'en' ? 'Start' : 'শুরু')}
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          {!isCountdown && !isCompleted && (
            <Button size="sm" variant="outline" onClick={() => { setIsCompleted(true); setIsRunning(false); onComplete?.(); }}>
              <CheckCircle2 className="h-4 w-4" />
              {lang === 'en' ? 'Done' : 'শেষ'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function parseTimerDuration(sets: string): number {
  // "3 x 20 sec" → 20, "3 x 30 sec" → 30, "15 min" → 900
  const minMatch = sets.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1]) * 60;
  const secMatch = sets.match(/(\d+)\s*sec/i);
  if (secMatch) return parseInt(secMatch[1]);
  return 60; // default 60s
}
