import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/use-subscription';
import { useActiveProfile } from '@/contexts/ActiveProfileContext';
import SubscriptionGate from '@/components/SubscriptionGate';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, Plus, Pencil, Trash2, Heart, User, Baby, PersonStanding, Crown, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { MEDICAL_CONDITIONS } from '@/lib/medical-conditions';

interface FamilyMember {
  id: string;
  owner_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  weight: number | null;
  height: number | null;
  activity_level: string | null;
  medical_conditions: string | null;
  relationship: string;
  avatar_emoji: string;
  created_at: string;
}

const RELATIONSHIPS = [
  { value: 'spouse', label: { en: 'Spouse', bn: 'স্বামী/স্ত্রী' }, emoji: '💑' },
  { value: 'child', label: { en: 'Child', bn: 'সন্তান' }, emoji: '👶' },
  { value: 'parent', label: { en: 'Parent', bn: 'পিতামাতা' }, emoji: '👴' },
  { value: 'sibling', label: { en: 'Sibling', bn: 'ভাই/বোন' }, emoji: '👫' },
  { value: 'other', label: { en: 'Other', bn: 'অন্যান্য' }, emoji: '👤' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: { en: 'Sedentary', bn: 'নিষ্ক্রিয়' } },
  { value: 'light', label: { en: 'Light', bn: 'হালকা' } },
  { value: 'moderate', label: { en: 'Moderate', bn: 'মাঝারি' } },
  { value: 'active', label: { en: 'Active', bn: 'সক্রিয়' } },
];

const MAX_MEMBERS = 4;

const emptyForm = {
  name: '', age: '', gender: '', weight: '', height: '',
  activity_level: 'moderate', medical_conditions: [] as string[], relationship: 'spouse',
};

