"use client";

import { useContext } from "react";
import { OperatorContext } from "./OperatorContext";

export function useOperator() {
  const context = useContext(OperatorContext);
  if (!context) {
    throw new Error("useOperator must be used within OperatorProvider.");
  }
  return context;
}
