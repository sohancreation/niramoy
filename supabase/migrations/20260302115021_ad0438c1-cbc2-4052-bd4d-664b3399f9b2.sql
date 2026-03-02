
-- Table to track daily AI chat usage per user
CREATE TABLE public.ai_chat_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  question_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

ALTER TABLE public.ai_chat_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat usage"
ON public.ai_chat_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat usage"
ON public.ai_chat_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat usage"
ON public.ai_chat_usage FOR UPDATE
USING (auth.uid() = user_id);
