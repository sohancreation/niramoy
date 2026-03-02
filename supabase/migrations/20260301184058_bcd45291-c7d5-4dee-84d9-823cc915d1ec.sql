-- Allow users to insert their own notifications (for auto AI advice)
CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);