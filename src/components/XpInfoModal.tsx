import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Zap, CheckCircle2, Camera, Flame, Gift, Percent, Star, Trophy } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface XpInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  xp: number;
}

export default function XpInfoModal({ open, onOpenChange, xp }: XpInfoModalProps) {
  const { lang } = useLang();
  const xpDiscount = xp >= 10000 ? 20 : xp >= 1000 ? 10 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" />
            {lang === 'en' ? 'Your XP' : 'আপনার XP'}
          </DialogTitle>
          <DialogDescription>
            {lang === 'en' ? 'Earn XP by completing daily tasks' : 'দৈনিক টাস্ক সম্পন্ন করে XP অর্জন করুন'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current XP */}
          <div className="bg-warning/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-heading font-bold text-foreground">{xp} XP</p>
          </div>

          {/* How to Earn */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-2 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 text-warning" />
              {lang === 'en' ? 'How to Earn XP' : 'কিভাবে XP অর্জন করবেন'}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg p-2">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span className="text-foreground">{lang === 'en' ? 'Complete a task' : 'টাস্ক সম্পন্ন করুন'}: <strong>+5 XP</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg p-2">
                <Camera className="h-4 w-4 text-primary shrink-0" />
                <span className="text-foreground">{lang === 'en' ? 'Complete with photo proof' : 'ছবি প্রমাণ সহ সম্পন্ন'}: <strong>+10 XP</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg p-2">
                <Flame className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-foreground">{lang === 'en' ? 'Maintain daily streak' : 'দৈনিক ধারা বজায় রাখুন'}: <strong>{lang === 'en' ? 'Bonus XP' : 'বোনাস XP'}</strong></span>
              </div>
            </div>
          </div>

          {/* Rewards */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-2 flex items-center gap-1 text-sm">
              <Gift className="h-4 w-4 text-accent" />
              {lang === 'en' ? 'XP Rewards' : 'XP পুরস্কার'}
            </h4>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-sm rounded-lg p-2 ${xp >= 1000 ? 'bg-success/10 border border-success/30' : 'bg-muted/30'}`}>
                <Percent className="h-4 w-4 text-accent shrink-0" />
                <span className="text-foreground">
                  <strong>1,000 XP</strong> → {lang === 'en' ? '10% discount on plans' : 'প্ল্যানে ১০% ছাড়'}
                  {xp >= 1000 && <span className="text-success ml-1">✓</span>}
                </span>
              </div>
              <div className={`flex items-center gap-2 text-sm rounded-lg p-2 ${xp >= 10000 ? 'bg-success/10 border border-success/30' : 'bg-muted/30'}`}>
                <Percent className="h-4 w-4 text-accent shrink-0" />
                <span className="text-foreground">
                  <strong>10,000 XP</strong> → {lang === 'en' ? '20% discount on plans' : 'প্ল্যানে ২০% ছাড়'}
                  {xp >= 10000 && <span className="text-success ml-1">✓</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Current Discount */}
          {xpDiscount > 0 && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 text-center">
              <p className="text-sm font-medium text-foreground">
                🎉 {lang === 'en' ? `You have ${xpDiscount}% discount available!` : `আপনার ${xpDiscount}% ছাড় পাওয়া যাচ্ছে!`}
              </p>
            </div>
          )}

          <Link to="/pricing" onClick={() => onOpenChange(false)}>
            <Button className="w-full gradient-primary border-0 text-primary-foreground gap-1">
              <Trophy className="h-4 w-4" />
              {lang === 'en' ? 'View Plans & Use Discount' : 'প্ল্যান দেখুন ও ছাড় ব্যবহার করুন'}
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
