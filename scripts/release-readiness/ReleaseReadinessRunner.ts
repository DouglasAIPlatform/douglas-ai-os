/**
 * Sprint 5.37 — Release Readiness Runner (read-only).
 *
 * NÃO modifica arquivos, NÃO conecta ao banco, NÃO aplica migrations, NÃO faz deploy.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import {
  EXPECTED_SUPABASE_MIGRATIONS,
  REQUIRED_RELEASE_DOCS,
  REQUIRED_RELEASE_WORKFLOWS,
  RELEASE_READINESS_CHECK_LABELS,
  type ReleaseReadinessCheck,
  type ReleaseReadinessCheckId,
} from "./ReleaseReadinessCheck.ts";
import {
  buildReleaseReadinessReport,
  type ReleaseReadinessReport,
} from "./ReleaseReadinessReport.ts";
import {
  collectVersionTargets,
  loadReleaseManifest,
} from "../release-versioning/VersionConsistency.ts";
import { isValidSemVer } from "../release-versioning/SemVer.ts";
import {
  changelogHasRequiredStructure,
  changelogHasVersionEntry,
  validateReleaseManifestShape,
} from "../release-versioning/ReleaseManifestValidation.ts";

export interface ReleaseReadinessRunnerOptions {
  repoRoot: string;
  /** Quando false, pula `pnpm validate` (útil para testes isolados de checks estáticos). */
  runValidate?: boolean;
}

interface SecretPattern {
  id: string;
  pattern: RegExp;
  /** Linhas que correspondem a placeholders seguros são ignoradas. */
  isPlaceholder?: (line: string) => boolean;
}

const SECRET_SCAN_EXCLUDED_PREFIXES = [
  "node_modules/",
  ".pnpm-store/",
  ".next/",
  "dist/",
  "coverage/",
  "pnpm-lock.yaml",
];

const SECRET_SCAN_EXCLUDED_FILES = new Set([
  ".env.example",
  "scripts/release-readiness/ReleaseReadinessRunner.ts",
]);

const SECRET_PATTERNS: SecretPattern[] = [
  {
    id: "private_key_pem",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    id: "supabase_service_role_assignment",
    pattern: /SUPABASE_SERVICE_ROLE(?:_KEY)?\s*=\s*\S+/i,
    isPlaceholder: (line) => /=\s*$|=\s*your[-_]|\s*#\s*$/i.test(line.trim()),
  },
  {
    id: "jwt_like_token",
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
    isPlaceholder: (line) => line.includes("example") || line.includes("placeholder"),
  },
  {
    id: "github_pat",
    pattern: /ghp_[A-Za-z0-9]{20,}/,
  },
  {
    id: "openai_sk_key",
    pattern: /\bsk-[A-Za-z0-9]{20,}\b/,
  },
  {
    id: "slack_token",
    pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/,
  },
];

function check(
  id: ReleaseReadinessCheckId,
  outcome: ReleaseReadinessCheck["outcome"],
  message: string,
  options: { blocking?: boolean; docPath?: string } = {},
): ReleaseReadinessCheck {
  return {
    id,
    label: RELEASE_READINESS_CHECK_LABELS[id],
    outcome,
    message,
    blocking: options.blocking ?? true,
    docPath: options.docPath,
  };
}

