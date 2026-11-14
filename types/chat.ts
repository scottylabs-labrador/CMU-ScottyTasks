import type { HabitSaveData } from "@/constants/habits";

export type ChatRole = "user" | "assistant";

export type ChatIntent = "query" | "support" | "mixed" | "general" | "crisis";

export type PendingActionStatus = "pending" | "confirmed" | "dismissed";

export type PendingChatAction =
  | {
      type: "create_task";
      summaryLabel: string;
      payload: {
        text: string;
        course: string;
        priority: "high" | "medium" | "low";
        tag: string;
        dueDate: string;
        dueTime: string;
        xp: number;
      };
    }
  | {
      type: "create_habit";
      summaryLabel: string;
      payload: HabitSaveData;
    }
  | {
      type: "complete_task";
      summaryLabel: string;
      payload: {
        taskId: string;
        taskText: string;
        xp: number;
      };
    }
  | {
      type: "complete_habit";
      summaryLabel: string;
      payload: {
        habitId: string;
        habitTitle: string;
        xp: number;
      };
    }
  | {
      type: "pet_scotty";
      summaryLabel: string;
      payload: Record<string, never>;
    };

export interface ChatToolSummary {
  toolsUsed: string[];
  matchedTasksCount?: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  intent?: ChatIntent;
  toolSummary?: ChatToolSummary | null;
  pendingAction?: PendingChatAction | null;
  actionStatus?: PendingActionStatus;
}

export interface SendChatMessageInput {
  role: ChatRole;
  content: string;
}

export interface SendChatResponse {
  reply: string;
  intent: ChatIntent;
  toolSummary: ChatToolSummary | null;
  pendingAction: PendingChatAction | null;
}
