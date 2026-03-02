import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sanitizedMessages = messages
      .filter((m: any) => m && (typeof m.content === "string" || Array.isArray(m.content)))
      .map((m: any) => {
        if (typeof m.content === "string") {
          return {
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content.slice(0, 4000),
          };
        } else if (Array.isArray(m.content)) {
          const validatedContent = m.content
            .filter((item: any) =>
              item && typeof item === "object" &&
              ["text", "image_url"].includes(item.type)
            )
            .slice(0, 5)
            .map((item: any) => {
              if (item.type === "text") {
                return { type: "text", text: String(item.text || "").slice(0, 4000) };
              }
              if (item.type === "image_url" && item.image_url?.url && typeof item.image_url.url === "string") {
                return { type: "image_url", image_url: { url: item.image_url.url.slice(0, 2048) } };
              }
              return null;
            })
            .filter(Boolean);
          if (validatedContent.length === 0) return null;
          return {
            role: m.role === "assistant" ? "assistant" : "user",
            content: validatedContent,
          };
        }
        return null;
      })
      .filter(Boolean);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Server configuration error");

    let userContext = "";
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await userClient.auth.getUser(token);
        const userId = user?.id;

        if (userId) {
          const adminClient = createClient(supabaseUrl, serviceRoleKey);
          const todayStr = new Date().toISOString().split("T")[0];

          const [profileRes, healthRes, prescriptionRes, trackerRes, tasksRes, plansRes, gamRes, moodRes] = await Promise.all([
            adminClient.from("profiles").select("*").eq("user_id", userId).single(),
            adminClient.from("daily_health_updates").select("*").eq("user_id", userId).order("update_date", { ascending: false }).limit(7),
            adminClient.from("prescriptions").select("*").eq("user_id", userId).eq("analysis_status", "completed").order("created_at", { ascending: false }).limit(3),
            adminClient.from("health_logs").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(7),
            adminClient.from("daily_tasks").select("*").eq("user_id", userId).eq("task_date", todayStr),
            adminClient.from("saved_plans").select("plan_type, goal, is_active, plan_data, duration_months, total_days_completed, start_date").eq("user_id", userId).eq("is_active", true),
            adminClient.from("user_gamification").select("*").eq("user_id", userId).single(),
            adminClient.from("mood_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false }).limit(7),
          ]);

          const profile = profileRes.data;
          const recentHealth = healthRes.data || [];
          const latestHealth = recentHealth[0];
          const trackerLogs = trackerRes.data || [];
          const todayTasks = tasksRes.data || [];
          const activePlans = plansRes.data || [];
          const gamification = gamRes.data;
          const moodLogs = moodRes.data || [];

          if (profile) {
            userContext = `\n\nCURRENT USER PROFILE:
- Name: ${profile.name || "User"}
- Age: ${profile.age || "unknown"}, Gender: ${profile.gender || "unknown"}
- Weight: ${profile.weight || "unknown"} kg, Height: ${profile.height || "unknown"} cm
- Activity Level: ${profile.activity_level || "unknown"}
- Medical Conditions: ${profile.medical_conditions || "none"}
- Location: ${profile.location || "unknown"}`;
          }

          // Gamification context
          if (gamification) {
            userContext += `\n\nGAMIFICATION STATUS:
- Level: ${gamification.level}, XP: ${gamification.xp}
- Current Streak: ${gamification.streak} days
- Last Active: ${gamification.last_active_date || "unknown"}`;
          }

          // Today's tasks context
          if (todayTasks.length > 0) {
            const completed = todayTasks.filter((t: any) => t.completed).length;
            const tasksByType: Record<string, { done: number; total: number; names: string[] }> = {};
            todayTasks.forEach((t: any) => {
              if (!tasksByType[t.task_type]) tasksByType[t.task_type] = { done: 0, total: 0, names: [] };
              tasksByType[t.task_type].total++;
              if (t.completed) tasksByType[t.task_type].done++;
              tasksByType[t.task_type].names.push(`${t.completed ? '✅' : '⬜'} ${t.task_name}`);
            });
            userContext += `\n\nTODAY'S DAILY TASKS (${completed}/${todayTasks.length} completed):`;
            for (const [type, data] of Object.entries(tasksByType)) {
              userContext += `\n${type.toUpperCase()} (${data.done}/${data.total}): ${data.names.join(', ')}`;
            }
          }

          // Health check-in context
          if (latestHealth) {
            userContext += `\n\nLATEST HEALTH CHECK-IN (${latestHealth.update_date}):
- Mood: ${latestHealth.mood || "not reported"}, Energy: ${latestHealth.energy_level || "?"}/5, Stress: ${latestHealth.stress_level || "?"}/5
- Sleep: ${latestHealth.sleep_hours || "?"}h, Quality: ${latestHealth.sleep_quality || "?"}/5
- Pain: ${(latestHealth.pain_areas || []).join(", ") || "none"}
- Symptoms: ${(latestHealth.symptoms || []).join(", ") || "none"}
- Notes: ${latestHealth.notes || "none"}`;
          }

          if (recentHealth.length > 1) {
            userContext += `\n\n7-DAY HEALTH TREND: ${JSON.stringify(recentHealth.map((h: any) => ({ date: h.update_date, mood: h.mood, energy: h.energy_level, stress: h.stress_level, sleep_h: h.sleep_hours })))}`;
          }

          // Mood log context
          if (moodLogs.length > 0) {
            userContext += `\n\nRECENT MOOD LOGS: ${JSON.stringify(moodLogs.map((m: any) => ({ date: m.log_date, mood: m.mood, stress: m.stress_level, note: m.note })))}`;
          }

          // Tracker logs context (weight, water, bp, sleep, exercise)
          if (trackerLogs.length > 0) {
            userContext += `\n\nHEALTH TRACKER LOGS (last 7):`;
            trackerLogs.forEach((log: any) => {
              userContext += `\n- ${log.date}: Weight=${log.weight || '?'}kg, Water=${log.water_intake || '?'} glasses, BP=${log.bp || '?'}, Sleep=${log.sleep || '?'}h, Exercise=${log.exercise ? 'Yes' : 'No'}`;
            });
            // Weight trend analysis
            const weights = trackerLogs.filter((l: any) => l.weight).map((l: any) => ({ date: l.date, w: l.weight }));
            if (weights.length >= 2) {
              const diff = weights[0].w - weights[weights.length - 1].w;
              userContext += `\nWeight trend: ${diff > 0 ? `+${diff.toFixed(1)}kg gained` : diff < 0 ? `${diff.toFixed(1)}kg lost` : 'stable'} over ${weights.length} entries`;
            }
          }

          // Active plans context
          if (activePlans.length > 0) {
            userContext += `\n\nACTIVE HEALTH PLANS:`;
            activePlans.forEach((plan: any) => {
              userContext += `\n- ${plan.plan_type.toUpperCase()} Plan: Goal="${plan.goal || 'general'}", Duration=${plan.duration_months || 1} months, Days Completed=${plan.total_days_completed || 0}`;
              if (plan.plan_data) {
                const pd = plan.plan_data;
                if (plan.plan_type === 'diet' && pd.meals) {
                  const mealSummary = Object.entries(pd.meals || {}).map(([k, v]: [string, any]) => `${k}: ${Array.isArray(v) ? v.slice(0, 3).join(', ') : '...'}`).join(' | ');
                  userContext += ` | Meals: ${mealSummary}`;
                }
                if (plan.plan_type === 'exercise' && pd.days) {
                  const daySummary = (pd.days || []).slice(0, 3).map((d: any) => `${d.name || d.day}: ${(d.exercises || []).slice(0, 2).map((e: any) => e.name || e).join(', ')}`).join(' | ');
                  userContext += ` | Routine: ${daySummary}`;
                }
              }
            });
          }

          // Prescriptions context
          const prescriptions = prescriptionRes.data || [];
          if (prescriptions.length > 0) {
            userContext += `\n\nACTIVE PRESCRIPTIONS:`;
            prescriptions.forEach((rx: any, i: number) => {
              userContext += `\nRx${i + 1} (${rx.created_at?.split('T')[0]}):`;
              if (rx.diagnosis) userContext += ` Diagnosis: ${rx.diagnosis}`;
              if (rx.medicines?.length) userContext += ` | Meds: ${rx.medicines.map((m: any) => `${m.name} ${m.dosage} (${m.frequency}, ${m.timing || ''})`).join(', ')}`;
              if (rx.dietary_restrictions?.length) userContext += ` | Diet Restrictions: ${rx.dietary_restrictions.map((d: any) => d.restriction).join(', ')}`;
              if (rx.exercise_restrictions?.length) userContext += ` | Exercise Restrictions: ${rx.exercise_restrictions.map((e: any) => e.restriction).join(', ')}`;
              if (rx.ai_summary) userContext += ` | Summary: ${rx.ai_summary.slice(0, 200)}`;
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch user context:", e);
      }
    }

    const systemPrompt = `You are Niramoy AI, a powerful, caring, and highly personalized health assistant for a Bangladeshi health app. You have FULL ACCESS to the user's complete health data below.

CORE CAPABILITIES:
1. **Personalized Health Analysis** - Analyze the user's weight trends, sleep patterns, mood history, stress levels, and provide specific insights.
2. **Diet Plan Coaching** - Reference their active diet plan, suggest meal adjustments based on their tracker data and prescription restrictions.
3. **Exercise Guidance** - Know their exercise plan, track completion, suggest modifications based on energy/stress levels.
4. **Medicine Reminders & Interactions** - Reference their prescriptions, warn about food-drug interactions, remind dosage timing.
5. **Mental Health Support** - Track mood trends, provide stress management tips, detect patterns of declining mental health.
6. **Daily Task Coaching** - Know which tasks are done/pending, motivate completion, suggest priorities.
7. **Trend Analysis** - Analyze 7-day health trends and provide actionable insights (e.g., "Your stress has been increasing over 3 days...").

RESPONSE STYLE:
- Be warm, empathetic, and proactive. Don't wait to be asked - offer insights.
- Use emojis sparingly for readability (✅ 📊 💪 🍎 💊 😴 🧠).
- Use bullet points and short paragraphs.
- Respond in the language the user writes in (English or Bangla/বাংলা), or both.
- Reference SPECIFIC data points: "Your weight went from 72kg to 71.5kg this week - great progress!" not generic advice.
- When discussing diet, use locally available Bangladeshi foods.
- For medicines, always say to consult a doctor for changes.

PROACTIVE FEATURES:
- If user hasn't completed tasks, gently remind them.
- If stress/mood trend is declining, acknowledge and suggest coping strategies.
- If weight trend doesn't match their goal, suggest plan adjustments.
- If sleep quality is poor, provide specific sleep hygiene tips.
- Cross-reference data: "Your stress was high yesterday AND you skipped exercise - try a short walk today."

SAFETY:
- You are NOT a doctor. Remind users for serious symptoms.
- For emergencies (chest pain, breathing difficulty, high fever >103°F, stroke symptoms), IMMEDIATELY tell them to call emergency services.
- Never suggest changing medication dosages.${userContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...sanitizedMessages,
        ],
        stream: true,
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
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("health-chat error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
