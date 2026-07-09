"use client";

import { createContext } from "react";
import type { Conversation, ConversationMessage } from "../types";

export interface ConversationContextValue {
  conversations: Conversation[];
  messages: ConversationMessage[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  selectConversation: (conversationId: string) => void;
  clearConversationSelection: () => void;
  getConversationById: (conversationId: string) => Conversation | undefined;
  getMessagesByConversation: (conversationId: string) => ConversationMessage[];
  getConversationsByWorkspace: (workspaceId: string) => Conversation[];
}

export const ConversationContext = createContext<ConversationContextValue | null>(
  null,
);
