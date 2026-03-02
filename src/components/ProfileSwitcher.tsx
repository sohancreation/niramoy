import React, { useState, useEffect, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveProfile, type ActiveFamilyMember } from '@/contexts/ActiveProfileContext';
import { useSubscription } from '@/hooks/use-subscription';
import { supabase } from '@/integrations/supabase/client';
import { Users, ChevronDown, User, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FamilyMemberRow {
  id: string;
  name: string;
  avatar_emoji: string;
  relationship: string;
  age: number | null;
  gender: string | null;
  weight: number | null;
  height: number | null;
  activity_level: string | null;
  medical_conditions: string | null;
}

export default function ProfileSwitcher() {
  const { lang } = useLang();
  const { user: authUser } = useAuth();
  const { activeMember, setActiveMember, clearActiveMember, isViewingFamily } = useActiveProfile();
  const { tier } = useSubscription();
  const [members, setMembers] = useState<FamilyMemberRow[]>([]);
  const [profileName, setProfileName] = useState('');

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    const [{ data: profile }, { data: familyData }] = await Promise.all([
      supabase.from('profiles').select('name').eq('user_id', authUser.id).single(),
      tier === 'premium'
        ? supabase.from('family_members').select('*').eq('owner_id', authUser.id).order('created_at', { ascending: true })
        : Promise.resolve({ data: [] }),
    ]);
    if (profile) setProfileName(profile.name || 'Me');
    if (familyData) setMembers(familyData as FamilyMemberRow[]);
  }, [authUser, tier]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (members.length === 0) return null;

  const currentName = isViewingFamily && activeMember ? activeMember.name : profileName;
  const currentEmoji = isViewingFamily && activeMember ? activeMember.avatar_emoji : '👤';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/80 hover:bg-muted border border-border text-sm font-medium text-foreground transition-colors">
          <span className="text-lg">{currentEmoji}</span>
          <span className="max-w-[100px] truncate">{currentName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Self */}
        <DropdownMenuItem
          onClick={() => clearActiveMember()}
          className="flex items-center gap-3 cursor-pointer"
        >
          <span className="text-lg">👤</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profileName}</p>
            <p className="text-[10px] text-muted-foreground">{lang === 'en' ? 'My Profile' : 'আমার প্রোফাইল'}</p>
          </div>
          {!isViewingFamily && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>

        {members.length > 0 && <DropdownMenuSeparator />}

        {/* Family Members */}
        {members.map(m => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => setActiveMember({
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
            })}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span className="text-lg">{m.avatar_emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {m.relationship === 'spouse' ? (lang === 'en' ? 'Spouse' : 'স্বামী/স্ত্রী') :
                 m.relationship === 'child' ? (lang === 'en' ? 'Child' : 'সন্তান') :
                 m.relationship === 'parent' ? (lang === 'en' ? 'Parent' : 'পিতামাতা') :
                 m.relationship === 'sibling' ? (lang === 'en' ? 'Sibling' : 'ভাই/বোন') :
                 (lang === 'en' ? 'Other' : 'অন্যান্য')}
              </p>
            </div>
            {activeMember?.id === m.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
