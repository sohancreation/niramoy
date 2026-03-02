import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Heart, CheckCircle2, History, ChevronRight, ChevronLeft, Smile, Frown, Meh, AlertCircle, Zap, Moon, Sparkles } from 'lucide-react';

interface HealthCheckinWizardProps {
  lang: 'en' | 'bn';
  mood: string; setMood: (v: string) => void;
  energy: number; setEnergy: (v: number) => void;
  stress: number; setStress: (v: number) => void;
  sleepQuality: number; setSleepQuality: (v: number) => void;
  sleepHours: number; setSleepHours: (v: number) => void;
  selectedPains: string[]; setSelectedPains: (v: string[]) => void;
  selectedSymptoms: string[]; setSelectedSymptoms: (v: string[]) => void;
  healthNotes: string; setHealthNotes: (v: string) => void;
  todayHealthDone: boolean;
  canCheckinAgain: boolean;
  lastCheckinTime: string | null;
  savingHealth: boolean;
  handleSaveHealthUpdate: () => void;
  showHealthHistory: boolean; setShowHealthHistory: (v: boolean) => void;
  healthHistory: any[];
  moodOptions: { value: string; icon: React.ElementType; label: { en: string; bn: string }; color: string }[];
}

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

const STEPS = [
  { key: 'mood', label: { en: '😊 How are you?', bn: '😊 কেমন আছেন?' } },
  { key: 'energy', label: { en: '⚡ Energy & Stress', bn: '⚡ শক্তি ও চাপ' } },
  { key: 'sleep', label: { en: '😴 Sleep', bn: '😴 ঘুম' } },
  { key: 'health', label: { en: '🩺 Symptoms', bn: '🩺 লক্ষণ' } },
  { key: 'notes', label: { en: '📝 Notes', bn: '📝 নোট' } },
];

