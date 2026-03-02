
CREATE TABLE public.voice_consult_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_date timestamp with time zone NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_consult_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice usage" ON public.voice_consult_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice usage" ON public.voice_consult_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
