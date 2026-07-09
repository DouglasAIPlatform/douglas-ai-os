"use client";

import { useContext } from "react";
import { DecisionContext } from "./DecisionContext";

export function useDecision() {
  const context = useContext(DecisionContext);

  if (!context) {
    throw new Error("useDecision must be used inside DecisionProvider.");
  }

  return context;
}
