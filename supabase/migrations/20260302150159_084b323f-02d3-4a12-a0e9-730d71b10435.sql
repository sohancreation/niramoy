-- Allow admins to view all family members
CREATE POLICY "Admins can view all family members"
ON public.family_members
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));