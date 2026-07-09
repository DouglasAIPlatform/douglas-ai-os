export type ConversationStatus = "active" | "archived" | "paused";

export type MessageRole = "user" | "assistant" | "system";

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  status: ConversationStatus;
  workspaceId: string;
  agentId?: string;
  messageIds: string[];
  createdAt: string;
  updatedAt: string;
}
