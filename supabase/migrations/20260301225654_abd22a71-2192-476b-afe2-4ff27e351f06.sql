
-- Mood logs table
CREATE TABLE public.mood_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT NOT NULL,
  stress_level INTEGER NOT NULL DEFAULT 3,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT mood_logs_stress_check CHECK (stress_level >= 1 AND stress_level <= 5),
  CONSTRAINT mood_logs_unique_daily UNIQUE (user_id, log_date)
);

ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mood logs" ON public.mood_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mood logs" ON public.mood_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mood logs" ON public.mood_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mood logs" ON public.mood_logs FOR DELETE USING (auth.uid() = user_id);

-- Journal entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal entries" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal entries" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal entries" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal entries" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
