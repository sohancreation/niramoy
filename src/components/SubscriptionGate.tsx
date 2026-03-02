import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/contexts/LanguageContext';

interface SubscriptionGateProps {
  children?: React.ReactNode;
  allowed: boolean;
  featureName?: { en: string; bn: string };
  message?: { en: string; bn: string };
}

export default function SubscriptionGate({ children, allowed, featureName, message }: SubscriptionGateProps) {
  const { lang } = useLang();

  if (allowed) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 min-h-[300px]">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="h-10 w-10 text-primary" />
      </div>
      <h2 className="font-heading text-xl font-bold text-foreground">
        {featureName
          ? (lang === 'en' 
              ? `${featureName.en} requires a subscription` 
              : `${featureName.bn} এর জন্য সাবস্ক্রিপশন প্রয়োজন`)
          : (lang === 'en' ? 'Subscription Required' : 'সাবস্ক্রিপশন প্রয়োজন')
        }
      </h2>
      <p className="text-sm text-muted-foreground max-w-md">
        {message
          ? (message[lang] || message.en)
          : (lang === 'en'
              ? 'Your free trial has ended. Upgrade to continue using this feature.'
              : 'আপনার ফ্রি ট্রায়াল শেষ হয়েছে। এই ফিচারটি ব্যবহার করতে আপগ্রেড করুন।')
        }
      </p>
      <Link to="/pricing">
        <Button className="gradient-primary border-0 text-primary-foreground gap-2">
          <Crown className="h-4 w-4" />
          {lang === 'en' ? 'View Plans & Upgrade' : 'প্ল্যান দেখুন ও আপগ্রেড করুন'}
        </Button>
      </Link>
    </div>
  );
}
