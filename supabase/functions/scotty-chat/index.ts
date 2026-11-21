import { createClient } from "@supabase/supabase-js";
import {
  localDateKey,
  resolveLocalToday,
  shiftLocalDays,
  type RawHabitEntryRow,
  type RawHabitRow,
  type RawTaskRow,
} from "./dateUtils.ts";
import { runGeminiConversation, UpstreamModelError, type IncomingChatMessage } from "./gemini.ts";
import { buildCrisisReply, detectCrisisSignals } from "./safety.ts";
import { buildUserSnapshot, type ActivityClaimRow, type ProfileRow, type ShopItemRow } from "./tools.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_HISTORY_TURNS = 16;
const MAX_LATEST_MESSAGE_CHARS = 1500;
const MAX_HISTORY_MESSAGE_CHARS = 2000;
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function parseValidatedMessages(raw: unknown): IncomingChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const trimmedWindow = raw.slice(-MAX_HISTORY_TURNS);
  const validated: IncomingChatMessage[] = [];

  for (let i = 0; i < trimmedWindow.length; i += 1) {
    const item = trimmedWindow[i];
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const cleaned = content.trim();
    if (!cleaned) return null;
    const maxLen = i === trimmedWindow.length - 1 ? MAX_LATEST_MESSAGE_CHARS : MAX_HISTORY_MESSAGE_CHARS;
    validated.push({
      role,
      content: cleaned.slice(0, maxLen),
    });
  }

  if (validated.length === 0 || validated[validated.length - 1].role !== "user") {
    return null;
  }
  return validated;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Sign in required to chat with Scotty." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey =
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse({ error: "Server Supabase configuration missing." }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return jsonResponse({ error: "Your session has expired. Please sign in again." }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Invalid JSON request body." }, 400);
  }

  const messages = parseValidatedMessages(body.messages);
  if (!messages) {
    return jsonResponse({ error: "Messages must end with a non-empty user message." }, 400);
  }

  const latestUserMessage = messages[messages.length - 1].content;
  if (detectCrisisSignals(latestUserMessage).isCrisis) {
    return jsonResponse({
      reply: buildCrisisReply(),
      intent: "crisis",
      toolSummary: null,
      pendingAction: null,
    });
  }

  const { data: limitData, error: limitError } = await supabase.rpc("check_chat_rate_limit", {
    p_max_requests: 30,
    p_window_seconds: 3600,
  });
  if (limitError) {
    return jsonResponse({ error: "Could not verify chat rate limit." }, 500);
  }
  if (limitData && limitData.allowed === false) {
    return jsonResponse(
      {
        error: "Scotty needs a quick breather! Please wait a little bit before sending more messages.",
        retryAfterSeconds: limitData.retryAfterSeconds ?? 60,
      },
      429,
    );
  }

  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    return jsonResponse({ error: "GEMINI_API_KEY is not configured in Edge Function secrets." }, 500);
  }
  const geminiModel = Deno.env.get("GEMINI_MODEL") || DEFAULT_GEMINI_MODEL;

  const localDate = typeof body.localDate === "string" ? body.localDate : undefined;
  const timezone = typeof body.timezone === "string" ? body.timezone : undefined;
  const currentTab = typeof body.currentTab === "string" ? body.currentTab : undefined;
  const localToday = resolveLocalToday(localDate, timezone);
  const lookbackStart = localDateKey(shiftLocalDays(localToday, -365));

  const [profileRes, tasksRes, habitsRes, entriesRes, shopRes, claimsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("tasks")
      .select("id, text, course, priority, tag, dueDate, dueTime, xp, done, rewarded, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("habits")
      .select(
        "id, category, tracking, title, description, unit, goal, goal_condition, icon, color, step, starts_on, ends_on, priority, archived",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("habit_entries")
      .select("habit_id, day, value, goal, note")
      .eq("user_id", user.id)
      .gte("day", lookbackStart),
    supabase.from("shop_items").select("id, category, price"),
    supabase.from("activity_claims").select("kind, activity_id, period").eq("user_id", user.id),
  ]);

  if (profileRes.error || !profileRes.data) {
    return jsonResponse({ error: "Could not load your user profile." }, 500);
  }
  if (tasksRes.error || habitsRes.error || entriesRes.error || shopRes.error || claimsRes.error) {
    return jsonResponse({ error: "Could not load your tasks or habits from the database." }, 500);
  }

  const profile = profileRes.data as ProfileRow;
  const tasks = (tasksRes.data ?? []) as RawTaskRow[];
  const habits = (habitsRes.data ?? []) as RawHabitRow[];
  const habitEntries = (entriesRes.data ?? []) as RawHabitEntryRow[];
  const shopItems = (shopRes.data ?? []) as ShopItemRow[];
  const claims = (claimsRes.data ?? []) as ActivityClaimRow[];

  const snapshot = buildUserSnapshot({
    profile,
    tasks,
    habits,
    habitEntries,
    claims,
    localToday,
  });

  try {
    const result = await runGeminiConversation({
      apiKey: geminiApiKey,
      model: geminiModel,
      messages,
      currentTab,
      toolContext: {
        tasks,
        snapshot,
        profile,
        shopItems,
        localToday,
      },
    });
    return jsonResponse(result, 200);
  } catch (err) {
    if (err instanceof UpstreamModelError && err.status === 429) {
      return jsonResponse(
        {
          error: "Scotty is getting lots of questions right now (free API limit). Please try again in a moment!",
        },
        429,
      );
    }
    return jsonResponse(
      { error: "Scotty had trouble thinking just now. Please try again." },
      502,
    );
  }
});
