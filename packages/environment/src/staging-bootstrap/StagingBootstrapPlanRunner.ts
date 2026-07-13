import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildStagingBootstrapPlan,
  buildStagingBootstrapReport,
  type StagingBootstrapReport,
} from "./StagingBootstrapPlan.ts";

const ENV_EXAMPLE = ".env.example";
const ENV_STAGING_EXAMPLE = "apps/headquarters/.env.staging.example";
const BOOTSTRAP_PLAN_SCRIPT = "scripts/staging-bootstrap-plan.ts";

export function runStagingBootstrapPlan(repoRoot: string): StagingBootstrapReport {
  const envExamplePresent = existsSync(join(repoRoot, ENV_EXAMPLE));
  const envStagingExamplePresent = existsSync(join(repoRoot, ENV_STAGING_EXAMPLE));
  const bootstrapScriptPresent = existsSync(join(repoRoot, BOOTSTRAP_PLAN_SCRIPT));

  let codebasePrepared = envExamplePresent && bootstrapScriptPresent;

  const manifestPath = join(
    repoRoot,
    "packages/environment/src/staging-bootstrap/StagingTargetManifest.ts",
  );
  if (existsSync(manifestPath)) {
    const content = readFileSync(manifestPath, "utf8");
    codebasePrepared =
      codebasePrepared &&
      content.includes("STAGING_TARGET_MANIFEST") &&
      content.includes("requireSeparateSupabaseProject");
  } else {
    codebasePrepared = false;
  }

  const plan = buildStagingBootstrapPlan({
    codebasePrepared,
    envTemplatesPresent: envExamplePresent && envStagingExamplePresent,
    bootstrapPlanScriptPresent: bootstrapScriptPresent,
  });

  return buildStagingBootstrapReport(plan);
}

export function runAndFormatStagingBootstrapPlan(
  repoRoot: string,
): StagingBootstrapReport {
  return runStagingBootstrapPlan(repoRoot);
}
