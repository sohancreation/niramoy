import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { Heart, Utensils, Dumbbell, Leaf, MapPin, ArrowRight, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Utensils, key: 'featureDiet', descKey: 'featureDietDesc', color: 'text-primary' },
  { icon: Dumbbell, key: 'featureExercise', descKey: 'featureExerciseDesc', color: 'text-accent' },
  { icon: Leaf, key: 'featureRemedy', descKey: 'featureRemedyDesc', color: 'text-success' },
  { icon: MapPin, key: 'featureCare', descKey: 'featureCareDesc', color: 'text-info' },
];

export default function Landing() {
  const { lang, toggleLang } = useLang();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 w-full z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-primary" fill="currentColor" />
            <span className="font-heading text-xl font-bold text-foreground">{t('appName', lang)}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              <Globe className="h-4 w-4" />
              {t('language', lang)}
            </button>
            <Link to="/auth">
              <Button size="sm">{t('getStarted', lang)}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 health-badge bg-secondary text-secondary-foreground mb-6">
            <Shield className="h-3.5 w-3.5" />
            {lang === 'en' ? 'Preventive Health & Wellness' : 'প্রতিরোধমূলক স্বাস্থ্য ও সুস্থতা'}
          </div>
          <h1 className="font-heading text-5xl md:text-6xl font-800 tracking-tight text-foreground mb-6 leading-tight">
            {lang === 'en' ? (
              <>Your AI-Powered <span className="text-gradient">Health Companion</span></>
            ) : (
              <>আপনার এআই-চালিত <span className="text-gradient">স্বাস্থ্য সহচর</span></>
            )}
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('heroDesc', lang)}
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2 text-base px-8 py-6 rounded-xl gradient-primary border-0 text-primary-foreground shadow-elevated hover:opacity-90 transition-opacity">
              {t('getStarted', lang)}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-heading text-3xl font-bold text-center mb-12 text-foreground">{t('features', lang)}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map(f => (
              <div key={f.key} className="health-card flex gap-4 items-start">
                <div className="p-3 rounded-xl bg-secondary shrink-0">
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-card-foreground mb-1">{t(f.key, lang)}</h3>
                  <p className="text-sm text-muted-foreground">{t(f.descKey, lang)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto text-center">
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">{t('disclaimer', lang)}</p>
          <p className="text-xs text-muted-foreground mt-2">© 2026 Niramoy AI</p>
        </div>
      </footer>
    </div>
  );
}