export default function FamilyModePage() {
  const { lang } = useLang();
  const { user: authUser } = useAuth();
  const { tier } = useSubscription();
  const { setActiveMember } = useActiveProfile();
  const navigate = useNavigate();
  const isPremium = tier === 'premium';

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!authUser) return;
    const { data } = await supabase
      .from('family_members')
      .select('*')
      .eq('owner_id', authUser.id)
      .order('created_at', { ascending: true });
    setMembers((data as FamilyMember[]) || []);
    setLoading(false);
  }, [authUser]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const openAdd = () => {
    if (members.length >= MAX_MEMBERS) {
      toast.error(lang === 'en' ? `Maximum ${MAX_MEMBERS} family members allowed` : `সর্বোচ্চ ${MAX_MEMBERS} জন পরিবারের সদস্য অনুমোদিত`);
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (m: FamilyMember) => {
    setForm({
      name: m.name,
      age: m.age?.toString() || '',
      gender: m.gender || '',
      weight: m.weight?.toString() || '',
      height: m.height?.toString() || '',
      activity_level: m.activity_level || 'moderate',
      medical_conditions: m.medical_conditions ? m.medical_conditions.split(', ').map(s => s.trim().toLowerCase().replace(/[ /]/g, '_')).filter(Boolean) : [],
      relationship: m.relationship,
    });
    setEditingId(m.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!authUser || !form.name.trim()) {
      toast.error(lang === 'en' ? 'Name is required' : 'নাম আবশ্যক');
      return;
    }
    setSaving(true);
    const rel = RELATIONSHIPS.find(r => r.value === form.relationship);
    const payload = {
      owner_id: authUser.id,
      name: form.name.trim(),
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      activity_level: form.activity_level || null,
      medical_conditions: form.medical_conditions.filter(c => c !== 'none').join(', ') || null,
      relationship: form.relationship,
      avatar_emoji: rel?.emoji || '👤',
    };

    if (editingId) {
      const { error } = await supabase.from('family_members').update(payload).eq('id', editingId);
      if (error) { toast.error(lang === 'en' ? 'Update failed' : 'আপডেট ব্যর্থ'); }
      else { toast.success(lang === 'en' ? 'Member updated!' : 'সদস্য আপডেট হয়েছে!'); }
    } else {
      const { error } = await supabase.from('family_members').insert(payload);
      if (error) { toast.error(lang === 'en' ? 'Failed to add member' : 'সদস্য যোগ করতে ব্যর্থ'); }
      else { toast.success(lang === 'en' ? 'Member added!' : 'সদস্য যোগ হয়েছে!'); }
    }
    setSaving(false);
    setDialogOpen(false);
    fetchMembers();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (!error) {
      toast.success(lang === 'en' ? 'Member removed' : 'সদস্য সরানো হয়েছে');
      fetchMembers();
    }
  };

  if (!isPremium) {
    return (
      <AppLayout>
        <SubscriptionGate
          allowed={false}
          featureName={{ en: 'Family Mode', bn: 'ফ্যামিলি মোড' }}
          message={{
            en: 'Family Mode with up to 4 profiles and a family wellness dashboard is exclusively available with the HealthMate AI+ subscription (৳399/month).',
            bn: 'ফ্যামিলি মোড (৪টি প্রোফাইল পর্যন্ত) এবং ফ্যামিলি ওয়েলনেস ড্যাশবোর্ড শুধুমাত্র HealthMate AI+ সাবস্ক্রিপশনে (৳৩৯৯/মাস) পাওয়া যায়।'
          }}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-accent" />
              {lang === 'en' ? 'Family Mode' : 'ফ্যামিলি মোড'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {lang === 'en'
                ? `Manage up to ${MAX_MEMBERS} family profiles. ${members.length}/${MAX_MEMBERS} members added.`
                : `${MAX_MEMBERS} জন পর্যন্ত পরিবারের প্রোফাইল পরিচালনা করুন। ${members.length}/${MAX_MEMBERS} জন যোগ হয়েছে।`}
            </p>
          </div>
          <Button onClick={openAdd} className="gradient-primary border-0 text-primary-foreground gap-2" disabled={members.length >= MAX_MEMBERS}>
            <Plus className="h-4 w-4" />
            {lang === 'en' ? 'Add Member' : 'সদস্য যোগ করুন'}
          </Button>
        </div>

        {/* Members Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : members.length === 0 ? (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                <Users className="h-10 w-10 text-accent" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {lang === 'en' ? 'No family members yet' : 'এখনো কোনো পরিবারের সদস্য নেই'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {lang === 'en'
                  ? 'Add your family members to track their health, create personalized plans, and view a shared wellness dashboard.'
                  : 'তাদের স্বাস্থ্য ট্র্যাক করতে, ব্যক্তিগত প্ল্যান তৈরি করতে এবং একটি শেয়ারড ওয়েলনেস ড্যাশবোর্ড দেখতে আপনার পরিবারের সদস্যদের যোগ করুন।'}
              </p>
              <Button onClick={openAdd} className="gradient-primary border-0 text-primary-foreground gap-2">
                <Plus className="h-4 w-4" />
                {lang === 'en' ? 'Add First Member' : 'প্রথম সদস্য যোগ করুন'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {members.map((m, i) => {
                const bmi = m.weight && m.height ? (m.weight / ((m.height / 100) ** 2)).toFixed(1) : null;
                const rel = RELATIONSHIPS.find(r => r.value === m.relationship);
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => {
                      setActiveMember({
                        id: m.id,
                        name: m.name,
                        avatar_emoji: m.avatar_emoji,
                        relationship: m.relationship,
                        age: m.age,
                        gender: m.gender,
                        weight: m.weight,
                        height: m.height,
                        activity_level: m.activity_level,
                        medical_conditions: m.medical_conditions,
                      });
                      navigate('/dashboard');
                    }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-2xl">
                              {m.avatar_emoji}
                            </div>
                            <div>
                              <CardTitle className="text-lg font-heading">{m.name}</CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {rel?.label[lang] || m.relationship}
                                {m.age ? ` • ${m.age} ${lang === 'en' ? 'yrs' : 'বছর'}` : ''}
                                {m.gender ? ` • ${m.gender === 'male' ? (lang === 'en' ? 'Male' : 'পুরুষ') : m.gender === 'female' ? (lang === 'en' ? 'Female' : 'মহিলা') : m.gender}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(m)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(m.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 gap-3 text-center">
                          {m.weight && (
                            <div className="bg-muted/50 rounded-lg p-2">
                              <p className="text-lg font-bold text-foreground">{m.weight}</p>
                              <p className="text-[10px] text-muted-foreground">{lang === 'en' ? 'kg' : 'কেজি'}</p>
                            </div>
                          )}
                          {m.height && (
                            <div className="bg-muted/50 rounded-lg p-2">
                              <p className="text-lg font-bold text-foreground">{m.height}</p>
                              <p className="text-[10px] text-muted-foreground">{lang === 'en' ? 'cm' : 'সেমি'}</p>
                            </div>
                          )}
                          {bmi && (
                            <div className="bg-muted/50 rounded-lg p-2">
                              <p className="text-lg font-bold text-foreground">{bmi}</p>
                              <p className="text-[10px] text-muted-foreground">BMI</p>
                            </div>
                          )}
                        </div>
                        {m.medical_conditions && (
                          <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
                            <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                            <p className="text-xs text-foreground">{m.medical_conditions}</p>
                          </div>
                        )}
                        {/* View Profile CTA */}
                        <div className="mt-3 flex items-center justify-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 group-hover:bg-primary/10 transition-colors">
                          <span className="text-xs font-medium text-primary">
                            {lang === 'en' ? 'View Full Profile' : 'সম্পূর্ণ প্রোফাইল দেখুন'}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                {editingId
                  ? (lang === 'en' ? 'Edit Family Member' : 'পরিবারের সদস্য সম্পাদনা')
                  : (lang === 'en' ? 'Add Family Member' : 'পরিবারের সদস্য যোগ করুন')}
              </DialogTitle>
              <DialogDescription>
                {lang === 'en' ? 'Fill in the health profile details.' : 'স্বাস্থ্য প্রোফাইলের বিবরণ পূরণ করুন।'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Relationship */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {lang === 'en' ? 'Relationship' : 'সম্পর্ক'}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {RELATIONSHIPS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setForm(f => ({ ...f, relationship: r.value }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center ${
                        form.relationship === r.value
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <span className="text-xl">{r.emoji}</span>
                      <span className="text-[10px] font-medium text-foreground">{r.label[lang]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {lang === 'en' ? 'Name *' : 'নাম *'}
                </label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={lang === 'en' ? 'Full name' : 'পুরো নাম'} />
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {lang === 'en' ? 'Age' : 'বয়স'}
                  </label>
                  <Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    placeholder="25" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {lang === 'en' ? 'Gender' : 'লিঙ্গ'}
                  </label>
                  <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder={lang === 'en' ? 'Select' : 'নির্বাচন'} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{lang === 'en' ? 'Male' : 'পুরুষ'}</SelectItem>
                      <SelectItem value="female">{lang === 'en' ? 'Female' : 'মহিলা'}</SelectItem>
                      <SelectItem value="other">{lang === 'en' ? 'Other' : 'অন্যান্য'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Weight & Height */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {lang === 'en' ? 'Weight (kg)' : 'ওজন (কেজি)'}
                  </label>
                  <Input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                    placeholder="70" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {lang === 'en' ? 'Height (cm)' : 'উচ্চতা (সেমি)'}
                  </label>
                  <Input type="number" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                    placeholder="170" />
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {lang === 'en' ? 'Activity Level' : 'কার্যকলাপের মাত্রা'}
                </label>
                <Select value={form.activity_level} onValueChange={v => setForm(f => ({ ...f, activity_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_LEVELS.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label[lang]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Medical Conditions */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {lang === 'en' ? 'Medical Conditions' : 'চিকিৎসা অবস্থা'}
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {MEDICAL_CONDITIONS.map(mc => {
                    const selected = form.medical_conditions.includes(mc.value);
                    const isNone = mc.value === 'none';
                    return (
                      <button
                        key={mc.value}
                        type="button"
                        onClick={() => {
                          setForm(f => {
                            if (isNone) return { ...f, medical_conditions: selected ? [] : ['none'] };
                            const without = f.medical_conditions.filter(c => c !== 'none' && c !== mc.value);
                            return { ...f, medical_conditions: selected ? without : [...without, mc.value] };
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

              <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary border-0 text-primary-foreground">
                {saving
                  ? (lang === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...')
                  : editingId
                    ? (lang === 'en' ? 'Update Member' : 'সদস্য আপডেট করুন')
                    : (lang === 'en' ? 'Add Member' : 'সদস্য যোগ করুন')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
