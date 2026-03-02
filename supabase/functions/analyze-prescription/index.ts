import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, prescriptionId } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Verify prescription ownership if prescriptionId provided
    if (prescriptionId) {
      const { data: prescription } = await adminClient
        .from("prescriptions")
        .select("user_id")
        .eq("id", prescriptionId)
        .single();
      if (!prescription || prescription.user_id !== user.id) {
        throw new Error("Forbidden: not your prescription");
      }
    }

    // Get user profile for context
    let userContext = "";
    try {
      const { data: profile } = await adminClient.from("profiles").select("*").eq("user_id", user.id).single();
      if (profile) {
        userContext = `\nUser Profile: Age ${profile.age}, Gender ${profile.gender}, Weight ${profile.weight}kg, Height ${profile.height}cm, Activity Level: ${profile.activity_level}, Medical Conditions: ${profile.medical_conditions || 'none'}`;
      }
    } catch (e) {
      console.error("Failed to get user context:", e);
    }

    const systemPrompt = `You are a medical prescription analyzer for a Bangladeshi health app. Analyze the prescription image and extract structured information.

IMPORTANT: You must call the "extract_prescription" function with the extracted data. Be thorough and accurate.
${userContext}

Guidelines:
- Extract doctor name, diagnosis, and all medicines with dosage and schedule
- Identify any dietary restrictions or recommendations implied by the medicines/diagnosis
- Identify any exercise restrictions or recommendations
- Provide a clear summary in both English and Bangla
- For each medicine, specify: name, dosage, frequency (e.g., "3 times daily"), duration, timing (before/after meals), and any special instructions
- Consider drug interactions and common side effects when suggesting dietary changes
- If you cannot read parts of the prescription, mention that clearly`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this prescription image. Extract all medicines, dosages, schedules, and provide dietary/exercise recommendations based on the prescription." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_prescription",
              description: "Extract structured prescription data",
              parameters: {
                type: "object",
                properties: {
                  doctor_name: { type: "string", description: "Doctor's name from the prescription" },
                  diagnosis: { type: "string", description: "Diagnosis or condition mentioned" },
                  medicines: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        dosage: { type: "string" },
                        frequency: { type: "string", description: "e.g., '3 times daily', 'twice daily'" },
                        duration: { type: "string", description: "e.g., '7 days', '2 weeks'" },
                        timing: { type: "string", description: "e.g., 'after meals', 'before breakfast'" },
                        instructions: { type: "string", description: "Any special instructions" },
                      },
                      required: ["name", "dosage", "frequency"],
                    },
                  },
                  dietary_restrictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        restriction: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["restriction", "reason"],
                    },
                  },
                  exercise_restrictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        restriction: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["restriction", "reason"],
                    },
                  },
                  summary_en: { type: "string", description: "Summary in English" },
                  summary_bn: { type: "string", description: "Summary in Bangla" },
                },
                required: ["medicines", "summary_en", "summary_bn"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_prescription" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI service error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured data");
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    // Update the prescription record
    if (prescriptionId) {
      await adminClient.from("prescriptions").update({
        doctor_name: extracted.doctor_name || null,
        diagnosis: extracted.diagnosis || null,
        medicines: extracted.medicines || [],
        dietary_restrictions: extracted.dietary_restrictions || [],
        exercise_restrictions: extracted.exercise_restrictions || [],
        ai_summary: extracted.summary_en,
        raw_analysis: extracted,
        analysis_status: "completed",
      }).eq("id", prescriptionId);
    }

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-prescription error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
