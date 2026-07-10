/** Status do ciclo de vida de uma release. */
export type ReleaseStatus = "draft" | "candidate" | "released" | "deprecated";

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  draft: "Rascunho",
  candidate: "Release Candidate",
  released: "Publicada",
  deprecated: "Descontinuada",
};

export function isReleaseStatus(value: string): value is ReleaseStatus {
  return value === "draft" || value === "candidate" || value === "released" || value === "deprecated";
}
