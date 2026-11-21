import { requireSupabase } from "@/config/supabase";
import type { SendChatMessageInput, SendChatResponse } from "@/types/chat";
import { localDateKey } from "@/utils/taskDates";

const CHAT_FUNCTION_NAME = "scotty-chat";
const MAX_SENT_MESSAGES = 16;

async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  if (!error || typeof error !== "object") {
    return "Could not reach Scotty right now. Please try again.";
  }

  const maybeContext = (error as { context?: { json?: () => Promise<unknown> } }).context;
  if (maybeContext && typeof maybeContext.json === "function") {
    try {
      const payload = (await maybeContext.json()) as { error?: unknown };
      if (typeof payload?.error === "string" && payload.error.trim()) {
        return payload.error.trim();
      }
    } catch {
      // Ignore JSON parse failures and fall back to error.message.
    }
  }

  const message = (error as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }
  return "Could not reach Scotty right now. Please try again.";
}

/** Sends the bounded in-session conversation window to the `scotty-chat` Edge Function. */
export async function sendScottyChatMessage(params: {
  messages: SendChatMessageInput[];
  currentTab?: string;
}): Promise<SendChatResponse> {
  const client = requireSupabase();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { data, error } = await client.functions.invoke<SendChatResponse>(CHAT_FUNCTION_NAME, {
    body: {
      messages: params.messages.slice(-MAX_SENT_MESSAGES),
      localDate: localDateKey(new Date()),
      timezone,
      currentTab: params.currentTab,
    },
  });

  if (error) {
    throw new Error(await extractFunctionErrorMessage(error));
  }
  if (!data || typeof data.reply !== "string") {
    throw new Error("Received an unexpected reply from Scotty.");
  }

  return {
    reply: data.reply,
    intent: data.intent ?? "general",
    toolSummary: data.toolSummary ?? null,
    pendingAction: data.pendingAction ?? null,
  };
}
