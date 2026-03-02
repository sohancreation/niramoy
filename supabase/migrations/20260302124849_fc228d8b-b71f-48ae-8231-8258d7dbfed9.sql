
-- Add family_member_id column to all relevant data tables
-- NULL = main user's own data, set = data belongs to a family member

ALTER TABLE public.health_logs
ADD COLUMN family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE DEFAULT NULL;

ALTER TABLE public.saved_plans
ADD COLUMN family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE DEFAULT NULL;

ALTER TABLE public.daily_tasks
ADD COLUMN family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE DEFAULT NULL;

ALTER TABLE public.daily_health_updates
ADD COLUMN family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE DEFAULT NULL;

ALTER TABLE public.mood_logs
ADD COLUMN family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE DEFAULT NULL;

ALTER TABLE public.journal_entries
ADD COLUMN family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE DEFAULT NULL;

ALTER TABLE public.prescriptions
ADD COLUMN family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE DEFAULT NULL;

ALTER TABLE public.ai_chat_usage
ADD COLUMN family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE DEFAULT NULL;

ALTER TABLE public.plan_progress
ADD COLUMN family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE DEFAULT NULL;

ALTER TABLE public.user_gamification
ADD COLUMN family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE DEFAULT NULL;

-- Create indexes for performance
CREATE INDEX idx_health_logs_family_member ON public.health_logs(family_member_id);
CREATE INDEX idx_saved_plans_family_member ON public.saved_plans(family_member_id);
CREATE INDEX idx_daily_tasks_family_member ON public.daily_tasks(family_member_id);
CREATE INDEX idx_daily_health_updates_family_member ON public.daily_health_updates(family_member_id);
CREATE INDEX idx_mood_logs_family_member ON public.mood_logs(family_member_id);
CREATE INDEX idx_journal_entries_family_member ON public.journal_entries(family_member_id);
CREATE INDEX idx_prescriptions_family_member ON public.prescriptions(family_member_id);
CREATE INDEX idx_ai_chat_usage_family_member ON public.ai_chat_usage(family_member_id);
CREATE INDEX idx_plan_progress_family_member ON public.plan_progress(family_member_id);
CREATE INDEX idx_user_gamification_family_member ON public.user_gamification(family_member_id);
