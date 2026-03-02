import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BLOCKED_KEYWORDS = [
  "suicide", "self-harm", "kill myself", "end my life", "hurt myself",
  "আত্মহত্যা", "নিজেকে আঘাত", "নিজেকে মেরে",
  "prescribe", "medication", "dosage", "diagnosis",
  "ওষুধ দাও", "রোগ নির্ণয়",
];

const CRISIS_RESPONSE_EN = `I'm here to support you, but I'm not a crisis service. If you're in distress, please reach out to a professional:

- **National Mental Health Helpline (BD):** 16789
- **Kaan Pete Roi:** 01779-554391

You are not alone. Please talk to someone who can help. ❤️`;

const CRISIS_RESPONSE_BN = `আমি আপনাকে সহায়তা করতে এখানে আছি, কিন্তু আমি কোনো সংকট সেবা নই। আপনি যদি কষ্টে থাকেন, দয়া করে একজন পেশাদারের সাথে যোগাযোগ করুন:

- **জাতীয় মানসিক স্বাস্থ্য হেল্পলাইন:** ১৬৭৮৯
- **কান পেতে রই:** ০১৭৭৯-৫৫৪৩৯১

আপনি একা নন। দয়া করে এমন কারো সাথে কথা বলুন যিনি সাহায্য করতে পারেন। ❤️`;

const sanitize = (s: any, maxLen = 1000) =>
  typeof s === "string" ? s.slice(0, maxLen).replace(/[<>{}$]/g, "") : "";

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

    const { messages, lang } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check last user message for crisis keywords
    const lastMsg = sanitize(messages[messages.length - 1]?.content || "", 1000).toLowerCase();
    const hasCrisis = BLOCKED_KEYWORDS.some(kw => lastMsg.includes(kw));

    if (hasCrisis) {
      return new Response(JSON.stringify({
        reply: lang === "bn" ? CRISIS_RESPONSE_BN : CRISIS_RESPONSE_EN,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const sanitizedMessages = messages.slice(-20).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: sanitize(m.content, 1000),
    }));

    const systemPrompt = `You are a compassionate MindCare emotional support companion in the Niramoy AI health app. 

Your role:
- Help with stress management, motivation, study burnout, overthinking, work pressure
- Provide calming advice and coping strategies
- Be warm, empathetic, and encouraging
- Respond in ${lang === "bn" ? "Bangla" : "English"}

You must NEVER:
- Provide medical diagnosis
- Recommend specific medications or dosages
- Act as a therapist or psychiatrist
- Encourage self-harm or dangerous behavior

If someone seems in crisis, always direct them to professional help.
Keep responses concise (under 200 words). Use a gentle, supportive tone.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...sanitizedMessages],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status, await response.text());
      return new Response(JSON.stringify({ error: "Something went wrong" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || (lang === "bn" ? "দুঃখিত, আবার চেষ্টা করুন।" : "Sorry, please try again.");

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mindcare-chat error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
