"use client";

import { useContext } from "react";
import { CoreContext } from "./CoreContext";

export function useCore() {
  const context = useContext(CoreContext);

  if (!context) {
    throw new Error("useCore must be used inside CoreProvider.");
  }

  return context;
}
