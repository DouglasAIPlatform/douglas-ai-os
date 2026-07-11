#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runAndFormatStagingReadinessCheck } from "../packages/environment/src/staging-bootstrap/StagingReadinessRunner.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const { report, formatted } = runAndFormatStagingReadinessCheck(repoRoot, {
  env: process.env,
});

console.log(formatted);

if (report.status === "failed") {
  process.exit(1);
}

process.exit(0);
