import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReleaseManifest } from "../../packages/release/src/ReleaseManifest.ts";
import type { VersionConsistencyReport, VersionConsistencyTarget } from "../../packages/release/src/ReleaseValidationResult.ts";

function readJsonVersion(path: string): string | null {
  if (!existsSync(path)) {
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { version?: string };
    return typeof parsed.version === "string" ? parsed.version : null;
  } catch {
    return null;
  }
}

function readPlatformVersionFromMockData(path: string): string | null {
  if (!existsSync(path)) {
    return null;
  }
  const content = readFileSync(path, "utf8");
  const match = content.match(/export const platformVersion\s*=\s*["']([^"']+)["']/);
  return match?.[1] ?? null;
}

function readPlatformVersionFromVersionTs(path: string): string | null {
  if (!existsSync(path)) {
    return null;
  }
  const content = readFileSync(path, "utf8");
  const usesOfficial = content.includes("OFFICIAL_PLATFORM_VERSION");
  if (usesOfficial) {
    return "manifest-linked";
  }
  const match = content.match(/platform:\s*version\.platform\s*\?\?\s*["']([^"']+)["']/);
  return match?.[1] ?? null;
}

export function loadReleaseManifest(repoRoot: string): ReleaseManifest | null {
  const manifestPath = join(repoRoot, "release", "manifest.json");
  if (!existsSync(manifestPath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(manifestPath, "utf8")) as ReleaseManifest;
  } catch {
    return null;
  }
}

export function collectVersionTargets(repoRoot: string): VersionConsistencyReport {
  const manifest = loadReleaseManifest(repoRoot);
  const manifestVersion = manifest?.version ?? "unknown";

  const targets: VersionConsistencyTarget[] = [
    {
      id: "manifest",
      label: "release/manifest.json",
      path: "release/manifest.json",
      version: manifest?.version ?? null,
    },
    {
      id: "root_package",
      label: "package.json (root)",
      path: "package.json",
      version: readJsonVersion(join(repoRoot, "package.json")),
    },
    {
      id: "core_package",
      label: "@douglas/core package.json",
      path: "packages/core/package.json",
      version: readJsonVersion(join(repoRoot, "packages/core/package.json")),
    },
    {
      id: "release_package",
      label: "@douglas/release package.json",
      path: "packages/release/package.json",
      version: readJsonVersion(join(repoRoot, "packages/release/package.json")),
    },
    {
      id: "headquarters_package",
      label: "headquarters package.json",
      path: "apps/headquarters/package.json",
      version: readJsonVersion(join(repoRoot, "apps/headquarters/package.json")),
    },
    {
      id: "headquarters_runtime",
      label: "Headquarters platformVersion",
      path: "apps/headquarters/lib/mock-data.ts",
      version: readPlatformVersionFromMockData(
        join(repoRoot, "apps/headquarters/lib/mock-data.ts"),
      ),
    },
    {
      id: "core_version_ts",
      label: "@douglas/core Version.ts",
      path: "packages/core/src/Version.ts",
      version: readPlatformVersionFromVersionTs(join(repoRoot, "packages/core/src/Version.ts")),
    },
  ];

  const divergences = targets.filter((target) => {
    if (target.version === null) {
      return true;
    }
    if (target.id === "core_version_ts" && target.version === "manifest-linked") {
      return false;
    }
    return target.version !== manifestVersion;
  });

  return {
    manifestVersion,
    targets,
    divergences,
    consistent: divergences.length === 0 && manifestVersion !== "unknown",
  };
}
