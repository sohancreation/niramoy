
-- User gamification tracking
CREATE TABLE public.user_gamification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gamification" ON public.user_gamification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gamification" ON public.user_gamification FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gamification" ON public.user_gamification FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Saved plans (diet + exercise)
CREATE TABLE public.saved_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('diet', 'exercise')),
  plan_data JSONB NOT NULL,
  goal TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans" ON public.saved_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.saved_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.saved_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.saved_plans FOR DELETE USING (auth.uid() = user_id);

-- Daily tasks
CREATE TABLE public.daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  task_type TEXT NOT NULL CHECK (task_type IN ('diet', 'exercise', 'water', 'sleep')),
  task_name TEXT NOT NULL,
  task_description TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  photo_url TEXT,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.daily_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.daily_tasks FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for task photos
INSERT INTO storage.buckets (id, name, public) VALUES ('task-photos', 'task-photos', true);

CREATE POLICY "Users can upload own task photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'task-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view task photos" ON storage.objects FOR SELECT USING (bucket_id = 'task-photos');
CREATE POLICY "Users can delete own task photos" ON storage.objects FOR DELETE USING (bucket_id = 'task-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
