"use client";

import { createContext } from "react";
import type { Prompt } from "../types";

export interface PromptContextValue {
  prompts: Prompt[];
  activePromptId: string | null;
  activePrompt: Prompt | null;
  selectPrompt: (promptId: string) => void;
  clearPromptSelection: () => void;
  getPromptById: (promptId: string) => Prompt | undefined;
  getPromptsByWorkspace: (workspaceId: string) => Prompt[];
}

export const PromptContext = createContext<PromptContextValue | null>(null);
