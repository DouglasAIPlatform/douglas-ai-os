/**
 * Sprint 5.40 — Release Prepare (dry-run por padrão).
 *
 * Uso:
 *   pnpm release:prepare -- 0.2.0
 *   pnpm release:prepare -- 0.2.0 --write
 *
 * Nunca cria commit, push, tag, GitHub Release ou deploy.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  isValidSemVer,
  isVersionGreaterThan,
} from "./release-versioning/SemVer.ts";
import { readGitState } from "./release-versioning/GitState.ts";
import {
  collectVersionTargets,
  loadReleaseManifest,
} from "./release-versioning/VersionConsistency.ts";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..");

const args = process.argv.slice(2);
const writeMode = args.includes("--write");
const versionArg = args.find((arg) => arg !== "--write" && !arg.startsWith("-"));

if (!versionArg) {
  console.error("Uso: pnpm release:prepare -- <versão> [--write]");
  process.exitCode = 1;
  process.exit(1);
}

const targetVersion = versionArg.trim();
const manifest = loadReleaseManifest(repoRoot);
const currentVersion = manifest?.version ?? "0.0.0";
const git = readGitState(repoRoot);

const errors: string[] = [];
const warnings: string[] = [];
const plannedChanges: string[] = [];

if (!isValidSemVer(targetVersion)) {
  errors.push(`Formato SemVer inválido: "${targetVersion}" (esperado MAJOR.MINOR.PATCH).`);
}

if (isValidSemVer(targetVersion) && !isVersionGreaterThan(targetVersion, currentVersion)) {
  errors.push(
    `Versão ${targetVersion} não é superior à atual (${currentVersion}).`,
  );
}

if (git.available && git.workingTreeClean === false) {
  if (writeMode) {
    errors.push("Working tree dirty — commit ou stash antes de --write.");
  } else {
    warnings.push("Working tree dirty — alterações locais presentes (dry-run continua).");
  }
}

if (!manifest) {
  errors.push("release/manifest.json ausente.");
}

const lines: string[] = [];
lines.push("Douglas AI OS — Release Prepare");
lines.push(`Modo: ${writeMode ? "WRITE (aplicará alterações)" : "DRY-RUN (nenhum arquivo será modificado)"}`);
lines.push(`Versão atual: ${currentVersion}`);
lines.push(`Versão alvo: ${targetVersion}`);
lines.push("");

if (errors.length > 0) {
  lines.push("Erros");
  for (const error of errors) {
    lines.push(`  ✗ ${error}`);
  }
  lines.push("");
  console.log(lines.join("\n"));
  process.exitCode = 1;
  process.exit(1);
}

if (warnings.length > 0) {
  lines.push("Alertas");
  for (const warning of warnings) {
    lines.push(`  ! ${warning}`);
  }
  lines.push("");
}

lines.push("Executando pnpm release:check…");
console.log(lines.join("\n"));

const checkResult = spawnSync("pnpm", ["release:check"], {
  cwd: repoRoot,
  encoding: "utf8",
  shell: true,
  stdio: "inherit",
});

if (checkResult.status !== 0) {
  console.error("\nrelease:check falhou — corrija bloqueantes antes de preparar release.");
  process.exitCode = 1;
  process.exit(1);
}

plannedChanges.push(`release/manifest.json → version: ${targetVersion}`);
plannedChanges.push("package.json (root) → version");
plannedChanges.push("packages/core/package.json → version");
plannedChanges.push("packages/release/package.json → version");
plannedChanges.push("apps/headquarters/package.json → version");
plannedChanges.push("apps/headquarters/lib/mock-data.ts → platformVersion");
plannedChanges.push(`CHANGELOG.md → adicionar seção [${targetVersion}] (revisão manual)`);

console.log("\nPlano de alterações");
for (const change of plannedChanges) {
  console.log(`  • ${change}`);
}

console.log("\nAções NÃO executadas automaticamente:");
console.log("  • commit");
console.log("  • push");
console.log("  • tag Git");
console.log("  • GitHub Release");
console.log("  • deploy");

if (!writeMode) {
  console.log("\nDry-run concluído — nenhum arquivo modificado.");
  console.log("Para aplicar: pnpm release:prepare -- " + targetVersion + " --write");
  process.exit(0);
}

function updateJsonVersion(path: string, version: string): void {
  const content = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  content.version = version;
  writeFileSync(path, `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

function updateMockDataVersion(path: string, version: string): void {
  const content = readFileSync(path, "utf8");
  const updated = content.replace(
    /export const platformVersion\s*=\s*["'][^"']+["']/,
    `export const platformVersion = "${version}"`,
  );
  writeFileSync(path, updated, "utf8");
}

function updateManifest(path: string, version: string): void {
  const content = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  content.version = version;
  const metadata =
    content.metadata && typeof content.metadata === "object"
      ? (content.metadata as Record<string, unknown>)
      : {};
  metadata.preparedAt = new Date().toISOString();
  if (git.commit) {
    metadata.commit = git.commit;
  }
  content.metadata = metadata;
  writeFileSync(path, `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

const manifestPath = join(repoRoot, "release", "manifest.json");
updateManifest(manifestPath, targetVersion);

const jsonTargets = [
  join(repoRoot, "package.json"),
  join(repoRoot, "packages/core/package.json"),
  join(repoRoot, "packages/release/package.json"),
  join(repoRoot, "apps/headquarters/package.json"),
];

for (const path of jsonTargets) {
  if (existsSync(path)) {
    updateJsonVersion(path, targetVersion);
  }
}

updateMockDataVersion(join(repoRoot, "apps/headquarters/lib/mock-data.ts"), targetVersion);

const afterConsistency = collectVersionTargets(repoRoot);
console.log("\nArquivos atualizados.");
console.log(`Consistência pós-write: ${afterConsistency.consistent ? "OK" : "DIVERGENTE"}`);

if (!afterConsistency.consistent) {
  for (const divergence of afterConsistency.divergences) {
    console.log(`  • ${divergence.label}: ${divergence.version ?? "ausente"}`);
  }
}

console.log("\nPróximos passos manuais:");
console.log(`  1. Atualize CHANGELOG.md com seção [${targetVersion}]`);
console.log("  2. Revise alterações (git diff)");
console.log("  3. Commit manual");
console.log(`  4. Tag manual: git tag v${targetVersion}`);
console.log("  5. GitHub Release manual (opcional)");
console.log("  6. Deploy manual no ambiente alvo");
