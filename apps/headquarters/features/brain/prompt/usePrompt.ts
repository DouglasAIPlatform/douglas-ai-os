"use client";

import { useContext } from "react";
import { PromptContext } from "./PromptContext";

export function usePrompt() {
  const context = useContext(PromptContext);

  if (!context) {
    throw new Error("usePrompt must be used inside PromptProvider.");
  }

  return context;
}
