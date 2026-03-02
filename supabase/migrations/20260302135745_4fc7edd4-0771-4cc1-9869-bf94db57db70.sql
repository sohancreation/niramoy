
-- Fix RLS policies on all tables with family_member_id to verify ownership

-- ========== health_logs ==========
DROP POLICY IF EXISTS "Users can view own logs" ON public.health_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.health_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON public.health_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON public.health_logs;

CREATE POLICY "Users can view own logs" ON public.health_logs FOR SELECT USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = health_logs.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can insert own logs" ON public.health_logs FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = health_logs.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can update own logs" ON public.health_logs FOR UPDATE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = health_logs.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can delete own logs" ON public.health_logs FOR DELETE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = health_logs.family_member_id AND owner_id = auth.uid()))
);

-- ========== daily_tasks ==========
DROP POLICY IF EXISTS "Users can view own tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.daily_tasks;

CREATE POLICY "Users can view own tasks" ON public.daily_tasks FOR SELECT USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = daily_tasks.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can insert own tasks" ON public.daily_tasks FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = daily_tasks.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can update own tasks" ON public.daily_tasks FOR UPDATE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = daily_tasks.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can delete own tasks" ON public.daily_tasks FOR DELETE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = daily_tasks.family_member_id AND owner_id = auth.uid()))
);

-- ========== prescriptions ==========
DROP POLICY IF EXISTS "Users can view own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Users can insert own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Users can update own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Users can delete own prescriptions" ON public.prescriptions;

CREATE POLICY "Users can view own prescriptions" ON public.prescriptions FOR SELECT USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = prescriptions.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can insert own prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = prescriptions.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can update own prescriptions" ON public.prescriptions FOR UPDATE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = prescriptions.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can delete own prescriptions" ON public.prescriptions FOR DELETE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = prescriptions.family_member_id AND owner_id = auth.uid()))
);

-- ========== daily_health_updates ==========
DROP POLICY IF EXISTS "Users can view own health updates" ON public.daily_health_updates;
DROP POLICY IF EXISTS "Users can insert own health updates" ON public.daily_health_updates;
DROP POLICY IF EXISTS "Users can update own health updates" ON public.daily_health_updates;
DROP POLICY IF EXISTS "Users can delete own health updates" ON public.daily_health_updates;

CREATE POLICY "Users can view own health updates" ON public.daily_health_updates FOR SELECT USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = daily_health_updates.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can insert own health updates" ON public.daily_health_updates FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = daily_health_updates.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can update own health updates" ON public.daily_health_updates FOR UPDATE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = daily_health_updates.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can delete own health updates" ON public.daily_health_updates FOR DELETE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = daily_health_updates.family_member_id AND owner_id = auth.uid()))
);

-- ========== journal_entries ==========
DROP POLICY IF EXISTS "Users can view own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON public.journal_entries;

CREATE POLICY "Users can view own journal entries" ON public.journal_entries FOR SELECT USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = journal_entries.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can insert own journal entries" ON public.journal_entries FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = journal_entries.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can update own journal entries" ON public.journal_entries FOR UPDATE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = journal_entries.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can delete own journal entries" ON public.journal_entries FOR DELETE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = journal_entries.family_member_id AND owner_id = auth.uid()))
);

-- ========== mood_logs ==========
DROP POLICY IF EXISTS "Users can view own mood logs" ON public.mood_logs;
DROP POLICY IF EXISTS "Users can insert own mood logs" ON public.mood_logs;
DROP POLICY IF EXISTS "Users can update own mood logs" ON public.mood_logs;
DROP POLICY IF EXISTS "Users can delete own mood logs" ON public.mood_logs;

CREATE POLICY "Users can view own mood logs" ON public.mood_logs FOR SELECT USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = mood_logs.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can insert own mood logs" ON public.mood_logs FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = mood_logs.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can update own mood logs" ON public.mood_logs FOR UPDATE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = mood_logs.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can delete own mood logs" ON public.mood_logs FOR DELETE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = mood_logs.family_member_id AND owner_id = auth.uid()))
);

-- ========== saved_plans ==========
DROP POLICY IF EXISTS "Users can view own plans" ON public.saved_plans;
DROP POLICY IF EXISTS "Users can insert own plans" ON public.saved_plans;
DROP POLICY IF EXISTS "Users can update own plans" ON public.saved_plans;
DROP POLICY IF EXISTS "Users can delete own plans" ON public.saved_plans;

CREATE POLICY "Users can view own plans" ON public.saved_plans FOR SELECT USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = saved_plans.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can insert own plans" ON public.saved_plans FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = saved_plans.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can update own plans" ON public.saved_plans FOR UPDATE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = saved_plans.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can delete own plans" ON public.saved_plans FOR DELETE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = saved_plans.family_member_id AND owner_id = auth.uid()))
);

-- ========== plan_progress ==========
DROP POLICY IF EXISTS "Users can view own progress" ON public.plan_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.plan_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.plan_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON public.plan_progress;

CREATE POLICY "Users can view own progress" ON public.plan_progress FOR SELECT USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = plan_progress.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can insert own progress" ON public.plan_progress FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = plan_progress.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can update own progress" ON public.plan_progress FOR UPDATE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = plan_progress.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can delete own progress" ON public.plan_progress FOR DELETE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = plan_progress.family_member_id AND owner_id = auth.uid()))
);

-- ========== user_gamification ==========
DROP POLICY IF EXISTS "Users can view own gamification" ON public.user_gamification;
DROP POLICY IF EXISTS "Users can insert own gamification" ON public.user_gamification;
DROP POLICY IF EXISTS "Users can update own gamification" ON public.user_gamification;

CREATE POLICY "Users can view own gamification" ON public.user_gamification FOR SELECT USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = user_gamification.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can insert own gamification" ON public.user_gamification FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = user_gamification.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can update own gamification" ON public.user_gamification FOR UPDATE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = user_gamification.family_member_id AND owner_id = auth.uid()))
);

-- ========== ai_chat_usage ==========
DROP POLICY IF EXISTS "Users can view own chat usage" ON public.ai_chat_usage;
DROP POLICY IF EXISTS "Users can insert own chat usage" ON public.ai_chat_usage;
DROP POLICY IF EXISTS "Users can update own chat usage" ON public.ai_chat_usage;

CREATE POLICY "Users can view own chat usage" ON public.ai_chat_usage FOR SELECT USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = ai_chat_usage.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can insert own chat usage" ON public.ai_chat_usage FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = ai_chat_usage.family_member_id AND owner_id = auth.uid()))
);
CREATE POLICY "Users can update own chat usage" ON public.ai_chat_usage FOR UPDATE USING (
  auth.uid() = user_id AND (family_member_id IS NULL OR EXISTS (SELECT 1 FROM public.family_members WHERE id = ai_chat_usage.family_member_id AND owner_id = auth.uid()))
);
