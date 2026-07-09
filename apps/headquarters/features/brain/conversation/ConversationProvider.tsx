"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { mockConversationMessages, mockConversations } from "../mocks";
import { useBrainMockState } from "../useBrainMockState";
import { ConversationContext } from "./ConversationContext";

interface ConversationProviderProps {
  children: ReactNode;
}

export function ConversationProvider({ children }: ConversationProviderProps) {
  const conversations = useBrainMockState(mockConversations);
  const messages = useBrainMockState(mockConversationMessages);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );

  const activeConversation =
    conversations.find(
      (conversation) => conversation.id === activeConversationId,
    ) ?? null;

  function getConversationById(conversationId: string) {
    return conversations.find((conversation) => conversation.id === conversationId);
  }

  function getMessagesByConversation(conversationId: string) {
    return messages.filter(
      (message) => message.conversationId === conversationId,
    );
  }

  function getConversationsByWorkspace(workspaceId: string) {
    return conversations.filter(
      (conversation) => conversation.workspaceId === workspaceId,
    );
  }

  const value = useMemo(
    () => ({
      conversations,
      messages,
      activeConversationId,
      activeConversation,
      selectConversation: setActiveConversationId,
      clearConversationSelection: () => setActiveConversationId(null),
      getConversationById,
      getMessagesByConversation,
      getConversationsByWorkspace,
    }),
    [activeConversation, activeConversationId, conversations, messages],
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}
