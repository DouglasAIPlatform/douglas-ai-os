"use client";

import { useContext } from "react";
import { CommandPaletteContext } from "./CommandPaletteProvider";

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);

  if (!context) {
    throw new Error(
      "useCommandPalette must be used inside CommandPaletteProvider.",
    );
  }

  return context;
}
