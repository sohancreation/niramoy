import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGamification } from '@/hooks/use-gamification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Check, X, Crown, Zap, Star, Sparkles, Gift, Tag, Phone, 
  CreditCard, Shield, ArrowRight, Percent
} from 'lucide-react';
import { toast } from 'sonner';

type PlanType = 'free' | 'pro' | 'premium';
type BillingCycle = 'monthly' | 'yearly';
type PaymentMethod = 'bkash' | 'nagad';

const PAYMENT_NUMBER = '01706028292';

const plans = {
  free: {
    name: { en: 'Basic Care', bn: 'বেসিক কেয়ার' },
    subtitle: { en: '7-Day Free Trial', bn: '৭-দিনের ফ্রি ট্রায়াল' },
    price: { monthly: 0, yearly: 0 },
    sections: {
      en: [
        { title: '🥗 Basic Diet', items: ['Auto-generated diet plan (7 days)', 'Simple meal suggestions'] },
        { title: '💪 Basic Exercise', items: ['Basic exercise suggestions (7 days)', 'No live tracking'] },
        { title: '📊 Limited Tracking', items: ['7-day health history only', 'Daily check-in (manual)'] },
        { title: '🏥 FindCare', items: ['Nearby hospitals finder'] },
        { title: '🌿 Home Remedies', items: ['View existing remedies only', 'No AI generation'] },
      ],
      bn: [
        { title: '🥗 বেসিক ডায়েট', items: ['স্বয়ংক্রিয় ডায়েট প্ল্যান (৭ দিন)', 'সাধারণ খাবার পরামর্শ'] },
        { title: '💪 বেসিক ব্যায়াম', items: ['বেসিক ব্যায়াম পরামর্শ (৭ দিন)', 'লাইভ ট্র্যাকিং নেই'] },
        { title: '📊 সীমিত ট্র্যাকিং', items: ['শুধু ৭ দিনের স্বাস্থ্য ইতিহাস', 'দৈনিক চেক-ইন (ম্যানুয়াল)'] },
        { title: '🏥 ফাইন্ডকেয়ার', items: ['নিকটস্থ হাসপাতাল খুঁজুন'] },
        { title: '🌿 ঘরোয়া প্রতিকার', items: ['শুধু বিদ্যমান প্রতিকার দেখুন', 'AI জেনারেশন নেই'] },
      ],
    },
    limitations: {
      en: ['No AI Chat', 'No MindCare', 'No PDF export', 'Trial expires after 7 days'],
      bn: ['AI চ্যাট নেই', 'মাইন্ডকেয়ার নেই', 'PDF এক্সপোর্ট নেই', '৭ দিন পর ট্রায়াল শেষ'],
    },
  },
  pro: {
    name: { en: 'HealthMate Pro', bn: 'হেলথমেট প্রো' },
    subtitle: { en: 'Most Popular ⭐', bn: 'সবচেয়ে জনপ্রিয় ⭐' },
    price: { monthly: 199, yearly: 1999 },
    sections: {
      en: [
        { title: '🥗 Advanced Diet Engine', items: ['Calorie & macro breakdown', 'Smart meal replacement', 'Budget-based food planning'] },
        { title: '💪 Interactive Workout Mode', items: ['Live workout tracking', 'XP & level system', 'Advanced routine customization', 'Weekly progress analytics'] },
        { title: '🧠 Mental Wellness Upgrade', items: ['Unlimited mood tracking', 'Journal feature', 'Guided focus sessions', 'Stress trend insights'] },
        { title: '📊 Health Analytics', items: ['1-year history', 'Progress graphs', 'Smart weekly feedback'] },
        { title: '🤖 AI Chat (10/day)', items: ['10 AI health questions per day'] },
        { title: '🌿 AI Remedies', items: ['AI-powered remedy generation'] },
      ],
      bn: [
        { title: '🥗 উন্নত ডায়েট ইঞ্জিন', items: ['ক্যালোরি ও ম্যাক্রো বিশ্লেষণ', 'স্মার্ট মিল রিপ্লেসমেন্ট', 'বাজেট-ভিত্তিক খাবার পরিকল্পনা'] },
        { title: '💪 ইন্টারেক্টিভ ওয়ার্কআউট', items: ['লাইভ ওয়ার্কআউট ট্র্যাকিং', 'XP ও লেভেল সিস্টেম', 'উন্নত রুটিন কাস্টমাইজেশন', 'সাপ্তাহিক অগ্রগতি বিশ্লেষণ'] },
        { title: '🧠 মানসিক সুস্থতা আপগ্রেড', items: ['আনলিমিটেড মুড ট্র্যাকিং', 'জার্নাল ফিচার', 'গাইডেড ফোকাস সেশন', 'স্ট্রেস ট্রেন্ড ইনসাইটস'] },
        { title: '📊 হেলথ অ্যানালিটিক্স', items: ['১ বছরের ইতিহাস', 'অগ্রগতি গ্রাফ', 'স্মার্ট সাপ্তাহিক ফিডব্যাক'] },
        { title: '🤖 AI চ্যাট (১০/দিন)', items: ['প্রতিদিন ১০টি AI স্বাস্থ্য প্রশ্ন'] },
        { title: '🌿 AI প্রতিকার', items: ['AI-চালিত প্রতিকার জেনারেশন'] },
      ],
    },
    extras: { en: ['🚫 No Ads'], bn: ['🚫 বিজ্ঞাপন মুক্ত'] },
  },
  premium: {
    name: { en: 'HealthMate AI+', bn: 'হেলথমেট AI+' },
    subtitle: { en: 'For Families & Professionals', bn: 'পরিবার ও পেশাদারদের জন্য' },
    price: { monthly: 399, yearly: 3999 },
    sections: {
      en: [
        { title: '✅ Everything in Pro +', items: [] },
        { title: '🤖 Unlimited AI Assistant', items: ['Unlimited AI Chat (Diet, Stress, Fitness)', 'Adaptive weekly plan adjustments', 'Smart behavioral nudges'] },
        { title: '👨‍👩‍👧 Family Mode', items: ['Up to 4 profiles', 'Family wellness dashboard'] },
        { title: '🧠 Advanced Insights', items: ['Burnout detection patterns', 'Stress risk alerts', 'Habit prediction'] },
        { title: '📄 Downloadable Reports', items: ['PDF export', 'Shareable health summary'] },
        { title: '⭐ Priority Support', items: ['Priority customer support'] },
      ],
      bn: [
        { title: '✅ প্রো-এর সবকিছু +', items: [] },
        { title: '🤖 আনলিমিটেড AI সহকারী', items: ['আনলিমিটেড AI চ্যাট (ডায়েট, স্ট্রেস, ফিটনেস)', 'অ্যাডাপ্টিভ সাপ্তাহিক প্ল্যান সমন্বয়', 'স্মার্ট আচরণগত নাজ'] },
        { title: '👨‍👩‍👧 ফ্যামিলি মোড', items: ['৪টি প্রোফাইল পর্যন্ত', 'ফ্যামিলি ওয়েলনেস ড্যাশবোর্ড'] },
        { title: '🧠 উন্নত ইনসাইটস', items: ['বার্নআউট ডিটেকশন প্যাটার্ন', 'স্ট্রেস রিস্ক অ্যালার্ট', 'হ্যাবিট প্রেডিকশন'] },
        { title: '📄 ডাউনলোডযোগ্য রিপোর্ট', items: ['PDF এক্সপোর্ট', 'শেয়ারযোগ্য স্বাস্থ্য সারাংশ'] },
        { title: '⭐ প্রায়োরিটি সাপোর্ট', items: ['প্রায়োরিটি কাস্টমার সাপোর্ট'] },
      ],
    },
    extras: { en: ['🚫 No Ads'], bn: ['🚫 বিজ্ঞাপন মুক্ত'] },
  },
};

