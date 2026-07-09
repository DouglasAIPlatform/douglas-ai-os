"use client";

import { useContext } from "react";
import { MissionControlContext } from "./MissionControlContext";

export function useMissions() {
  const context = useContext(MissionControlContext);

  if (!context) {
    throw new Error("useMissions must be used inside MissionProvider.");
  }

  return context;
}
