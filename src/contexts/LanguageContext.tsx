import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { type Language } from '@/lib/translations';

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({ lang: 'en', toggleLang: () => {} });

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('hm-lang') as Language) || 'en';
  });

  const toggleLang = () => {
    setLang(prev => {
      const next = prev === 'en' ? 'bn' : 'en';
      localStorage.setItem('hm-lang', next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
