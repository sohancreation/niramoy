import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('hm-dark');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('hm-dark', String(dark));
  }, [dark]);

  const toggleDark = () => setDark(prev => !prev);

  return { dark, toggleDark };
}
