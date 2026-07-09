import type {
  MemoryRecord,
  MemorySearchQuery,
  MemorySearchResult,
} from "./MemoryTypes";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function scoreRecord(
  record: MemoryRecord,
  normalizedQuery: string,
): MemorySearchResult | null {
  if (!normalizedQuery) return null;

  const fields = {
    content: record.content,
    kind: record.kind,
    domain: record.domain,
    tier: record.tier,
    tags: record.tags.join(" "),
  };

  let score = 0;
  const matchedFields: string[] = [];

  Object.entries(fields).forEach(([field, value]) => {
    const normalizedValue = normalizeSearchText(String(value));

    if (normalizedValue === normalizedQuery) {
      score += 100;
      matchedFields.push(field);
      return;
    }

    if (normalizedValue.startsWith(normalizedQuery)) {
      score += 50;
      matchedFields.push(field);
      return;
    }

    if (normalizedValue.includes(normalizedQuery)) {
      score += 20;
      matchedFields.push(field);
    }
  });

  if (score === 0) return null;

  return {
    ...record,
    score,
    matchedFields,
  };
}

export class MemorySearch {
  search(
    records: MemoryRecord[],
    query: MemorySearchQuery = {},
  ): MemorySearchResult[] {
    const normalizedQuery = normalizeSearchText(query.text ?? "");
    const limit = query.limit ?? 20;
    const minScore = query.minScore ?? 1;

    if (!normalizedQuery) {
      return records.slice(0, limit).map((record) => ({
        ...record,
        score: 0,
        matchedFields: [],
      }));
    }

    return records
      .map((record) => scoreRecord(record, normalizedQuery))
      .filter((result): result is MemorySearchResult => Boolean(result))
      .filter((result) => result.score >= minScore)
      .sort((a, b) => b.score - a.score || a.content.localeCompare(b.content))
      .slice(0, limit);
  }
}
