
-- Make task-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'task-photos';

-- Drop overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can view task photos" ON storage.objects;
