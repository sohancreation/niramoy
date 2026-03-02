import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) throw new Error("Server configuration error");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No auth header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const todayStr = new Date().toISOString().split("T")[0];

    const [profileRes, healthRes, gamRes, tasksRes, prescriptionRes, trackerRes, moodRes, plansRes] = await Promise.all([
      adminClient.from("profiles").select("*").eq("user_id", userId).single(),
      adminClient.from("daily_health_updates").select("*").eq("user_id", userId).order("update_date", { ascending: false }).limit(7),
      adminClient.from("user_gamification").select("*").eq("user_id", userId).single(),
      adminClient.from("daily_tasks").select("*").eq("user_id", userId).eq("task_date", todayStr),
      adminClient.from("prescriptions").select("medicines, dietary_restrictions, exercise_restrictions, diagnosis, ai_summary").eq("user_id", userId).eq("analysis_status", "completed").order("created_at", { ascending: false }).limit(3),
      adminClient.from("health_logs").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(7),
      adminClient.from("mood_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false }).limit(7),
      adminClient.from("saved_plans").select("plan_type, goal, is_active, duration_months, total_days_completed").eq("user_id", userId).eq("is_active", true),
    ]);

    const profile = profileRes.data;
    const recentHealth = healthRes.data || [];
    const gamification = gamRes.data;
    const todayTasks = tasksRes.data || [];
    const trackerLogs = trackerRes.data || [];
    const moodLogs = moodRes.data || [];
    const activePlans = plansRes.data || [];

    const completedTasks = todayTasks.filter((t: any) => t.completed).length;
    const totalTasks = todayTasks.length;
    const latestHealth = recentHealth[0];

    // Compute task breakdown
    const taskBreakdown: Record<string, { done: number; total: number }> = {};
    todayTasks.forEach((t: any) => {
      if (!taskBreakdown[t.task_type]) taskBreakdown[t.task_type] = { done: 0, total: 0 };
      taskBreakdown[t.task_type].total++;
      if (t.completed) taskBreakdown[t.task_type].done++;
    });

    // Tracker trends
    const weights = trackerLogs.filter((l: any) => l.weight).map((l: any) => l.weight);
    const weightTrend = weights.length >= 2 ? `${(weights[0] - weights[weights.length - 1]).toFixed(1)}kg change` : "insufficient data";
    const avgWater = trackerLogs.length > 0 ? (trackerLogs.reduce((s: number, l: any) => s + (l.water_intake || 0), 0) / trackerLogs.length).toFixed(1) : "no data";
    const avgSleep = trackerLogs.length > 0 ? (trackerLogs.reduce((s: number, l: any) => s + (l.sleep || 0), 0) / trackerLogs.length).toFixed(1) : "no data";
    const exerciseDays = trackerLogs.filter((l: any) => l.exercise).length;

    // Mood trend analysis
    const moodTrend = moodLogs.length >= 3 
      ? `Recent moods: ${moodLogs.slice(0, 5).map((m: any) => m.mood).join(' → ')}, Avg stress: ${(moodLogs.reduce((s: number, m: any) => s + m.stress_level, 0) / moodLogs.length).toFixed(1)}/5`
      : "insufficient mood data";

    const prompt = `You are a health advisor for Niramoy AI, a Bangladeshi health app. Generate 5-7 HIGHLY PERSONALIZED, ACTIONABLE health suggestions based on ALL the data below. Each suggestion should reference SPECIFIC data points from the user's logs.

CATEGORIZE each suggestion with one of: diet, exercise, mindcare, tracker, medicine, sleep, general

User Profile:
- Name: ${profile?.name || "User"}, Age: ${profile?.age || "?"}, Gender: ${profile?.gender || "?"}
- Weight: ${profile?.weight || "?"} kg, Height: ${profile?.height || "?"} cm
- Activity: ${profile?.activity_level || "?"}, Medical: ${profile?.medical_conditions || "none"}

Gamification: Level ${gamification?.level || 1}, XP: ${gamification?.xp || 0}, Streak: ${gamification?.streak || 0} days

Today's Tasks: ${completedTasks}/${totalTasks} done
${Object.entries(taskBreakdown).map(([type, data]) => `- ${type}: ${data.done}/${data.total}`).join('\n')}

Active Plans: ${activePlans.map((p: any) => `${p.plan_type}(goal: ${p.goal || '?'}, ${p.total_days_completed || 0} days done)`).join(', ') || 'none'}

${latestHealth ? `Latest Check-in (${latestHealth.update_date}):
Mood: ${latestHealth.mood || "?"}, Energy: ${latestHealth.energy_level || "?"}/5, Stress: ${latestHealth.stress_level || "?"}/5
Sleep: ${latestHealth.sleep_hours || "?"}h (quality ${latestHealth.sleep_quality || "?"}/5)
Pain: ${(latestHealth.pain_areas || []).join(", ") || "none"}, Symptoms: ${(latestHealth.symptoms || []).join(", ") || "none"}` : "No health check-in today yet."}

7-Day Trends:
- Health: ${JSON.stringify(recentHealth.map((h: any) => ({ d: h.update_date, mood: h.mood, energy: h.energy_level, stress: h.stress_level })))}
- Weight Trend: ${weightTrend}
- Avg Water: ${avgWater} glasses/day, Avg Sleep: ${avgSleep}h/day
- Exercise days (last 7): ${exerciseDays}/7
- Mood Trend: ${moodTrend}

Prescriptions: ${(prescriptionRes.data || []).length > 0 ? (prescriptionRes.data || []).map((rx: any) => `Diagnosis: ${rx.diagnosis || '?'}, Meds: ${(rx.medicines || []).map((m: any) => `${m.name} (${m.timing || '?'})`).join(', ')}, Diet restrictions: ${(rx.dietary_restrictions || []).map((d: any) => d.restriction).join(', ') || 'none'}`).join(' | ') : 'none'}

IMPORTANT GUIDELINES:
- Reference SPECIFIC numbers: "Your stress was 4/5 yesterday - try breathing exercises"
- Cross-reference data: "You slept only 5h and your energy is 2/5 - prioritize sleep tonight"
- If on medication, include medicine-aware suggestions
- Suggest Bangladeshi foods and local practices
- For declining trends, be proactive: "Your mood has been declining for 3 days..."
- Include motivational comments about streaks/XP

Format as JSON array. Each item must have: "en" (English), "bn" (Bangla), "category" (diet/exercise/mindcare/tracker/medicine/sleep/general), "priority" (high/medium/low)
Return ONLY the JSON array.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error: " + status);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "[]";
    
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) content = jsonMatch[1].trim();

    let suggestions;
    try {
      suggestions = JSON.parse(content);
    } catch {
      suggestions = [{ en: content, bn: content, category: "general", priority: "medium" }];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI suggestion error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
