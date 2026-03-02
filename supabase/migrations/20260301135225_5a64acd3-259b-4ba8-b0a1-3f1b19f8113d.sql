
-- Create daily health updates table
CREATE TABLE public.daily_health_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  update_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT, -- happy, neutral, sad, stressed
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  sleep_hours NUMERIC,
  pain_areas TEXT[], -- headache, back, joints, etc.
  symptoms TEXT[], -- fever, cough, fatigue, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, update_date)
);

ALTER TABLE public.daily_health_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health updates"
  ON public.daily_health_updates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health updates"
  ON public.daily_health_updates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health updates"
  ON public.daily_health_updates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health updates"
  ON public.daily_health_updates FOR DELETE
  USING (auth.uid() = user_id);
