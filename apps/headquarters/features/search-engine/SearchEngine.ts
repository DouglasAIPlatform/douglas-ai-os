import type {
  SearchEngineOptions,
  SearchIndex,
  SearchRecord,
  SearchResult,
} from "./types";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function scoreRecord(record: SearchRecord, normalizedQuery: string): SearchResult | null {
  if (!normalizedQuery) return null;

  const fields = {
    title: record.title,
    description: record.description,
    type: record.type,
    keywords: record.keywords.join(" "),
  };

  let score = 0;
  const matchedFields: string[] = [];

  Object.entries(fields).forEach(([field, value]) => {
    const normalizedValue = normalizeSearchText(value);

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

export class SearchEngine {
  private readonly index: SearchIndex;

  constructor(index: SearchIndex) {
    this.index = index;
  }

  search(query: string, options: SearchEngineOptions = {}): SearchResult[] {
    const normalizedQuery = normalizeSearchText(query);
    const limit = options.limit ?? 12;
    const minScore = options.minScore ?? 1;

    return this.index.records
      .map((record) => scoreRecord(record, normalizedQuery))
      .filter((result): result is SearchResult => Boolean(result))
      .filter((result) => result.score >= minScore)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, limit);
  }

  getIndex(): SearchIndex {
    return this.index;
  }
}
