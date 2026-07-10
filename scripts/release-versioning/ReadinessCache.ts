import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReleaseReadinessReport } from "../release-readiness/ReleaseReadinessReport.ts";

export const RELEASE_READINESS_CACHE_PATH = ".release/last-readiness.json";

export interface ReleaseReadinessCache {
  status: ReleaseReadinessReport["status"];
  checkedAt: string;
  passedCount: number;
  warningCount: number;
  blockingCount: number;
}

export function readReleaseReadinessCache(
  repoRoot: string,
): ReleaseReadinessCache | null {
  const cachePath = join(repoRoot, RELEASE_READINESS_CACHE_PATH);
  if (!existsSync(cachePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(cachePath, "utf8")) as ReleaseReadinessCache;
  } catch {
    return null;
  }
}

export function formatReadinessCacheSummary(cache: ReleaseReadinessCache | null): string {
  if (!cache) {
    return "N/A — execute pnpm release:check para gerar cache em .release/last-readiness.json";
  }

  return `${cache.status} (${cache.passedCount} OK, ${cache.warningCount} alertas, ${cache.blockingCount} bloqueantes) em ${cache.checkedAt}`;
}
