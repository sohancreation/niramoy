
-- Family members table for AI+ subscribers (up to 4 profiles)
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  weight NUMERIC,
  height NUMERIC,
  activity_level TEXT,
  medical_conditions TEXT,
  relationship TEXT NOT NULL DEFAULT 'other',
  avatar_emoji TEXT NOT NULL DEFAULT '👤',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own family members"
ON public.family_members FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own family members"
ON public.family_members FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own family members"
ON public.family_members FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own family members"
ON public.family_members FOR DELETE
USING (auth.uid() = owner_id);

CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
