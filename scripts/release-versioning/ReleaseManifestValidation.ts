import { isValidSemVer } from "./SemVer.ts";

const VERSION_HEADER_PATTERN = /^## \[([^\]]+)\]/;

export function changelogHasVersionEntry(
  changelogContent: string,
  version: string,
): boolean {
  const lines = changelogContent.split("\n");
  for (const line of lines) {
    const match = VERSION_HEADER_PATTERN.exec(line.trim());
    if (match && match[1] === version) {
      return true;
    }
  }
  return false;
}

export function changelogHasRequiredStructure(changelogContent: string): boolean {
  if (!changelogContent.includes("# Changelog")) {
    return false;
  }

  const categories = ["Added", "Changed", "Fixed", "Security", "Deprecated", "Removed"];
  return categories.some((category) => changelogContent.includes(`### ${category}`));
}

export function validateReleaseManifestShape(manifest: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const channels = ["development", "staging", "production"];
  const statuses = ["draft", "candidate", "released", "deprecated"];

  if (!manifest || typeof manifest !== "object") {
    return { valid: false, errors: ["Manifesto inválido ou ausente."] };
  }

  const record = manifest as Record<string, unknown>;

  if (typeof record.version !== "string" || !isValidSemVer(record.version)) {
    errors.push("Campo version ausente ou SemVer inválido.");
  }

  if (typeof record.channel !== "string" || !channels.includes(record.channel)) {
    errors.push("Campo channel ausente ou inválido.");
  }

  if (typeof record.platform !== "string" || !record.platform.trim()) {
    errors.push("Campo platform ausente.");
  }

  if (typeof record.status !== "string" || !statuses.includes(record.status)) {
    errors.push("Campo status ausente ou inválido.");
  }

  if (!record.metadata || typeof record.metadata !== "object") {
    errors.push("Campo metadata ausente.");
  }

  return { valid: errors.length === 0, errors };
}
