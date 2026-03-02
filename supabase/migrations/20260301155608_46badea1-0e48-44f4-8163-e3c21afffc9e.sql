
-- Subscriptions table for plan management
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'premium')),
  payment_method TEXT CHECK (payment_method IN ('bkash', 'nagad')),
  payment_number TEXT,
  transaction_id TEXT,
  contact_number TEXT,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'BDT',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  coupon_code TEXT,
  xp_discount_percent INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Coupon codes table
CREATE TABLE public.coupon_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active coupons" ON public.coupon_codes FOR SELECT USING (is_active = true);
