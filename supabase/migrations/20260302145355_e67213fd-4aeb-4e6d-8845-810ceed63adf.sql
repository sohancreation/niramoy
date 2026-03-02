CREATE OR REPLACE FUNCTION public.try_use_coupon(
  _coupon_code TEXT,
  _now TIMESTAMPTZ
)
RETURNS TABLE (coupon_id UUID, discount_percent INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE coupon_codes
  SET used_count = used_count + 1
  WHERE code = _coupon_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > _now)
    AND (max_uses IS NULL OR used_count < max_uses)
  RETURNING id AS coupon_id, coupon_codes.discount_percent;
END;
$$;