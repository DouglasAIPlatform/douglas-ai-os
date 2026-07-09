"use client";

import { useContext } from "react";
import { DOSContext } from "./DOSContext";

export function useDOS() {
  const context = useContext(DOSContext);

  if (!context) {
    throw new Error("useDOS must be used inside DOSProvider.");
  }

  return context;
}
