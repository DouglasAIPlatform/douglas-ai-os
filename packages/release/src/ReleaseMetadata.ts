import type { ReleaseChangeCategory } from "./ReleaseChange";

/** Metadados opcionais associados a uma release. */
export interface ReleaseMetadata {
  codename?: string | null;
  releasedAt?: string | null;
  preparedAt?: string | null;
  commit?: string | null;
  notes?: string | null;
}

export interface ReleaseMetadataSnapshot extends ReleaseMetadata {
  /** Resumo seguro para UI — sem paths internos ou secrets. */
  summary?: string | null;
}

/** Entrada de changelog associada a uma versão. */
export interface ReleaseChangelogEntry {
  version: string;
  date?: string | null;
  categories: Partial<Record<ReleaseChangeCategory, string[]>>;
}
