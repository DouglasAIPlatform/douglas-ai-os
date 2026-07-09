"use client";

import { useContext } from "react";
import { EventContext } from "./EventContext";

export function useEventBus() {
  const context = useContext(EventContext);

  if (!context) {
    throw new Error("useEventBus must be used inside EventProvider.");
  }

  return context;
}
