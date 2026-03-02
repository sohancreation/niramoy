import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/hooks/use-toast';
import LocationSelector from '@/components/LocationSelector';

export default function ProfilePage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '', phone: '', age: 25, gender: 'male' as string,
    height: 170, weight: 70, activity_level: 'moderate',
    medical_conditions: '', location: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name || '',
          phone: (data as any).phone || '',
          age: (data as any).age || 25,
          gender: (data as any).gender || 'male',
          height: Number((data as any).height) || 170,
          weight: Number((data as any).weight) || 70,
          activity_level: (data as any).activity_level || 'moderate',
          medical_conditions: (data as any).medical_conditions || '',
          location: (data as any).location || '',
        });
      }
      setLoading(false);
    });
  }, [user]);

  const update = (key: string, val: string | number) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('profiles').update({
      name: form.name,
      phone: form.phone,
      age: form.age,
      gender: form.gender,
      height: form.height,
      weight: form.weight,
      activity_level: form.activity_level,
      medical_conditions: form.medical_conditions,
      location: form.location,
    } as any).eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: lang === 'en' ? 'Profile saved!' : 'প্রোফাইল সংরক্ষিত!' });
      navigate('/dashboard');
    }
  };

  if (loading) return <AppLayout><div /></AppLayout>;

  return (
    <AppLayout>
      <div className="p-6 max-w-lg mx-auto">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-6">{t('profile', lang)}</h1>
        <form onSubmit={handleSubmit} className="health-card space-y-5">
          <div>
            <Label>{t('name', lang)}</Label>
            <Input value={form.name} onChange={e => update('name', e.target.value)} required maxLength={100} />
          </div>
          <div>
            <Label>{t('phone', lang)}</Label>
            <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+880..." maxLength={20} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('age', lang)}</Label>
              <Input type="number" value={form.age} onChange={e => update('age', +e.target.value)} min={10} max={120} required />
            </div>
            <div>
              <Label>{t('gender', lang)}</Label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.gender} onChange={e => update('gender', e.target.value)}>
                <option value="male">{t('male', lang)}</option>
                <option value="female">{t('female', lang)}</option>
              </select>
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
            <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.activity_level} onChange={e => update('activity_level', e.target.value)}>
              <option value="sedentary">{t('sedentary', lang)}</option>
              <option value="light">{t('light', lang)}</option>
              <option value="moderate">{t('moderate', lang)}</option>
              <option value="active">{t('active', lang)}</option>
            </select>
          </div>
          <div>
            <Label>{t('location', lang)}</Label>
            <LocationSelector value={form.location} onChange={val => update('location', val)} lang={lang} />
          </div>
          <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground">
            {t('saveProfile', lang)}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
