-- Fix payment_method constraint to allow 'admin'
ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_payment_method_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_payment_method_check 
  CHECK (payment_method = ANY (ARRAY['bkash'::text, 'nagad'::text, 'admin'::text]));

-- Fix status constraint to allow 'rejected' and 'inactive'
ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'expired'::text, 'cancelled'::text, 'rejected'::text, 'inactive'::text]));

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));