function listGitTrackedFiles(repoRoot: string): string[] | null {
  const result = spawnSync("git", ["ls-files", "-z"], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    return null;
  }

  return result.stdout
    .split("\0")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function checkDosEnvironmentDocumented(repoRoot: string): ReleaseReadinessCheck {
  const envExamplePath = join(repoRoot, ".env.example");

  if (!existsSync(envExamplePath)) {
    return check(
      "dos_environment_documented",
      "fail",
      ".env.example ausente — não é possível validar NEXT_PUBLIC_DOS_ENVIRONMENT.",
      { docPath: "docs/architecture/environment-separation.md" },
    );
  }

  const content = readFileSync(envExamplePath, "utf8");
  const hasVar = content.includes("NEXT_PUBLIC_DOS_ENVIRONMENT");
  const documentsValues =
    content.includes("development") &&
    content.includes("staging") &&
    content.includes("production");

  if (!hasVar) {
    return check(
      "dos_environment_documented",
      "fail",
      "NEXT_PUBLIC_DOS_ENVIRONMENT ausente em .env.example.",
      { docPath: "docs/architecture/environment-separation.md" },
    );
  }

  if (!documentsValues) {
    return check(
      "dos_environment_documented",
      "warn",
      "Variável presente, mas valores permitidos não documentados claramente.",
      { blocking: false, docPath: "docs/architecture/environment-separation.md" },
    );
  }

  const secretPattern = /NEXT_PUBLIC_DOS_ENVIRONMENT\s*=\s*[^\s#][^\s]{20,}/;
  if (secretPattern.test(content)) {
    return check(
      "dos_environment_documented",
      "fail",
      ".env.example contém valor suspeito em NEXT_PUBLIC_DOS_ENVIRONMENT.",
      { docPath: "docs/architecture/environment-separation.md" },
    );
  }

  return check(
    "dos_environment_documented",
    "pass",
    "NEXT_PUBLIC_DOS_ENVIRONMENT documentado com valores permitidos.",
    { docPath: "docs/architecture/environment-separation.md" },
  );
}

function checkDosEnvironmentPoliciesPresent(repoRoot: string): ReleaseReadinessCheck {
  const paths = [
    join(repoRoot, "packages", "environment", "src", "EnvironmentProfile.ts"),
    join(repoRoot, "packages", "environment", "src", "EnvironmentSafetyPolicy.ts"),
    join(repoRoot, "packages", "environment", "src", "EnvironmentConfigResolver.ts"),
  ];

  const missing = paths.filter((path) => !existsSync(path));

  if (missing.length > 0) {
    return check(
      "dos_environment_policies_present",
      "fail",
      `Módulos de ambiente ausentes: ${missing.map((p) => relative(repoRoot, p)).join(", ")}.`,
      { docPath: "docs/architecture/environment-separation.md" },
    );
  }

  const profileContent = readFileSync(paths[0]!, "utf8");
  const hasAllEnvs =
    profileContent.includes("development:") &&
    profileContent.includes("staging:") &&
    profileContent.includes("production:");

  if (!hasAllEnvs) {
    return check(
      "dos_environment_policies_present",
      "fail",
      "ENVIRONMENT_PROFILES incompleto — faltam ambientes oficiais.",
      { docPath: "docs/architecture/environment-separation.md" },
    );
  }

  return check(
    "dos_environment_policies_present",
    "pass",
    "Políticas de ambiente (development/staging/production) presentes.",
    { docPath: "docs/architecture/environment-separation.md" },
  );
}

function checkDosEnvironmentProductionNoMocks(repoRoot: string): ReleaseReadinessCheck {
  const profilePath = join(repoRoot, "packages", "environment", "src", "EnvironmentProfile.ts");

  if (!existsSync(profilePath)) {
    return check(
      "dos_environment_production_no_mocks",
      "fail",
      "EnvironmentProfile.ts ausente.",
      { docPath: "docs/architecture/environment-separation.md" },
    );
  }

  const content = readFileSync(profilePath, "utf8");
  const productionBlock = content.match(/production:\s*\{[\s\S]*?\n\s*\},/);

  if (!productionBlock) {
    return check(
      "dos_environment_production_no_mocks",
      "fail",
      "Bloco production não encontrado em ENVIRONMENT_PROFILES.",
      { docPath: "docs/architecture/environment-separation.md" },
    );
  }

  const block = productionBlock[0];
  const mocksDisabled =
    /allowMocks:\s*false/.test(block) && /allowMockRoleChange:\s*false/.test(block);

  if (!mocksDisabled) {
    return check(
      "dos_environment_production_no_mocks",
      "fail",
      "Política production deve desabilitar allowMocks e allowMockRoleChange.",
      { docPath: "docs/architecture/environment-separation.md" },
    );
  }

  return check(
    "dos_environment_production_no_mocks",
    "pass",
    "Política production bloqueia mocks e mock role.",
    { docPath: "docs/architecture/environment-separation.md" },
  );
}

function checkReleaseManifestPresent(repoRoot: string): ReleaseReadinessCheck {
  const manifest = loadReleaseManifest(repoRoot);

  if (!manifest) {
    return check(
      "release_manifest_present",
      "fail",
      "release/manifest.json ausente.",
      { docPath: "docs/engineering/release-versioning.md" },
    );
  }

  const shape = validateReleaseManifestShape(manifest);
  if (!shape.valid) {
    return check(
      "release_manifest_present",
      "fail",
      `Manifesto inválido: ${shape.errors.join("; ")}.`,
      { docPath: "docs/engineering/release-versioning.md" },
    );
  }

  return check(
    "release_manifest_present",
    "pass",
    `Manifesto presente — v${manifest.version} (${manifest.channel}).`,
    { docPath: "docs/engineering/release-versioning.md" },
  );
}

function checkReleaseSemverValid(repoRoot: string): ReleaseReadinessCheck {
  const manifest = loadReleaseManifest(repoRoot);

  if (!manifest) {
    return check(
      "release_semver_valid",
      "fail",
      "Manifesto ausente — SemVer não verificável.",
      { docPath: "docs/engineering/release-versioning.md" },
    );
  }

  if (!isValidSemVer(manifest.version)) {
    return check(
      "release_semver_valid",
      "fail",
      `Versão "${manifest.version}" não é SemVer válido (MAJOR.MINOR.PATCH).`,
      { docPath: "docs/engineering/release-versioning.md" },
    );
  }

  return check(
    "release_semver_valid",
    "pass",
    `Versão ${manifest.version} é SemVer válido.`,
    { docPath: "docs/engineering/release-versioning.md" },
  );
}

function checkReleaseVersionConsistency(repoRoot: string): ReleaseReadinessCheck {
  const report = collectVersionTargets(repoRoot);

  if (report.manifestVersion === "unknown") {
    return check(
      "release_version_consistency",
      "fail",
      "Manifesto ausente — consistência não verificável.",
      { docPath: "docs/engineering/release-versioning.md" },
    );
  }

  if (!report.consistent) {
    const preview = report.divergences
      .slice(0, 4)
      .map((item) => `${item.label}=${item.version ?? "ausente"}`)
      .join("; ");
    return check(
      "release_version_consistency",
      "fail",
      `Divergências (${report.divergences.length}): ${preview}${report.divergences.length > 4 ? "…" : ""}.`,
      { docPath: "docs/engineering/release-versioning.md" },
    );
  }

  return check(
    "release_version_consistency",
    "pass",
    `Versão ${report.manifestVersion} consistente em ${report.targets.length} fonte(s).`,
    { docPath: "docs/engineering/release-versioning.md" },
  );
}

function checkChangelogPresent(repoRoot: string): ReleaseReadinessCheck {
  const changelogPath = join(repoRoot, "CHANGELOG.md");

  if (!existsSync(changelogPath)) {
    return check(
      "changelog_present",
      "fail",
      "CHANGELOG.md ausente na raiz.",
      { docPath: "docs/operations/release-process.md" },
    );
  }

  const content = readFileSync(changelogPath, "utf8");
  if (!changelogHasRequiredStructure(content)) {
    return check(
      "changelog_present",
      "warn",
      "CHANGELOG.md presente, mas estrutura Keep a Changelog incompleta.",
      { blocking: false, docPath: "docs/operations/release-process.md" },
    );
  }

  return check(
    "changelog_present",
    "pass",
    "CHANGELOG.md presente com estrutura esperada.",
    { docPath: "docs/operations/release-process.md" },
  );
}

function checkChangelogCurrentVersionEntry(repoRoot: string): ReleaseReadinessCheck {
  const manifest = loadReleaseManifest(repoRoot);
  const changelogPath = join(repoRoot, "CHANGELOG.md");

  if (!manifest) {
    return check(
      "changelog_current_version_entry",
      "fail",
      "Manifesto ausente.",
      { docPath: "docs/operations/release-process.md" },
    );
  }

  if (!existsSync(changelogPath)) {
    return check(
      "changelog_current_version_entry",
      "fail",
      "CHANGELOG.md ausente.",
      { docPath: "docs/operations/release-process.md" },
    );
  }

  const content = readFileSync(changelogPath, "utf8");
  if (!changelogHasVersionEntry(content, manifest.version)) {
    return check(
      "changelog_current_version_entry",
      "fail",
      `Entrada ## [${manifest.version}] ausente no CHANGELOG.`,
      { docPath: "docs/operations/release-process.md" },
    );
  }

  return check(
    "changelog_current_version_entry",
    "pass",
    `CHANGELOG contém entrada para v${manifest.version}.`,
    { docPath: "docs/operations/release-process.md" },
  );
}

function checkReleaseWorkflowsPresent(repoRoot: string): ReleaseReadinessCheck {
  const missing = REQUIRED_RELEASE_WORKFLOWS.filter(
    (workflowPath) => !existsSync(join(repoRoot, workflowPath)),
  );

  if (missing.length > 0) {
    return check(
      "release_workflows_present",
      "fail",
      `Workflows ausentes: ${missing.join(", ")}.`,
      { docPath: "docs/engineering/release-readiness-pipeline.md" },
    );
  }

  return check(
    "release_workflows_present",
    "pass",
    `${REQUIRED_RELEASE_WORKFLOWS.length} workflow(s) de CI presentes.`,
    { docPath: "docs/engineering/release-readiness-pipeline.md" },
  );
}

function checkReleaseEnvironmentProfileCompatible(
  repoRoot: string,
): ReleaseReadinessCheck {
  const manifest = loadReleaseManifest(repoRoot);
  const profilePath = join(repoRoot, "packages", "environment", "src", "EnvironmentProfile.ts");

  if (!manifest) {
    return check(
      "release_environment_profile_compatible",
      "fail",
      "Manifesto ausente.",
      { docPath: "docs/architecture/environment-separation.md" },
    );
  }

  if (!existsSync(profilePath)) {
    return check(
      "release_environment_profile_compatible",
      "fail",
      "EnvironmentProfile.ts ausente.",
      { docPath: "docs/architecture/environment-separation.md" },
    );
  }

  const allowedChannels = ["development", "staging", "production"];
  if (!allowedChannels.includes(manifest.channel)) {
    return check(
      "release_environment_profile_compatible",
      "fail",
      `Channel "${manifest.channel}" não mapeia a ambientes oficiais.`,
      { docPath: "docs/architecture/environment-separation.md" },
    );
  }

  const profileContent = readFileSync(profilePath, "utf8");
  const hasChannelProfile = profileContent.includes(`${manifest.channel}:`);

  if (!hasChannelProfile) {
    return check(
      "release_environment_profile_compatible",
      "fail",
      `Perfil de ambiente "${manifest.channel}" ausente em ENVIRONMENT_PROFILES.`,
      { docPath: "docs/architecture/environment-separation.md" },
    );
  }

  return check(
    "release_environment_profile_compatible",
    "pass",
    `Channel ${manifest.channel} compatível com perfis de ambiente.`,
    { docPath: "docs/architecture/environment-separation.md" },
  );
}

function runRbacVerificationTests(repoRoot: string): ReleaseReadinessCheck {
  const result = spawnSync("pnpm", ["test:rbac"], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status === 0) {
    return check(
      "rbac_verification_tests",
      "pass",
      "pnpm test:rbac concluído — matriz RBAC verificada.",
      { docPath: "docs/security/rbac-verification-suite.md" },
    );
  }

  const stderrTail = (result.stderr ?? "").split("\n").slice(-8).join("\n").trim();
  const stdoutTail = (result.stdout ?? "").split("\n").slice(-8).join("\n").trim();
  const hint = stderrTail || stdoutTail || `exit code ${result.status ?? "unknown"}`;

  return check(
    "rbac_verification_tests",
    "fail",
    `pnpm test:rbac falhou. Últimas linhas: ${hint}`,
    { docPath: "docs/security/rbac-verification-suite.md" },
  );
}

function runValidatePipeline(repoRoot: string): ReleaseReadinessCheck {
  const result = spawnSync("pnpm", ["validate"], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status === 0) {
    return check(
      "validate_pipeline",
      "pass",
      "typecheck, lint e build concluídos com sucesso.",
      { docPath: "docs/engineering/validation-pipeline.md" },
    );
  }

  const stderrTail = (result.stderr ?? "").split("\n").slice(-8).join("\n").trim();
  const stdoutTail = (result.stdout ?? "").split("\n").slice(-8).join("\n").trim();
  const hint = stderrTail || stdoutTail || `exit code ${result.status ?? "unknown"}`;

  return check(
    "validate_pipeline",
    "fail",
    `pnpm validate falhou. Últimas linhas: ${hint}`,
    { docPath: "docs/engineering/validation-pipeline.md" },
  );
}

function checkSupabaseMigrations(repoRoot: string): ReleaseReadinessCheck {
  const migrationsDir = join(repoRoot, "supabase", "migrations");

  if (!existsSync(migrationsDir)) {
    return check(
      "supabase_migrations_present",
      "fail",
      "Diretório supabase/migrations/ não encontrado.",
      { docPath: "docs/operations/apply-supabase-migrations.md" },
    );
  }

  const files = readdirSync(migrationsDir).filter((name) => name.endsWith(".sql"));
  const missing = EXPECTED_SUPABASE_MIGRATIONS.filter((name) => !files.includes(name));

  if (missing.length > 0) {
    return check(
      "supabase_migrations_present",
      "fail",
      `Migrations esperadas ausentes: ${missing.join(", ")}.`,
      { docPath: "docs/operations/supabase-migration-checklist.md" },
    );
  }

  return check(
    "supabase_migrations_present",
    "pass",
    `${files.length} migration(s) SQL encontrada(s); catálogo mínimo presente.`,
    { docPath: "docs/operations/supabase-migration-checklist.md" },
  );
}

function checkAuditIngestFunction(repoRoot: string): ReleaseReadinessCheck {
  const indexPath = join(repoRoot, "supabase", "functions", "audit-ingest", "index.ts");
  const readmePath = join(repoRoot, "supabase", "functions", "audit-ingest", "README.md");

  if (!existsSync(indexPath)) {
    return check(
      "audit_ingest_function_present",
      "fail",
      "supabase/functions/audit-ingest/index.ts não encontrado.",
      { docPath: "docs/architecture/audit-edge-function.md" },
    );
  }

  const content = readFileSync(indexPath, "utf8");
  const hasServe = content.includes("serve(") || content.includes("Deno.serve");
  const hasReadme = existsSync(readmePath);

  if (!hasServe) {
    return check(
      "audit_ingest_function_present",
      "warn",
      "index.ts existe, mas handler HTTP não identificado claramente.",
      { blocking: false, docPath: "docs/architecture/audit-edge-function.md" },
    );
  }

  if (!hasReadme) {
    return check(
      "audit_ingest_function_present",
      "warn",
      "Edge Function presente; README local ausente.",
      { blocking: false, docPath: "supabase/functions/audit-ingest/README.md" },
    );
  }

  return check(
    "audit_ingest_function_present",
    "pass",
    "Edge Function audit-ingest e README presentes.",
    { docPath: "docs/architecture/audit-edge-function.md" },
  );
}

function checkEnvExample(repoRoot: string): ReleaseReadinessCheck {
  const envExamplePath = join(repoRoot, ".env.example");

  if (!existsSync(envExamplePath)) {
    return check(
      "env_example_present",
      "fail",
      ".env.example ausente na raiz do repositório.",
    );
  }

  const content = readFileSync(envExamplePath, "utf8");
  const requiredKeys = [
    "NEXT_PUBLIC_DOS_ENVIRONMENT",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const missingKeys = requiredKeys.filter((key) => !content.includes(key));

  if (missingKeys.length > 0) {
    return check(
      "env_example_present",
      "warn",
      `.env.example presente, mas chaves esperadas ausentes: ${missingKeys.join(", ")}.`,
      { blocking: false },
    );
  }

  return check(
    "env_example_present",
    "pass",
    ".env.example presente com variáveis Supabase documentadas.",
  );
}

function checkPathNotTracked(
  repoRoot: string,
  path: string,
  checkId: Extract<
    ReleaseReadinessCheckId,
    "env_local_not_tracked" | "supabase_temp_not_tracked"
  >,
): ReleaseReadinessCheck {
  const tracked = listGitTrackedFiles(repoRoot);

  if (tracked === null) {
    return check(
      checkId,
      "warn",
      "git ls-files indisponível — verifique manualmente se o path não está versionado.",
      { blocking: false },
    );
  }

  const normalizedPath = path.replace(/\\/g, "/");
  const matches = tracked.filter(
    (file) => file === normalizedPath || file.startsWith(`${normalizedPath}/`),
  );

  if (matches.length > 0) {
    return check(
      checkId,
      "fail",
      `Arquivo(s) sensível(is) rastreado(s): ${matches.slice(0, 3).join(", ")}${matches.length > 3 ? "…" : ""}.`,
    );
  }

  const gitignorePath = join(repoRoot, ".gitignore");
  const gitignore = existsSync(gitignorePath)
    ? readFileSync(gitignorePath, "utf8")
    : "";
  const ignorePattern = normalizedPath.includes(".temp") ? "supabase/.temp" : ".env.local";
  const ignored = gitignore.includes(ignorePattern);

  return check(
    checkId,
    ignored ? "pass" : "warn",
    ignored
      ? `${normalizedPath} não rastreado e listado no .gitignore.`
      : `${normalizedPath} não rastreado, mas padrão ausente no .gitignore.`,
    { blocking: false },
  );
}

function checkAuditWriteMode(repoRoot: string): ReleaseReadinessCheck {
  const configPath = join(
    repoRoot,
    "apps",
    "headquarters",
    "features",
    "platform-audit",
    "config.ts",
  );

  if (!existsSync(configPath)) {
    return check(
      "audit_write_mode_edge_function",
      "fail",
      "config.ts de platform-audit não encontrado.",
      { docPath: "docs/architecture/audit-edge-function.md" },
    );
  }

  const content = readFileSync(configPath, "utf8");
  const edgeModeMatch = content.match(/writeMode\s*:\s*["']([^"']+)["']/);

  if (!edgeModeMatch) {
    return check(
      "audit_write_mode_edge_function",
      "fail",
      "writeMode não encontrado em auditSupabaseConfig.",
      { docPath: "docs/architecture/audit-edge-function.md" },
    );
  }

  const writeMode = edgeModeMatch[1];
  if (writeMode !== "edge_function") {
    return check(
      "audit_write_mode_edge_function",
      "fail",
      `writeMode atual é "${writeMode}" — esperado "edge_function" para release.`,
      { docPath: "docs/architecture/audit-edge-function.md" },
    );
  }

  return check(
    "audit_write_mode_edge_function",
    "pass",
    'writeMode configurado como "edge_function" no Headquarters.',
    { docPath: "docs/architecture/audit-edge-function.md" },
  );
}

function checkOperationalDocs(repoRoot: string): ReleaseReadinessCheck {
  const missing = REQUIRED_RELEASE_DOCS.filter(
    (docPath) => !existsSync(join(repoRoot, docPath)),
  );

  if (missing.length > 0) {
    return check(
      "operational_docs_present",
      "fail",
      `Documentação ausente: ${missing.join(", ")}.`,
      { docPath: "docs/operations/release-checklist.md" },
    );
  }

  return check(
    "operational_docs_present",
    "pass",
    `${REQUIRED_RELEASE_DOCS.length} documento(s) operacionais/arquitetura presentes.`,
    { docPath: "docs/operations/release-checklist.md" },
  );
}

function shouldScanFile(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");

  if (SECRET_SCAN_EXCLUDED_FILES.has(normalized)) {
    return false;
  }

  if (SECRET_SCAN_EXCLUDED_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return false;
  }

  if (normalized.endsWith(".png") || normalized.endsWith(".jpg") || normalized.endsWith(".webp")) {
    return false;
  }

  return true;
}

function scanVersionedSecrets(repoRoot: string): ReleaseReadinessCheck {
  const tracked = listGitTrackedFiles(repoRoot);

  if (tracked === null) {
    return check(
      "versioned_secrets_scan",
      "warn",
      "git ls-files indisponível — scan de secrets não executado.",
      { blocking: false },
    );
  }

  const findings: string[] = [];

  for (const relativePath of tracked) {
    if (!shouldScanFile(relativePath)) {
      continue;
    }

    const absolutePath = join(repoRoot, relativePath);
    if (!existsSync(absolutePath)) {
      continue;
    }

    let content: string;
    try {
      content = readFileSync(absolutePath, "utf8");
    } catch {
      continue;
    }

    const lines = content.split("\n");
    for (const pattern of SECRET_PATTERNS) {
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index] ?? "";
        if (!pattern.pattern.test(line)) {
          continue;
        }
        if (pattern.isPlaceholder?.(line)) {
          continue;
        }
        findings.push(`${relativePath}:${index + 1} (${pattern.id})`);
        break;
      }
    }
  }

  if (findings.length > 0) {
    const preview = findings.slice(0, 5).join("; ");
    return check(
      "versioned_secrets_scan",
      "fail",
      `Possíveis secrets versionados (${findings.length}): ${preview}${findings.length > 5 ? "…" : ""}. Valores não exibidos.`,
    );
  }

  return check(
    "versioned_secrets_scan",
    "pass",
    `Scan em ${tracked.length} arquivo(s) rastreado(s) — nenhum padrão óbvio de secret detectado.`,
  );
}

function buildSuggestedNextSteps(report: ReleaseReadinessReport): string[] {
  const steps: string[] = [];

  if (report.blockingChecks.length > 0) {
    steps.push("Corrija todos os checks bloqueantes antes de solicitar revisão de release.");
    for (const blocking of report.blockingChecks.slice(0, 4)) {
      steps.push(`• ${blocking.label}: ${blocking.message}`);
    }
  }

  if (report.warningChecks.length > 0) {
    steps.push("Revise alertas não bloqueantes — podem indicar dívida operacional.");
  }

  if (report.status === "passed" || report.status === "passed_with_warnings") {
    steps.push("Execute o Production Safety Gate no ambiente alvo (runtime) antes do deploy.");
    steps.push("Deploy e apply de migrations continuam manuais nesta fase.");
  }

  return steps;
}

export function runReleaseReadiness(
  options: ReleaseReadinessRunnerOptions,
): ReleaseReadinessReport {
  const { repoRoot, runValidate = true } = options;
  const checks: ReleaseReadinessCheck[] = [];

  if (runValidate) {
    checks.push(runValidatePipeline(repoRoot));
  } else {
    checks.push(
      check("validate_pipeline", "skip", "validate omitido (runValidate=false).", {
        blocking: false,
      }),
    );
  }

  checks.push(checkSupabaseMigrations(repoRoot));
  checks.push(checkAuditIngestFunction(repoRoot));
  checks.push(checkEnvExample(repoRoot));
  checks.push(checkPathNotTracked(repoRoot, ".env.local", "env_local_not_tracked"));
  checks.push(checkPathNotTracked(repoRoot, "supabase/.temp", "supabase_temp_not_tracked"));
  checks.push(checkAuditWriteMode(repoRoot));
  checks.push(checkOperationalDocs(repoRoot));
  checks.push(scanVersionedSecrets(repoRoot));
  checks.push(checkDosEnvironmentDocumented(repoRoot));
  checks.push(checkDosEnvironmentPoliciesPresent(repoRoot));
  checks.push(checkDosEnvironmentProductionNoMocks(repoRoot));
  checks.push(checkReleaseManifestPresent(repoRoot));
  checks.push(checkReleaseSemverValid(repoRoot));
  checks.push(checkReleaseVersionConsistency(repoRoot));
  checks.push(checkChangelogPresent(repoRoot));
  checks.push(checkChangelogCurrentVersionEntry(repoRoot));
  checks.push(checkReleaseWorkflowsPresent(repoRoot));
  checks.push(checkReleaseEnvironmentProfileCompatible(repoRoot));
  checks.push(runRbacVerificationTests(repoRoot));

  const preliminary = buildReleaseReadinessReport(checks, []);
  const suggestedNextSteps = buildSuggestedNextSteps(preliminary);

  return buildReleaseReadinessReport(checks, suggestedNextSteps);
}

export function formatReleaseReadinessReport(
  report: ReleaseReadinessReport,
  repoRoot: string,
): string {
  const lines: string[] = [];
  const rel = (path: string) => relative(repoRoot, join(repoRoot, path));

  lines.push("Douglas AI OS — Release Readiness");
  lines.push(`Status: ${report.status}`);
  lines.push(`Verificado em: ${report.checkedAt}`);
  lines.push("");

  lines.push(`Aprovados (${report.passedChecks.length})`);
  for (const item of report.passedChecks) {
    lines.push(`  ✓ ${item.label}`);
  }
  lines.push("");

  if (report.warningChecks.length > 0) {
    lines.push(`Alertas (${report.warningChecks.length})`);
    for (const item of report.warningChecks) {
      lines.push(`  ! ${item.label}: ${item.message}`);
    }
    lines.push("");
  }

  if (report.blockingChecks.length > 0) {
    lines.push(`Bloqueantes (${report.blockingChecks.length})`);
    for (const item of report.blockingChecks) {
      const doc = item.docPath ? ` → ${rel(item.docPath)}` : "";
      lines.push(`  ✗ ${item.label}: ${item.message}${doc}`);
    }
    lines.push("");
  }

  if (report.suggestedNextSteps.length > 0) {
    lines.push("Próximos passos");
    for (const step of report.suggestedNextSteps) {
      lines.push(`  ${step.startsWith("•") ? step : `- ${step}`}`);
    }
  }

  return lines.join("\n");
}
