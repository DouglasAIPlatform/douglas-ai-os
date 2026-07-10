/** Categorias de changelog (estrutura inspirada em Keep a Changelog). */
export type ReleaseChangeCategory =
  | "Added"
  | "Changed"
  | "Fixed"
  | "Security"
  | "Deprecated"
  | "Removed";

export const RELEASE_CHANGE_CATEGORIES: readonly ReleaseChangeCategory[] = [
  "Added",
  "Changed",
  "Fixed",
  "Security",
  "Deprecated",
  "Removed",
] as const;

export interface ReleaseChange {
  category: ReleaseChangeCategory;
  description: string;
}
