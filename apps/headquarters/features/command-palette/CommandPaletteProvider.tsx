"use client";

import type { ReactNode } from "react";
import { createContext, useMemo, useState } from "react";
import { useDemoData } from "@douglas/demo-data";
import { buildCommandPaletteRegistry } from "./registry";
import { filterCommandPaletteGroups } from "./search";
import type { CommandPaletteGroup, CommandPaletteItem } from "./types";

export interface CommandPaletteContextValue {
  isOpen: boolean;
  query: string;
  groups: CommandPaletteGroup[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  previewItem: (item: CommandPaletteItem) => void;
}

export const CommandPaletteContext =
  createContext<CommandPaletteContextValue | null>(null);

interface CommandPaletteProviderProps {
  children: ReactNode;
}

export function CommandPaletteProvider({
  children,
}: CommandPaletteProviderProps) {
  const { isSourceEnabled } = useDemoData();
  const widgetMocksEnabled = isSourceEnabled("widget_mocks");
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const groups = useMemo(
    () =>
      filterCommandPaletteGroups(
        buildCommandPaletteRegistry(widgetMocksEnabled).groups,
        query,
      ),
    [query, widgetMocksEnabled],
  );

  const value = useMemo<CommandPaletteContextValue>(
    () => ({
      isOpen,
      query,
      groups,
      open: () => setIsOpen(true),
      close: () => {
        setIsOpen(false);
        setQuery("");
      },
      toggle: () => setIsOpen((currentValue) => !currentValue),
      setQuery,
      previewItem: () => {
        // Reserved for future execution/navigation/AI orchestration.
      },
    }),
    [groups, isOpen, query],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}
