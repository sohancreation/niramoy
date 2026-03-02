
-- Add timeline columns to saved_plans
ALTER TABLE public.saved_plans 
ADD COLUMN IF NOT EXISTS duration_months integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS total_days_completed integer DEFAULT 0;

-- Create plan_progress table for daily feedback
CREATE TABLE public.plan_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.saved_plans(id) ON DELETE CASCADE,
  progress_date date NOT NULL DEFAULT CURRENT_DATE,
  completed_items jsonb DEFAULT '[]'::jsonb,
  feedback jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(plan_id, progress_date)
);

-- Enable RLS
ALTER TABLE public.plan_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.plan_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.plan_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.plan_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress" ON public.plan_progress FOR DELETE USING (auth.uid() = user_id);
