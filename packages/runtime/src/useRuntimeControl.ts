"use client";

import { useContext } from "react";
import { RuntimeControlContext } from "./RuntimeControlContext";

export function useRuntimeControl() {
  const context = useContext(RuntimeControlContext);
  if (!context) {
    throw new Error("useRuntimeControl must be used within RuntimeControlProvider.");
  }
  return context;
}
