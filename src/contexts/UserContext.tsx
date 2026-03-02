import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female';
  height: number;
  weight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  location: string;
  medicalConditions: string;
}

interface UserContextType {
  user: UserProfile | null;
  setUser: (u: UserProfile) => void;
  isOnboarded: boolean;
}

const UserContext = createContext<UserContextType>({ user: null, setUser: () => {}, isOnboarded: false });

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('hm-user');
    return saved ? JSON.parse(saved) : null;
  });

  const setUser = (u: UserProfile) => {
    localStorage.setItem('hm-user', JSON.stringify(u));
    setUserState(u);
  };

  return (
    <UserContext.Provider value={{ user, setUser, isOnboarded: !!user }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
