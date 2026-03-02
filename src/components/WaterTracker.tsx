import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Plus } from 'lucide-react';

interface WaterTrackerProps {
  target: number; // in ml
  current: number;
  onAdd: (ml: number) => void;
  lang: 'en' | 'bn';
}

export default function WaterTracker({ target, current, onAdd, lang }: WaterTrackerProps) {
  const [ripple, setRipple] = useState(false);
  const percent = Math.min(100, Math.round((current / target) * 100));
  const glasses = Math.round(current / 250);
  const targetGlasses = Math.round(target / 250);

  const handleTap = () => {
    setRipple(true);
    onAdd(250);
    setTimeout(() => setRipple(false), 600);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-medium text-muted-foreground">
        {lang === 'en' ? 'Water Tracker' : 'পানি ট্র্যাকার'}
      </p>

      {/* Circular Water Gauge */}
      <motion.button
        onClick={handleTap}
        whileTap={{ scale: 0.95 }}
        className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-info/30 bg-info/5 cursor-pointer"
      >
        {/* Water fill */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-info/30"
          animate={{ height: `${percent}%` }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          {/* Wave */}
          <svg viewBox="0 0 120 10" className="absolute -top-2 left-0 w-full" preserveAspectRatio="none">
            <motion.path
              d="M0 5 Q15 0 30 5 T60 5 T90 5 T120 5 V10 H0 Z"
              fill="hsl(var(--info) / 0.4)"
              animate={{ d: [
                "M0 5 Q15 0 30 5 T60 5 T90 5 T120 5 V10 H0 Z",
                "M0 5 Q15 10 30 5 T60 5 T90 5 T120 5 V10 H0 Z",
                "M0 5 Q15 0 30 5 T60 5 T90 5 T120 5 V10 H0 Z",
              ]}}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            />
          </svg>
        </motion.div>

        {/* Ripple */}
        <AnimatePresence>
          {ripple && (
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-info/40"
            />
          )}
        </AnimatePresence>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <Droplets className="h-5 w-5 text-info mb-1" />
          <span className="text-lg font-heading font-bold text-foreground">{current}ml</span>
          <span className="text-[10px] text-muted-foreground">{percent}%</span>
        </div>
      </motion.button>

      {/* Quick add buttons */}
      <div className="flex gap-2">
        {[250, 500].map(ml => (
          <motion.button
            key={ml}
            whileTap={{ scale: 0.9 }}
            onClick={() => onAdd(ml)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-info/10 text-info text-xs font-medium hover:bg-info/20 transition-colors"
          >
            <Plus className="h-3 w-3" />
            {ml}ml
          </motion.button>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground">
        {glasses}/{targetGlasses} {lang === 'en' ? 'glasses' : 'গ্লাস'}
      </p>
    </div>
  );
}
