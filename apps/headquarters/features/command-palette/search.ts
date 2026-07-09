import type { CommandPaletteGroup, CommandPaletteItem } from "./types";

function matchesItem(item: CommandPaletteItem, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;

  const searchable = [
    item.title,
    item.subtitle,
    item.kind,
    item.group,
    ...item.keywords,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

export function filterCommandPaletteGroups(
  groups: CommandPaletteGroup[],
  query: string,
): CommandPaletteGroup[] {
  const normalizedQuery = query.trim().toLowerCase();

  return groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => matchesItem(item, normalizedQuery)),
  }));
}
