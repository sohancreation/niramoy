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

    const { disease, symptoms, lang } = await req.json();

    // Input validation & sanitization
    const sanitizedDisease = typeof disease === "string" ? disease.slice(0, 200).replace(/[<>{}]/g, "") : "";
    const sanitizedSymptoms = typeof symptoms === "string" ? symptoms.slice(0, 500).replace(/[<>{}]/g, "") : "";
    const sanitizedLang = lang === "bn" ? "bn" : "en";

    if (!sanitizedDisease && !sanitizedSymptoms) {
      return new Response(JSON.stringify({ error: "Please describe your condition" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Server configuration error");

    const prompt = `You are a health advisor for a Bangladeshi health app. A user has described their health issue.

User's input:
- Disease/Condition: ${sanitizedDisease || "not specified"}
- Symptoms: ${sanitizedSymptoms || "not specified"}
- Language preference: ${sanitizedLang}

IMPORTANT: 
1. First assess the SEVERITY of the condition:
   - If it could be SERIOUS or LIFE-THREATENING (e.g., chest pain, difficulty breathing, stroke symptoms, severe bleeding, high fever >103°F, severe allergic reaction, appendicitis symptoms, kidney stones, heart attack signs), set severity to "critical" and STRONGLY urge them to see a doctor IMMEDIATELY.
   - If it's MODERATE (persistent symptoms, worsening condition), set severity to "moderate" and recommend seeing a doctor soon.
   - If it's MILD (common cold, minor aches, mild indigestion), set severity to "mild" and provide home remedies.

2. Provide your response as a JSON object with this structure:
{
  "severity": "mild" | "moderate" | "critical",
  "condition_name": { "en": "...", "bn": "..." },
  "doctor_warning": { "en": "...", "bn": "..." },
  "remedies": [
    { "en": "remedy in english", "bn": "remedy in bangla", "type": "home" | "medical" | "lifestyle" }
  ],
  "diet_tips": [
    { "en": "...", "bn": "..." }
  ],
  "avoid": [
    { "en": "...", "bn": "..." }
  ],
  "when_to_see_doctor": { "en": "...", "bn": "..." }
}

For CRITICAL conditions, provide minimal remedies and focus on the urgency of medical attention.
For MILD conditions, provide 4-6 practical home remedies using locally available ingredients in Bangladesh.
Include both traditional Bangladeshi remedies and modern approaches.

Return ONLY the JSON object, no other text.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI error: " + aiResponse.status);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "{}";
    
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) content = jsonMatch[1].trim();

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { severity: "moderate", condition_name: { en: disease, bn: disease }, remedies: [], doctor_warning: { en: content, bn: content } };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("remedy-suggest error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
