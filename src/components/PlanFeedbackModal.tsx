import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, Minus, MessageSquare } from 'lucide-react';

interface PlanFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => void;
  planType: 'diet' | 'exercise';
  lang: 'en' | 'bn';
}

export interface FeedbackData {
  weight_change: 'lost' | 'same' | 'gained';
  energy_feeling: number;
  muscle_progress: number;
  difficulty: number;
  notes: string;
}

export default function PlanFeedbackModal({ open, onClose, onSubmit, planType, lang }: PlanFeedbackModalProps) {
  const [weightChange, setWeightChange] = useState<'lost' | 'same' | 'gained'>('same');
  const [energy, setEnergy] = useState(3);
  const [muscle, setMuscle] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onSubmit({ weight_change: weightChange, energy_feeling: energy, muscle_progress: muscle, difficulty, notes });
    onClose();
  };

  const weightOpts = [
    { value: 'lost' as const, icon: TrendingDown, label: { en: 'Lost Weight', bn: 'ওজন কমেছে' }, color: 'text-accent' },
    { value: 'same' as const, icon: Minus, label: { en: 'Same', bn: 'একই' }, color: 'text-warning' },
    { value: 'gained' as const, icon: TrendingUp, label: { en: 'Gained', bn: 'বেড়েছে' }, color: 'text-destructive' },
  ];

  const RatingRow = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(v => (
          <button key={v} onClick={() => onChange(v)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${value === v ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
          >{v}</button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <MessageSquare className="h-5 w-5 text-primary" />
            {lang === 'en' ? 'Daily Progress Feedback' : 'দৈনিক অগ্রগতি ফিডব্যাক'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              {lang === 'en' ? 'Weight Change' : 'ওজনের পরিবর্তন'}
            </label>
            <div className="flex gap-2">
              {weightOpts.map(o => (
                <button key={o.value} onClick={() => setWeightChange(o.value)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${weightChange === o.value ? 'border-primary bg-primary/10' : 'border-border'}`}
                >
                  <o.icon className={`h-5 w-5 ${o.color}`} />
                  <span className="text-xs font-medium text-foreground">{o.label[lang]}</span>
                </button>
              ))}
            </div>
          </div>
          <RatingRow value={energy} onChange={setEnergy} label={lang === 'en' ? 'Energy Level' : 'শক্তির মাত্রা'} />
          {planType === 'exercise' && (
            <RatingRow value={muscle} onChange={setMuscle} label={lang === 'en' ? 'Muscle Progress' : 'পেশী অগ্রগতি'} />
          )}
          <RatingRow value={difficulty} onChange={setDifficulty} label={lang === 'en' ? 'Difficulty' : 'কঠিন মাত্রা'} />
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {lang === 'en' ? 'Notes (optional)' : 'মন্তব্য (ঐচ্ছিক)'}
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground resize-none h-16"
              placeholder={lang === 'en' ? 'How did it go today?' : 'আজ কেমন হলো?'}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full gradient-primary border-0 text-primary-foreground">
            {lang === 'en' ? 'Submit Feedback' : 'ফিডব্যাক জমা দিন'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
