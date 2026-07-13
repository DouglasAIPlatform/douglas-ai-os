import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import { RELEASE_READINESS_CHECK_LABELS } from "./ReleaseReadinessCheck.ts";
import { assertStagingTargetManifestSafe } from "../../packages/environment/src/staging-bootstrap/StagingTargetManifest.ts";
import { STAGING_TARGET_MANIFEST } from "../../packages/environment/src/staging-bootstrap/StagingTargetManifest.ts";

const DOC_MANIFEST = "docs/operations/staging-project-bootstrap.md";

function check(
  id: keyof typeof RELEASE_READINESS_CHECK_LABELS,
  outcome: ReleaseReadinessCheck["outcome"],
  message: string,
  docPath?: string,
): ReleaseReadinessCheck {
  return {
    id,
    label: RELEASE_READINESS_CHECK_LABELS[id],
    outcome,
    message,
    blocking: true,
    docPath: docPath ?? DOC_MANIFEST,
  };
}

export function checkStagingTargetManifestPresent(repoRoot: string): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/environment/src/staging-bootstrap/StagingTargetManifest.ts",
  );

  if (!existsSync(path)) {
    return check("staging_target_manifest_present", "fail", "StagingTargetManifest ausente.");
  }

  const content = readFileSync(path, "utf8");
  const required = [
    "STAGING_TARGET_MANIFEST",
    "requireSeparateSupabaseProject",
    "requireRemoteMissionPersistence",
    "assertStagingTargetManifestSafe",
  ];
  const missing = required.filter((token) => !content.includes(token));

  if (missing.length > 0) {
    return check("staging_target_manifest_present", "fail", `Manifest incompleto: ${missing.join(", ")}`);
  }

  if (!assertStagingTargetManifestSafe(STAGING_TARGET_MANIFEST)) {
    return check("staging_target_manifest_present", "fail", "Manifest contém campos sensíveis.");
  }

  return check("staging_target_manifest_present", "pass", "StagingTargetManifest presente e seguro.");
}

export function checkStagingEnvTemplatesPresent(repoRoot: string): ReleaseReadinessCheck {
  const rootExample = join(repoRoot, ".env.example");
  const stagingExample = join(repoRoot, "apps/headquarters/.env.staging.example");

  if (!existsSync(rootExample) || !existsSync(stagingExample)) {
    return check("staging_env_templates_present", "fail", "Templates .env staging ausentes.");
  }

  const rootContent = readFileSync(rootExample, "utf8");
  const stagingContent = readFileSync(stagingExample, "utf8");

  if (
    !rootContent.includes("NEXT_PUBLIC_DOS_ENVIRONMENT") ||
    !stagingContent.includes("NEXT_PUBLIC_DOS_ENVIRONMENT=staging") ||
    !stagingContent.includes("NEXT_PUBLIC_SUPABASE_URL=")
  ) {
    return check("staging_env_templates_present", "fail", "Placeholders incompletos nos templates.");
  }

  if (stagingContent.includes("service_role") && stagingContent.includes("=")) {
    const lines = stagingContent.split("\n").filter((line) => line.includes("service_role") && !line.trim().startsWith("#"));
    if (lines.length > 0) {
      return check("staging_env_templates_present", "fail", "Template não deve incluir service_role.");
    }
  }

  return check("staging_env_templates_present", "pass", "Templates de ambiente staging com placeholders.");
}

export function checkStagingEnvLocalIgnored(repoRoot: string): ReleaseReadinessCheck {
  const gitignore = readFileSync(join(repoRoot, ".gitignore"), "utf8");

  if (!gitignore.includes(".env.*.local") || !gitignore.includes(".env.local")) {
    return check("staging_env_local_ignored", "fail", ".gitignore não ignora arquivos .env locais.");
  }

  return check("staging_env_local_ignored", "pass", ".env.staging.local e .env.local ignorados.");
}

export function checkStagingBootstrapPlanScript(repoRoot: string): ReleaseReadinessCheck {
  const scriptPath = join(repoRoot, "scripts/staging-bootstrap-plan.ts");
  const pkg = readFileSync(join(repoRoot, "package.json"), "utf8");

  if (!existsSync(scriptPath) || !pkg.includes("staging:bootstrap-plan")) {
    return check("staging_bootstrap_plan_script", "fail", "pnpm staging:bootstrap-plan ausente.");
  }

  const content = readFileSync(scriptPath, "utf8");
  if (!content.includes("runAndFormatStagingBootstrapPlan")) {
    return check("staging_bootstrap_plan_script", "fail", "Script bootstrap plan incompleto.");
  }

  return check("staging_bootstrap_plan_script", "pass", "pnpm staging:bootstrap-plan disponível.");
}

export function checkStagingManifestNoSecrets(repoRoot: string): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/environment/src/staging-bootstrap/StagingTargetManifest.ts",
  );
  const content = readFileSync(path, "utf8");

  const forbiddenPatterns = [
    /supabase\.co/i,
    /eyJ[a-zA-Z0-9]/,
    /service_role/i,
    /project-ref/i,
    /password\s*=/i,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      return check("staging_manifest_no_secrets", "fail", "Manifest ou código contém padrão sensível.");
    }
  }

  return check("staging_manifest_no_secrets", "pass", "Manifest sem informação sensível.");
}

export function checkStagingBootstrapDocsPack(repoRoot: string): ReleaseReadinessCheck {
  const docs = [
    "docs/operations/staging-project-bootstrap.md",
    "docs/operations/staging-environment-variables.md",
    "docs/operations/staging-manual-setup-checklist.md",
  ];

  const missing = docs.filter((doc) => !existsSync(join(repoRoot, doc)));
  if (missing.length > 0) {
    return check("staging_bootstrap_docs_pack", "fail", `Docs ausentes: ${missing.join(", ")}`);
  }

  return check("staging_bootstrap_docs_pack", "pass", "Documentação operacional staging presente.");
}

export function runStagingBootstrapPackTests(repoRoot: string): ReleaseReadinessCheck {
  const result = spawnSync(
    "pnpm",
    ["vitest", "run", "packages/environment/src/staging-bootstrap/staging-bootstrap-pack.rbac.test.ts"],
    { cwd: repoRoot, shell: true, encoding: "utf8" },
  );

  if (result.status !== 0) {
    return check("staging_bootstrap_pack_tests", "fail", "Testes staging bootstrap pack falharam.");
  }

  return check("staging_bootstrap_pack_tests", "pass", "Testes staging bootstrap pack passando.");
}