export default function HealthCheckinWizard({
  lang, mood, setMood, energy, setEnergy, stress, setStress,
  sleepQuality, setSleepQuality, sleepHours, setSleepHours,
  selectedPains, setSelectedPains, selectedSymptoms, setSelectedSymptoms,
  healthNotes, setHealthNotes, todayHealthDone, canCheckinAgain,
  lastCheckinTime, savingHealth, handleSaveHealthUpdate,
  showHealthHistory, setShowHealthHistory, healthHistory, moodOptions,
}: HealthCheckinWizardProps) {
  const [step, setStep] = useState(0);
  const isLocked = todayHealthDone && !canCheckinAgain;

  const handleSave = () => {
    handleSaveHealthUpdate();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const AnimatedRating = ({ value, onChange, label, emoji }: { value: number; onChange: (v: number) => void; label: string; emoji: string[] }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map(v => (
          <motion.button
            key={v}
            onClick={() => onChange(v)}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className={`w-12 h-12 rounded-xl text-lg font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
              value === v 
                ? 'gradient-primary text-primary-foreground shadow-lg ring-2 ring-primary/30' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <span className="text-base">{emoji[v - 1]}</span>
            <span className="text-[10px]">{v}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="health-card" id="health-checkin">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <Heart className="h-5 w-5 text-destructive" />
          {lang === 'en' ? "Health Check-in" : 'স্বাস্থ্য চেক-ইন'}
          {isLocked && <CheckCircle2 className="h-4 w-4 text-success" />}
        </h3>
        <Button size="sm" variant="ghost" onClick={() => setShowHealthHistory(!showHealthHistory)} className="gap-1 text-xs">
          <History className="h-3.5 w-3.5" />
          {lang === 'en' ? 'History' : 'ইতিহাস'}
        </Button>
      </div>

      {/* Cooldown */}
      {isLocked && lastCheckinTime && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-3 mb-4 text-sm">
          <p className="text-foreground font-medium">✅ {lang === 'en' ? 'Check-in completed!' : 'চেক-ইন সম্পন্ন!'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === 'en' 
              ? `Next check-in after 18 hours (Last: ${new Date(lastCheckinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` 
              : `১৮ ঘণ্টা পর (শেষ: ${new Date(lastCheckinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
          </p>
        </div>
      )}

      {/* History */}
      {showHealthHistory && healthHistory.length > 0 && (
        <div className="mb-4 border border-border rounded-lg overflow-hidden animate-in slide-in-from-top-2">
          <div className="bg-muted/30 px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold text-foreground">{lang === 'en' ? 'Recent Check-ins' : 'সাম্প্রতিক চেক-ইন'}</p>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-border">
            {[...healthHistory].reverse().slice(0, 10).map((h: any, i: number) => (
              <div key={i} className="px-3 py-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">{new Date(h.update_date).toLocaleDateString()}</span>
                  <span className="text-muted-foreground">{new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-muted-foreground">
                  {h.mood && <span>{moodOptions.find(m => m.value === h.mood)?.label[lang] || h.mood}</span>}
                  <span>⚡{h.energy_level || '-'}</span>
                  <span>😰{h.stress_level || '-'}</span>
                  <span>😴{h.sleep_quality || '-'}/5 ({h.sleep_hours || '-'}h)</span>
                  {h.pain_areas?.length > 0 && <span className="text-destructive">🔴 {h.pain_areas.join(', ')}</span>}
                  {h.symptoms?.length > 0 && <span className="text-warning">⚠️ {h.symptoms.join(', ')}</span>}
                </div>
                {h.notes && <p className="text-muted-foreground mt-1 italic">"{h.notes}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step progress dots */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {STEPS.map((s, i) => (
          <motion.button
            key={s.key}
            onClick={() => !isLocked && setStep(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === step ? 'w-8 bg-primary' : i < step ? 'w-2.5 bg-success' : 'w-2.5 bg-muted'
            }`}
            whileTap={{ scale: 0.8 }}
          />
        ))}
      </div>

      {/* Step label */}
      <p className="text-center text-sm font-semibold text-foreground mb-4">
        {STEPS[step].label[lang]}
        <span className="text-muted-foreground text-xs ml-2">({step + 1}/{STEPS.length})</span>
      </p>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="min-h-[140px]"
        >
          {step === 0 && (
            <div className="flex justify-center gap-3">
              {moodOptions.map(m => {
                const Icon = m.icon;
                const selected = mood === m.value;
                return (
                  <motion.button
                    key={m.value}
                    onClick={() => { setMood(m.value); setTimeout(() => setStep(1), 400); }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
                      selected 
                        ? 'bg-primary/10 border-2 border-primary shadow-md' 
                        : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
                    }`}
                  >
                    <motion.div animate={selected ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                      <Icon className={`h-10 w-10 ${m.color}`} />
                    </motion.div>
                    <span className={`text-sm font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>{m.label[lang]}</span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <AnimatedRating
                value={energy}
                onChange={setEnergy}
                label={lang === 'en' ? 'Energy Level' : 'শক্তির মাত্রা'}
                emoji={['😴', '😔', '😐', '😊', '🔥']}
              />
              <AnimatedRating
                value={stress}
                onChange={setStress}
                label={lang === 'en' ? 'Stress Level' : 'চাপের মাত্রা'}
                emoji={['😌', '🙂', '😐', '😰', '🤯']}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <AnimatedRating
                value={sleepQuality}
                onChange={setSleepQuality}
                label={lang === 'en' ? 'Sleep Quality' : 'ঘুমের মান'}
                emoji={['💤', '😪', '😐', '😴', '🌟']}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground text-center block">
                  {lang === 'en' ? 'Sleep Hours' : 'ঘুমের ঘণ্টা'}
                </label>
                <div className="flex items-center justify-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSleepHours(Math.max(0, sleepHours - 0.5))}
                    className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground font-bold text-lg hover:bg-muted/80"
                  >−</motion.button>
                  <div className="w-20 text-center">
                    <span className="text-3xl font-heading font-black text-foreground">{sleepHours}</span>
                    <span className="text-sm text-muted-foreground ml-1">h</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSleepHours(Math.min(24, sleepHours + 0.5))}
                    className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground font-bold text-lg hover:bg-muted/80"
                  >+</motion.button>
                </div>
                {/* Quick presets */}
                <div className="flex justify-center gap-2 mt-2">
                  {[5, 6, 7, 8, 9].map(h => (
                    <motion.button
                      key={h}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSleepHours(h)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        sleepHours === h ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >{h}h</motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {lang === 'en' ? 'Any Pain?' : 'কোনো ব্যথা?'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {painOptions.map(p => {
                    const sel = selectedPains.includes(p.en);
                    return (
                      <motion.button
                        key={p.en}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedPains(sel ? selectedPains.filter(x => x !== p.en) : [...selectedPains, p.en])}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          sel ? 'bg-destructive/10 text-destructive border-2 border-destructive/30 shadow-sm' : 'bg-muted text-muted-foreground border-2 border-transparent hover:bg-muted/80'
                        }`}
                      >
                        {sel && '🔴 '}{p[lang]}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {lang === 'en' ? 'Any Symptoms?' : 'কোনো লক্ষণ?'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {symptomOptions.map(s => {
                    const sel = selectedSymptoms.includes(s.en);
                    return (
                      <motion.button
                        key={s.en}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedSymptoms(sel ? selectedSymptoms.filter(x => x !== s.en) : [...selectedSymptoms, s.en])}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          sel ? 'bg-warning/10 text-warning border-2 border-warning/30 shadow-sm' : 'bg-muted text-muted-foreground border-2 border-transparent hover:bg-muted/80'
                        }`}
                      >
                        {sel && '⚠️ '}{s[lang]}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <textarea
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
                placeholder={lang === 'en' ? 'How do you feel today? Any additional notes...' : 'আজ কেমন লাগছে? অতিরিক্ত কিছু...'}
                className="w-full h-24 px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              {/* Summary before save */}
              <div className="mt-3 bg-muted/30 rounded-xl p-3 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground text-sm">{lang === 'en' ? '📋 Summary' : '📋 সারাংশ'}</p>
                {mood && <p>😊 {moodOptions.find(m => m.value === mood)?.label[lang]}</p>}
                <p>⚡ {lang === 'en' ? 'Energy' : 'শক্তি'}: {energy}/5 • 😰 {lang === 'en' ? 'Stress' : 'চাপ'}: {stress}/5</p>
                <p>😴 {lang === 'en' ? 'Sleep' : 'ঘুম'}: {sleepQuality}/5 ({sleepHours}h)</p>
                {selectedPains.length > 0 && <p>🔴 {selectedPains.join(', ')}</p>}
                {selectedSymptoms.length > 0 && <p>⚠️ {selectedSymptoms.join(', ')}</p>}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5 gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {lang === 'en' ? 'Back' : 'পিছনে'}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setStep(step + 1)}
            className="gradient-primary border-0 text-primary-foreground gap-1"
          >
            {lang === 'en' ? 'Next' : 'পরবর্তী'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleSave} 
            disabled={savingHealth || isLocked}
            className="gradient-primary border-0 text-primary-foreground gap-1"
          >
            <Sparkles className="h-4 w-4" />
            {savingHealth 
              ? (lang === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...') 
              : isLocked
                ? (lang === 'en' ? '✓ Done (18hrs)' : '✓ সম্পন্ন')
                : (lang === 'en' ? 'Save Check-in' : 'সংরক্ষণ করুন')}
          </Button>
        )}
      </div>
    </div>
  );
}
