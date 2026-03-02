import React, { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Globe, Mail, Lock, User, Phone, Moon, Sun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LocationSelector from '@/components/LocationSelector';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { MEDICAL_CONDITIONS } from '@/lib/medical-conditions';

export default function AuthPage() {
  const { lang, toggleLang } = useLang();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { dark, toggleDark } = useDarkMode();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    age: 25,
    gender: 'male' as 'male' | 'female',
    height: 170,
    weight: 70,
    activityLevel: 'moderate',
    medicalConditions: [] as string[],
    location: '',
  });

  const update = (key: string, val: string | number) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data: loginData, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;

        // Check if user is admin to redirect appropriately
        if (loginData.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', loginData.user.id)
            .eq('role', 'admin')
            .maybeSingle();
          
          if (roleData) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/dashboard');
        }
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { name: form.name },
          },
        });
        if (error) throw error;

        // Save all profile fields after signup
        const userId = signUpData.user?.id;
        if (userId) {
          // Wait briefly for the trigger to create the profile row
          await new Promise(r => setTimeout(r, 500));
          await supabase.from('profiles').update({
            phone: form.phone || null,
            age: form.age,
            gender: form.gender,
            height: form.height,
            weight: form.weight,
            activity_level: form.activityLevel,
            medical_conditions: form.medicalConditions.filter(c => c !== 'none').join(', ') || null,
            location: form.location || null,
          } as any).eq('user_id', userId);
        }

        navigate('/dashboard');
      }
    } catch (err: any) {
      toast({
        title: lang === 'en' ? 'Error' : 'ত্রুটি',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Heart className="h-10 w-10 text-primary mx-auto mb-3" fill="currentColor" />
          <h1 className="font-heading text-3xl font-bold text-foreground">{t('appName', lang)}</h1>
          <p className="text-muted-foreground mt-1">
            {isLogin ? t('login', lang) : t('signup', lang)}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button onClick={toggleLang} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
              <Globe className="h-3.5 w-3.5" />
              {t('language', lang)}
            </button>
            <button onClick={toggleDark} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
              {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {dark ? (lang === 'en' ? 'Light' : 'লাইট') : (lang === 'en' ? 'Dark' : 'ডার্ক')}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="health-card space-y-4">
          {!isLogin && (
            <>
              <div>
                <Label className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{t('name', lang)}</Label>
                <Input value={form.name} onChange={e => update('name', e.target.value)} required maxLength={100} />
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{t('phone', lang)}</Label>
                <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+880..." maxLength={20} />
              </div>
            </>
          )}

          <div>
            <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{t('email', lang)}</Label>
            <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} required maxLength={255} />
          </div>
          <div>
            <Label className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />{t('password', lang)}</Label>
            <Input type="password" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} maxLength={72} />
          </div>

          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('age', lang)}</Label>
                  <Input type="number" value={form.age} onChange={e => update('age', +e.target.value)} min={10} max={120} required />
                </div>
                <div>
                  <Label>{t('gender', lang)}</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => update('gender', 'male')}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        form.gender === 'male'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      👨 {t('male', lang)}
                    </button>
                    <button
                      type="button"
                      onClick={() => update('gender', 'female')}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        form.gender === 'female'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      👩 {t('female', lang)}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('height', lang)}</Label>
                  <Input type="number" value={form.height} onChange={e => update('height', +e.target.value)} min={100} max={250} required />
                </div>
                <div>
                  <Label>{t('weight', lang)}</Label>
                  <Input type="number" value={form.weight} onChange={e => update('weight', +e.target.value)} min={20} max={300} required />
                </div>
              </div>
              <div>
                <Label>{t('activityLevel', lang)}</Label>
                <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.activityLevel} onChange={e => update('activityLevel', e.target.value)}>
                  <option value="sedentary">{t('sedentary', lang)}</option>
                  <option value="light">{t('light', lang)}</option>
                  <option value="moderate">{t('moderate', lang)}</option>
                  <option value="active">{t('active', lang)}</option>
                </select>
              </div>
              <div>
                <Label>{lang === 'en' ? 'Medical Conditions' : 'চিকিৎসা অবস্থা'}</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {MEDICAL_CONDITIONS.map(mc => {
                    const selected = form.medicalConditions.includes(mc.value);
                    const isNone = mc.value === 'none';
                    return (
                      <button
                        key={mc.value}
                        type="button"
                        onClick={() => {
                          setForm(f => {
                            if (isNone) return { ...f, medicalConditions: selected ? [] : ['none'] };
                            const without = f.medicalConditions.filter(c => c !== 'none' && c !== mc.value);
                            return { ...f, medicalConditions: selected ? without : [...without, mc.value] };
                          });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {mc.label[lang]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>{t('location', lang)}</Label>
                <LocationSelector value={form.location} onChange={val => update('location', val)} lang={lang} />
              </div>
            </>
          )}

          <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loading}>
            {loading
              ? (lang === 'en' ? 'Please wait...' : 'অপেক্ষা করুন...')
              : isLogin ? t('login', lang) : t('signup', lang)
            }
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? t('noAccount', lang) : t('haveAccount', lang)}{' '}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
              {isLogin ? t('signup', lang) : t('login', lang)}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
