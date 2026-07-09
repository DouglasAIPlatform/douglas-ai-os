"use client";

import { useContext } from "react";
import { PluginSystemContext } from "./PluginSystemContext";

export function usePlugins() {
  const context = useContext(PluginSystemContext);

  if (!context) {
    throw new Error("usePlugins must be used inside PluginProvider.");
  }

  return context;
}
