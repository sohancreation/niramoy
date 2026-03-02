import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { division, district, upazilla, careType } = await req.json();

    // Input validation & sanitization
    const sanitize = (s: any, maxLen = 100) => typeof s === "string" ? s.slice(0, maxLen).replace(/[<>{}$]/g, "") : "";
    const sDistrict = sanitize(district);
    const sDivision = sanitize(division);
    const sUpazilla = sanitize(upazilla);
    const sCareType = sanitize(careType, 20);

    if (!sDistrict) {
      return new Response(JSON.stringify({ error: "District is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Server configuration error");

    const locationStr = [sUpazilla, sDistrict, sDivision].filter(Boolean).join(", ");
    
    const typeInstructions: Record<string, string> = {
      hospital: `List ONLY hospitals (government and private hospitals, medical college hospitals). Do NOT include clinics, pharmacies, diagnostic centers, or ambulance services. Every result must be a hospital.`,
      clinic: `List ONLY clinics and small healthcare centers (private clinics, specialist clinics, polyclinics). Do NOT include hospitals, pharmacies, diagnostic centers, or ambulance services. Every result must be a clinic.`,
      pharmacy: `List ONLY pharmacies and medicine shops (retail pharmacies, chain pharmacies like Lazz Pharma, Square Pharmacy outlets). Do NOT include hospitals, clinics, diagnostic centers, or ambulance services. Every result must be a pharmacy.`,
      diagnostic: `List ONLY diagnostic centers and labs (pathology labs, imaging centers, X-ray/ultrasound centers). Do NOT include hospitals, clinics, pharmacies, or ambulance services. Every result must be a diagnostic center.`,
      ambulance: `List ONLY ambulance and emergency transport services (hospital ambulances, private ambulance services, national emergency 999). Do NOT include hospitals, clinics, pharmacies, or diagnostic centers. Every result must be an ambulance/emergency service.`,
      doctor: `List ONLY individual doctors and their chambers/practices in this area. Include their specialization, chamber address, and visiting hours if known. Focus on well-known specialists and general practitioners. Every result must be a doctor's practice/chamber.`,
    };

    const validTypes = ['hospital', 'clinic', 'pharmacy', 'diagnostic', 'ambulance', 'doctor'];
    const typeFilter = sCareType && validTypes.includes(sCareType) && typeInstructions[sCareType]
      ? typeInstructions[sCareType] 
      : 'Include a diverse mix of hospitals, clinics, pharmacies, diagnostic centers, doctors, and ambulance services.';

    const typeValue = sCareType && validTypes.includes(sCareType) ? sCareType : 'mixed';

    const prompt = `You are a healthcare facility finder for Bangladesh. Find real, well-known healthcare facilities in or near "${locationStr}", Bangladesh.

CRITICAL INSTRUCTION: ${typeFilter}

Return a JSON array of 6-10 results. Each object must have:
- "name": facility/doctor name (real name if possible)
- "name_bn": name in Bangla
- "type": "${typeValue === 'mixed' ? 'one of hospital, clinic, pharmacy, ambulance, diagnostic, doctor' : careType}"
- "address": street address in English
- "address_bn": address in Bangla
- "phone": phone number (use real numbers if known, otherwise realistic Bangladesh format +880-XX-XXXXXXX)
- "emergency": boolean (true if 24/7 emergency available)
- "services": array of 2-4 key services offered (in English)
- "rating": number 1-5 (estimated quality rating)
- "notes": one short helpful note

${typeValue === 'doctor' ? 'For doctors, include specialization in services array and chamber timing in notes.' : ''}

Prioritize REAL, well-known ${typeValue === 'mixed' ? 'facilities' : typeValue + 's'} in ${district} district. If rural, include nearest major ones.

Return ONLY the JSON array, no other text.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error: " + status);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "[]";

    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) content = jsonMatch[1].trim();

    let facilities;
    try {
      facilities = JSON.parse(content);
    } catch {
      facilities = [];
    }

    return new Response(JSON.stringify({ facilities }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Find care error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
