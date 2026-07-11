import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import { RELEASE_READINESS_CHECK_LABELS } from "./ReleaseReadinessCheck.ts";
import { STAGING_BOOTSTRAP_DOCS } from "../../packages/environment/src/staging-bootstrap/StagingReadinessRunner.ts";

const DOC_PATH = "docs/operations/staging-bootstrap.md";

function check(
  id: keyof typeof RELEASE_READINESS_CHECK_LABELS,
  outcome: ReleaseReadinessCheck["outcome"],
  message: string,
): ReleaseReadinessCheck {
  return {
    id,
    label: RELEASE_READINESS_CHECK_LABELS[id],
    outcome,
    message,
    blocking: true,
    docPath: DOC_PATH,
  };
}

function readProfileStagingBlock(repoRoot: string): string {
  const path = join(repoRoot, "packages/environment/src/EnvironmentProfile.ts");
  const content = readFileSync(path, "utf8");
  const match = content.match(/staging:\s*\{[\s\S]*?\},/);
  return match?.[0] ?? "";
}

export function checkStagingProfilePresent(repoRoot: string): ReleaseReadinessCheck {
  const path = join(repoRoot, "packages/environment/src/staging-bootstrap/StagingEnvironmentProfile.ts");

  if (!existsSync(path)) {
    return check("staging_profile_present", "fail", "StagingEnvironmentProfile ausente.");
  }

  const extendedPath = join(
    repoRoot,
    "packages/environment/src/staging-bootstrap/StagingEnvironmentProfile.ts",
  );
  const content = readFileSync(extendedPath, "utf8");

  if (
    !content.includes("requireSeparateSupabaseProject") ||
    !content.includes("requireServerSideRbac")
  ) {
    return check("staging_profile_present", "fail", "Perfil staging incompleto.");
  }

  return check("staging_profile_present", "pass", "StagingEnvironmentProfile presente.");
}

export function checkStagingNoMocksAllowed(repoRoot: string): ReleaseReadinessCheck {
  const stagingBlock = readProfileStagingBlock(repoRoot);

  if (!stagingBlock.includes("allowMocks: false") || !stagingBlock.includes("allowMockRoleChange: false")) {
    return check("staging_no_mocks_allowed", "fail", "Staging deve bloquear mocks.");
  }

  return check("staging_no_mocks_allowed", "pass", "Staging bloqueia mocks.");
}

export function checkStagingRequiresRealAuth(repoRoot: string): ReleaseReadinessCheck {
  const stagingBlock = readProfileStagingBlock(repoRoot);

  if (!stagingBlock.includes("requireRealAuth: true") || !stagingBlock.includes("requireAuthProfile: true")) {
    return check("staging_requires_real_auth", "fail", "Staging deve exigir auth real e profile.");
  }

  return check("staging_requires_real_auth", "pass", "Staging exige login real e profile ativo.");
}

export function checkStagingRequiresEdgeAudit(repoRoot: string): ReleaseReadinessCheck {
  const auditPath = join(repoRoot, "apps/headquarters/features/platform-audit/config.ts");
  const content = readFileSync(auditPath, "utf8");
  const stagingBlock = readProfileStagingBlock(repoRoot);

  if (!content.includes('writeMode: "edge_function"')) {
    return check("staging_requires_edge_audit", "fail", "Audit writeMode deve ser edge_function.");
  }

  if (!stagingBlock.includes("requireEdgeFunctionAudit: true")) {
    return check("staging_requires_edge_audit", "fail", "Perfil staging não exige Edge audit.");
  }

  return check("staging_requires_edge_audit", "pass", "Staging exige audit via Edge Function.");
}

export function checkStagingBootstrapDocsPresent(repoRoot: string): ReleaseReadinessCheck {
  const missing = STAGING_BOOTSTRAP_DOCS.filter((doc) => !existsSync(join(repoRoot, doc)));

  if (missing.length > 0) {
    return check(
      "staging_bootstrap_docs_present",
      "fail",
      `Docs ausentes: ${missing.join(", ")}`,
    );
  }

  return check("staging_bootstrap_docs_present", "pass", "Documentação de staging bootstrap presente.");
}

export function checkStagingScriptAvailable(repoRoot: string): ReleaseReadinessCheck {
  const pkgPath = join(repoRoot, "package.json");
  const scriptPath = join(repoRoot, "scripts/staging-readiness.ts");

  if (!existsSync(scriptPath)) {
    return check("staging_check_script_available", "fail", "scripts/staging-readiness.ts ausente.");
  }

  const content = readFileSync(pkgPath, "utf8");
  if (!content.includes("staging:check")) {
    return check("staging_check_script_available", "fail", "Script staging:check ausente em package.json.");
  }

  return check("staging_check_script_available", "pass", "pnpm staging:check disponível.");
}
