"use client";

import { CommandPalette } from "@douglas/ui";
import type {
  CommandPaletteGroupData,
  CommandPaletteItemData,
} from "@douglas/ui";
import { useCommandPalette } from "./useCommandPalette";
import { useCommandPaletteShortcuts } from "./useCommandPaletteShortcuts";
import type {
  CommandPaletteGroup,
  CommandPaletteItem,
} from "./types";

function toUiItem(item: CommandPaletteItem): CommandPaletteItemData {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    keywords: item.keywords,
    shortcut: item.shortcut,
    icon: item.icon,
    disabled: item.status !== "available",
  };
}

function toUiGroup(group: CommandPaletteGroup): CommandPaletteGroupData {
  return {
    id: group.id,
    label: group.label,
    items: group.items.map(toUiItem),
  };
}

export function CommandPaletteRoot() {
  const { isOpen, query, groups, close, setQuery, previewItem } =
    useCommandPalette();

  useCommandPaletteShortcuts();

  return (
    <CommandPalette
      open={isOpen}
      query={query}
      groups={groups.map(toUiGroup)}
      title="Douglas Command Palette"
      description="Infraestrutura preparada para páginas, agentes, projetos, comandos e IA."
      footer={<CommandPaletteFooter />}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      onQueryChange={setQuery}
      onSelectItem={(item) => {
        const sourceItem = groups
          .flatMap((group) => group.items)
          .find((candidate) => candidate.id === item.id);

        if (sourceItem) previewItem(sourceItem);
      }}
    />
  );
}

function CommandPaletteFooter() {
  return (
    <div className="flex flex-col gap-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)] sm:flex-row sm:items-center sm:justify-between">
      <span>⌘K / Ctrl+K para abrir. Esc para fechar.</span>
      <span>Execução, navegação e IA entram em sprints futuras.</span>
    </div>
  );
}
