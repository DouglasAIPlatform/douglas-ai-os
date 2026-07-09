"use client";

import { useContext } from "react";
import { MemoryContext } from "./MemoryContext";

export function useMemoryEngine() {
  const context = useContext(MemoryContext);

  if (!context) {
    throw new Error("useMemoryEngine must be used inside MemoryProvider.");
  }

  return context;
}
