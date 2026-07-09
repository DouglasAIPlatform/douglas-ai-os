"use client";

import { useContext } from "react";
import { AgentContext } from "./AgentContext";

export function useAgentFramework() {
  const context = useContext(AgentContext);

  if (!context) {
    throw new Error("useAgentFramework must be used inside AgentProvider.");
  }

  return context;
}
