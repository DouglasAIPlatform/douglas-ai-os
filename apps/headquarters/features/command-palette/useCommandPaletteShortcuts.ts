"use client";

import { useEffect } from "react";
import { useCommandPalette } from "./useCommandPalette";

export function useCommandPaletteShortcuts() {
  const { close, toggle } = useCommandPalette();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isCommandPaletteShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

      if (isCommandPaletteShortcut) {
        event.preventDefault();
        toggle();
        return;
      }

      if (event.key === "Escape") {
        close();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, toggle]);
}