export default function PricingPage() {
  const { lang } = useLang();
  const { user: authUser } = useAuth();
  const { gamification } = useGamification();
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [useXpDiscount, setUseXpDiscount] = useState(false);

  const xp = gamification?.xp || 0;
  const xpDiscountPercent = xp >= 10000 ? 20 : xp >= 1000 ? 10 : 0;

  useEffect(() => {
    if (!authUser) return;
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setCurrentSub(data));
  }, [authUser]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { action: 'validate', coupon_code: couponCode.trim().toUpperCase() },
      });
      if (error) throw error;
      if (data?.valid) {
        setCouponDiscount(data.discount_percent);
        setCouponApplied(true);
        toast.success(lang === 'en' ? `${data.discount_percent}% discount applied!` : `${data.discount_percent}% ছাড় প্রয়োগ হয়েছে!`);
      } else {
        toast.error(lang === 'en' ? (data?.error || 'Invalid coupon code!') : 'অবৈধ কুপন কোড!');
      }
    } catch {
      toast.error(lang === 'en' ? 'Failed to validate coupon' : 'কুপন যাচাই ব্যর্থ');
    }
    setCouponLoading(false);
  };

  const getDiscountedPrice = (planType: PlanType) => {
    const basePrice = plans[planType].price[billing];
    if (basePrice === 0) return 0;
    let totalDiscount = 0;
    if (couponApplied) totalDiscount += couponDiscount;
    if (useXpDiscount) totalDiscount += xpDiscountPercent;
    totalDiscount = Math.min(totalDiscount, 50); // Max 50% discount
    return Math.round(basePrice * (1 - totalDiscount / 100));
  };

  const handleSubmit = async () => {
    if (!authUser || !selectedPlan) return;
    if (!transactionId.trim()) {
      toast.error(lang === 'en' ? 'Please enter Transaction ID' : 'লেনদেন আইডি দিন');
      return;
    }
    if (!contactNumber.trim()) {
      toast.error(lang === 'en' ? 'Please enter your contact number' : 'যোগাযোগ নম্বর দিন');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: {
          action: 'subscribe',
          plan_type: selectedPlan,
          billing_cycle: billing,
          coupon_code: couponApplied ? couponCode.trim().toUpperCase() : null,
          use_xp_discount: useXpDiscount,
          transaction_id: transactionId.trim(),
          contact_number: contactNumber.trim(),
          payment_method: paymentMethod,
        },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success(lang === 'en' ? 'Payment submitted! We will verify and activate your plan shortly.' : 'পেমেন্ট জমা হয়েছে! শীঘ্রই আপনার প্ল্যান সক্রিয় করা হবে।');
        setSelectedPlan(null);
        setTransactionId('');
        setContactNumber('');
        setCouponCode('');
        setCouponDiscount(0);
        setCouponApplied(false);
        setUseXpDiscount(false);
      } else {
        throw new Error(data?.error || 'Submission failed');
      }
    } catch {
      toast.error(lang === 'en' ? 'Submission failed. Try again.' : 'জমা দিতে ব্যর্থ।');
    }
    setSubmitting(false);
  };

  const planOrder: PlanType[] = ['free', 'pro', 'premium'];
  const planColors: Record<PlanType, string> = {
    free: 'border-muted',
    pro: 'border-primary ring-2 ring-primary/20',
    premium: 'border-accent ring-2 ring-accent/20',
  };
  const planIcons: Record<PlanType, React.ReactNode> = {
    free: <Shield className="h-6 w-6 text-muted-foreground" />,
    pro: <Star className="h-6 w-6 text-primary" />,
    premium: <Crown className="h-6 w-6 text-accent" />,
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
            {lang === 'en' ? 'Choose Your Plan' : 'আপনার প্ল্যান বেছে নিন'}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {lang === 'en' ? 'Unlock premium features to supercharge your health journey' : 'আপনার স্বাস্থ্য যাত্রাকে সুপারচার্জ করতে প্রিমিয়াম ফিচার আনলক করুন'}
          </p>
        </div>

        {/* Current Plan Badge */}
        {currentSub && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-sm px-4 py-2 gap-2">
              <Check className="h-4 w-4" />
              {lang === 'en' ? `Current Plan: ${plans[currentSub.plan_type as PlanType]?.name.en}` : `বর্তমান প্ল্যান: ${plans[currentSub.plan_type as PlanType]?.name.bn}`}
            </Badge>
          </div>
        )}

        {/* XP Discount Banner */}
        {xpDiscountPercent > 0 && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center gap-3 text-center justify-center">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-foreground">
              {lang === 'en' 
                ? `🎉 You have ${xp} XP! You can get ${xpDiscountPercent}% discount on any plan!` 
                : `🎉 আপনার ${xp} XP আছে! যেকোনো প্ল্যানে ${xpDiscountPercent}% ছাড় পেতে পারেন!`}
            </span>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center">
          <div className="bg-muted rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                billing === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {lang === 'en' ? 'Monthly' : 'মাসিক'}
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                billing === 'yearly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {lang === 'en' ? 'Yearly' : 'বার্ষিক'}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {lang === 'en' ? 'Save 16%' : '১৬% সাশ্রয়'}
              </Badge>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planOrder.map(planType => {
            const plan = plans[planType];
            const price = plan.price[billing];
            const isPopular = planType === 'pro';
            return (
              <Card key={planType} className={`relative overflow-hidden transition-all hover:shadow-lg ${planColors[planType]}`}>
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    {lang === 'en' ? '🔥 POPULAR' : '🔥 জনপ্রিয়'}
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-2">{planIcons[planType]}</div>
                  <CardTitle className="font-heading text-xl">{plan.name[lang]}</CardTitle>
                  {'subtitle' in plan && (
                    <p className="text-xs text-muted-foreground font-medium">{(plan as any).subtitle[lang]}</p>
                  )}
                  <div className="mt-3">
                    {price === 0 ? (
                      <p className="text-3xl font-heading font-bold text-foreground">
                        {lang === 'en' ? 'Free' : 'বিনামূল্যে'}
                      </p>
                    ) : (
                      <div>
                        <p className="text-3xl font-heading font-bold text-foreground">
                          ৳{price}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          /{billing === 'monthly' ? (lang === 'en' ? 'month' : 'মাস') : (lang === 'en' ? 'year' : 'বছর')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.sections[lang].map((section: any, si: number) => (
                    <div key={si}>
                      <p className="text-xs font-bold text-foreground mb-1">{section.title}</p>
                      {section.items.map((item: string, ii: number) => (
                        <div key={ii} className="flex items-start gap-2 text-sm ml-1">
                          <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                          <span className="text-foreground text-xs">{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {'extras' in plan && (plan as any).extras[lang].map((e: string, i: number) => (
                    <div key={`e-${i}`} className="flex items-start gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                      <span className="text-foreground text-xs font-medium">{e}</span>
                    </div>
                  ))}
                  {'limitations' in plan && (plan as any).limitations[lang].map((l: string, i: number) => (
                    <div key={`l-${i}`} className="flex items-start gap-2 text-sm">
                      <X className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-xs">{l}</span>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  {planType === 'free' ? (
                    <Button variant="outline" className="w-full" disabled>
                      {lang === 'en' ? 'Current Plan' : 'বর্তমান প্ল্যান'}
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full ${planType === 'pro' ? 'gradient-primary border-0 text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-accent/90'}`}
                      onClick={() => setSelectedPlan(planType)}
                    >
                      {lang === 'en' ? 'Subscribe Now' : 'সাবস্ক্রাইব করুন'}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Payment Dialog */}
        <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {lang === 'en' ? 'Complete Payment' : 'পেমেন্ট সম্পন্ন করুন'}
              </DialogTitle>
              <DialogDescription>
                {selectedPlan && (
                  <span>
                    {plans[selectedPlan].name[lang]} — ৳{plans[selectedPlan].price[billing]}/{billing === 'monthly' ? (lang === 'en' ? 'mo' : 'মাস') : (lang === 'en' ? 'yr' : 'বছর')}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Payment Method */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {lang === 'en' ? 'Payment Method' : 'পেমেন্ট মেথড'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['bkash', 'nagad'] as PaymentMethod[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`p-3 rounded-xl border-2 text-center font-bold text-sm transition-all ${
                        paymentMethod === m 
                          ? m === 'bkash' ? 'border-[hsl(338,80%,50%)] bg-[hsl(338,80%,50%)]/10 text-[hsl(338,80%,50%)]' : 'border-[hsl(25,90%,50%)] bg-[hsl(25,90%,50%)]/10 text-[hsl(25,90%,50%)]'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {m === 'bkash' ? '🟪 bKash' : '🟧 Nagad'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Number Display */}
              <div className="bg-muted/50 rounded-xl p-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground">
                  {lang === 'en' ? `Send money to this ${paymentMethod} number:` : `এই ${paymentMethod} নম্বরে টাকা পাঠান:`}
                </p>
                <p className="text-xl font-heading font-bold text-foreground tracking-wider">{PAYMENT_NUMBER}</p>
                <p className="text-xs text-muted-foreground">
                  {lang === 'en' ? '(Personal Number)' : '(পার্সোনাল নম্বর)'}
                </p>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  {lang === 'en' ? 'Transaction ID *' : 'লেনদেন আইডি *'}
                </label>
                <Input
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  placeholder={lang === 'en' ? 'Enter transaction ID' : 'লেনদেন আইডি দিন'}
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  {lang === 'en' ? 'Your Contact Number *' : 'আপনার যোগাযোগ নম্বর *'}
                </label>
                <Input
                  value={contactNumber}
                  onChange={e => setContactNumber(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g. 01XXXXXXXXX' : 'যেমন: ০১XXXXXXXXX'}
                />
              </div>

              {/* Coupon Code */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {lang === 'en' ? 'Coupon Code' : 'কুপন কোড'}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value); setCouponApplied(false); setCouponDiscount(0); }}
                    placeholder={lang === 'en' ? 'Enter coupon' : 'কুপন দিন'}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={applyCoupon} 
                    disabled={couponLoading || couponApplied}
                    size="sm"
                  >
                    {couponApplied ? <Check className="h-4 w-4 text-success" /> : (lang === 'en' ? 'Apply' : 'প্রয়োগ')}
                  </Button>
                </div>
              </div>

              {/* XP Discount Toggle */}
              {xpDiscountPercent > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-2 flex-1">
                    <Zap className="h-4 w-4 text-warning shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {lang === 'en' ? `Use ${xpDiscountPercent}% XP Discount` : `${xpDiscountPercent}% XP ছাড় ব্যবহার করুন`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lang === 'en' ? `You have ${xp} XP` : `আপনার ${xp} XP আছে`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUseXpDiscount(!useXpDiscount)}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                      useXpDiscount ? 'bg-foreground' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform duration-300 ${
                      useXpDiscount ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              )}

              {/* Price Summary */}
              {selectedPlan && (
                <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{lang === 'en' ? 'Base Price' : 'মূল্য'}</span>
                    <span className="text-foreground">৳{plans[selectedPlan].price[billing]}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-sm text-success">
                      <span>{lang === 'en' ? 'Coupon Discount' : 'কুপন ছাড়'}</span>
                      <span>-{couponDiscount}%</span>
                    </div>
                  )}
                  {useXpDiscount && (
                    <div className="flex justify-between text-sm text-accent">
                      <span>{lang === 'en' ? 'XP Discount' : 'XP ছাড়'}</span>
                      <span>-{xpDiscountPercent}%</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 flex justify-between font-bold">
                    <span className="text-foreground">{lang === 'en' ? 'Total' : 'মোট'}</span>
                    <span className="text-foreground text-lg">৳{getDiscountedPrice(selectedPlan)}</span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full gradient-primary border-0 text-primary-foreground h-12 text-base"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting 
                  ? (lang === 'en' ? 'Submitting...' : 'জমা হচ্ছে...') 
                  : (lang === 'en' ? 'Submit Payment' : 'পেমেন্ট জমা দিন')}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                {lang === 'en' 
                  ? 'Your plan will be activated after payment verification (within 24 hours).' 
                  : 'পেমেন্ট যাচাইয়ের পর আপনার প্ল্যান সক্রিয় হবে (২৪ ঘণ্টার মধ্যে)।'}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
