/**
 * Sprint 5.40 — Release Status (read-only).
 *
 * Uso: pnpm release:status
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateReleaseManifestShape } from "./release-versioning/ReleaseManifestValidation.ts";
import { isValidSemVer } from "./release-versioning/SemVer.ts";
import { changelogHasVersionEntry } from "./release-versioning/ReleaseManifestValidation.ts";
import { readGitState } from "./release-versioning/GitState.ts";
import {
  collectVersionTargets,
  loadReleaseManifest,
} from "./release-versioning/VersionConsistency.ts";
import {
  formatReadinessCacheSummary,
  readReleaseReadinessCache,
} from "./release-versioning/ReadinessCache.ts";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..");

const manifest = loadReleaseManifest(repoRoot);
const git = readGitState(repoRoot);
const consistency = collectVersionTargets(repoRoot);
const readinessCache = readReleaseReadinessCache(repoRoot);

const lines: string[] = [];
lines.push("Douglas AI OS — Release Status");
lines.push("");

if (!manifest) {
  lines.push("Versão atual: N/A (release/manifest.json ausente)");
} else {
  lines.push(`Versão atual: ${manifest.version}`);
  lines.push(`Channel: ${manifest.channel}`);
  lines.push(`Status: ${manifest.status}`);
  lines.push(`Plataforma: ${manifest.platform}`);

  const shape = validateReleaseManifestShape(manifest);
  if (!shape.valid) {
    lines.push(`Manifesto inválido: ${shape.errors.join("; ")}`);
  } else if (!isValidSemVer(manifest.version)) {
    lines.push("SemVer inválido no manifest.");
  }
}

lines.push("");
lines.push("Git");
if (!git.available) {
  lines.push("  Repositório Git indisponível.");
} else {
  lines.push(`  Branch: ${git.branch ?? "—"}`);
  lines.push(`  Commit: ${git.shortCommit ?? git.commit ?? "—"}`);
  lines.push(
    `  Working tree: ${git.workingTreeClean === true ? "clean" : git.workingTreeClean === false ? "dirty" : "unknown"}`,
  );
  if (git.dirtyFiles.length > 0) {
    lines.push(`  Arquivos alterados: ${git.dirtyFiles.length}`);
    for (const file of git.dirtyFiles.slice(0, 8)) {
      lines.push(`    • ${file}`);
    }
    if (git.dirtyFiles.length > 8) {
      lines.push(`    … e mais ${git.dirtyFiles.length - 8}`);
    }
  }
}

lines.push("");
lines.push("Último release readiness");
lines.push(`  ${formatReadinessCacheSummary(readinessCache)}`);

lines.push("");
lines.push("Consistência de versão");
if (consistency.consistent) {
  lines.push(`  ✓ Todas as fontes alinhadas em ${consistency.manifestVersion}`);
} else {
  lines.push(`  ✗ Divergências detectadas (manifest: ${consistency.manifestVersion})`);
  for (const divergence of consistency.divergences) {
    lines.push(`    • ${divergence.label}: ${divergence.version ?? "ausente"}`);
  }
}

if (manifest) {
  const changelogPath = join(repoRoot, "CHANGELOG.md");
  let changelogOk = false;
  if (existsSync(changelogPath)) {
    const content = readFileSync(changelogPath, "utf8");
    changelogOk = changelogHasVersionEntry(content, manifest.version);
  }

  lines.push("");
  lines.push("Changelog");
  lines.push(
    changelogOk
      ? `  ✓ Entrada encontrada para v${manifest.version}`
      : `  ! Entrada ausente para v${manifest.version} em CHANGELOG.md`,
  );
}

lines.push("");
lines.push("Próximos passos manuais");
lines.push("  • pnpm release:prepare -- <versão>  (dry-run)");
lines.push("  • pnpm release:prepare -- <versão> --write  (aplica alterações)");
lines.push("  • Revisão humana, commit, tag e GitHub Release permanecem manuais.");

console.log(lines.join("\n"));

if (!manifest || !consistency.consistent) {
  process.exitCode = 1;
}
