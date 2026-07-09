"use client";

import type { HandoffRelevantTransition } from "@douglas/supabase";
import { createContext, useContext } from "react";

export interface HandoffEventBridgeContextValue {
  lastRelevantTransition: HandoffRelevantTransition | null;
}

export const HandoffEventBridgeContext =
  createContext<HandoffEventBridgeContextValue | null>(null);

export function useHandoffEventBridge(): HandoffEventBridgeContextValue {
  const context = useContext(HandoffEventBridgeContext);
  return context ?? { lastRelevantTransition: null };
}
