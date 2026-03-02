import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_PRICES: Record<string, Record<string, number>> = {
  pro: { monthly: 199, yearly: 1999 },
  premium: { monthly: 399, yearly: 3999 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    const { action, coupon_code, plan_type, billing_cycle, use_xp_discount, transaction_id, contact_number, payment_method } = await req.json();

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (action === "validate") {
      if (!coupon_code) {
        return new Response(JSON.stringify({ error: "No coupon code provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const sanitizedCode = coupon_code.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,20}$/.test(sanitizedCode)) {
        return new Response(JSON.stringify({ valid: false, error: "Invalid coupon format" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: coupon } = await adminClient
        .from("coupon_codes")
        .select("*")
        .eq("code", sanitizedCode)
        .eq("is_active", true)
        .maybeSingle();

      if (!coupon) {
        return new Response(JSON.stringify({ valid: false, error: "Invalid coupon code" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return new Response(JSON.stringify({ valid: false, error: "Coupon expired" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        return new Response(JSON.stringify({ valid: false, error: "Coupon usage limit reached" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ valid: true, discount_percent: coupon.discount_percent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "subscribe") {
      if (!plan_type || !billing_cycle || !PLAN_PRICES[plan_type]) {
        return new Response(JSON.stringify({ error: "Invalid plan or billing cycle" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const basePrice = PLAN_PRICES[plan_type][billing_cycle];
      if (basePrice === undefined) {
        return new Response(JSON.stringify({ error: "Invalid billing cycle" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let totalDiscount = 0;

      if (coupon_code) {
        const sanitizedCode = coupon_code.trim().toUpperCase();
        if (!/^[A-Z0-9_-]{3,20}$/.test(sanitizedCode)) {
          return new Response(JSON.stringify({ error: "Invalid coupon format" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { data: usedCoupon } = await adminClient.rpc("try_use_coupon", {
          _coupon_code: sanitizedCode,
          _now: new Date().toISOString(),
        });
        if (usedCoupon && usedCoupon.length > 0) {
          totalDiscount += usedCoupon[0].discount_percent;
        }
      }

      let xpDiscountPercent = 0;
      if (use_xp_discount) {
        const { data: gam } = await adminClient.from("user_gamification").select("xp").eq("user_id", userId).single();
        const xp = gam?.xp || 0;
        xpDiscountPercent = xp >= 10000 ? 20 : xp >= 1000 ? 10 : 0;
        totalDiscount += xpDiscountPercent;
      }

      totalDiscount = Math.min(totalDiscount, 50);
      const finalPrice = Math.round(basePrice * (1 - totalDiscount / 100));

      const now = new Date();
      const expiresAt = new Date(now);
      if (billing_cycle === "monthly") expiresAt.setMonth(expiresAt.getMonth() + 1);
      else expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const sanitizedTxId = transaction_id?.trim().replace(/[<>{}$]/g, '') || null;
      const sanitizedContact = contact_number?.trim().replace(/[<>{}$]/g, '') || null;

      const { data: sub, error: insertError } = await adminClient.from("subscriptions").insert({
        user_id: userId,
        plan_type,
        payment_method: payment_method || null,
        payment_number: "01706028292",
        transaction_id: sanitizedTxId,
        contact_number: sanitizedContact,
        amount: finalPrice,
        billing_cycle,
        coupon_code: coupon_code ? coupon_code.trim().toUpperCase().replace(/[<>{}$]/g, '') : null,
        xp_discount_percent: xpDiscountPercent,
        status: "pending",
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      }).select().single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ success: true, subscription: sub, calculated_price: finalPrice }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("validate-coupon error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
