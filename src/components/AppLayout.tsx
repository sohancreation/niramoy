import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveProfile } from '@/contexts/ActiveProfileContext';
import { t } from '@/lib/translations';
import {
  LayoutDashboard, Utensils, Dumbbell, Leaf, MapPin, BarChart3,
  User, Menu, X, Globe, AlertTriangle, LogOut, Moon, Sun, Trophy,
  ClipboardCheck, MessageCircle, HeartPulse, FileText, CreditCard, Brain, Users, ArrowLeft, Phone
} from 'lucide-react';
import HealthChatbot from '@/components/HealthChatbot';
import NotificationBell from '@/components/NotificationBell';
import ProfileSwitcher from '@/components/ProfileSwitcher';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { path: '/checkin', icon: ClipboardCheck, key: 'healthCheckin' },
  { path: '/quests', icon: Trophy, key: 'dailyQuests' },
  { path: '/diet', icon: Utensils, key: 'dietPlan' },
  { path: '/exercise', icon: Dumbbell, key: 'exercise' },
  { path: '/remedies', icon: Leaf, key: 'remedies' },
  { path: '/find-care', icon: MapPin, key: 'findCare' },
  { path: '/prescriptions', icon: FileText, key: 'prescriptions' },
  { path: '/tracker', icon: BarChart3, key: 'tracker' },
  { path: '/mindcare', icon: Brain, key: 'mindCare' },
  { path: '/voice-consult', icon: Phone, key: 'voiceConsult' },
  { path: '/family', icon: Users, key: 'familyMode' },
  { path: '/profile', icon: User, key: 'profile' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { lang, toggleLang } = useLang();
  const { signOut, user: authUser } = useAuth();
  const { activeMember, isViewingFamily, clearActiveMember } = useActiveProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggleDark } = useDarkMode();
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const handleNavClick = (path: string) => {
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col gradient-hero text-sidebar-foreground fixed h-full z-30">
        <Link to="/dashboard" className="p-6 flex items-center gap-3 hover:opacity-90 transition-opacity">
          <HeartPulse className="h-8 w-8 text-primary" />
          <span className="font-heading text-xl font-bold text-primary-foreground">Niramoy AI</span>
        </Link>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isHash = item.path.includes('#');
            const basePath = item.path.split('#')[0];
            const active = isHash ? false : location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={isHash ? basePath : item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${active
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }`}
              >
                <item.icon className="h-5 w-5" />
                {t(item.key, lang)}
              </Link>
            );
          })}
          {/* AI Chatbot menu item */}
          <button
            onClick={() => setChatbotOpen(prev => !prev)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all w-full"
          >
            <MessageCircle className="h-5 w-5" />
            {lang === 'en' ? 'AI Health Chat' : 'এআই স্বাস্থ্য চ্যাট'}
          </button>
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-1">
          <Link
            to="/pricing"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === '/pricing'
                ? 'bg-[hsl(45,90%,48%)] text-[hsl(45,90%,10%)] shadow-md'
                : 'text-[hsl(45,80%,60%)] hover:bg-[hsl(45,90%,48%)]/20 hover:text-[hsl(45,90%,60%)]'
              }`}
          >
            <CreditCard className="h-4 w-4" />
            {t('pricing', lang)}
          </Link>
          <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-destructive/80 hover:bg-sidebar-accent/50 transition-all w-full">
            <LogOut className="h-4 w-4" />
            {t('logout', lang)}
          </button>
        </div>
      </aside>

      {/* Desktop Top Bar */}
      <div className="hidden md:flex fixed top-0 left-64 right-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-6 py-3 items-center justify-end gap-3">
        <ProfileSwitcher />
        <div className="flex-1" />
        <button onClick={toggleDark} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title={dark ? 'Light Mode' : 'Night Mode'}>
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button onClick={toggleLang} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title={t('language', lang)}>
          <Globe className="h-5 w-5" />
        </button>
        <NotificationBell />
        <Link to="/profile" className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title={t('profile', lang)}>
          <User className="h-5 w-5" />
        </Link>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 gradient-hero px-3 py-2.5 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-1.5 shrink-0">
          <HeartPulse className="h-6 w-6 text-primary" />
          <span className="font-heading text-base font-bold text-primary-foreground whitespace-nowrap">Niramoy AI</span>
        </Link>
        <div className="flex items-center gap-0.5">
          <button onClick={toggleDark} className="p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button onClick={toggleLang} className="p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
            <Globe className="h-5 w-5" />
          </button>
          <NotificationBell />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-sidebar-foreground">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-foreground/50" onClick={() => setMobileOpen(false)}>
          <div className="absolute right-0 top-14 w-64 gradient-hero h-full p-4 space-y-1" onClick={e => e.stopPropagation()}>
            {navItems.map(item => {
              const isHash = item.path.includes('#');
              const basePath = item.path.split('#')[0];
              const active = isHash ? false : location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={isHash ? basePath : item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${active
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  {t(item.key, lang)}
                </Link>
              );
            })}
            {/* AI Chatbot in mobile */}
            <button
              onClick={() => { setChatbotOpen(prev => !prev); setMobileOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-all w-full"
            >
              <MessageCircle className="h-5 w-5" />
              {lang === 'en' ? 'AI Health Chat' : 'এআই স্বাস্থ্য চ্যাট'}
            </button>
            <div className="border-t border-sidebar-border mt-2 pt-2 space-y-1">
              <Link
                to="/pricing"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[hsl(45,80%,60%)] hover:bg-[hsl(45,90%,48%)]/20 transition-all"
              >
                <CreditCard className="h-5 w-5" />
                {t('pricing', lang)}
              </Link>
              <button onClick={signOut} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive/80 hover:bg-sidebar-accent/50 transition-all w-full">
                <LogOut className="h-5 w-5" />
                {t('logout', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 md:ml-64 min-h-screen overflow-x-hidden">
        {/* Family Member Banner */}
        {isViewingFamily && activeMember && (
          <div className="sticky top-14 md:top-14 z-10 bg-accent/15 border-b border-accent/30 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeMember.avatar_emoji}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {lang === 'en' ? `Viewing as: ${activeMember.name}` : `দেখছেন: ${activeMember.name}`}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {lang === 'en' ? 'Family member profile' : 'পরিবারের সদস্যের প্রোফাইল'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { clearActiveMember(); navigate('/family'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {lang === 'en' ? 'Back to Me' : 'নিজের প্রোফাইলে'}
            </button>
          </div>
        )}
        <div className={`${isViewingFamily ? 'pt-4' : 'pt-16'} md:pt-14 pb-6`}>
          {children}
        </div>
        <footer className="md:ml-0 px-6 py-4 border-t border-border bg-muted/50">
          <div className="flex items-start gap-2 max-w-4xl mx-auto">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{t('disclaimer', lang)}</p>
          </div>
        </footer>
      </main>

      {/* AI Health Chatbot */}
      <HealthChatbot externalOpen={chatbotOpen} onExternalToggle={() => setChatbotOpen(false)} />
    </div>
  );
}
