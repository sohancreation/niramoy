
-- 1. Make prescriptions bucket private
UPDATE storage.buckets SET public = false WHERE id = 'prescriptions';

-- 2. Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Public can view prescriptions" ON storage.objects;

-- 3. Fix coupon codes - remove public read, add admin-only read
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupon_codes;

CREATE POLICY "Admins can manage coupons"
  ON public.coupon_codes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
