#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runAndFormatStagingBootstrapPlan } from "../packages/environment/src/staging-bootstrap/StagingBootstrapPlanRunner.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const report = runAndFormatStagingBootstrapPlan(repoRoot);

console.log(report.formatted);
process.exit(0);
