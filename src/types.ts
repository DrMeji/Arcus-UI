export const AI_MODELS = [
  { id: "arcus", label: "Arcus" },
  { id: "gemini", label: "Gemini" },
  { id: "grok", label: "Grok" },
  { id: "claude", label: "Claude" },
  { id: "gpt", label: "GPT" },
] as const;

export type AiModelId = (typeof AI_MODELS)[number]["id"];

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export type SidebarView = "main" | "projects" | "agent" | "mission-control";
