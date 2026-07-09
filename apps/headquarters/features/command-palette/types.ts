import type { ReactNode } from "react";

export type CommandPaletteItemKind =
  | "page"
  | "agent"
  | "project"
  | "command"
  | "module"
  | "ai";

export type CommandPaletteItemStatus = "available" | "planned" | "disabled";

export interface CommandPaletteItem {
  id: string;
  kind: CommandPaletteItemKind;
  title: string;
  subtitle?: string;
  keywords: string[];
  group: string;
  icon?: ReactNode;
  href?: string;
  shortcut?: string[];
  status: CommandPaletteItemStatus;
  aiReady?: boolean;
}

export interface CommandPaletteGroup {
  id: string;
  label: string;
  items: CommandPaletteItem[];
}

export interface CommandPaletteRegistry {
  groups: CommandPaletteGroup[];
}
