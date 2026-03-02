import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface ActiveFamilyMember {
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

interface ActiveProfileContextType {
  activeMember: ActiveFamilyMember | null;
  isViewingFamily: boolean;
  setActiveMember: (member: ActiveFamilyMember) => void;
  clearActiveMember: () => void;
  /** Returns the family_member_id to use in queries (null = self) */
  familyMemberId: string | null;
}

const ActiveProfileContext = createContext<ActiveProfileContextType>({
  activeMember: null,
  isViewingFamily: false,
  setActiveMember: () => {},
  clearActiveMember: () => {},
  familyMemberId: null,
});

export const ActiveProfileProvider = ({ children }: { children: ReactNode }) => {
  const [activeMember, setActiveMemberState] = useState<ActiveFamilyMember | null>(null);

  const setActiveMember = (member: ActiveFamilyMember) => {
    setActiveMemberState(member);
  };

  const clearActiveMember = () => {
    setActiveMemberState(null);
  };

  return (
    <ActiveProfileContext.Provider value={{
      activeMember,
      isViewingFamily: !!activeMember,
      setActiveMember,
      clearActiveMember,
      familyMemberId: activeMember?.id || null,
    }}>
      {children}
    </ActiveProfileContext.Provider>
  );
};

export const useActiveProfile = () => useContext(ActiveProfileContext);
