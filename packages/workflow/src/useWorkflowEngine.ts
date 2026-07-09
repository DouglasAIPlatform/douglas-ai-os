"use client";

import { useContext } from "react";
import { WorkflowContext } from "./WorkflowContext";

export function useWorkflowEngine() {
  const context = useContext(WorkflowContext);

  if (!context) {
    throw new Error("useWorkflowEngine must be used inside WorkflowProvider.");
  }

  return context;
}
