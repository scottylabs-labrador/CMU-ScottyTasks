import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHabits } from "@/contexts/HabitsContext";
import { useTasks } from "@/contexts/TasksContext";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import { sendScottyChatMessage } from "@/services/chatService";
import type { ChatMessage } from "@/types/chat";

export interface UseScottyChatReturn {
  isAuthenticated: boolean;
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  messages: ChatMessage[];
  isSending: boolean;
  error: string | null;
  clearError: () => void;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  confirmPendingAction: (messageId: string) => Promise<void>;
  dismissPendingAction: (messageId: string) => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "scotty-welcome",
  role: "assistant",
  content:
    "Hi! I'm Scotty. Ask me about your tasks, deadlines, habits, XP, or shop items—or just vent if today feels heavy.",
  createdAt: 0,
  intent: "general",
};

function useScottyChatState(): UseScottyChatReturn {
  const { user } = useAuth();
  const { createTask, setTaskCompletedById } = useTasks();
  const { createHabit, setHabitCompletedById } = useHabits();
  const { petScotty } = useUserShopProfile();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("scotty");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [WELCOME_MESSAGE]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendingRef = useRef(false);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);
  const clearError = useCallback(() => setError(null), []);

  const clearChat = useCallback(() => {
    setMessages([{ ...WELCOME_MESSAGE, createdAt: Date.now() }]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed || sendingRef.current) return;
      if (!user) {
        setError("Please sign in to chat with Scotty.");
        return;
      }

      sendingRef.current = true;
      setIsSending(true);
      setError(null);

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };

      const historyPayload = [...messagesRef.current, userMessage]
        .filter((m) => m.id !== WELCOME_MESSAGE.id)
        .map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await sendScottyChatMessage({
          messages: historyPayload,
          currentTab: activeTab,
        });

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.reply,
          createdAt: Date.now(),
          intent: response.intent,
          toolSummary: response.toolSummary,
          pendingAction: response.pendingAction,
          actionStatus: response.pendingAction ? "pending" : undefined,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Could not reach Scotty right now. Please try again.";
        setError(message);
      } finally {
        sendingRef.current = false;
        setIsSending(false);
      }
    },
    [user, activeTab],
  );

  const confirmPendingAction = useCallback(
    async (messageId: string) => {
      const target = messagesRef.current.find((m) => m.id === messageId);
      if (!target?.pendingAction || target.actionStatus !== "pending") return;

      const action = target.pendingAction;
      let succeeded = false;

      try {
        if (action.type === "create_task") {
          const created = await createTask(action.payload);
          succeeded = created !== null;
        } else if (action.type === "create_habit") {
          const created = await createHabit(action.payload);
          succeeded = created !== null;
        } else if (action.type === "complete_task") {
          succeeded = await setTaskCompletedById(action.payload.taskId, true);
        } else if (action.type === "complete_habit") {
          succeeded = await setHabitCompletedById(action.payload.habitId, true);
        } else if (action.type === "pet_scotty") {
          succeeded = await petScotty();
        }
      } catch {
        succeeded = false;
      }

      if (!succeeded) {
        setError("Could not complete that action. Please try directly in the tab.");
        return;
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, actionStatus: "confirmed" } : m)),
      );
    },
    [createTask, createHabit, setTaskCompletedById, setHabitCompletedById, petScotty],
  );

  const dismissPendingAction = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, actionStatus: "dismissed" } : m)),
    );
  }, []);

  return {
    isAuthenticated: !!user,
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    activeTab,
    setActiveTab,
    messages,
    isSending,
    error,
    clearError,
    sendMessage,
    clearChat,
    confirmPendingAction,
    dismissPendingAction,
  };
}

const ScottyChatContext = createContext<UseScottyChatReturn | null>(null);

function ScottyChatSession({ children }: PropsWithChildren) {
  const value = useScottyChatState();
  return <ScottyChatContext.Provider value={value}>{children}</ScottyChatContext.Provider>;
}

/**
 * Provides an in-memory, session-scoped chat context isolated per authenticated user.
 * Logging out, switching accounts, or restarting the app resets the conversation.
 */
export function ScottyChatProvider({ children }: PropsWithChildren) {
  const { user, guest } = useAuth();
  return (
    <ScottyChatSession key={user?.id ?? (guest ? "guest" : "signed-out")}>
      {children}
    </ScottyChatSession>
  );
}

/** Hook for controlling and interacting with the embedded Scotty Companion chatbot. */
export function useScottyChat(): UseScottyChatReturn {
  const value = useContext(ScottyChatContext);
  if (!value) throw new Error("useScottyChat requires ScottyChatProvider");
  return value;
}
