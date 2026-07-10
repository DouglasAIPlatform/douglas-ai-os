import manifestJson from "../../../release/manifest.json";
import type { ReleaseManifest } from "./ReleaseManifest";
import { isReleaseChannel } from "./ReleaseChannel";
import { isReleaseStatus } from "./ReleaseStatus";
import { isValidSemVer } from "./ReleaseVersion";

/** Manifesto embutido — espelha `release/manifest.json` (fonte única). */
export const EMBEDDED_RELEASE_MANIFEST = manifestJson as ReleaseManifest;

export const OFFICIAL_PLATFORM_VERSION = EMBEDDED_RELEASE_MANIFEST.version;

export function resolveEmbeddedReleaseManifest(): ReleaseManifest {
  return { ...EMBEDDED_RELEASE_MANIFEST, metadata: { ...EMBEDDED_RELEASE_MANIFEST.metadata } };
}

export function validateReleaseManifestShape(
  manifest: unknown,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== "object") {
    return { valid: false, errors: ["Manifesto inválido ou ausente."] };
  }

  const record = manifest as Record<string, unknown>;

  if (typeof record.version !== "string" || !isValidSemVer(record.version)) {
    errors.push("Campo version ausente ou SemVer inválido.");
  }

  if (typeof record.channel !== "string" || !isReleaseChannel(record.channel)) {
    errors.push("Campo channel ausente ou inválido.");
  }

  if (typeof record.platform !== "string" || !record.platform.trim()) {
    errors.push("Campo platform ausente.");
  }

  if (typeof record.status !== "string" || !isReleaseStatus(record.status)) {
    errors.push("Campo status ausente ou inválido.");
  }

  if (!record.metadata || typeof record.metadata !== "object") {
    errors.push("Campo metadata ausente.");
  }

  return { valid: errors.length === 0, errors };
}
