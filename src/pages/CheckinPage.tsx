import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveProfile } from '@/contexts/ActiveProfileContext';
import { useFamilyFilter } from '@/hooks/use-family-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Bell, Trophy, Zap, AlertCircle, TrendingUp, Smile, Meh, Frown, Sparkles, RefreshCw, ChevronLeft, ChevronRight, History } from 'lucide-react';
import HealthCheckinWizard from '@/components/HealthCheckinWizard';
import { toast } from 'sonner';

const moodOptions = [
    { value: 'happy', icon: Smile, label: { en: 'Happy', bn: 'খুশি' }, color: 'text-success' },
    { value: 'neutral', icon: Meh, label: { en: 'Neutral', bn: 'স্বাভাবিক' }, color: 'text-warning' },
    { value: 'sad', icon: Frown, label: { en: 'Sad', bn: 'দুঃখিত' }, color: 'text-info' },
    { value: 'stressed', icon: AlertCircle, label: { en: 'Stressed', bn: 'চাপে' }, color: 'text-destructive' },
];

export default function CheckinPage() {
    const { lang } = useLang();
    const { user: authUser } = useAuth();
    const { insertPayload, applyFilter, familyMemberId } = useFamilyFilter();

    const [mood, setMood] = useState('');
    const [energy, setEnergy] = useState(3);
    const [stress, setStress] = useState(3);
    const [sleepQuality, setSleepQuality] = useState(3);
    const [sleepHours, setSleepHours] = useState(7);
    const [selectedPains, setSelectedPains] = useState<string[]>([]);
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [healthNotes, setHealthNotes] = useState('');
    const [todayHealthDone, setTodayHealthDone] = useState(false);
    const [canCheckinAgain, setCanCheckinAgain] = useState(true);
    const [lastCheckinTime, setLastCheckinTime] = useState<string | null>(null);
    const [savingHealth, setSavingHealth] = useState(false);
    const [healthHistory, setHealthHistory] = useState<any[]>([]);
    const [showHealthHistory, setShowHealthHistory] = useState(false);

    const today = new Date().toLocaleDateString('en-CA');

    const fetchCheckinStatus = useCallback(async () => {
        if (!authUser) return;

        const { data: healthRes } = await applyFilter(supabase.from('daily_health_updates').select('*').eq('user_id', authUser.id)).order('created_at', { ascending: false });

        if (healthRes) {
            setHealthHistory([...(healthRes || [])].reverse());
            const latest = healthRes[0];
            if (latest) {
                const lastTime = new Date(latest.created_at).getTime();
                const now = Date.now();
                const hoursSince = (now - lastTime) / (1000 * 60 * 60);
                setLastCheckinTime(latest.created_at);

                if (latest.update_date === today) {
                    setTodayHealthDone(true);
                    setMood(latest.mood || '');
                    setEnergy(latest.energy_level || 3);
                    setStress(latest.stress_level || 3);
                    setSleepQuality(latest.sleep_quality || 3);
                    setSleepHours(latest.sleep_hours || 7);
                    setSelectedPains(latest.pain_areas || []);
                    setSelectedSymptoms(latest.symptoms || []);
                    setHealthNotes(latest.notes || '');
                } else {
                    setTodayHealthDone(false);
                }
                setCanCheckinAgain(hoursSince >= 18);
            } else {
                setCanCheckinAgain(true);
            }
        }
    }, [authUser, today, familyMemberId]);

    useEffect(() => {
        fetchCheckinStatus();
    }, [fetchCheckinStatus]);

    const handleSaveHealthUpdate = async () => {
        if (!authUser) return;
        setSavingHealth(true);
        const payload = {
            user_id: authUser.id,
            update_date: today,
            mood,
            energy_level: energy,
            stress_level: stress,
            sleep_quality: sleepQuality,
            sleep_hours: sleepHours,
            pain_areas: selectedPains,
            symptoms: selectedSymptoms,
            notes: healthNotes,
            ...insertPayload,
        };

        if (todayHealthDone) {
            await supabase.from('daily_health_updates')
                .update(payload)
                .eq('user_id', authUser.id)
                .eq('update_date', today);
        } else {
            await supabase.from('daily_health_updates').insert(payload);
        }

        setTodayHealthDone(true);
        setCanCheckinAgain(false);
        setLastCheckinTime(new Date().toISOString());
        setSavingHealth(false);
        toast.success(lang === 'en' ? 'Health update saved!' : 'স্বাস্থ্য আপডেট সংরক্ষিত!');
        fetchCheckinStatus();

        // Trigger AI advice
        try {
            await supabase.functions.invoke('ai-health-suggestions', {});
        } catch (e) {
            console.error('AI suggestions error:', e);
        }
    };

    return (
        <AppLayout>
            <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                            {lang === 'en' ? 'Daily Health Check-in' : 'দৈনিক স্বাস্থ্য চেক-ইন'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {lang === 'en' ? 'Track your mood, energy, and symptoms daily.' : 'আপনার মেজাজ, শক্তি এবং লক্ষণ প্রতিদিন ট্র্যাক করুন।'}
                        </p>
                    </div>
                    <Zap className="h-8 w-8 text-warning animate-pulse-soft" />
                </div>

                <HealthCheckinWizard
                    lang={lang}
                    mood={mood} setMood={setMood}
                    energy={energy} setEnergy={setEnergy}
                    stress={stress} setStress={setStress}
                    sleepQuality={sleepQuality} setSleepQuality={setSleepQuality}
                    sleepHours={sleepHours} setSleepHours={setSleepHours}
                    selectedPains={selectedPains} setSelectedPains={setSelectedPains}
                    selectedSymptoms={selectedSymptoms} setSelectedSymptoms={setSelectedSymptoms}
                    healthNotes={healthNotes} setHealthNotes={setHealthNotes}
                    todayHealthDone={todayHealthDone}
                    canCheckinAgain={canCheckinAgain}
                    lastCheckinTime={lastCheckinTime}
                    savingHealth={savingHealth}
                    handleSaveHealthUpdate={handleSaveHealthUpdate}
                    showHealthHistory={showHealthHistory} setShowHealthHistory={setShowHealthHistory}
                    healthHistory={healthHistory}
                    moodOptions={moodOptions}
                />
            </div>
        </AppLayout>
    );
}
