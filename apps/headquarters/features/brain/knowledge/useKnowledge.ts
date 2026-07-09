"use client";

import { useContext } from "react";
import { KnowledgeContext } from "./KnowledgeContext";

export function useKnowledge() {
  const context = useContext(KnowledgeContext);

  if (!context) {
    throw new Error("useKnowledge must be used inside KnowledgeProvider.");
  }

  return context;
}
