"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { mockPrompts } from "../mocks";
import { useBrainMockState } from "../useBrainMockState";
import { PromptContext } from "./PromptContext";

interface PromptProviderProps {
  children: ReactNode;
}

export function PromptProvider({ children }: PromptProviderProps) {
  const prompts = useBrainMockState(mockPrompts);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);

  const activePrompt =
    prompts.find((prompt) => prompt.id === activePromptId) ?? null;

  function getPromptById(promptId: string) {
    return prompts.find((prompt) => prompt.id === promptId);
  }

  function getPromptsByWorkspace(workspaceId: string) {
    return prompts.filter((prompt) => prompt.workspaceId === workspaceId);
  }

  const value = useMemo(
    () => ({
      prompts,
      activePromptId,
      activePrompt,
      selectPrompt: setActivePromptId,
      clearPromptSelection: () => setActivePromptId(null),
      getPromptById,
      getPromptsByWorkspace,
    }),
    [activePrompt, activePromptId, prompts],
  );

  return (
    <PromptContext.Provider value={value}>{children}</PromptContext.Provider>
  );
}
